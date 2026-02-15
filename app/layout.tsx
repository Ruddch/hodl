import type { Metadata } from "next";
import { Instrument_Sans, League_Gothic } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { API_BASE_URL, BASE_PATH } from "@/lib/constants";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const leagueGothic = League_Gothic({
  variable: "--font-league-gothic",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
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
        {/* Ранний редирект / → /tournament/ с сохранением ?ref (до загрузки React) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var p=location.pathname.replace(/\\/$/,'')||'/';var b="${BASE_PATH}";var r=b?p===b||p===b+'/':p===''||p==='/';if(r){location.replace((b?b+'/':'/')+'tournament/'+(location.search||''));}})();`,
          }}
        />
        <link rel="preconnect" href={API_BASE_URL} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={API_BASE_URL} />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('hodleague-theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');else if(t==='light')document.documentElement.setAttribute('data-theme','light');})();`,
          }}
        />
      </head>
      <body
        className={`${instrumentSans.variable} ${leagueGothic.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
