import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PT Nusatech Solusi Handal – Sistem MRO & Inventori",
  description: "Platform manajemen perbaikan, inventori, dan monitoring klien untuk PT Nusatech Solusi Handal",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
