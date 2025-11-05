import { useMemo } from "react";
import { useFhevm } from "@fhevm-sdk";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DisabledVisibleIcon from "@mui/icons-material/DisabledVisible";
import KeyIcon from "@mui/icons-material/Key";
import LockOutlineIcon from "@mui/icons-material/LockOutline";
import PasswordIcon from "@mui/icons-material/Password";
import SyncLockIcon from "@mui/icons-material/SyncLock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Box, Button, Divider, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
import { formatUnits, parseUnits } from "viem";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { useConfidentialTokenWrapper } from "~~/hooks/helper/useConfidentialTokenWrapper";
import { useUsdc } from "~~/hooks/helper/useUsdc";
import initialMockChains from "~~/utils/helper/initialChains";

const formatAddress = (address: Address) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}` as string;
};

// shows usdc balance
// has a button to mint usdc using usdc contract
export const Usdc = () => {
  const { isConnected, chain } = useAccount();
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
  const { readUsdcBalanceResult, mintUsdc, isMinting } = useUsdc({ initialMockChains });
  const {
    readConfidentialTokenWrapperBalanceResult,
    wrapUsdc,
    decrypt,
    decryptedBalance,
    isDecrypting,
    clearBalance,
    canDecrypt,
    refreshBalanceHandle,
    isApproveLoading,
    isWrapLoading,
  } = useConfidentialTokenWrapper({
    instance: fhevmInstance,
    initialMockChains,
    invalidateQuery: readUsdcBalanceResult.queryKey,
  });
  // 100 usdc
  const mintUsdcAmount = parseUnits("100", 6) as bigint;
  const wrapUsdcAmount = parseUnits("100", 6) as bigint;
  //wrap button is disabled if usdc balance is loading or error or less than wrapUsdcAmount
  const isWrapUsdcDisabled =
    readUsdcBalanceResult.isLoading ||
    readUsdcBalanceResult.isError ||
    (readUsdcBalanceResult?.data as bigint) < wrapUsdcAmount;
  return (
    <Paper variant="outlined" sx={{ padding: 2 }}>
      <Typography variant="h4">Quote Token</Typography>
      <Divider sx={{ marginBottom: 2, marginTop: 2 }} />
      <Stack direction="column" spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <VisibilityIcon />
          <Typography variant="h6">{formatUnits((readUsdcBalanceResult?.data as bigint) ?? 0n, 6)} USDC</Typography>
          <Box sx={{ flexGrow: 1, marginLeft: "auto", alignItems: "flex-end", textAlign: "right" }}>
            <Button
              color="inherit"
              loading={isMinting}
              disabled={readUsdcBalanceResult.isLoading || readUsdcBalanceResult.isError}
              onClick={() => mintUsdc(mintUsdcAmount)}
              startIcon={<AddCircleIcon />}
            >
              Mint USDC
            </Button>
          </Box>
        </Stack>
        <Typography>ERC 20 test USDC contract with mint</Typography>
        <Divider />
        <Stack direction="row" spacing={2} alignItems="center">
          <DisabledVisibleIcon />
          <Stack direction="row" spacing={1} alignItems="center">
            {decryptedBalance === undefined && (
              <Tooltip
                title={!canDecrypt ? "Encrypted balance not initialized" : "Decrypt balance to get plaintext balance"}
              >
                <IconButton>
                  <LockOutlineIcon />
                </IconButton>
              </Tooltip>
            )}
            {decryptedBalance !== undefined && (
              <Typography variant="h6">{formatUnits(decryptedBalance ?? 0n, 6)}</Typography>
            )}
            <Typography variant="h6"> zUSDC</Typography>
          </Stack>
          <Box sx={{ flexGrow: 1, marginLeft: "auto", alignItems: "flex-end", textAlign: "right" }}>
            <Tooltip title={!canDecrypt ? "Wrap USDC to initialize balance" : "Decrypt balance"}>
              <Button
                color="inherit"
                loading={isDecrypting}
                disabled={!canDecrypt}
                onClick={() => {
                  refreshBalanceHandle();
                  decrypt();
                }}
                startIcon={<KeyIcon />}
              >
                Decrypt Balance
              </Button>
            </Tooltip>
            <Button
              color="inherit"
              loading={isApproveLoading || isWrapLoading}
              disabled={isWrapUsdcDisabled}
              onClick={() => wrapUsdc(wrapUsdcAmount)}
              startIcon={<SyncLockIcon />}
            >
              Wrap USDC
            </Button>
          </Box>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={2}>
          <PasswordIcon />
          <Typography>
            Encrypted Balance {formatAddress(readConfidentialTokenWrapperBalanceResult?.data as Address)}
          </Typography>
        </Stack>
        <Typography>
          Quote Asset For Tokens, Wrapped Observable ERC 7984 USDC Contract With Confidential Balance
        </Typography>
      </Stack>
    </Paper>
  );
};
