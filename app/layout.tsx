import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const _geistSans = _geist // Declaring _geistSans variable

export const metadata: Metadata = {
  title: "MVBD MINI APP",
  description: "🎥 HD Movies | 🎞️ Web Series | 🔥 Weekly Drops🚫 No Ads | ✅ Direct Download📥 all movie download our channel📥and🚀 easy search any movie on our website no ads☑️",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
      </head>
      <body className={`${_geistSans.className} bg-black text-white`}>{children}</body>
    </html>
  )
}
