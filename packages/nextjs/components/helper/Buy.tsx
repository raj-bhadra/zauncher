import { ZTokenInput } from "./ZTokenInput";
import { Box, Button } from "@mui/material";
import { Address } from "viem";
import { TokenInfo } from "~~/types/tokenInfo";

export const Buy = ({ address, baseTokenInfo }: { address: Address; baseTokenInfo: TokenInfo }) => {
  return (
    <Box>
      <ZTokenInput address={address} baseTokenInfo={baseTokenInfo} isBuy={true} />
      <Button>Buy {baseTokenInfo.symbol}</Button>
    </Box>
  );
};
