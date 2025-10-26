import { useWagmiEthers } from "../wagmi/useWagmiEthers";
import { useDeployedContractInfo } from "./useDeployedContractInfo";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Address } from "viem";
import { useReadContract, useWriteContract } from "wagmi";
import { Contract } from "~~/utils/helper/contract";
import { AllowedChainIds } from "~~/utils/helper/networks";

export const useUsdc = (parameters: { initialMockChains?: Readonly<Record<number, string>> }) => {
  const queryClient = useQueryClient();
  const { writeContract, ...mintUsdcResult } = useWriteContract();
  const { initialMockChains } = parameters;
  const { chainId, accounts, ethersReadonlyProvider } = useWagmiEthers(initialMockChains);
  const allowedChainId = typeof chainId === "number" ? (chainId as AllowedChainIds) : undefined;
  const { data: usdc } = useDeployedContractInfo({ contractName: "USDC", chainId: allowedChainId });
  type UsdcInfo = Contract<"USDC"> & { chainId?: number };
  const hasUsdcContract = Boolean(usdc?.address && usdc?.abi);
  const hasProvider = Boolean(ethersReadonlyProvider);
  const readUsdcBalanceResult = useReadContract({
    address: (hasUsdcContract ? (usdc!.address as unknown as `0x${string}`) : undefined) as `0x${string}` | undefined,
    abi: (hasUsdcContract ? ((usdc as UsdcInfo).abi as any) : undefined) as any,
    args: [accounts?.[0] as Address],
    functionName: "balanceOf" as const,
    query: {
      enabled: Boolean(hasUsdcContract && hasProvider),
      refetchOnWindowFocus: false,
    },
  });
  const mintUsdc = (amount: bigint) => {
    toast("Minting 100 USDC...");
    writeContract(
      {
        abi: (usdc as UsdcInfo).abi,
        functionName: "mint" as const,
        args: [accounts![0]! as Address, amount],
        address: usdc!.address as `0x${string}`,
      },
      {
        onSuccess: () => {
          toast.success("100 USDC minted successfully");
          queryClient.invalidateQueries({ queryKey: readUsdcBalanceResult.queryKey });
        },
        onError: () => {
          toast.error("Failed to mint USDC");
        },
      },
    );
  };
  return { readUsdcBalanceResult, mintUsdc, mintUsdcResult };
};
