"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWagmiEthers } from "../wagmi/useWagmiEthers";
import { useDeployedContractInfo } from "./useDeployedContractInfo";
import { FhevmInstance, buildParamsFromAbi, useFHEDecrypt, useFHEEncryption, useInMemoryStorage } from "@fhevm-sdk";
import { QueryKey, useQueryClient } from "@tanstack/react-query";
// @ts-ignore
import { ethers } from "ethers";
import { toast } from "react-hot-toast";
import { Address, toHex } from "viem";
import { useReadContracts } from "wagmi";
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
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
  const [decryptedBaseTokenBalance, setDecryptedBaseTokenBalance] = useState<bigint | undefined>(undefined);
  const [operationHash, setOperationHash] = useState<`0x${string}` | undefined>(undefined);
  const [buyTransactionHash, setBuyTransactionHash] = useState<`0x${string}` | undefined>(undefined);
  const [sellTransactionHash, setSellTransactionHash] = useState<`0x${string}` | undefined>(undefined);
  const [isEncryptingBuy, setIsEncryptingBuy] = useState<boolean>(false);
  const [isEncryptingSell, setIsEncryptingSell] = useState<boolean>(false);
  const [pendingOperations, setPendingOperations] = useState<
    | Array<{
        type: "setObserver" | "setOperator";
        address: `0x${string}`;
        args: readonly [Address, `0x${string}`] | readonly [`0x${string}`, bigint];
        description: string;
      }>
    | undefined
  >(undefined);
  const [currentOperationIndex, setCurrentOperationIndex] = useState<number>(0);
  const operationTriggeredRef = useRef<`0x${string}` | undefined>(undefined);
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const { instance, initialMockChains } = parameters;
  const { chainId, accounts, ethersReadonlyProvider, ethersSigner, isConnected } = useWagmiEthers(initialMockChains);
  const { writeContract, ...tradeResult } = useWriteContract();
  const { writeContract: writeBuyContract, isPending: isBuyPending, ...buyResult } = useWriteContract();
  const { writeContract: writeSellContract, isPending: isSellPending, ...sellResult } = useWriteContract();
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

  const {
    data: operationTransactionReceipt,
    isSuccess: isOperationSuccess,
    isLoading: isOperationLoading,
  } = useWaitForTransactionReceipt({
    hash: operationHash,
    query: {
      enabled: !!operationHash,
    },
  });

  const {
    data: buyTransactionReceipt,
    isSuccess: isBuySuccess,
    isLoading: isBuyLoading,
    isError: isBuyError,
    error: buyError,
  } = useWaitForTransactionReceipt({
    hash: buyTransactionHash,
    query: {
      enabled: !!buyTransactionHash,
    },
  });

  const {
    data: sellTransactionReceipt,
    isSuccess: isSellSuccess,
    isLoading: isSellLoading,
    isError: isSellError,
    error: sellError,
  } = useWaitForTransactionReceipt({
    hash: sellTransactionHash,
    query: {
      enabled: !!sellTransactionHash,
    },
  });

  // Track buying state: pending if encrypting, writeContract is pending, or transaction hash exists and transaction hasn't completed
  const isBuying = isEncryptingBuy || isBuyPending || (!!buyTransactionHash && !isBuySuccess && !isBuyError);
  // Track selling state: pending if encrypting, writeContract is pending, or transaction hash exists and transaction hasn't completed
  const isSelling = isEncryptingSell || isSellPending || (!!sellTransactionHash && !isSellSuccess && !isSellError);

  // Clear buy transaction hash on success or error
  useEffect(() => {
    if (isBuySuccess && buyTransactionReceipt) {
      toast.success("Buy transaction confirmed");
      setBuyTransactionHash(undefined);
      // Optionally refresh balances or other data
      quoteBaseTokenInfo.refetch();
    } else if (isBuyError) {
      toast.error("Buy transaction failed");
      console.error("Buy transaction error:", buyError);
      setBuyTransactionHash(undefined);
    }
  }, [isBuySuccess, isBuyError, buyTransactionReceipt, buyError, quoteBaseTokenInfo]);

  // Clear sell transaction hash on success or error
  useEffect(() => {
    if (isSellSuccess && sellTransactionReceipt) {
      toast.success("Sell transaction confirmed");
      setSellTransactionHash(undefined);
      // Optionally refresh balances or other data
      quoteBaseTokenInfo.refetch();
    } else if (isSellError) {
      toast.error("Sell transaction failed");
      console.error("Sell transaction error:", sellError);
      setSellTransactionHash(undefined);
    }
  }, [isSellSuccess, isSellError, sellTransactionReceipt, sellError, quoteBaseTokenInfo]);

  // Trigger next operation after current operation is confirmed
  useEffect(() => {
    if (
      isOperationSuccess &&
      operationTransactionReceipt &&
      operationHash &&
      pendingOperations &&
      currentOperationIndex < pendingOperations.length &&
      operationTriggeredRef.current !== operationHash
    ) {
      operationTriggeredRef.current = operationHash;
      const nextIndex = currentOperationIndex + 1;

      if (nextIndex >= pendingOperations.length) {
        // All operations completed
        const lastOperation = pendingOperations[currentOperationIndex];
        if (lastOperation) {
          toast.success(`Successfully set ${lastOperation.description}`);
        }
        toast.success("Observer and operator access set successfully");
        quoteBaseTokenInfo.refetch();
        setOperationHash(undefined);
        setPendingOperations(undefined);
        setCurrentOperationIndex(0);
        operationTriggeredRef.current = undefined;
        return;
      }

      // Show success for completed operation
      const completedOperation = pendingOperations[currentOperationIndex];
      if (completedOperation) {
        toast.success(`Successfully set ${completedOperation.description}`);
      }

      // Execute next operation
      const nextOperation = pendingOperations[nextIndex];
      const functionName = nextOperation.type === "setObserver" ? "setObserver" : "setOperator";

      toast("Setting " + nextOperation.description);

      writeContract(
        {
          address: nextOperation.address,
          abi: minimalObservableConfidentialTokenABI as any,
          functionName,
          args: nextOperation.args,
        },
        {
          onSuccess: hash => {
            setOperationHash(hash);
            setCurrentOperationIndex(nextIndex);
            operationTriggeredRef.current = undefined;
          },
          onError: (error: Error) => {
            console.error(`Failed to set ${nextOperation.description}:`, error);
            toast.error(`Failed to set ${nextOperation.description}`);
            setOperationHash(undefined);
            setPendingOperations(undefined);
            setCurrentOperationIndex(0);
            operationTriggeredRef.current = undefined;
          },
        },
      );
    }
  }, [
    isOperationSuccess,
    operationTransactionReceipt,
    operationHash,
    pendingOperations,
    currentOperationIndex,
    writeContract,
    quoteBaseTokenInfo,
  ]);

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

    if (operations.length === 0) {
      return;
    }

    // Set pending operations and start with the first one
    setPendingOperations(operations);
    setCurrentOperationIndex(0);
    operationTriggeredRef.current = undefined;

    const firstOperation = operations[0];
    const functionName = firstOperation.type === "setObserver" ? "setObserver" : "setOperator";

    toast("Setting " + firstOperation.description);

    writeContract(
      {
        address: firstOperation.address,
        abi: minimalObservableConfidentialTokenABI as any,
        functionName,
        args: firstOperation.args,
      },
      {
        onSuccess: hash => {
          setOperationHash(hash);
        },
        onError: (error: Error) => {
          console.error(`Failed to set ${firstOperation.description}:`, error);
          toast.error(`Failed to set ${firstOperation.description}`);
          setPendingOperations(undefined);
          setCurrentOperationIndex(0);
        },
      },
    );
  };
  const { encryptWith } = useFHEEncryption({
    instance,
    ethersSigner: ethersSigner as any,
    contractAddress: zBondingCurve?.address as `0x${string}`,
  });
  const buyBaseAssetToken = async (baseTokenAddress: Address, amount: bigint) => {
    // generate encrypted input for trade tokens
    toast("Encrypting input for buying base asset token");
    setIsEncryptingBuy(true);
    let enc;
    try {
      enc = await encryptWith(builder => {
        (builder as any)["add64"](amount)[""];
        (builder as any)["add64"](0);
      });
    } finally {
      setIsEncryptingBuy(false);
    }
    console.log(enc);
    if (!enc) {
      toast.error("Failed to encrypt input for buying base asset token");
      return;
    }
    writeBuyContract(
      {
        address: zBondingCurve?.address as `0x${string}`,
        abi: (zBondingCurve as ZBondingCurveInfo).abi,
        functionName: "trade" as const,
        args: [parameters.baseTokenAddress, toHex(enc.handles[0]), toHex(enc.handles[1]), toHex(enc.inputProof)],
      },
      {
        onSuccess: hash => {
          setBuyTransactionHash(hash);
          toast.success("Base asset token buy transaction sent");
        },
        onError: (error: Error) => {
          setBuyTransactionHash(undefined);
          toast.error("Failed to buy base asset token");
          console.error("Failed to buy base asset token:", error);
        },
      },
    );
  };
  const buyQuoteAssetToken = async (baseTokenAddress: Address, amount: bigint) => {
    toast("Encrypting input for selling base asset token");
    setIsEncryptingSell(true);
    let enc;
    try {
      enc = await encryptWith(builder => {
        (builder as any)["add64"](0);
        (builder as any)["add64"](amount)[""];
      });
    } finally {
      setIsEncryptingSell(false);
    }
    console.log(enc);
    if (!enc) {
      toast.error("Failed to encrypt input for selling base asset token");
      return;
    }
    writeSellContract(
      {
        address: zBondingCurve?.address as `0x${string}`,
        abi: (zBondingCurve as ZBondingCurveInfo).abi,
        functionName: "trade" as const,
        args: [parameters.baseTokenAddress, toHex(enc.handles[0]), toHex(enc.handles[1]), toHex(enc.inputProof)],
      },
      {
        onSuccess: hash => {
          setSellTransactionHash(hash);
          toast.success("Quote asset token buy transaction sent");
        },
        onError: (error: Error) => {
          setSellTransactionHash(undefined);
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
    buyWriteContractResult: buyResult,
    sellWriteContractResult: sellResult,
    quoteBaseTokenInfo,
    baseTokenObserver,
    quoteTokenObserver,
    isOperatorForBaseToken,
    isOperatorForQuoteToken,
    decryptedBaseTokenBalance,
    decrypteBaseTokenBalance,
    refreshBaseTokenBalanceHandle,
    isApprovalLoading: isOperationLoading,
    isBuying,
    isSelling,
  };
};

export const useEncryptedBalanceOf = (parameters: {
  instance: FhevmInstance | undefined;
  initialMockChains?: Readonly<Record<number, string>>;
  confidentialToken: Address;
  account: Address;
}) => {
  const [decryptedBaseTokenBalance, setDecryptedBaseTokenBalance] = useState<bigint | undefined>(undefined);
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const { instance, confidentialToken, account, initialMockChains } = parameters;
  const { chainId, accounts, ethersReadonlyProvider, ethersSigner, isConnected } = useWagmiEthers(initialMockChains);
  const allowedChainId = typeof chainId === "number" ? (chainId as AllowedChainIds) : undefined;
  const hasProvider = Boolean(ethersReadonlyProvider);
  const encryptedBalanceResult = useReadContract({
    address: confidentialToken,
    abi: minimalObservableConfidentialTokenABI as any,
    functionName: "confidentialBalanceOf" as const,
    args: [account],
    query: {
      enabled: Boolean(hasProvider),
      refetchOnWindowFocus: false,
    },
  });
  const encryptedBalanceHandle = useMemo(
    () => (encryptedBalanceResult.data as string | undefined) ?? undefined,
    [encryptedBalanceResult.data],
  );
  const refreshBalanceHandle = useCallback(async () => {
    const res = await encryptedBalanceResult.refetch();
    if (res.error) toast.error("Failed to refresh confidential token wrapper balance");
  }, [encryptedBalanceResult]);
  const requests = useMemo(() => {
    if (!encryptedBalanceHandle || encryptedBalanceHandle === ethers.ZeroHash) return undefined;
    return [{ handle: encryptedBalanceHandle, contractAddress: confidentialToken } as const];
  }, [encryptedBalanceHandle]);
  const {
    canDecrypt,
    decrypt: decryptBalance,
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
    if (results[encryptedBalanceHandle!])
      setDecryptedBaseTokenBalance(results[encryptedBalanceHandle!] as bigint | undefined);
  }, [results, encryptedBalanceHandle]);

  const clearBaseTokenBalance = useMemo(() => {
    if (!encryptedBalanceHandle) return undefined;
    if (encryptedBalanceHandle === ethers.ZeroHash)
      return { handle: encryptedBalanceHandle, clear: BigInt(0) } as const;
    const clear = results[encryptedBalanceHandle];
    if (typeof clear === "undefined") return undefined;
    return { handle: encryptedBalanceHandle, clear } as const;
  }, [encryptedBalanceHandle, results]);

  return {
    canDecrypt,
    encryptedBalanceResult,
    decryptedBaseTokenBalance,
    clearBaseTokenBalance,
    refreshBalanceHandle,
    decryptBalance,
  };
};

export const useZBondingCurveBuyEstimates = (parameters: {
  initialMockChains?: Readonly<Record<number, string>>;
  baseAssetToken: Address;
  amountIn: bigint;
}) => {
  const { amountIn, baseAssetToken, initialMockChains } = parameters;
  const { chainId, ethersReadonlyProvider } = useWagmiEthers(initialMockChains);
  const allowedChainId = typeof chainId === "number" ? (chainId as AllowedChainIds) : undefined;
  const { data: zBondingCurve } = useDeployedContractInfo({ contractName: "ZBondingCurve", chainId: allowedChainId });
  type ZBondingCurveInfo = Contract<"ZBondingCurve"> & { chainId?: number };
  const hasZBondingCurveContract = Boolean(zBondingCurve?.address && zBondingCurve?.abi);
  const hasProvider = Boolean(ethersReadonlyProvider);
  const buyEstimateResult = useReadContract({
    address: (hasZBondingCurveContract ? (zBondingCurve!.address as unknown as `0x${string}`) : undefined) as
      | `0x${string}`
      | undefined,
    abi: (hasZBondingCurveContract ? ((zBondingCurve as ZBondingCurveInfo).abi as any) : undefined) as any,
    functionName: "calculateTokenOutAtLastDecryptedPrice" as const,
    args: [baseAssetToken, amountIn],
    query: {
      enabled: Boolean(hasZBondingCurveContract && hasProvider),
      refetchOnWindowFocus: false,
    },
  });
  return { buyEstimateResult };
};

export const useZBondingCurveSellEstimates = (parameters: {
  initialMockChains?: Readonly<Record<number, string>>;
  baseAssetToken: Address;
  amountIn: bigint;
}) => {
  const { amountIn, baseAssetToken, initialMockChains } = parameters;
  const { chainId, ethersReadonlyProvider } = useWagmiEthers(initialMockChains);
  const allowedChainId = typeof chainId === "number" ? (chainId as AllowedChainIds) : undefined;
  const { data: zBondingCurve } = useDeployedContractInfo({ contractName: "ZBondingCurve", chainId: allowedChainId });
  type ZBondingCurveInfo = Contract<"ZBondingCurve"> & { chainId?: number };
  const hasZBondingCurveContract = Boolean(zBondingCurve?.address && zBondingCurve?.abi);
  const hasProvider = Boolean(ethersReadonlyProvider);
  const sellEstimateResult = useReadContract({
    address: (hasZBondingCurveContract ? (zBondingCurve!.address as unknown as `0x${string}`) : undefined) as
      | `0x${string}`
      | undefined,
    abi: (hasZBondingCurveContract ? ((zBondingCurve as ZBondingCurveInfo).abi as any) : undefined) as any,
    functionName: "calculateQuoteAssetOutAtLastDecryptedPrice" as const,
    args: [baseAssetToken, amountIn],
    query: {
      enabled: Boolean(hasZBondingCurveContract && hasProvider),
      refetchOnWindowFocus: false,
    },
  });
  return { sellEstimateResult };
};
