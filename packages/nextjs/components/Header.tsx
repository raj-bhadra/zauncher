"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { Usdc } from "./helper/Usdc";
import { Typography } from "@mui/material";
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
    <div className="sticky lg:static top-0 navbar min-h-0 shrink-0 justify-between z-20 px-0 sm:px-2">
      <Link href="/">
        <Typography>Zex</Typography>
      </Link>
      <Link href="/zauncher/zaunch">
        <Typography>Zaunch</Typography>
      </Link>
      <div className="navbar-end grow mr-4">
        <RainbowKitCustomConnectButton />
        <Usdc />
      </div>
    </div>
  );
};
