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


const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "") || "";
const iconPath = basePath ? `/${basePath}/logo-3.png` : "/logo-3.png";

const siteUrl = "https://hodleague.com";
const ogImage = `${siteUrl}/logo-3.png`;

export const metadata: Metadata = {
  title: "Hodleague",
  description: "Build your crypto deck, compete in tournaments, and prove you're the real alpha. Fantasy league for crypto degens.",
  metadataBase: new URL(siteUrl),
  icons: {
    icon: iconPath,
    apple: iconPath,
  },
  appleWebApp: {
    capable: true,
    title: "Hodleague",
  },
  openGraph: {
    title: "Hodleague",
    description: "Build your crypto deck, compete in tournaments, and prove you're the real alpha. Fantasy league for crypto degens.",
    url: siteUrl,
    siteName: "Hodleague",
    images: [
      {
        url: ogImage,
        width: 512,
        height: 512,
        alt: "Hodleague",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Hodleague",
    description: "Build your crypto deck, compete in tournaments, and prove you're the real alpha. Fantasy league for crypto degens.",
    images: [ogImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        {/* Иконка для Add to Home Screen (iOS, Android) */}
        <link rel="apple-touch-icon" href={iconPath} />
        <link rel="icon" href={iconPath} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Hodleague" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        {/* UTM / fc_ml_id в sessionStorage до редиректа (ключ hodleague_acquisition = lib/acquisition.ts) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var q=location.search;if(!q||q.length<2)return;var params=new URLSearchParams(q.slice(1));var o={};var us=params.get('utm_source');if(us)o.utm_source=us;var um=params.get('utm_medium');if(um)o.utm_medium=um;var uc=params.get('utm_campaign');if(uc)o.utm_campaign=uc;var ml=params.get('fc_ml_id');if(ml)o.marketing_link_id=ml;if(!Object.keys(o).length)return;sessionStorage.setItem('hodleague_acquisition',JSON.stringify(o));})();`,
          }}
        />
        {/* Ранний редирект / → /tournament/ без query (параметры уже в sessionStorage) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var p=location.pathname.replace(/\\/$/,'')||'/';var b="${BASE_PATH}";var r=b?p===b||p===b+'/':p===''||p==='/';if(r){location.replace((b?b+'/':'/')+'tournament/');}})();`,
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
