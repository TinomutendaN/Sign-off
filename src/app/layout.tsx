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
    // Clerk's own windows (checkout, subscription details) use the design's violet, navy and Inter.
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "var(--color-violet)",
          colorForeground: "var(--color-ink)",
          fontFamily: "var(--font-sans)",
          borderRadius: "10px",
        },
      }}
    >
      <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col bg-page font-sans text-ink">{children}</body>
      </html>
    </ClerkProvider>
  );
}
