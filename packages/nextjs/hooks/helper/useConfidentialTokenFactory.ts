import { useEffect, useState } from "react";
import { useWagmiEthers } from "../wagmi/useWagmiEthers";
import { useDeployedContractInfo } from "./useDeployedContractInfo";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Address, Log, keccak256, toHex } from "viem";
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { WriteContractReturnType } from "wagmi/actions";
import { Contract } from "~~/utils/helper/contract";
import { AllowedChainIds } from "~~/utils/helper/networks";

export const useConfidentialTokenFactory = (parameters: { initialMockChains?: Readonly<Record<number, string>> }) => {
  const [tokenAddress, setTokenAddress] = useState<Address | undefined>(undefined);
  const queryClient = useQueryClient();
  const { data: hash, writeContract, isPending: isWritingContract } = useWriteContract();
  const {
    isPending: isPending,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: transactionReceipt,
  } = useWaitForTransactionReceipt({
    hash,
  });
  const { initialMockChains } = parameters;
  const { chainId, ethersReadonlyProvider } = useWagmiEthers(initialMockChains);
  const allowedChainId = typeof chainId === "number" ? (chainId as AllowedChainIds) : undefined;
  const { data: confidentialTokenFactory } = useDeployedContractInfo({
    contractName: "ConfidentialTokenFactory",
    chainId: allowedChainId,
  });
  const hasConfidentailTokenFactoryContract = Boolean(
    confidentialTokenFactory?.address && confidentialTokenFactory?.abi,
  );
  const hasProvider = Boolean(ethersReadonlyProvider);
  type ConfidentialTokenFactoryInfo = Contract<"ConfidentialTokenFactory"> & { chainId?: number };
  const readTokenAddressesResult = useReadContract({
    address: (hasConfidentailTokenFactoryContract
      ? (confidentialTokenFactory!.address as unknown as `0x${string}`)
      : undefined) as `0x${string}` | undefined,
    abi: (hasConfidentailTokenFactoryContract
      ? ((confidentialTokenFactory as ConfidentialTokenFactoryInfo).abi as any)
      : undefined) as any,
    functionName: "getTokenAddresses" as const,
    query: {
      enabled: Boolean(hasConfidentailTokenFactoryContract && hasProvider),
      refetchOnWindowFocus: false,
    },
  });
  // Create token should return the token address of the launched token
  // We can either get it by getting the token address from the response of this call
  // or from the event of the transaction
  useEffect(() => {
    if (isConfirmed && transactionReceipt) {
      console.log("Transaction receipt logs:");
      console.log(transactionReceipt);

      // Find the TokenCreated event log
      const tokenCreatedLog = transactionReceipt.logs?.find((log: Log) => {
        try {
          // The event signature is "TokenCreated(address indexed tokenAddress)"
          // Indexed parameters go in topics[1], topics[2], etc.
          // topics[0] is the keccak256 hash of the event signature
          return log.topics[0] === keccak256(toHex("TokenCreated(address)"));
        } catch {
          return false;
        }
      });

      if (tokenCreatedLog && tokenCreatedLog.topics[1]) {
        // The token address is in topics[1] as an indexed parameter
        // Remove the 0x prefix and extract the last 40 characters (20 bytes = 40 hex chars)
        // Addresses in topics are padded to 32 bytes with zeros at the beginning
        const tokenAddressHex = tokenCreatedLog.topics[1].slice(2).slice(-40);
        const tokenAddress = `0x${tokenAddressHex}` as Address;
        console.log("Found token address:", tokenAddress);
        setTokenAddress(tokenAddress);
      } else {
        console.log("TokenCreated event not found in logs");
        console.log("Available logs:", transactionReceipt.logs);
      }
    }
  }, [isConfirmed, transactionReceipt]);
  const createToken = (name: string, symbol: string, contractURI: string) => {
    toast("Creating confidential token...");
    console.log("ConfidentialTokenFactory address:");
    console.log(confidentialTokenFactory?.address);
    writeContract(
      {
        abi: (confidentialTokenFactory as ConfidentialTokenFactoryInfo).abi,
        functionName: "createToken" as const,
        args: [name, symbol, contractURI],
        address: confidentialTokenFactory!.address as `0x${string}`,
      },
      {
        onSuccess: (data: WriteContractReturnType) => {
          toast.success("Confidential token created successfully");
          queryClient.invalidateQueries({ queryKey: readTokenAddressesResult.queryKey });
        },
        onError: () => {
          toast.error("Failed to create confidential token");
        },
      },
    );
  };
  const clearTokenAddress = () => {
    setTokenAddress(undefined);
  };
  return {
    createToken,
    tokenAddress,
    clearTokenAddress,
    isPending,
    isWritingContract,
    isConfirming,
    isConfirmed,
    transactionReceipt,
    readTokenAddressesResult,
  };
};
