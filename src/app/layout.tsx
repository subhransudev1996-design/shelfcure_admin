import type { Metadata } from "next";
import "./globals.css";
import AppLayout from "./AppLayout";

export const metadata: Metadata = {
  title: "Shelfcure Admin Portal",
  description: "Master administration for Shelfcure SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-[#0a0a0a] text-white antialiased font-sans" suppressHydrationWarning>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
