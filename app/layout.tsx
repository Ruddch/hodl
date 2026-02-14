import type { Metadata } from "next";
import { Instrument_Sans, League_Gothic, Rubik } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const leagueGothic = League_Gothic({
  variable: "--font-league-gothic",
  subsets: ["latin"],
  weight: ["400"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Hodleague",
  description: "Crypto fantasy on Abstract chain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('hodleague-theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');else if(t==='light')document.documentElement.setAttribute('data-theme','light');})();`,
          }}
        />
      </head>
      <body
        className={`${instrumentSans.variable} ${leagueGothic.variable} ${rubik.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
