import { ZTokenInput } from "./ZTokenInput";
import { Box, Button } from "@mui/material";
import { Address } from "viem";
import { TokenInfo } from "~~/types/tokenInfo";

export const Buy = ({ baseTokenAddress, baseTokenInfo }: { baseTokenAddress: Address; baseTokenInfo: TokenInfo }) => {
  return (
    <Box>
      <ZTokenInput baseTokenAddress={baseTokenAddress} baseTokenInfo={baseTokenInfo} isBuy={true} />
      <Button>Buy {baseTokenInfo.symbol}</Button>
    </Box>
  );
};
