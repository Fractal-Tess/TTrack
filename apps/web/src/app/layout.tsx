import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Mono } from "next/font/google";

import "@workspace/ui/globals.css";

const fontMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

const fontCode = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-code",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TTrack",
  description: "Track and visualize AI token usage across your projects",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    title: "TTrack - Token Tracker",
    description: "Track and visualize AI token usage across your projects",
    type: "website",
    siteName: "TTrack",
    images: [
      {
        url: "/preview.png",
        width: 1200,
        height: 630,
        alt: "TTrack Dashboard Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TTrack - Token Tracker",
    description: "Track and visualize AI token usage across your projects",
    images: ["/preview.png"],
  },
  other: {
    "theme-color": "#00D4AA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="dark" lang="en" suppressHydrationWarning>
      <body
        className={`${fontMono.variable} ${fontCode.variable} font-mono antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
