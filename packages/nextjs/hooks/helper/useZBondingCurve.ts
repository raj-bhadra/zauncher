"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWagmiEthers } from "../wagmi/useWagmiEthers";
import { useDeployedContractInfo } from "./useDeployedContractInfo";
import { FhevmInstance, useFHEDecrypt, useInMemoryStorage } from "@fhevm-sdk";
import { QueryKey, useQueryClient } from "@tanstack/react-query";
// @ts-ignore
import { ethers } from "ethers";
import { toast } from "react-hot-toast";
import { Address } from "viem";
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
  const buyBaseAssetToken = (baseTokenAddress: Address, amount: bigint) => {
    // set erc 7984 operator for base token as zBonding Curve
    // set erc 7984 operator for quote token as zBonding Curve
    // set erc 7984 observer for base token as zBonding Curve
    // set erc 7984 observer for quote token as zBonding Curve
    // generate encrypted input for trade tokens
  };
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
    ],
  });
  const buyQuoteAssetToken = (baseTokenAddress: Address, amount: bigint) => {};
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
  return {
    getObserverOperatorAccessOnQuoteAndBaseToken,
    writeContractResult: tradeResult,
    quoteBaseTokenInfo,
    baseTokenObserver,
    quoteTokenObserver,
    isOperatorForBaseToken,
    isOperatorForQuoteToken,
  };
};
