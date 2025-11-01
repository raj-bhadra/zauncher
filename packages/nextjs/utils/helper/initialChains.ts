import { RPC_CHAIN_NAMES, getAlchemyHttpUrl } from ".";
import * as chains from "viem/chains";

let initialMockChains: Record<number, string> = {
  31137: "http://localhost:8545",
};

if (process.env.NODE_ENV === "production") {
  initialMockChains = {
    [chains.sepolia.id]: `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
  };
}

export default initialMockChains;
