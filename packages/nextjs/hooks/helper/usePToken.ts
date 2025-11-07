"use client";

import { useEffect, useState } from "react";
import { useWagmiEthers } from "../wagmi/useWagmiEthers";
import { FhevmInstance, useFHEEncryption } from "@fhevm-sdk";
import { QueryKey, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Address, toHex } from "viem";
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { readContractQueryKey } from "wagmi/query";
import minimalObservableConfidentialTokenABI from "~~/utils/helper/minimalObservableConfidentialTokenABI";
import { AllowedChainIds } from "~~/utils/helper/networks";

export const usePToken = (parameters: {
  instance: FhevmInstance | undefined;
  initialMockChains?: Readonly<Record<number, string>>;
  invalidateQuery?: QueryKey;
  baseTokenAddress: Address;
}) => {
  const queryClient = useQueryClient();
  const { instance, initialMockChains } = parameters;
  const { accounts, chainId, ethersReadonlyProvider, ethersSigner, isConnected } = useWagmiEthers(initialMockChains);
  const allowedChainId = typeof chainId === "number" ? (chainId as AllowedChainIds) : undefined;
  const [mintTransactionHash, setMintTransactionHash] = useState<`0x${string}` | undefined>(undefined);
  const [burnTransactionHash, setBurnTransactionHash] = useState<`0x${string}` | undefined>(undefined);
  const [isEncryptingMint, setIsEncryptingMint] = useState<boolean>(false);
  const [isEncryptingBurn, setIsEncryptingBurn] = useState<boolean>(false);
  const { writeContract: writeMintContract, isPending: isMintPending, ...mintResult } = useWriteContract();
  const { writeContract: writeBurnContract, isPending: isBurnPending, ...burnResult } = useWriteContract();
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

  const readEncryptedBalanceQueryKey = readContractQueryKey({
    address: parameters.baseTokenAddress,
    abi: minimalObservableConfidentialTokenABI as any,
    functionName: "confidentialBalanceOf" as const,
    args: [accounts?.[0] as Address],
    chainId: chainId,
  });

  const {
    data: mintTransactionReceipt,
    isSuccess: isMintSuccess,
    isLoading: isMintLoading,
    isError: isMintError,
    error: mintError,
  } = useWaitForTransactionReceipt({
    hash: mintTransactionHash,
    query: {
      enabled: !!mintTransactionHash,
    },
  });

  const {
    data: burnTransactionReceipt,
    isSuccess: isBurnSuccess,
    isLoading: isBurnLoading,
    isError: isBurnError,
    error: burnError,
  } = useWaitForTransactionReceipt({
    hash: burnTransactionHash,
    query: {
      enabled: !!burnTransactionHash,
    },
  });

  // Track minting state: pending if encrypting, writeContract is pending, or transaction hash exists and transaction hasn't completed
  const isMinting = isEncryptingMint || isMintPending || (!!mintTransactionHash && !isMintSuccess && !isMintError);
  // Track burning state: pending if encrypting, writeContract is pending, or transaction hash exists and transaction hasn't completed
  const isBurning = isEncryptingBurn || isBurnPending || (!!burnTransactionHash && !isBurnSuccess && !isBurnError);

  // Clear mint transaction hash on success or error
  useEffect(() => {
    if (isMintSuccess && mintTransactionReceipt) {
      toast.success("Mint transaction confirmed");
      setMintTransactionHash(undefined);
      queryClient.invalidateQueries({ queryKey: readEncryptedBalanceQueryKey });
    } else if (isMintError) {
      toast.error("Mint transaction failed");
      console.error("Mint transaction error:", mintError);
      setMintTransactionHash(undefined);
    }
  }, [isMintSuccess, isMintError, mintTransactionReceipt, mintError]);

  // Clear burn transaction hash on success or error
  useEffect(() => {
    if (isBurnSuccess && burnTransactionReceipt) {
      toast.success("Burn transaction confirmed");
      setBurnTransactionHash(undefined);
      queryClient.invalidateQueries({ queryKey: readEncryptedBalanceQueryKey });
    } else if (isBurnError) {
      toast.error("Burn transaction failed");
      console.error("Burn transaction error:", burnError);
      setBurnTransactionHash(undefined);
    }
  }, [isBurnSuccess, isBurnError, burnTransactionReceipt, burnError]);
  const mintToken = async (account: Address, amount: bigint) => {
    // generate encrypted input for minting token
    toast("Encrypting input for minting token");
    setIsEncryptingMint(true);
    let enc;
    try {
      enc = await encryptWith(builder => {
        (builder as any)["add64"](amount)[""];
      });
    } finally {
      setIsEncryptingMint(false);
    }
    console.log(enc);
    if (!enc) {
      toast.error("Failed to encrypt input for minting token");
      return;
    }
    writeMintContract(
      {
        address: parameters.baseTokenAddress,
        abi: minimalObservableConfidentialTokenABI as any,
        functionName: "mint" as const,
        args: [account, toHex(enc.handles[0]), toHex(enc.inputProof)],
      },
      {
        onSuccess: hash => {
          setMintTransactionHash(hash);
          toast.success("Mint transaction sent");
        },
        onError: (error: Error) => {
          setMintTransactionHash(undefined);
          toast.error("Failed to mint token");
          console.error("Failed to mint token:", error);
        },
      },
    );
  };
  const burnToken = async (account: Address, amount: bigint) => {
    toast("Encrypting input for burning token");
    setIsEncryptingBurn(true);
    let enc;
    try {
      enc = await encryptWith(builder => {
        (builder as any)["add64"](amount)[""];
      });
    } finally {
      setIsEncryptingBurn(false);
    }
    console.log(enc);
    if (!enc) {
      toast.error("Failed to encrypt input for burning token");
      return;
    }
    writeBurnContract(
      {
        address: parameters.baseTokenAddress,
        abi: minimalObservableConfidentialTokenABI as any,
        functionName: "burn" as const,
        args: [account, toHex(enc.handles[0]), toHex(enc.inputProof)],
      },
      {
        onSuccess: hash => {
          setBurnTransactionHash(hash);
          toast.success("Burn transaction sent");
        },
        onError: (error: Error) => {
          setBurnTransactionHash(undefined);
          toast.error("Failed to burn token");
          console.error("Failed to burn token:", error);
        },
      },
    );
  };
  return {
    mintToken,
    burnToken,
    writeContractResult: mintResult,
    mintWriteContractResult: mintResult,
    burnWriteContractResult: burnResult,
    isTokenCreator,
    tokenCreatorResult,
    isMinting,
    isBurning,
  };
};
