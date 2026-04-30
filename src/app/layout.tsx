import type { Metadata } from "next";
import { Inter, Noto_Sans_Ethiopic } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const notoEthiopic = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  display: "swap",
  variable: "--font-ethiopic",
  weight: ["400", "500", "600", "700"],
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
      <body className={`${inter.variable} ${notoEthiopic.variable} font-sans antialiased`}>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
