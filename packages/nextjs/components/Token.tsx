import { BondingCurveTrade } from "./helper/BondingCurveTrade";
import { Box, Typography } from "@mui/material";
import { Address } from "viem";
import { useTokenInfo } from "~~/hooks/helper/useTokenInfo";

export const Token = ({ address }: { address: Address }) => {
  const { tokenInfo, name, symbol, decimals, isConfidentialTokenRegistered } = useTokenInfo({ address });
  const isSuccess = Boolean(tokenInfo.isFetched && tokenInfo.isSuccess && !tokenInfo.isError && symbol !== undefined);
  const isLoading = tokenInfo.isFetching || tokenInfo.isLoading;
  const isError = tokenInfo.isFetched && (symbol === undefined || isConfidentialTokenRegistered === undefined);
  return (
    <Box>
      {isSuccess && (
        <>
          <Typography>Token: {address}</Typography>
          <Typography>Name: {name}</Typography>
          <Typography>Symbol: {symbol}</Typography>
          <Typography>Decimals: {decimals}</Typography>
          <BondingCurveTrade address={address} baseTokenInfo={{ name, symbol, decimals }} />
        </>
      )}
      {isLoading && <Typography>Loading token info...</Typography>}
      {isError && <Typography>Not a confidential token</Typography>}
    </Box>
  );
};
