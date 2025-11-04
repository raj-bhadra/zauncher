"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LaunchIcon from "@mui/icons-material/Launch";
import { Alert, AlertTitle, Button, MenuItem, Paper, Stack, TextField, Tooltip, Typography } from "@mui/material";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { motion } from "motion/react";
import { toast } from "react-hot-toast";
import { useConfidentialTokenFactory } from "~~/hooks/helper/useConfidentialTokenFactory";
import initialMockChains from "~~/utils/helper/initialChains";

export const ZaunchForm = () => {
  const [formData, setFormData] = useState({
    coinName: "",
    coinSymbol: "",
    coinUri: "",
    launchType: "fair",
  });
  const [isMounted, setIsMounted] = useState(false);
  const { createToken, createPriviledgedToken, tokenAddress, isConfirming, isConfirmed, isWritingContract } =
    useConfidentialTokenFactory({
      initialMockChains,
    });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(formData);
    if (formData.launchType === "fair") {
      createToken(formData.coinName, formData.coinSymbol, formData.coinUri);
    } else if (formData.launchType === "priviledged") {
      createPriviledgedToken(formData.coinName, formData.coinSymbol, formData.coinUri);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLaunchTypeChange = (e: SelectChangeEvent<string>) => {
    setFormData({ ...formData, launchType: e.target.value });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

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
                <Select value={formData.launchType} onChange={handleLaunchTypeChange} sx={{ minWidth: "150px" }}>
                  <MenuItem value="fair">Fair</MenuItem>
                  <MenuItem value="priviledged">Priviledged</MenuItem>
                </Select>
              </Stack>
              {isMounted && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    loading={isConfirming || isWritingContract}
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
                  View Token
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
      </Stack>
    </Paper>
  );
};
