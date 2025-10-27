import { ZTokenInput } from "./ZTokenInput";
import { Box, Button } from "@mui/material";
import { Address } from "viem";
import { TokenInfo } from "~~/types/tokenInfo";

export const Sell = ({ address, baseTokenInfo }: { address: Address; baseTokenInfo: TokenInfo }) => {
  return (
    <Box>
      <ZTokenInput address={address} baseTokenInfo={baseTokenInfo} isBuy={false} />
      <Button>Sell {baseTokenInfo.symbol}</Button>
    </Box>
  );
};
