import type { Metadata } from "next";
import { Quicksand, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Boba Babe | Merchant Dashboard",
  description: "Quản lý quán trà sữa cực vibe cho Gen-Z",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${quicksand.variable} ${bricolage.variable}`}>
        {children}
      </body>
    </html>
  );
}
