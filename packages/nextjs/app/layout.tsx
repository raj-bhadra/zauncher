import { ThemeProvider } from "@mui/material/styles";
import "@rainbow-me/rainbowkit/styles.css";
import { DappWrapperWithProviders } from "~~/components/DappWrapperWithProviders";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/helper/getMetadata";
import { darkTheme } from "~~/utils/helper/theme";

export const metadata = getMetadata({
  title: "Zex",
  description: "Zeconomy",
});

const DappWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning className={``}>
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=telegraf@400,500,700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <DappWrapperWithProviders>
          <ThemeProvider theme={darkTheme}>{children}</ThemeProvider>
        </DappWrapperWithProviders>
      </body>
    </html>
  );
};

export default DappWrapper;
