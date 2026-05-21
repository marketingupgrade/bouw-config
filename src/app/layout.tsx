import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import WishlistWidget from "@/components/WishlistWidget";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Configurator | Bureau Wijnschenk",
  description:
    "Stel in drie stappen je prefab aanbouw samen: bepaal de afmetingen, kies je opties en ontvang direct een richtprijs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={`${poppins.variable} h-full`}>
      <body className="min-h-full antialiased">
        {children}
        <WishlistWidget />
      </body>
    </html>
  );
}
