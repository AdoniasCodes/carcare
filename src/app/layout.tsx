import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CarCare - Expert Car Care, Delivered to You",
  description:
    "Ethiopia's first on-demand roadside assistance and vehicle maintenance service. We come to you — no garage visit needed.",
  openGraph: {
    title: "CarCare - Expert Car Care, Delivered to You",
    description:
      "Ethiopia's first on-demand roadside assistance and vehicle maintenance service.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
