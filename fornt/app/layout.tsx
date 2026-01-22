import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "PDF Insight",
  description: "Chat with your PDFs using RAG",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}


