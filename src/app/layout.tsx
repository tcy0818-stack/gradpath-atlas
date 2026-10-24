import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GradPath Atlas",
  description:
    "Compare your master's applications and see what to do next in one workspace.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
