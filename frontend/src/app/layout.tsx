import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TalentRadar — AI-Powered Technical Talent Intelligence",
  description:
    "Discover exceptional engineers through deep GitHub analysis. AI-powered profiles, evidence-based scoring, and actionable hiring intelligence.",
  keywords: [
    "talent intelligence",
    "github analysis",
    "technical recruiting",
    "engineer profiles",
    "AI hiring",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
