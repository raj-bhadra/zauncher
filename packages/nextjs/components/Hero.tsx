"use client";

import Link from "next/link";
import ZBoxGrid from "./ZBoxGrid";
import ExploreIcon from "@mui/icons-material/Explore";
import LaunchIcon from "@mui/icons-material/Launch";
import { Box, Container, Stack, Typography } from "@mui/material";
import { motion } from "motion/react";

export const Hero = () => {
  return (
    <>
      <Stack direction={"row"} spacing={2} justifyContent={"center"} alignItems={"center"} sx={{ minHeight: "80vh" }}>
        <Stack direction={"column"} spacing={8} justifyContent={"center"} sx={{ minHeight: "80vh", paddingLeft: 8 }}>
          <Box sx={{ paddingRight: 12 }}>
            <Link href="/zauncher/zaunch">
              <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }}>
                <Stack direction={"row"} spacing={2} alignItems={"center"}>
                  <LaunchIcon fontSize="large" />
                  <Stack direction={"column"} spacing={1}>
                    <Typography variant="h1">Zaunch</Typography>
                    <Typography variant="subtitle1">Launch a new ERC 7984 token</Typography>
                  </Stack>
                </Stack>
              </motion.div>
            </Link>
          </Box>
          <Link href="/zauncher/zaunch">
            <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }}>
              <Stack direction={"row"} spacing={2} alignItems={"center"}>
                <ExploreIcon fontSize="large" />
                <Stack direction={"column"} spacing={1}>
                  <Typography variant="h1">Explore</Typography>
                  <Typography variant="subtitle1">View and trade ERC 7984 tokens</Typography>
                </Stack>
              </Stack>
            </motion.div>
          </Link>
        </Stack>
        <ZBoxGrid />
      </Stack>
      <div className="fixed bottom-8 right-8 [writing-mode:vertical-rl] transform rotate-180 text-sm uppercase tracking-widest font-medium text-gray-400 pointer-events-none z-10">
        <Stack direction="row" spacing={2}>
          <Typography variant="h1" sx={{ marginLeft: 1 }}>
            7984 / zama
          </Typography>
        </Stack>
      </div>
    </>
  );
};
