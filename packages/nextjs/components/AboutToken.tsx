import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LockIcon from "@mui/icons-material/Lock";
import { Box, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
import { toast } from "react-hot-toast";
import { Address } from "viem";
import { TokenInfo } from "~~/types/tokenInfo";

const formatAddress = (address: Address) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}` as string;
};

export const AboutToken = ({ tokenInfo, tokenAddress }: { tokenInfo: TokenInfo; tokenAddress: Address }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied token address to clipboard");
  };
  return (
    <Paper variant="outlined" sx={{ padding: 2 }}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box sx={{ paddingTop: 1.25 }}>
          <LockIcon fontSize="large" />
        </Box>
        <Stack direction="column" spacing={0}>
          <Typography variant="h4">{tokenInfo.name}</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6">${tokenInfo.symbol}</Typography>
            <Stack direction="row" spacing={0} alignItems="center">
              <IconButton onClick={() => copyToClipboard(tokenAddress)}>
                <ContentCopyIcon />
              </IconButton>
              <Tooltip title={tokenAddress}>
                <Typography>{formatAddress(tokenAddress)}</Typography>
              </Tooltip>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
};
