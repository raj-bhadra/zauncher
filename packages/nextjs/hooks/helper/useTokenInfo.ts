// get name, symbol and decimals of a confidential token
import { useWagmiEthers } from "../wagmi/useWagmiEthers";
import { useDeployedContractInfo } from "./useDeployedContractInfo";
import { Address } from "viem";
import { useReadContracts } from "wagmi";
import { Contract } from "~~/utils/helper/contract";
import { AllowedChainIds } from "~~/utils/helper/networks";

const minimalTokenABI = [
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
];

export const useTokenInfo = (parameters: {
  initialMockChains?: Readonly<Record<number, string>>;
  address: Address;
}) => {
  const { initialMockChains } = parameters;
  const { chainId, ethersReadonlyProvider } = useWagmiEthers(initialMockChains);
  const allowedChainId = typeof chainId === "number" ? (chainId as AllowedChainIds) : undefined;
  const { data: confidentialTokenFactory } = useDeployedContractInfo({
    contractName: "ConfidentialTokenFactory",
    chainId: allowedChainId,
  });
  type ConfidentialTokenFactoryInfo = Contract<"ConfidentialTokenFactory"> & { chainId?: number };
  const hasConfidentialTokenFactoryContract = Boolean(
    confidentialTokenFactory?.address && confidentialTokenFactory?.abi,
  );
  const hasProvider = Boolean(ethersReadonlyProvider);

  const tokenInfo = useReadContracts({
    contracts: [
      {
        address: parameters.address,
        abi: minimalTokenABI,
        args: [],
        functionName: "name" as const,
      },
      {
        address: parameters.address,
        abi: minimalTokenABI,
        args: [],
        functionName: "symbol" as const,
      },
      {
        address: parameters.address,
        abi: minimalTokenABI,
        args: [],
        functionName: "decimals" as const,
      },
      {
        address: confidentialTokenFactory?.address as `0x${string}`,
        abi: (hasConfidentialTokenFactoryContract
          ? ((confidentialTokenFactory as ConfidentialTokenFactoryInfo).abi as any)
          : undefined) as any,
        functionName: "isConfidentialTokenRegistered" as const,
        args: [parameters.address],
      },
    ],
    query: {
      enabled: Boolean(hasConfidentialTokenFactoryContract && hasProvider),
    },
  });
  const name = tokenInfo.data?.[0]?.result as string;
  const symbol = tokenInfo.data?.[1]?.result as string;
  const decimals = tokenInfo.data?.[2]?.result as number;
  const isConfidentialTokenRegistered = tokenInfo.data?.[3]?.result as boolean;
  return { tokenInfo, name, symbol, decimals, isConfidentialTokenRegistered };
};
