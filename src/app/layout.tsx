import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Bomb Shelters in Bulgaria",
  description: "Find bomb shelters in Bulgaria",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
} 