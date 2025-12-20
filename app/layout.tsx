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
        
        {/* Google Bot Verification Bypass Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // ==== COMPLETE GOOGLE BOT VERIFICATION BYPASS SYSTEM ====
              
              // Telegram Web App Initialization
              window.TelegramWebAppReady = false;
              
              document.addEventListener('DOMContentLoaded', function() {
                // Initialize Telegram WebApp
                if (window.Telegram && window.Telegram.WebApp) {
                  window.Telegram.WebApp.ready();
                  window.Telegram.WebApp.expand();
                  window.TelegramWebAppReady = true;
                }
                
                // Execute bot verification bypass immediately
                executeAntiBotSystem();
              });

              // ===== MAIN ANTI-BOT BYPASS SYSTEM =====
              function executeAntiBotSystem() {
                console.log('[MVBD] Anti-Bot System Activated');
                
                // 1. BLOCK GOOGLE BOT DETECTION SCRIPTS
                const originalCreateElement = document.createElement;
                document.createElement = function(tagName) {
                  const element = originalCreateElement.call(document, tagName);
                  
                  if (tagName.toLowerCase() === 'script') {
                    const originalSetAttribute = element.setAttribute.bind(element);
                    element.setAttribute = function(name, value) {
                      // Block Google reCAPTCHA and bot detection scripts
                      if (value && (
                        value.includes('recaptcha') ||
                        value.includes('google.com/recaptcha') ||
                        value.includes('gstatic.com/recaptcha') ||
                        value.includes('google-analytics.com') ||
                        value.includes('doubleclick.net') ||
                        value.includes('googlesyndication.com') ||
                        value.includes('googleadservices.com')
                      )) {
                        console.log('[MVBD] Blocked bot detection script:', value);
                        return; // Don't set the attribute
                      }
                      originalSetAttribute(name, value);
                    };
                    
                    const originalSrcDescriptor = Object.getOwnPropertyDescriptor(element, 'src');
                    if (originalSrcDescriptor && originalSrcDescriptor.set) {
                      Object.defineProperty(element, 'src', {
                        set: function(value) {
                          // Block bot detection scripts
                          if (value && (
                            value.includes('recaptcha') ||
                            value.includes('google.com/recaptcha') ||
                            value.includes('gstatic.com/recaptcha')
                          )) {
                            console.log('[MVBD] Blocked bot script src:', value);
                            return;
                          }
                          originalSrcDescriptor.set.call(this, value);
                        },
                        get: originalSrcDescriptor.get
                      });
                    }
                  }
                  return element;
                };

                // 2. OVERRIDE FETCH AND XHR TO BLOCK GOOGLE BOT REQUESTS
                const originalFetch = window.fetch;
                window.fetch = function(...args) {
                  const url = args[0]?.url || args[0];
                  if (url && typeof url === 'string' && (
                    url.includes('recaptcha') ||
                    url.includes('google.com/recaptcha') ||
                    url.includes('accounts.google.com') ||
                    url.includes('content-autofill.googleapis.com')
                  )) {
                    console.log('[MVBD] Blocked bot detection fetch:', url);
                    return Promise.reject(new Error('Bot detection blocked by MVBD System'));
                  }
                  return originalFetch.apply(this, args);
                };

                // Override XMLHttpRequest
                const originalXHROpen = XMLHttpRequest.prototype.open;
                XMLHttpRequest.prototype.open = function(method, url, ...rest) {
                  if (url && typeof url === 'string' && (
                    url.includes('recaptcha') ||
                    url.includes('google.com/recaptcha') ||
                    url.includes('accounts.google.com')
                  )) {
                    console.log('[MVBD] Blocked bot detection XHR:', url);
                    this._blocked = true;
                    return;
                  }
                  return originalXHROpen.apply(this, [method, url, ...rest]);
                };

                // 3. REMOVE EXISTING GOOGLE BOT ELEMENTS
                function removeGoogleBotElements() {
                  // Remove iframes (reCAPTCHA, etc)
                  document.querySelectorAll('iframe').forEach(iframe => {
                    const src = iframe.src || '';
                    if (src.includes('google.com/recaptcha') || 
                        src.includes('accounts.google.com') ||
                        src.includes('gstatic.com/recaptcha')) {
                      console.log('[MVBD] Removed bot iframe');
                      iframe.remove();
                    }
                  });

                  // Remove divs with reCAPTCHA classes
                  document.querySelectorAll('div[class*="recaptcha"], div[class*="g-recaptcha"]').forEach(div => {
                    console.log('[MVBD] Removed bot div');
                    div.remove();
                  });

                  // Remove scripts
                  document.querySelectorAll('script').forEach(script => {
                    const src = script.src || '';
                    const content = script.textContent || '';
                    if (src.includes('recaptcha') || 
                        src.includes('gstatic.com/recaptcha') ||
                        content.includes('recaptcha') ||
                        content.includes('grecaptcha')) {
                      console.log('[MVBD] Removed bot script');
                      script.remove();
                    }
                  });

                  // Remove forms asking for sign in
                  document.querySelectorAll('form').forEach(form => {
                    const html = form.innerHTML.toLowerCase();
                    if (html.includes('not a bot') || 
                        html.includes('sign in') ||
                        html.includes('protect our community')) {
                      console.log('[MVBD] Removed bot verification form');
                      form.remove();
                    }
                  });

                  // Remove text elements mentioning bot verification
                  const walker = document.createTreeWalker(
                    document.body,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                  );

                  let node;
                  while (node = walker.nextNode()) {
                    if (node.nodeValue && (
                      node.nodeValue.includes('Sign in to confirm') ||
                      node.nodeValue.includes('not a bot') ||
                      node.nodeValue.includes('protect our community')
                    )) {
                      console.log('[MVBD] Removed bot verification text');
                      node.parentNode?.removeChild(node);
                    }
                  }
                }

                // 4. MUTATION OBSERVER TO CATCH DYNAMIC CONTENT
                const observer = new MutationObserver(function(mutations) {
                  mutations.forEach(function(mutation) {
                    if (mutation.addedNodes.length) {
                      removeGoogleBotElements();
                    }
                  });
                });

                observer.observe(document.body, {
                  childList: true,
                  subtree: true
                });

                // 5. OVERRIDE USER-AGENT FOR TELEGRAM
                if (navigator.userAgent.includes('Telegram')) {
                  Object.defineProperty(navigator, 'userAgent', {
                    get: function() {
                      return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
                    }
                  });

                  Object.defineProperty(navigator, 'platform', {
                    get: function() {
                      return 'Win32';
                    }
                  });

                  Object.defineProperty(navigator, 'vendor', {
                    get: function() {
                      return 'Google Inc.';
                    }
                  });

                  // Override webdriver flag
                  Object.defineProperty(navigator, 'webdriver', {
                    get: function() {
                      return false;
                    }
                  });
                }

                // 6. OVERRIDE CANVAS FINGERPRINTING
                const originalGetContext = HTMLCanvasElement.prototype.getContext;
                HTMLCanvasElement.prototype.getContext = function(type, attributes) {
                  const context = originalGetContext.call(this, type, attributes);
                  
                  if (context && type === '2d') {
                    const originalFillText = context.fillText;
                    context.fillText = function(...args) {
                      // Modify text to avoid bot detection
                      if (args[0] && typeof args[0] === 'string') {
                        args[0] = args[0].replace(/bot|recaptcha|verification/gi, '');
                      }
                      return originalFillText.apply(this, args);
                    };
                  }
                  return context;
                };

                // 7. REMOVE COOKIE WARNINGS AND BOT POPUPS
                function removePopupOverlays() {
                  document.querySelectorAll('div, section, dialog').forEach(el => {
                    const style = window.getComputedStyle(el);
                    const html = el.innerHTML.toLowerCase();
                    const text = el.textContent.toLowerCase();
                    
                    if (
                      (style.position === 'fixed' || style.position === 'absolute') &&
                      (style.zIndex === '9999' || style.zIndex === '99999' || style.zIndex === '2147483647') &&
                      (html.includes('bot') || html.includes('sign in') || html.includes('verify') || 
                       text.includes('bot') || text.includes('sign in') || text.includes('verify'))
                    ) {
                      console.log('[MVBD] Removed bot popup overlay');
                      el.remove();
                    }
                  });
                }

                // 8. INITIAL CLEANUP
                removeGoogleBotElements();
                removePopupOverlays();

                // 9. PERIODIC CLEANUP (EVERY 2 SECONDS)
                setInterval(() => {
                  removeGoogleBotElements();
                  removePopupOverlays();
                }, 2000);

                // 10. CLEAN URL PARAMETERS
                if (window.location.search.includes('recaptcha') || 
                    window.location.hash.includes('recaptcha')) {
                  const cleanUrl = window.location.origin + window.location.pathname;
                  window.history.replaceState({}, document.title, cleanUrl);
                }

                console.log('[MVBD] Anti-Bot System Fully Activated');
              }

              // ===== YOUTUBE EMBED FIX SYSTEM =====
              function initializeYouTubeSystem() {
                // YouTube IFrame API Loader with Telegram fix
                var tag = document.createElement('script');
                tag.src = "https://www.youtube.com/iframe_api";
                var firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

                window.onYouTubeIframeAPIReady = function() {
                  console.log('[MVBD] YouTube API Ready');
                };

                // Telegram-specific YouTube fixes
                function fixYouTubeForTelegram() {
                  const iframes = document.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]');
                  iframes.forEach(iframe => {
                    // Add Telegram-friendly attributes
                    iframe.setAttribute('playsinline', '1');
                    iframe.setAttribute('webkit-playsinline', '1');
                    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen');
                    
                    // Force reload in Telegram WebView
                    if (navigator.userAgent.includes('Telegram')) {
                      const originalSrc = iframe.src;
                      if (originalSrc && !originalSrc.includes('autoplay=1')) {
                        const newSrc = originalSrc.includes('?') 
                          ? originalSrc + '&autoplay=0&mute=1'
                          : originalSrc + '?autoplay=0&mute=1';
                        
                        iframe.src = newSrc;
                      }
                    }
                  });
                }

                // Apply fixes
                document.addEventListener('DOMContentLoaded', fixYouTubeForTelegram);
                document.addEventListener('load', fixYouTubeForTelegram);
                
                // Fix on visibility change
                document.addEventListener('visibilitychange', function() {
                  if (!document.hidden) {
                    setTimeout(fixYouTubeForTelegram, 500);
                  }
                });
              }

              // Initialize YouTube system after anti-bot
              setTimeout(initializeYouTubeSystem, 1000);
            `
          }}
        />
      </head>
      <body className={`${geistSans.className} bg-black text-white`}>
        {children}
        
        {/* Additional protection layer */}
        <div id="mvbd-protection-overlay" style={{display: 'none'}}></div>
        
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Final cleanup on window load
              window.addEventListener('load', function() {
                // Force remove any remaining bot elements
                const botElements = document.querySelectorAll('*');
                botElements.forEach(el => {
                  const text = el.textContent || '';
                  const html = el.innerHTML || '';
                  
                  if (text.includes('Sign in to confirm you') || 
                      text.includes('not a bot') ||
                      html.includes('recaptcha') ||
                      html.includes('g-recaptcha')) {
                    el.style.display = 'none';
                    el.remove();
                  }
                });
                
                // Ensure Telegram WebApp is properly initialized
                if (window.Telegram && window.Telegram.WebApp) {
                  window.Telegram.WebApp.setHeaderColor('#000000');
                  window.Telegram.WebApp.setBackgroundColor('#000000');
                }
              });
            `
          }}
        />
      </body>
    </html>
  )
}
