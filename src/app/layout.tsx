import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIGNoFF",
  description: "Client sign-off for freelancers and small agencies.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col bg-page font-sans text-ink">{children}</body>
      </html>
    </ClerkProvider>
  );
}
