import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

// 🔹 আগের font restore
const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MVBD MINI APP",
  description:
    "🎬 HD Movies | Fast Download🔥 বাংলা | হিন্দি | ইংরেজি | কোরিয়ান📥 GDrive + Mega Links📩 মুভি রিকোয়েস্ট = ইনবক্স",
  generator: "v0.app",
  icons: {
  icon: "/favicon.ico",
  apple: "/apple-touch-icon.png",
},
manifest: "/site.webmanifest",
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
      </head>
     <body className={`${_geist.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
