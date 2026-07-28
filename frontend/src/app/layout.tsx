import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import PageNavigationLoader from "@/components/PageNavigationLoader";

export const metadata: Metadata = {
  title: "PT Nusatech Solusi Handal – Sistem MRO & Inventori",
  description: "Platform manajemen perbaikan, inventori, dan monitoring klien untuk PT Nusatech Solusi Handal",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <Suspense fallback={null}>
          <PageNavigationLoader />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
