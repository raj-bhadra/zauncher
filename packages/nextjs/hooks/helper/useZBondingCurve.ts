"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWagmiEthers } from "../wagmi/useWagmiEthers";
import { useDeployedContractInfo } from "./useDeployedContractInfo";
import { FhevmInstance, buildParamsFromAbi, useFHEDecrypt, useFHEEncryption, useInMemoryStorage } from "@fhevm-sdk";
import { QueryKey, useQueryClient } from "@tanstack/react-query";
import { clear } from "console";
// @ts-ignore
import { ethers } from "ethers";
import { toast } from "react-hot-toast";
import { Address, toHex } from "viem";
import { useReadContracts } from "wagmi";
import { useReadContract, useWriteContract } from "wagmi";
import { Contract } from "~~/utils/helper/contract";
import minimalObservableConfidentialTokenABI from "~~/utils/helper/minimalObservableConfidentialTokenABI";
import { AllowedChainIds } from "~~/utils/helper/networks";

const maxUint48 = BigInt(2) ** BigInt(48) - BigInt(1);

export const useZBondingCurve = (parameters: {
  instance: FhevmInstance | undefined;
  initialMockChains?: Readonly<Record<number, string>>;
  invalidateQuery?: QueryKey;
  baseTokenAddress: Address;
}) => {
  const queryClient = useQueryClient();
  const [decryptedBaseTokenBalance, setDecryptedBaseTokenBalance] = useState<bigint | undefined>(undefined);
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const { instance, initialMockChains } = parameters;
  const { chainId, accounts, ethersReadonlyProvider, ethersSigner, isConnected } = useWagmiEthers(initialMockChains);
  const { writeContract, ...tradeResult } = useWriteContract();
  const allowedChainId = typeof chainId === "number" ? (chainId as AllowedChainIds) : undefined;
  const { data: zBondingCurve } = useDeployedContractInfo({ contractName: "ZBondingCurve", chainId: allowedChainId });
  type ZBondingCurveInfo = Contract<"ZBondingCurve"> & { chainId?: number };
  const hasZBondingCurveContract = Boolean(zBondingCurve?.address && zBondingCurve?.abi);
  const hasProvider = Boolean(ethersReadonlyProvider);
  const hasSigner = Boolean(ethersSigner);
  const { data: confidentialTokenWrapper } = useDeployedContractInfo({
    contractName: "ConfidentialTokenWrapper",
    chainId: allowedChainId,
  });
  const confidentialWrapperAddress = confidentialTokenWrapper?.address as `0x${string}`;
  type ConfidentialTokenWrapperInfo = Contract<"ConfidentialTokenWrapper"> & { chainId?: number };
  const quoteBaseTokenInfo = useReadContracts({
    contracts: [
      {
        address: confidentialWrapperAddress,
        abi: (hasProvider ? minimalObservableConfidentialTokenABI : undefined) as any,
        functionName: "observer",
        args: [accounts?.[0] as Address],
      },
      {
        address: parameters.baseTokenAddress,
        abi: (hasProvider ? minimalObservableConfidentialTokenABI : undefined) as any,
        functionName: "observer",
        args: [accounts?.[0] as Address],
      },
      {
        address: confidentialWrapperAddress,
        abi: (hasProvider ? minimalObservableConfidentialTokenABI : undefined) as any,
        functionName: "isOperator",
        args: [accounts?.[0] as Address, zBondingCurve?.address as `0x${string}`],
      },
      {
        address: parameters.baseTokenAddress,
        abi: (hasProvider ? minimalObservableConfidentialTokenABI : undefined) as any,
        functionName: "isOperator",
        args: [accounts?.[0] as Address, zBondingCurve?.address as `0x${string}`],
      },
      {
        address: parameters.baseTokenAddress,
        abi: (hasProvider ? minimalObservableConfidentialTokenABI : undefined) as any,
        functionName: "confidentialBalanceOf",
        args: [accounts?.[0] as Address],
      },
    ],
  });
  const baseTokenBalanceHandle = useMemo(
    () => (quoteBaseTokenInfo.data?.[4]?.result as string | undefined) ?? undefined,
    [quoteBaseTokenInfo.data],
  );
  const refreshBaseTokenBalanceHandle = useCallback(async () => {
    const res = await quoteBaseTokenInfo.refetch();
    if (res.error) toast.error("Failed to refresh confidential token wrapper balance");
  }, [quoteBaseTokenInfo]);
  const requests = useMemo(() => {
    if (!baseTokenBalanceHandle || baseTokenBalanceHandle === ethers.ZeroHash) return undefined;
    return [{ handle: baseTokenBalanceHandle, contractAddress: parameters.baseTokenAddress } as const];
  }, [baseTokenBalanceHandle]);
  const {
    canDecrypt,
    decrypt: decrypteBaseTokenBalance,
    isDecrypting,
    message,
    results,
  } = useFHEDecrypt({
    instance,
    ethersSigner: ethersSigner as any,
    fhevmDecryptionSignatureStorage,
    chainId,
    requests,
  });
  useEffect(() => {
    if (results[baseTokenBalanceHandle!])
      setDecryptedBaseTokenBalance(results[baseTokenBalanceHandle!] as bigint | undefined);
  }, [results, baseTokenBalanceHandle]);

  const clearBaseTokenBalance = useMemo(() => {
    if (!baseTokenBalanceHandle) return undefined;
    if (baseTokenBalanceHandle === ethers.ZeroHash)
      return { handle: baseTokenBalanceHandle, clear: BigInt(0) } as const;
    const clear = results[baseTokenBalanceHandle];
    if (typeof clear === "undefined") return undefined;
    return { handle: baseTokenBalanceHandle, clear } as const;
  }, [baseTokenBalanceHandle, results]);

  const mounted = isConnected && hasProvider && hasSigner && quoteBaseTokenInfo.isSuccess;
  const quoteTokenObserver = mounted && (quoteBaseTokenInfo.data?.[0]?.result as Address) === zBondingCurve?.address;
  const baseTokenObserver = mounted && (quoteBaseTokenInfo.data?.[1]?.result as Address) === zBondingCurve?.address;
  const isOperatorForQuoteToken = mounted && (quoteBaseTokenInfo.data?.[2]?.result as boolean) === true;
  const isOperatorForBaseToken = mounted && (quoteBaseTokenInfo.data?.[3]?.result as boolean) === true;
  const getObserverOperatorAccessOnQuoteAndBaseToken = () => {
    if (quoteTokenObserver && baseTokenObserver && isOperatorForQuoteToken && isOperatorForBaseToken) {
      toast.success("Observer and operator access on quote and base token already set");
      return;
    }

    // Create array of operations to perform
    const operations: Array<{
      type: "setObserver" | "setOperator";
      address: `0x${string}`;
      args: readonly [Address, `0x${string}`] | readonly [`0x${string}`, bigint];
      description: string;
    }> = [];

    if (!quoteTokenObserver) {
      operations.push({
        type: "setObserver",
        address: confidentialWrapperAddress,
        args: [accounts?.[0] as Address, zBondingCurve?.address as `0x${string}`] as const,
        description: "quote token observer",
      });
    }

    if (!baseTokenObserver) {
      operations.push({
        type: "setObserver",
        address: parameters.baseTokenAddress,
        args: [accounts?.[0] as Address, zBondingCurve?.address as `0x${string}`] as const,
        description: "base token observer",
      });
    }

    if (!isOperatorForQuoteToken) {
      operations.push({
        type: "setOperator",
        address: confidentialWrapperAddress,
        args: [zBondingCurve?.address as `0x${string}`, maxUint48] as const,
        description: "quote token operator",
      });
    }

    if (!isOperatorForBaseToken) {
      operations.push({
        type: "setOperator",
        address: parameters.baseTokenAddress,
        args: [zBondingCurve?.address as `0x${string}`, maxUint48] as const,
        description: "base token operator",
      });
    }

    // Execute operations sequentially using chained writeContract calls
    const executeNextOperation = (index: number) => {
      if (index >= operations.length) {
        toast.success("Observer and operator access set successfully");
        quoteBaseTokenInfo.refetch();
        return;
      }

      const operation = operations[index];
      const functionName = operation.type === "setObserver" ? "setObserver" : "setOperator";

      toast("Setting " + operation.description);

      writeContract(
        {
          address: operation.address,
          abi: minimalObservableConfidentialTokenABI as any,
          functionName,
          args: operation.args,
        },
        {
          onSuccess: () => {
            toast.success(`Successfully set ${operation.description}`);
            // console.log(`Successfully set ${operation.description}`);
            executeNextOperation(index + 1);
          },
          onError: (error: Error) => {
            console.error(`Failed to set ${operation.description}:`, error);
            toast.error(`Failed to set ${operation.description}`);
          },
        },
      );
    };

    // Start the chain of operations
    executeNextOperation(0);
  };
  const { encryptWith } = useFHEEncryption({
    instance,
    ethersSigner: ethersSigner as any,
    contractAddress: zBondingCurve?.address as `0x${string}`,
  });
  const buyBaseAssetToken = async (baseTokenAddress: Address, amount: bigint) => {
    // generate encrypted input for trade tokens
    const enc = await encryptWith(builder => {
      (builder as any)["add64"](amount)[""];
      (builder as any)["add64"](0);
    });
    console.log(enc);
    if (!enc) {
      toast.error("Failed to encrypt input for buying base asset token");
      return;
    }
    writeContract(
      {
        address: zBondingCurve?.address as `0x${string}`,
        abi: (zBondingCurve as ZBondingCurveInfo).abi,
        functionName: "trade" as const,
        args: [parameters.baseTokenAddress, toHex(enc.handles[0]), toHex(enc.handles[1]), toHex(enc.inputProof)],
      },
      {
        onSuccess: () => {
          toast.success("Successfully bought base asset token");
        },
        onError: (error: Error) => {
          toast.error("Failed to buy base asset token");
          console.error("Failed to buy base asset token:", error);
        },
      },
    );
  };
  const buyQuoteAssetToken = async (baseTokenAddress: Address, amount: bigint) => {
    const enc = await encryptWith(builder => {
      (builder as any)["add64"](0);
      (builder as any)["add64"](amount)[""];
    });
    console.log(enc);
    if (!enc) {
      toast.error("Failed to encrypt input for buying quote asset token");
      return;
    }
    writeContract(
      {
        address: zBondingCurve?.address as `0x${string}`,
        abi: (zBondingCurve as ZBondingCurveInfo).abi,
        functionName: "trade" as const,
        args: [parameters.baseTokenAddress, toHex(enc.handles[0]), toHex(enc.handles[1]), toHex(enc.inputProof)],
      },
      {
        onSuccess: () => {
          toast.success("Successfully bought quote asset token");
        },
        onError: (error: Error) => {
          toast.error("Failed to buy quote asset token");
          console.error("Failed to buy quote asset token:", error);
        },
      },
    );
  };
  return {
    getObserverOperatorAccessOnQuoteAndBaseToken,
    buyBaseAssetToken,
    buyQuoteAssetToken,
    writeContractResult: tradeResult,
    quoteBaseTokenInfo,
    baseTokenObserver,
    quoteTokenObserver,
    isOperatorForBaseToken,
    isOperatorForQuoteToken,
    decryptedBaseTokenBalance,
    decrypteBaseTokenBalance,
    refreshBaseTokenBalanceHandle,
  };
};
