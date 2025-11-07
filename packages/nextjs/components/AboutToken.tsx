"use client";

import { useMemo } from "react";
import { useFhevm } from "@fhevm-sdk";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DisabledVisibleIcon from "@mui/icons-material/DisabledVisible";
import KeyIcon from "@mui/icons-material/Key";
import LockIcon from "@mui/icons-material/Lock";
import LockOutlineIcon from "@mui/icons-material/LockOutline";
import PasswordIcon from "@mui/icons-material/Password";
import { Box, Button, Divider, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
import { toast } from "react-hot-toast";
import { Address } from "viem";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useEncryptedBalanceOf } from "~~/hooks/helper/useZBondingCurve";
import { TokenInfo } from "~~/types/tokenInfo";
import initialMockChains from "~~/utils/helper/initialChains";

const formatAddress = (address: Address) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}` as string;
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success("Copied token address to clipboard");
};

export const AboutToken = ({ tokenInfo, tokenAddress }: { tokenInfo: TokenInfo; tokenAddress: Address }) => {
  const { isConnected, chain, address } = useAccount();
  const provider = useMemo(() => {
    if (typeof window === "undefined") return undefined;

    // Get the wallet provider from window.ethereum
    return (window as any).ethereum;
  }, []);
  const chainId = chain?.id;
  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true, // use enabled to dynamically create the instance on-demand
  });

  const {
    canDecrypt,
    encryptedBalanceResult,
    decryptedBaseTokenBalance,
    clearBaseTokenBalance,
    isDecrypting,
    refreshBalanceHandle,
    decryptBalance,
  } = useEncryptedBalanceOf({
    instance: fhevmInstance,
    confidentialToken: tokenAddress,
    account: address as Address,
  });

  return (
    <Paper variant="outlined" sx={{ padding: 2 }}>
      <Typography variant="h4">Base Token</Typography>
      <Divider sx={{ marginBottom: 2, marginTop: 2 }} />
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box sx={{ paddingTop: 1.25 }}>
          <LockIcon fontSize="large" />
        </Box>
        <Stack direction="column" spacing={0} width="100%">
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Typography variant="h6">{tokenInfo.name}</Typography>
            <Stack direction="row" spacing={0} alignItems="center">
              <IconButton onClick={() => copyToClipboard(tokenAddress)}>
                <ContentCopyIcon />
              </IconButton>
              <Tooltip title={tokenAddress}>
                <Typography>{formatAddress(tokenAddress)}</Typography>
              </Tooltip>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center"></Stack>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ marginTop: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <DisabledVisibleIcon />
              <Stack direction="row" spacing={1} alignItems="center">
                {decryptedBaseTokenBalance === undefined && (
                  <Tooltip
                    title={
                      !canDecrypt ? "Encrypted balance not initialized" : "Decrypt balance to get plaintext balance"
                    }
                  >
                    <IconButton>
                      <LockOutlineIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {decryptedBaseTokenBalance !== undefined && (
                  <Typography variant="h6">{formatUnits(decryptedBaseTokenBalance ?? 0n, 6)}</Typography>
                )}
                <Typography variant="h6"> {tokenInfo.symbol}</Typography>
              </Stack>
            </Stack>
            <Box sx={{ flexGrow: 1, marginLeft: "auto", alignItems: "flex-end", textAlign: "right" }}>
              <Button
                color="inherit"
                loading={isDecrypting}
                disabled={!canDecrypt}
                onClick={() => {
                  refreshBalanceHandle();
                  decryptBalance();
                }}
                startIcon={<KeyIcon />}
              >
                Decrypt Balance
              </Button>
            </Box>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ marginTop: 2 }}>
            <PasswordIcon />
            <Typography>Encrypted Balance {formatAddress(encryptedBalanceResult?.data as Address)}</Typography>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
};
