import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinkSnap — Plataforma de Links, Bio e Identificação",
  description: "Encurtador inteligente, páginas de bio personalizadas, carteirinhas de equipe e gerador de QR Codes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-white text-zinc-900 antialiased selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
