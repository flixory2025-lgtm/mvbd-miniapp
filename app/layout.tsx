import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/react"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "MVBD MINI APP",
  description: "🎥 HD Movies | 🎞️ Web Series | 🔥 Weekly Drops 🚫 No Ads | ✅ Direct Download 📥 all movie download our channel 📥 and 🚀 easy search any movie on our website no ads ☑️",
  generator: "v0.app",
  manifest: "/manifest.json",
  metadataBase: new URL("https://your-domain.com"), // Change to your actual domain
  keywords: ["movies", "web series", "HD movies", "download movies", "no ads"],
  authors: [{ name: "MVBD" }],
  creator: "MVBD",
  publisher: "MVBD",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "MVBD Mini App",
    description: "Watch the latest movies, trailers, and shorts on MVBD",
    type: "website",
    siteName: "MVBD",
    url: "https://your-domain.com", // Change to your actual domain
  },
  twitter: {
    card: "summary_large_image",
    title: "MVBD Mini App",
    description: "Watch the latest movies, trailers, and shorts",
    creator: "@mvbd",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      {
        url: "/favicon.ico",
      },
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  verification: {
    google: "your-google-verification-code", // Add your Google verification code
    yandex: "your-yandex-verification-code", // Add your Yandex verification code
    yahoo: "your-yahoo-verification-code", // Add your Yahoo verification code
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#000000",
  colorScheme: "dark",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="referrer" content="no-referrer-when-downgrade" />
        <meta name="robots" content="index, follow" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MVBD" />
        <link rel="manifest" href="/manifest.json" />
        <script src="https://telegram.org/js/telegram-web-app.js" defer />
      </head>
      <body className={`${geistSans.className} bg-black text-white antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
