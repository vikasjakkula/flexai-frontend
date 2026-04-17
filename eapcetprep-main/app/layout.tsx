import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { FacebookPixel } from "@/components/facebook-pixel";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Get the base URL for Open Graph images
// For production, set NEXT_PUBLIC_APP_URL in your environment variables
// Example: NEXT_PUBLIC_APP_URL=https://eapcetpro.com
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eapcetpro.com';

export const metadata: Metadata = {
  title: "EAPCET Pro - Master Your EAPCET Preparation",
  description: "Ace your EAPCET exam with our smart test preparation platform",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EAPCET Pro",
  },
  openGraph: {
    title: "EAPCET Pro - Master Your EAPCET Preparation",
    description: "Ace your EAPCET exam with our smart test preparation platform",
    url: baseUrl,
    siteName: "EAPCET Pro",
    images: [
      {
        url: `${baseUrl}/OG.png`,
        width: 1200,
        height: 630,
        alt: "EAPCET Pro - Master Your EAPCET Preparation",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EAPCET Pro - Master Your EAPCET Preparation",
    description: "Ace your EAPCET exam with our smart test preparation platform",
    images: [`${baseUrl}/OG.png`],
  },
  metadataBase: new URL(baseUrl),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Microsoft Clarity Project ID - can be overridden via NEXT_PUBLIC_MICROSOFT_CLARITY_ID env variable
  const clarityId = process.env.NEXT_PUBLIC_MICROSOFT_CLARITY_ID || "uz9czioq6x";

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
        <FacebookPixel />
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${clarityId}");
            `,
          }}
        />
      </body>
    </html>
  );
}