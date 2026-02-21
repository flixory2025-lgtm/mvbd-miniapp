import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const geist = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL("https://mvbds.xyz"),

  title: {
    default: "MoviesVerseBD Official | mvbds.xyz",
    template: "%s | MoviesVerseBD",
  },

  description:
    "MoviesVerseBD Official – Download & Watch HD Movies in Bangla, Hindi, English, Korean & South Indian. Dual Audio 480p, 720p, 1080p | Fast GDrive & Mega Links | Latest Bollywood, Hollywood Movies.",

  keywords: [
    "MoviesVerseBD",
    "MVBD",
    "Bangla Movies Download",
    "Hindi Movies Download",
    "Hollywood Movies Download",
    "South Indian Hindi Dubbed",
    "Korean Movies Download",
    "Dual Audio Movies",
    "480p 720p 1080p Movies",
    "Latest Bollywood Movies",
  ],

  applicationName: "MoviesVerseBD",

  openGraph: {
    title: "MoviesVerseBD Official | mvbds.xyz",
    description:
      "Download Bangla, Hindi, English, Korean & South Indian HD Movies in 480p, 720p, 1080p. Fast Download Links Only on MoviesVerseBD.",
    url: "https://mvbds.xyz",
    siteName: "MoviesVerseBD",
    type: "website",
  },

  icons: {
    icon: "/favicon2.png",
    apple: "/favicon2.png",
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

        {/* Structured Data for Google Site Name */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "MoviesVerseBD",
              alternateName: "MVBD",
              url: "https://mvbds.xyz",
            }),
          }}
        />
      </head>

      <body className={`${geist.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}        </ThemeProvider>
      </body>
    </html>
  )
}
