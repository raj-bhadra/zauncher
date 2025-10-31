import { Box, Divider, Paper, Typography } from "@mui/material";

export const AboutZBondingCurve = () => {
  return (
    <Paper variant="outlined" sx={{ padding: 2 }}>
      <Typography variant="h4">Z Bonding Curve</Typography>
      <Divider sx={{ marginTop: 2, marginBottom: 2 }} />
      <Typography variant="body1">
        Helps fair launch ERC 7984 tokens with wrapped ERC 7984 USDC (zUSDC) as the quote asset
      </Typography>
      <Divider sx={{ marginTop: 2, marginBottom: 2 }} />
      <Typography variant="body1">
        Price changes on z bonding curve are revealed after multiple trades are made to protect privacy
      </Typography>
      <Divider sx={{ marginTop: 2, marginBottom: 2 }} />
      <Typography variant="body1">
        Swaps are still processed if balances are not enough to complete the trade since the balances are private during
        the trade but no changes are made to the balances
      </Typography>
    </Paper>
  );
};
