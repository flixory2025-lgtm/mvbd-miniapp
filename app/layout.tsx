import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })
const geistSans = geist

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
        <script src="https://telegram.org/js/telegram-web-app.js" async></script>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="telegram-web-app-capable" content="yes" />
        <meta name="telegram-web-app-status-bar-style" content="black" />
        <meta name="telegram-web-app-theme-color" content="#000000" />
        
        {/* YouTube IFrame API Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Telegram Web App Ready
              window.TelegramWebAppReady = false;
              
              document.addEventListener('DOMContentLoaded', function() {
                if (window.Telegram && window.Telegram.WebApp) {
                  window.Telegram.WebApp.ready();
                  window.TelegramWebAppReady = true;
                  
                  // Expand to full height
                  window.Telegram.WebApp.expand();
                  
                  // Enable video playback in Telegram
                  window.Telegram.WebApp.enableClosingConfirmation();
                }
              });

              // YouTube IFrame API Loader
              var tag = document.createElement('script');
              tag.src = "https://www.youtube.com/iframe_api";
              var firstScriptTag = document.getElementsByTagName('script')[0];
              firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

              // Global YouTube Player State
              window.YouTubePlayers = {};
              window.onYouTubeIframeAPIReady = function() {
                console.log('YouTube API Ready');
              };

              // Fix for Telegram WebView video playback
              function fixVideoPlayback() {
                // Ensure all iframes are properly handled
                const iframes = document.querySelectorAll('iframe');
                iframes.forEach(iframe => {
                  // Add playsinline for iOS
                  iframe.setAttribute('playsinline', '1');
                  iframe.setAttribute('webkit-playsinline', '1');
                  iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
                  
                  // Force reload iframe in Telegram WebView
                  if (navigator.userAgent.includes('Telegram')) {
                    const src = iframe.src;
                    iframe.src = '';
                    setTimeout(() => {
                      iframe.src = src;
                    }, 100);
                  }
                });
              }

              // Apply fixes when page loads
              document.addEventListener('DOMContentLoaded', fixVideoPlayback);
              document.addEventListener('load', fixVideoPlayback);

              // Handle visibility change for background playback
              document.addEventListener('visibilitychange', function() {
                if (!document.hidden) {
                  setTimeout(fixVideoPlayback, 500);
                }
              });
            `
          }}
        />
      </head>
      <body className={`${geistSans.className} bg-black text-white`}>
        {children}
        
        {/* Video playback helper script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Helper function to force video reload
              window.reloadYouTubeVideos = function() {
                const iframes = document.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]');
                iframes.forEach(iframe => {
                  const originalSrc = iframe.src;
                  iframe.src = '';
                  setTimeout(() => {
                    iframe.src = originalSrc;
                    iframe.setAttribute('playsinline', '1');
                    iframe.setAttribute('webkit-playsinline', '1');
                    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen');
                  }, 100);
                });
              };

              // Telegram WebApp event listeners
              if (window.Telegram && window.Telegram.WebApp) {
                window.Telegram.WebApp.onEvent('viewportChanged', function() {
                  setTimeout(window.reloadYouTubeVideos, 300);
                });

                window.Telegram.WebApp.onEvent('themeChanged', function() {
                  setTimeout(window.reloadYouTubeVideos, 300);
                });
              }

              // Reload videos on page load complete
              window.addEventListener('load', function() {
                setTimeout(window.reloadYouTubeVideos, 1000);
              });
            `
          }}
        />
      </body>
    </html>
  )
}
