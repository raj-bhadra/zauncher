import { AboutPToken } from "./AboutPToken";
import { AboutToken } from "./AboutToken";
import { AboutZBondingCurve } from "./helper/AboutZBondingCurve";
import { BondingCurveTrade } from "./helper/BondingCurveTrade";
import { PTokenMintBurn } from "./helper/PTokenMintBurn";
import { Usdc } from "./helper/Usdc";
import { Box, Container, Stack, Typography } from "@mui/material";
import { Address } from "viem";
import { useTokenInfo } from "~~/hooks/helper/useTokenInfo";

export const PToken = ({ address }: { address: Address }) => {
  const { tokenInfo, name, symbol, decimals, isConfidentialTokenRegistered } = useTokenInfo({ address });
  const isSuccess = Boolean(tokenInfo.isFetched && tokenInfo.isSuccess && !tokenInfo.isError && symbol !== undefined);
  const isLoading = tokenInfo.isFetching || tokenInfo.isLoading;
  const isError = tokenInfo.isFetched && (symbol === undefined || isConfidentialTokenRegistered === undefined);
  return (
    <Container maxWidth="lg">
      {isSuccess && (
        <>
          <Stack direction="row" spacing={4}>
            <Box sx={{ width: "50%" }}>
              <Stack direction="column" spacing={4}>
                <AboutToken tokenInfo={{ name, symbol, decimals }} tokenAddress={address} />
                <PTokenMintBurn baseTokenAddress={address} baseTokenInfo={{ name, symbol, decimals }} />
              </Stack>
            </Box>
            <Box sx={{ width: "50%" }}>
              <Stack direction="column" spacing={4}>
                <AboutPToken />
              </Stack>
            </Box>
          </Stack>
        </>
      )}
      {isLoading && <Typography>Loading token info...</Typography>}
      {isError && <Typography>Not a confidential token</Typography>}
    </Container>
  );
};
