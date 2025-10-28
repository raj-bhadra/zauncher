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
import { useReadContract, useWriteContract } from "wagmi";
import { Contract } from "~~/utils/helper/contract";
import { AllowedChainIds } from "~~/utils/helper/networks";

export const useConfidentialTokenWrapper = (parameters: {
  instance: FhevmInstance | undefined;
  initialMockChains?: Readonly<Record<number, string>>;
  invalidateQuery?: QueryKey;
}) => {
  const queryClient = useQueryClient();
  const [decryptedBalance, setDecryptedBalance] = useState<bigint | undefined>(undefined);
  const { writeContract, ...wrapConfidentialTokenWrapperResult } = useWriteContract();
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const { instance, initialMockChains } = parameters;
  const { chainId, accounts, ethersReadonlyProvider, ethersSigner } = useWagmiEthers(initialMockChains);
  const allowedChainId = typeof chainId === "number" ? (chainId as AllowedChainIds) : undefined;
  const { data: confidentialTokenWrapper } = useDeployedContractInfo({
    contractName: "ConfidentialTokenWrapper",
    chainId: allowedChainId,
  });
  const { data: usdc } = useDeployedContractInfo({
    contractName: "USDC",
    chainId: allowedChainId,
  });
  type ConfidentialTokenWrapperInfo = Contract<"ConfidentialTokenWrapper"> & { chainId?: number };
  type UsdcInfo = Contract<"USDC"> & { chainId?: number };
  const hasConfidentialTokenWrapperContract = Boolean(
    confidentialTokenWrapper?.address && confidentialTokenWrapper?.abi,
  );
  const hasProvider = Boolean(ethersReadonlyProvider);
  const readConfidentialTokenWrapperBalanceResult = useReadContract({
    address: (hasConfidentialTokenWrapperContract
      ? (confidentialTokenWrapper!.address as unknown as `0x${string}`)
      : undefined) as `0x${string}` | undefined,
    abi: (hasConfidentialTokenWrapperContract
      ? ((confidentialTokenWrapper as ConfidentialTokenWrapperInfo).abi as any)
      : undefined) as any,
    args: [accounts?.[0] as Address],
    functionName: "confidentialBalanceOf" as const,
    query: {
      enabled: Boolean(hasConfidentialTokenWrapperContract && hasProvider),
      refetchOnWindowFocus: false,
    },
  });
  const balanceHandle = useMemo(
    () => (readConfidentialTokenWrapperBalanceResult.data as string | undefined) ?? undefined,
    [readConfidentialTokenWrapperBalanceResult.data],
  );
  const refreshBalanceHandle = useCallback(async () => {
    const res = await readConfidentialTokenWrapperBalanceResult.refetch();
    if (res.error) toast.error("Failed to refresh confidential token wrapper balance");
  }, [readConfidentialTokenWrapperBalanceResult]);
  const requests = useMemo(() => {
    if (!hasConfidentialTokenWrapperContract || !balanceHandle || balanceHandle === ethers.ZeroHash) return undefined;
    return [{ handle: balanceHandle, contractAddress: confidentialTokenWrapper!.address } as const];
  }, [hasConfidentialTokenWrapperContract, confidentialTokenWrapper?.address, balanceHandle]);
  const { canDecrypt, decrypt, isDecrypting, message, results } = useFHEDecrypt({
    instance,
    ethersSigner: ethersSigner as any,
    fhevmDecryptionSignatureStorage,
    chainId,
    requests,
  });
  useEffect(() => {
    if (results[balanceHandle!]) setDecryptedBalance(results[balanceHandle!] as bigint | undefined);
  }, [results, balanceHandle]);

  const clearBalance = useMemo(() => {
    if (!balanceHandle) return undefined;
    if (balanceHandle === ethers.ZeroHash) return { handle: balanceHandle, clear: BigInt(0) } as const;
    const clear = results[balanceHandle];
    if (typeof clear === "undefined") return undefined;
    return { handle: balanceHandle, clear } as const;
  }, [balanceHandle, results]);
  const wrapUsdc = (amount: bigint) => {
    toast("Approving USDC Transfer To zUSDC...");
    writeContract(
      {
        abi: (usdc as UsdcInfo).abi,
        functionName: "approve" as const,
        args: [confidentialTokenWrapper!.address as `0x${string}`, amount],
        address: usdc!.address as `0x${string}`,
      },
      {
        onSuccess: () => {
          toast("Wrapping USDC To zUSDC...");
          writeContract(
            {
              abi: (confidentialTokenWrapper as ConfidentialTokenWrapperInfo).abi,
              functionName: "wrap" as const,
              args: [accounts![0]! as Address, amount],
              address: confidentialTokenWrapper!.address as `0x${string}`,
            },
            {
              onSuccess: () => {
                toast.success("USDC wrapped successfully");
                queryClient.invalidateQueries({
                  queryKey: [readConfidentialTokenWrapperBalanceResult.queryKey, parameters.invalidateQuery],
                });
              },
              onError: () => {
                toast.error("Failed to wrap USDC");
              },
            },
          );
        },
        onError: () => {
          toast.error("Failed to approve USDC transfer");
        },
      },
    );
  };
  return {
    readConfidentialTokenWrapperBalanceResult,
    wrapUsdc,
    wrapConfidentialTokenWrapperResult,
    decrypt,
    isDecrypting,
    decryptedBalance,
    refreshBalanceHandle,
    clearBalance: clearBalance?.clear,
    canDecrypt,
  };
};
