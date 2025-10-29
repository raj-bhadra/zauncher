import { ZTokenInput } from "./ZTokenInput";
import { Box, Button } from "@mui/material";
import { Address } from "viem";
import { TokenInfo } from "~~/types/tokenInfo";

export const Sell = ({ baseTokenAddress, baseTokenInfo }: { baseTokenAddress: Address; baseTokenInfo: TokenInfo }) => {
  return (
    <Box>
      <ZTokenInput baseTokenAddress={baseTokenAddress} baseTokenInfo={baseTokenInfo} isBuy={false} />
      <Button>Sell {baseTokenInfo.symbol}</Button>
    </Box>
  );
};
