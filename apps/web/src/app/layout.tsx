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
