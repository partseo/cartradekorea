import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlobalSettingsProvider } from "@/lib/supabase/settings-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Car Trade Korea | Premium Korean Used Cars Worldwide",
    template: "%s | Car Trade Korea"
  },
  description: "Car Trade Korea is a premium used car export platform. Easily browse, search, and get instant FOB/CIF shipping quotes for high-quality Korean used cars.",
  keywords: ["used cars export", "Korean used cars", "buy used cars South Korea", "Hyundai used cars export", "Kia used cars export"],
  openGraph: {
    title: "Car Trade Korea | Premium Korean Used Cars Worldwide",
    description: "Export high-quality Korean used cars directly from Incheon/Busan port. Get instant FOB/CIF quotations.",
    type: "website",
    locale: "en_US",
    url: "https://www.cartradekorea.com",
    siteName: "Car Trade Korea"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <GlobalSettingsProvider>
          <Header />
          <main className="flex-grow flex flex-col">{children}</main>
          <Footer />
        </GlobalSettingsProvider>
      </body>
    </html>
  );
}
