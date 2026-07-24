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
    icon: [{ url: "/rare-logo.jpeg", type: "image/jpeg" }],
    apple: [{ url: "/rare-logo.jpeg", type: "image/jpeg" }],
    shortcut: "/rare-logo.jpeg",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "RARE India",
    title: "RARE Conscious Travel Awards — Self Nomination",
    description:
      "A simple, branded nomination for Bridges exhibitors of The RARE Collection.",
    images: [
      {
        url: "/og-image.jpeg",
        width: 512,
        height: 512,
        alt: "RARE — Destinations & Experiences",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "RARE Conscious Travel Awards — Self Nomination",
    description:
      "A simple, branded nomination for Bridges exhibitors of The RARE Collection.",
    images: ["/og-image.jpeg"],
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
