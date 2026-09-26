import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "FleekFlow",
  description: "Finish a wholesale lot in conversation, on your phone.",
  applicationName: "FleekFlow",
  appleWebApp: {
    capable: true,
    title: "FleekFlow",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F2F2F7",
};

export default function PhoneLayout({ children }: LayoutProps<"/phone">) {
  return children;
}
