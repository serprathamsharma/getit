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
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700;1,6..72,400&family=Playfair+Display:ital,wght@0,600;0,700;0,800;0,900;1,600;1,700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
