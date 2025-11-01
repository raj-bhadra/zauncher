"use client";

import { useMemo, useState } from "react";
import { useFhevm } from "@fhevm-sdk";
import { Box, Button, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { Address, isAddress } from "viem";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import { usePToken } from "~~/hooks/helper/usePToken";
import { TokenInfo } from "~~/types/tokenInfo";
import initialMockChains from "~~/utils/helper/initialChains";

export const PTokenMintBurn = ({
  baseTokenAddress,
  baseTokenInfo,
}: {
  baseTokenAddress: Address;
  baseTokenInfo: TokenInfo;
}) => {
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

  // tabs for mint and burn
  const [tab, setTab] = useState("mint");
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTab(newValue);
  };

  const [addressInput, setAddressInput] = useState<string>("");
  const [addressError, setAddressError] = useState<string>("");

  const { mintToken, burnToken, writeContractResult, isTokenCreator, tokenCreatorResult } = usePToken({
    baseTokenAddress,
    instance: fhevmInstance,
    initialMockChains: initialMockChains,
  });

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddressInput(value);
    if (value === "") {
      setAddressError("");
    } else if (!isAddress(value)) {
      setAddressError("Invalid address");
    } else {
      setAddressError("");
    }
  };

  const isValidAddress = addressInput !== "" && isAddress(addressInput) && !addressError;
  const mintAmount = parseUnits("100", baseTokenInfo.decimals);
  const burnAmount = parseUnits("100", baseTokenInfo.decimals);

  const handleMint = () => {
    if (isValidAddress && isTokenCreator) {
      mintToken(addressInput as Address, mintAmount);
    }
  };

  const handleBurn = () => {
    if (isValidAddress && isTokenCreator) {
      burnToken(addressInput as Address, burnAmount);
    }
  };

  const isButtonDisabled = !isValidAddress || !isTokenCreator || writeContractResult.isPending;

  return (
    <Paper variant="outlined" sx={{ padding: 2 }}>
      <Typography variant="h4">Mint / Burn</Typography>
      <Typography variant="body1">Mint or burn {baseTokenInfo.symbol} tokens</Typography>
      <Divider sx={{ marginTop: 2 }} />
      <Box>
        <Tabs value={tab} onChange={handleTabChange} variant="fullWidth">
          <Tab label="Mint" value="mint" />
          <Tab label="Burn" value="burn" />
        </Tabs>
      </Box>
      <Stack direction="column" spacing={2} sx={{ marginTop: 4 }}>
        <TextField
          label="Address"
          value={addressInput}
          onChange={handleAddressChange}
          error={Boolean(addressError)}
          // helperText={addressError || "Enter the address to mint/burn tokens"}
          fullWidth
        />
        {tab === "mint" && (
          <Box>
            {!isTokenCreator && (
              <Typography variant="body2" color="error" sx={{ marginBottom: 2 }}>
                Only the token creator can mint tokens
              </Typography>
            )}
            <Button variant="contained" disabled={isButtonDisabled} onClick={handleMint} fullWidth>
              {writeContractResult.isPending ? "Minting..." : `Mint 100 ${baseTokenInfo.symbol}`}
            </Button>
          </Box>
        )}
        {tab === "burn" && (
          <Box>
            {!isTokenCreator && (
              <Typography variant="body2" color="error" sx={{ marginBottom: 2 }}>
                Only the token creator can burn tokens
              </Typography>
            )}
            <Button variant="contained" disabled={isButtonDisabled} onClick={handleBurn} fullWidth color="error">
              {writeContractResult.isPending ? "Burning..." : `Burn 100 ${baseTokenInfo.symbol}`}
            </Button>
          </Box>
        )}
      </Stack>
    </Paper>
  );
};
