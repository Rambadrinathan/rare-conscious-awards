import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";

const nunito = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const siteUrl = "https://rare-conscious-awards.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "RARE Conscious Travel Awards — Self Nomination",
  description:
    "Nominate your RARE property for the Conscious Travel Awards, guided by the Pinwheel touchstones.",
  icons: {
    icon: [{ url: "/rare-logo.png", type: "image/png" }],
    apple: [{ url: "/rare-logo.png", type: "image/png" }],
    shortcut: "/rare-logo.png",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "RARE India",
    title: "RARE Conscious Travel Awards — Self Nomination",
    description:
      "Open to all exhibitors at BRIDGES for conscious travel 2026. RARE Sustainability Lighthouse and RARE Sustainability Lightkeeper awards.",
    images: [
      {
        url: "/rare-logo.png",
        width: 512,
        height: 512,
        alt: "RARE",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "RARE Conscious Travel Awards — Self Nomination",
    description:
      "Open to all exhibitors at BRIDGES for conscious travel 2026. RARE Sustainability Lighthouse and RARE Sustainability Lightkeeper awards.",
    images: ["/rare-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
