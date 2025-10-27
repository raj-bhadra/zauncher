"use client";

import { useState } from "react";
import { Buy } from "./Buy";
import { Sell } from "./Sell";
import { Box } from "@mui/material";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { Address } from "viem";
import { TokenInfo } from "~~/types/tokenInfo";

export const BondingCurveTrade = ({ address, baseTokenInfo }: { address: Address; baseTokenInfo: TokenInfo }) => {
  // tabs for buy and sell
  const [tab, setTab] = useState("buy");
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTab(newValue);
  };
  return (
    <Box>
      <Box>
        <Tabs value={tab} onChange={handleTabChange}>
          <Tab label="Buy" value="buy" />
          <Tab label="Sell" value="sell" />
        </Tabs>
      </Box>
      {tab === "buy" && <Buy address={address} baseTokenInfo={baseTokenInfo} />}
      {tab === "sell" && <Sell address={address} baseTokenInfo={baseTokenInfo} />}
    </Box>
  );
};
