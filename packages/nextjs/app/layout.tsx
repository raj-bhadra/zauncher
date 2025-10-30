import "@fontsource-variable/ibm-plex-sans";
import "@fontsource-variable/museomoderno";
import "@fontsource-variable/open-sans";
import { ThemeProvider } from "@mui/material/styles";
import "@rainbow-me/rainbowkit/styles.css";
import { Toaster } from "react-hot-toast";
import { DappWrapperWithProviders } from "~~/components/DappWrapperWithProviders";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/helper/getMetadata";
import { darkTheme } from "~~/utils/helper/theme";

export const metadata = getMetadata({
  title: "zauncher",
  description: "launch z tokens",
});

const DappWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning className={``}>
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=telegraf@400,500,700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <DappWrapperWithProviders>
          <ThemeProvider theme={darkTheme}>
            {children}
            <Toaster />
          </ThemeProvider>
        </DappWrapperWithProviders>
      </body>
    </html>
  );
};

export default DappWrapper;
