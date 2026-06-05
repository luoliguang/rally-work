import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rally",
  description: "我们的羽毛球时光",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
