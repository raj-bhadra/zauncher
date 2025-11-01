import { Box, Divider, Paper, Typography } from "@mui/material";

export const AboutPToken = () => {
  return (
    <Paper variant="outlined" sx={{ padding: 2 }}>
      <Typography variant="h4">Priviledged ERC 7984 Token</Typography>
      <Divider sx={{ marginTop: 2, marginBottom: 2 }} />
      <Typography variant="body1">Allows creator to mint and burn tokens</Typography>
      <Divider sx={{ marginTop: 2, marginBottom: 2 }} />
      <Typography variant="body1">Mint and burn parameters are encrypted</Typography>
      <Divider sx={{ marginTop: 2, marginBottom: 2 }} />
      <Typography variant="body1">Balances are only vislble to owners and observers</Typography>
    </Paper>
  );
};
