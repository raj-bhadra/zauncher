"use client";

import { useWagmiEthers } from "../wagmi/useWagmiEthers";
import { FhevmInstance, buildParamsFromAbi, useFHEDecrypt, useFHEEncryption, useInMemoryStorage } from "@fhevm-sdk";
import { QueryKey, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Address, toHex } from "viem";
import { useReadContract, useWriteContract } from "wagmi";
import minimalObservableConfidentialTokenABI from "~~/utils/helper/minimalObservableConfidentialTokenABI";

export const usePToken = (parameters: {
  instance: FhevmInstance | undefined;
  initialMockChains?: Readonly<Record<number, string>>;
  invalidateQuery?: QueryKey;
  baseTokenAddress: Address;
}) => {
  const { instance, initialMockChains } = parameters;
  const { accounts, ethersReadonlyProvider, ethersSigner, isConnected } = useWagmiEthers(initialMockChains);
  const { writeContract, ...mintBurnResult } = useWriteContract();
  const hasProvider = Boolean(ethersReadonlyProvider);
  const hasSigner = Boolean(ethersSigner);
  const tokenCreatorResult = useReadContract({
    address: parameters.baseTokenAddress,
    abi: minimalObservableConfidentialTokenABI as any,
    functionName: "getCreator" as const,
    query: {
      enabled: Boolean(hasProvider),
      refetchOnWindowFocus: false,
    },
  });

  const mounted = isConnected && hasProvider && hasSigner && tokenCreatorResult.isSuccess;
  const isTokenCreator = mounted && (tokenCreatorResult.data as Address) === accounts?.[0];
  const { encryptWith } = useFHEEncryption({
    instance,
    ethersSigner: ethersSigner as any,
    contractAddress: parameters.baseTokenAddress as `0x${string}`,
  });
  const mintToken = async (account: Address, amount: bigint) => {
    // generate encrypted input for minting token
    const enc = await encryptWith(builder => {
      (builder as any)["add64"](amount)[""];
    });
    console.log(enc);
    if (!enc) {
      toast.error("Failed to encrypt input for minting token");
      return;
    }
    writeContract(
      {
        address: parameters.baseTokenAddress,
        abi: minimalObservableConfidentialTokenABI as any,
        functionName: "mint" as const,
        args: [account, toHex(enc.handles[0]), toHex(enc.inputProof)],
      },
      {
        onSuccess: () => {
          toast.success("Successfully minted token");
        },
        onError: (error: Error) => {
          toast.error("Failed to mint token");
          console.error("Failed to mint token:", error);
        },
      },
    );
  };
  const burnToken = async (account: Address, amount: bigint) => {
    const enc = await encryptWith(builder => {
      (builder as any)["add64"](amount)[""];
    });
    console.log(enc);
    if (!enc) {
      toast.error("Failed to encrypt input for burning token");
      return;
    }
    writeContract(
      {
        address: parameters.baseTokenAddress,
        abi: minimalObservableConfidentialTokenABI as any,
        functionName: "burn" as const,
        args: [account, toHex(enc.handles[0]), toHex(enc.inputProof)],
      },
      {
        onSuccess: () => {
          toast.success("Successfully burned token");
        },
        onError: (error: Error) => {
          toast.error("Failed to burn token");
          console.error("Failed to burn token:", error);
        },
      },
    );
  };
  return {
    mintToken,
    burnToken,
    writeContractResult: mintBurnResult,
    isTokenCreator,
    tokenCreatorResult,
  };
};
