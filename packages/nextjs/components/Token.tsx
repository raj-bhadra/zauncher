import { AboutToken } from "./AboutToken";
import { BondingCurveTrade } from "./helper/BondingCurveTrade";
import { Usdc } from "./helper/Usdc";
import { Box, Container, Stack, Typography } from "@mui/material";
import { Address } from "viem";
import { useTokenInfo } from "~~/hooks/helper/useTokenInfo";

export const Token = ({ address }: { address: Address }) => {
  const { tokenInfo, name, symbol, decimals, isConfidentialTokenRegistered } = useTokenInfo({ address });
  const isSuccess = Boolean(tokenInfo.isFetched && tokenInfo.isSuccess && !tokenInfo.isError && symbol !== undefined);
  const isLoading = tokenInfo.isFetching || tokenInfo.isLoading;
  const isError = tokenInfo.isFetched && (symbol === undefined || isConfidentialTokenRegistered === undefined);
  return (
    <Container maxWidth="lg">
      {isSuccess && (
        <>
          <Stack direction="row" spacing={2}>
            <Box sx={{ width: "50%" }}>
              <AboutToken tokenInfo={{ name, symbol, decimals }} tokenAddress={address} />
            </Box>
            <Box sx={{ width: "50%" }}>
              <Usdc />
            </Box>
          </Stack>
          <BondingCurveTrade baseTokenAddress={address} baseTokenInfo={{ name, symbol, decimals }} />
        </>
      )}
      {isLoading && <Typography>Loading token info...</Typography>}
      {isError && <Typography>Not a confidential token</Typography>}
    </Container>
  );
};
