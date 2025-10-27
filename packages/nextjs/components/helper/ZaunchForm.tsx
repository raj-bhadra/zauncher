"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, TextField, Typography } from "@mui/material";
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

  const tokenAddresses =
    readTokenAddressesResult.data && Array.isArray(readTokenAddressesResult.data)
      ? readTokenAddressesResult.data.map(address => address)
      : [];

  return (
    <div>
      <Typography>Zaunch Form</Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Coin Name"
          name="coinName"
          value={formData.coinName}
          onChange={handleChange}
          type={"text"}
          inputProps={{ maxLength: 32 }}
        />
        <TextField
          label="Ticker"
          name="coinSymbol"
          value={formData.coinSymbol}
          onChange={handleChange}
          type="text"
          inputProps={{ maxLength: 10 }}
        />
        {isMounted && (
          <Button type="submit" color="primary" variant="contained">
            Zaunch
          </Button>
        )}
      </form>
      {isMounted && isConfirmed && <Typography>Token Address: {tokenAddress}</Typography>}
      {tokenAddresses.map(address => (
        <Link href={`/zauncher/token/${address}`} key={address}>
          <Typography>{address}</Typography>
        </Link>
      ))}
    </div>
  );
};
