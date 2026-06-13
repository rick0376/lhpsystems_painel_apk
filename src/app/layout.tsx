// src/app/layout.tsx

import type { Metadata, Viewport } from "next";
import { RegisterServiceWorker } from "../components/pwa/RegisterServiceWorker/RegisterServiceWorker";
import "./globals.scss";

export const metadata: Metadata = {
  title: "LHP Painel APK",
  description:
    "Painel de controle de licenças, usuários e dispositivos de APKs.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/images/logo.jpeg",
    apple: "/images/logo.jpeg",
  },
};

export const viewport: Viewport = {
  themeColor: "#f5b301",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
