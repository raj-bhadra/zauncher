"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { Usdc } from "./helper/Usdc";
import { Typography } from "@mui/material";
import { motion } from "motion/react";
import { RainbowKitCustomConnectButton } from "~~/components/helper";
import { useOutsideClick } from "~~/hooks/helper";

/**
 * Site header
 */
export const Header = () => {
  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  return (
    <div className="sticky lg:static top-0 navbar min-h-0 shrink-0 justify-between z-20 px-24 sm:px-2">
      <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }}>
        <Link href="/">
          <Typography
            variant="h2"
            sx={{ fontFamily: "Open Sans Variable", fontWeight: 500, paddingLeft: 2, opacity: 0.8 }}
          >
            zauncher
          </Typography>
        </Link>
      </motion.div>
      <div className="navbar-end grow mr-4">
        <RainbowKitCustomConnectButton />
        {/* <Usdc /> */}
      </div>
    </div>
  );
};
