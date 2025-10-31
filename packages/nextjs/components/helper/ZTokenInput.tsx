import { useState } from "react";
import { Box, InputAdornment, TextField, Typography } from "@mui/material";
import { Address } from "viem";
import { TokenInfo } from "~~/types/tokenInfo";
import quoteTokenInfo from "~~/utils/helper/quoteTokenInfo";

export const ZTokenInput = ({
  baseTokenAddress,
  baseTokenInfo,
  isBuy,
  onChange,
  value,
}: {
  baseTokenAddress: Address;
  baseTokenInfo: TokenInfo;
  isBuy: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value: string;
}) => {
  return (
    <Box width="100%" sx={{ paddingLeft: 6, paddingRight: 6 }}>
      <TextField
        fullWidth
        placeholder="0"
        value={value}
        onChange={onChange}
        type="text"
        slotProps={{
          input: {
            inputProps: {
              inputMode: "numeric",
              pattern: "[0-9]*",
            },
            endAdornment: (
              <InputAdornment position="end">
                <Typography>{isBuy ? quoteTokenInfo.symbol : baseTokenInfo.symbol}</Typography>
              </InputAdornment>
            ),
          },
        }}
      />
    </Box>
  );
};
