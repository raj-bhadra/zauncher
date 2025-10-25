import { useWagmiEthers } from "../wagmi/useWagmiEthers";
import { useDeployedContractInfo } from "./useDeployedContractInfo";
import { useQueryClient } from "@tanstack/react-query";
import { Address } from "viem";
import { useReadContract, useWriteContract } from "wagmi";
import { Contract } from "~~/utils/helper/contract";
import { AllowedChainIds } from "~~/utils/helper/networks";

export const useUsdcBalance = (parameters: { initialMockChains?: Readonly<Record<number, string>> }) => {
  const queryClient = useQueryClient();
  const { writeContract, ...writeContractResult } = useWriteContract();
  const { initialMockChains } = parameters;
  const { chainId, accounts, ethersReadonlyProvider } = useWagmiEthers(initialMockChains);
  const allowedChainId = typeof chainId === "number" ? (chainId as AllowedChainIds) : undefined;
  const { data: usdc } = useDeployedContractInfo({ contractName: "USDC", chainId: allowedChainId });
  type UsdcInfo = Contract<"USDC"> & { chainId?: number };
  const hasContract = Boolean(usdc?.address && usdc?.abi);
  const hasProvider = Boolean(ethersReadonlyProvider);
  const readResult = useReadContract({
    address: (hasContract ? (usdc!.address as unknown as `0x${string}`) : undefined) as `0x${string}` | undefined,
    abi: (hasContract ? ((usdc as UsdcInfo).abi as any) : undefined) as any,
    args: [accounts?.[0] as Address],
    functionName: "balanceOf" as const,
    query: {
      enabled: Boolean(hasContract && hasProvider),
      refetchOnWindowFocus: false,
    },
  });
  const mintUsdc = (amount: bigint) => {
    writeContract(
      {
        abi: (usdc as UsdcInfo).abi,
        functionName: "mint" as const,
        args: [accounts![0]! as Address, amount],
        address: usdc!.address as `0x${string}`,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: readResult.queryKey });
        },
      },
    );
  };
  return { readResult, mintUsdc, writeContractResult };
};
