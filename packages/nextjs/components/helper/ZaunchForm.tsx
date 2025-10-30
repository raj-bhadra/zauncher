"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LaunchIcon from "@mui/icons-material/Launch";
import { Alert, AlertTitle, Button, Paper, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { motion } from "motion/react";
import { toast } from "react-hot-toast";
import { useConfidentialTokenFactory } from "~~/hooks/helper/useConfidentialTokenFactory";
import initialMockChains from "~~/utils/helper/initialChains";

export const ZaunchForm = () => {
  const [formData, setFormData] = useState({
    coinName: "",
    coinSymbol: "",
    coinUri: "",
  });
  const [isMounted, setIsMounted] = useState(false);
  const {
    createToken,
    tokenAddress,
    clearTokenAddress,
    isConfirming,
    isConfirmed,
    isWritingContract,
    isPending,
    transactionReceipt,
    readTokenAddressesResult,
  } = useConfidentialTokenFactory({ initialMockChains });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(formData);
    createToken(formData.coinName, formData.coinSymbol, formData.coinUri);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  console.log(readTokenAddressesResult.data);
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const tokenAddresses =
    readTokenAddressesResult.data && Array.isArray(readTokenAddressesResult.data)
      ? readTokenAddressesResult.data.map(address => address)
      : [];
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}` as string;
  };

  return (
    <Paper variant="outlined" sx={{ padding: 2 }}>
      <Stack direction="column" spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <LaunchIcon fontSize="large" />
          <Typography variant="h2">Zaunch</Typography>
        </Stack>
        <Typography variant="body1">Create a new ERC 7984 token</Typography>
        {!isConfirmed && (
          <form onSubmit={handleSubmit}>
            <Stack direction="column" spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="stretch">
                <TextField
                  fullWidth
                  label="Coin Name"
                  name="coinName"
                  value={formData.coinName}
                  onChange={handleChange}
                  type={"text"}
                  inputProps={{ maxLength: 32 }}
                />
                <TextField
                  fullWidth
                  label="Ticker"
                  name="coinSymbol"
                  value={formData.coinSymbol}
                  onChange={handleChange}
                  type="text"
                  inputProps={{ maxLength: 10 }}
                />
              </Stack>
              {isMounted && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    loading={isWritingContract}
                    disabled={isConfirming}
                    type="submit"
                    color="primary"
                    variant="contained"
                    sx={{ width: "100%" }}
                  >
                    Create Coin
                  </Button>
                </motion.div>
              )}
            </Stack>
          </form>
        )}
        {isMounted && isConfirmed && tokenAddress && (
          <Alert
            severity="success"
            action={
              <Link href={`/zauncher/token/${tokenAddress}`}>
                <Button color="inherit" size="large" startIcon={<LaunchIcon />}>
                  View & Trade Token
                </Button>
              </Link>
            }
          >
            <AlertTitle>Token created successfully</AlertTitle>
            <Stack direction="row" spacing={2} alignItems="center">
              <Tooltip title="Copy address to clipboard">
                <ContentCopyIcon sx={{ cursor: "pointer" }} onClick={() => copyToClipboard(tokenAddress)} />
              </Tooltip>
              <Typography>{formatAddress(tokenAddress)}</Typography>
            </Stack>
          </Alert>
        )}
        {/* {tokenAddresses.map(address => (
          <Link href={`/zauncher/token/${address}`} key={address}>
            <Typography>{address}</Typography>
          </Link>
        ))} */}
      </Stack>
    </Paper>
  );
};
