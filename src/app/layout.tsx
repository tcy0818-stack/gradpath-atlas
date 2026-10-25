import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import "./globals.css";

// Display face for headings only. next/font downloads it at build time and serves it from this site, so visitors'
// browsers never contact a font provider. Body text stays on the system stack.
const display = Newsreader({ subsets: ["latin"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  title: { default: "GradPath Atlas", template: "%s · GradPath Atlas" },
  description:
    "Compare your master's applications and see what to do next in one workspace.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
