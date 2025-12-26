// lib/telegram-utils.ts

// Type definitions for Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: any;
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color: string;
          text_color: string;
          hint_color: string;
          link_color: string;
          button_color: string;
          button_text_color: string;
        };
        viewportHeight: number;
        viewportStableHeight: number;
        isExpanded: boolean;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show(): void;
          hide(): void;
          setText(text: string): void;
          onClick(callback: () => void): void;
          offClick(callback: () => void): void;
        };
        BackButton: {
          isVisible: boolean;
          show(): void;
          hide(): void;
          onClick(callback: () => void): void;
          offClick(callback: () => void): void;
        };
        HapticFeedback: {
          impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
          notificationOccurred(type: 'error' | 'success' | 'warning'): void;
          selectionChanged(): void;
        };
        expand(): void;
        close(): void;
        ready(): void;
        disableVerticalSwipes(): void;
        enableClosingConfirmation(): void;
        disableClosingConfirmation(): void;
        setHeaderColor(color: string): void;
        setBackgroundColor(color: string): void;
        onEvent(eventType: string, eventHandler: () => void): void;
        offEvent(eventType: string, eventHandler: () => void): void;
        sendData(data: string): void;
        switchInlineQuery(query: string, choose_chat_types?: string[]): void;
        openLink(url: string, options?: { try_instant_view?: boolean }): void;
        openTelegramLink(url: string): void;
        openInvoice(url: string, callback?: (status: string) => void): void;
        showPopup(params: { title?: string; message: string; buttons?: Array<{ id?: string; type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'; text: string }> }, callback?: (buttonId: string) => void): void;
        showAlert(message: string, callback?: () => void): void;
        showConfirm(message: string, callback?: (confirmed: boolean) => void): void;
        showScanQrPopup(params: { text?: string }, callback?: (text: string) => void): void;
        closeScanQrPopup(): void;
        readTextFromClipboard(callback?: (text: string) => void): void;
        requestWriteAccess(callback?: (access: boolean) => void): void;
        requestContact(callback?: (contact: any) => void): void;
        setClosingBehavior(need_confirmation: boolean): void;
        isVersionAtLeast(version: string): boolean;
      };
    };
    TelegramWebviewProxy?: {
      postEvent: (event: string, data?: string) => void;
    };
  }
}

/**
 * Check if the app is running inside Telegram WebView
 */
export const isTelegramWebView = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Method 1: Check user agent
  const isTelegramUserAgent = userAgent.includes('telegram') || 
                              userAgent.includes('webview');
  
  // Method 2: Check for Telegram WebApp object
  const hasTelegramWebApp = typeof window.Telegram !== 'undefined' && 
                           typeof window.Telegram.WebApp !== 'undefined';
  
  // Method 3: Check for TelegramWebviewProxy
  const hasTelegramProxy = typeof window.TelegramWebviewProxy !== 'undefined';
  
  // Method 4: Check for Telegram-specific query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const hasTelegramParams = urlParams.has('tgWebAppData') || 
                           urlParams.has('tgWebAppVersion') ||
                           urlParams.has('tgWebAppPlatform');
  
  return isTelegramUserAgent || hasTelegramWebApp || hasTelegramProxy || hasTelegramParams;
};

/**
 * Get Telegram WebApp instance
 */
export const getTelegramWebApp = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
};

/**
 * Initialize Telegram WebApp with custom settings
 */
export const initTelegramApp = (options?: {
  backgroundColor?: string;
  headerColor?: string;
  enableConfirmation?: boolean;
  disableSwipes?: boolean;
}) => {
  const tg = getTelegramWebApp();
  
  if (!tg) return null;
  
  // Initialize the app
  tg.ready();
  
  // Expand to full height
  if (!tg.isExpanded) {
    tg.expand();
  }
  
  // Set colors
  if (options?.backgroundColor) {
    tg.setBackgroundColor(options.backgroundColor);
  } else {
    tg.setBackgroundColor('#000000'); // Default black
  }
  
  if (options?.headerColor) {
    tg.setHeaderColor(options.headerColor);
  } else {
    tg.setHeaderColor('#000000'); // Default black
  }
  
  // Enable/disable closing confirmation
  if (options?.enableConfirmation !== false) {
    tg.enableClosingConfirmation();
  } else {
    tg.disableClosingConfirmation();
  }
  
  // Disable vertical swipes if specified
  if (options?.disableSwipes) {
    tg.disableVerticalSwipes();
  }
  
  console.log('Telegram WebApp initialized:', {
    version: tg.version,
    platform: tg.platform,
    colorScheme: tg.colorScheme,
    viewportHeight: tg.viewportHeight,
    isExpanded: tg.isExpanded,
  });
  
  return tg;
};

/**
 * Get optimized YouTube URL for Telegram WebView
 */
export const getOptimizedYoutubeUrl = (
  videoId: string, 
  options?: {
    isShorts?: boolean;
    autoplay?: boolean;
    controls?: boolean;
    loop?: boolean;
  }
): string => {
  const isShorts = options?.isShorts ?? false;
  const autoplay = options?.autoplay ?? true;
  const showControls = options?.controls ?? true;
  const loop = options?.loop ?? isShorts;
  
  const params = new URLSearchParams({
    // Basic parameters
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    
    // Telegram-specific optimizations
    enablejsapi: '1',
    origin: window.location.origin,
    widget_referrer: window.location.href,
    origin_referrer: 'https://web.telegram.org',
    
    // Prevent bot detection
    autohide: '1',
    iv_load_policy: '3',
    disablekb: '0',
    fs: '1',
    cc_load_policy: '0',
    hl: 'en', // Set language to English
    
    // Performance optimizations
    webkitallowfullscreen: 'true',
    mozallowfullscreen: 'true',
    allowfullscreen: 'true',
  });
  
  // Conditional parameters
  if (autoplay) params.append('autoplay', '1');
  if (showControls) params.append('controls', '1');
  if (loop) params.append('loop', '1');
  
  if (isShorts) {
    params.append('controls', '1');
    params.append('loop', '1');
  }
  
  // Use youtube-nocookie.com for better compatibility and privacy
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
};

/**
 * Alternative YouTube embed method for problematic videos
 */
export const getAlternativeYoutubeEmbed = (videoId: string): string => {
  // Method 1: Simple embed without many parameters
  const simpleParams = new URLSearchParams({
    autoplay: '1',
    rel: '0',
    playsinline: '1',
    controls: '1',
  });
  
  // Method 2: Using youtube.com instead of youtube-nocookie.com
  return `https://www.youtube.com/embed/${videoId}?${simpleParams.toString()}`;
};

/**
 * Haptic feedback for Telegram
 */
export const hapticFeedback = {
  impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') => {
    const tg = getTelegramWebApp();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred(style);
    }
  },
  notification: (type: 'error' | 'success' | 'warning' = 'success') => {
    const tg = getTelegramWebApp();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred(type);
    }
  },
  selection: () => {
    const tg = getTelegramWebApp();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.selectionChanged();
    }
  }
};

/**
 * Show alert in Telegram
 */
export const showTelegramAlert = (message: string): Promise<void> => {
  return new Promise((resolve) => {
    const tg = getTelegramWebApp();
    if (tg) {
      tg.showAlert(message, () => resolve());
    } else {
      alert(message);
      resolve();
    }
  });
};

/**
 * Show confirm dialog in Telegram
 */
export const showTelegramConfirm = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const tg = getTelegramWebApp();
    if (tg) {
      tg.showConfirm(message, (confirmed) => resolve(confirmed));
    } else {
      const confirmed = confirm(message);
      resolve(confirmed);
    }
  });
};

/**
 * Get Telegram init data (for authentication)
 */
export const getTelegramInitData = (): {
  queryId?: string;
  user?: any;
  authDate?: number;
  hash?: string;
} => {
  const tg = getTelegramWebApp();
  if (tg?.initDataUnsafe) {
    return {
      queryId: tg.initDataUnsafe.query_id,
      user: tg.initDataUnsafe.user,
      authDate: tg.initDataUnsafe.auth_date,
      hash: tg.initDataUnsafe.hash,
    };
  }
  
  // Try to parse from URL
  const urlParams = new URLSearchParams(window.location.search);
  const tgWebAppData = urlParams.get('tgWebAppData');
  
  if (tgWebAppData) {
    try {
      const params = new URLSearchParams(tgWebAppData);
      const userParam = params.get('user');
      
      return {
        queryId: params.get('query_id') || undefined,
        user: userParam ? JSON.parse(decodeURIComponent(userParam)) : undefined,
        authDate: parseInt(params.get('auth_date') || '0'),
        hash: params.get('hash') || undefined,
      };
    } catch (error) {
      console.error('Error parsing Telegram init data:', error);
    }
  }
  
  return {};
};

/**
 * Close Telegram WebApp
 */
export const closeTelegramApp = () => {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.close();
  } else {
    window.close();
  }
};

/**
 * Open link in Telegram or external browser
 */
export const openTelegramLink = (url: string, options?: { try_instant_view?: boolean }) => {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.openLink(url, options);
  } else {
    window.open(url, '_blank');
  }
};

/**
 * Send data to bot
 */
export const sendDataToBot = (data: string | object) => {
  const tg = getTelegramWebApp();
  if (tg) {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    tg.sendData(dataString);
  }
};

/**
 * Set up Telegram event listeners
 */
export const setupTelegramEvents = () => {
  const tg = getTelegramWebApp();
  if (!tg) return;
  
  // Handle viewport changes
  tg.onEvent('viewportChanged', () => {
    console.log('Viewport changed:', {
      height: tg.viewportHeight,
      stableHeight: tg.viewportStableHeight,
      isExpanded: tg.isExpanded,
    });
    
    // Dispatch custom event for components to react
    window.dispatchEvent(new CustomEvent('telegram-viewport-change', {
      detail: {
        height: tg.viewportHeight,
        stableHeight: tg.viewportStableHeight,
      }
    }));
  });
  
  // Handle theme changes
  tg.onEvent('themeChanged', () => {
    console.log('Theme changed:', tg.themeParams);
    
    window.dispatchEvent(new CustomEvent('telegram-theme-change', {
      detail: tg.themeParams
    }));
  });
  
  // Handle back button
  if (tg.BackButton.isVisible) {
    tg.BackButton.onClick(() => {
      window.history.back();
    });
  }
};

/**
 * Get safe area insets for notch devices
 */
export const getSafeAreaInsets = () => {
  const style = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(style.getPropertyValue('--sat') || '0') || 
         parseInt(style.getPropertyValue('--safe-area-inset-top') || '0') ||
         (typeof window !== 'undefined' ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat')) : 0),
    
    bottom: parseInt(style.getPropertyValue('--sab') || '0') || 
            parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0') ||
            (typeof window !== 'undefined' ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab')) : 0),
    
    left: parseInt(style.getPropertyValue('--sal') || '0') || 
          parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
    
    right: parseInt(style.getPropertyValue('--sar') || '0') || 
           parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
  };
};

/**
 * Apply safe area CSS variables
 */
export const applySafeAreaStyles = () => {
  if (typeof window === 'undefined') return;
  
  const style = document.documentElement.style;
  const insets = getSafeAreaInsets();
  
  // Set CSS variables if not already set
  if (!style.getPropertyValue('--safe-area-inset-top')) {
    style.setProperty('--safe-area-inset-top', `${insets.top}px`);
  }
  if (!style.getPropertyValue('--safe-area-inset-bottom')) {
    style.setProperty('--safe-area-inset-bottom', `${insets.bottom}px`);
  }
  if (!style.getPropertyValue('--safe-area-inset-left')) {
    style.setProperty('--safe-area-inset-left', `${insets.left}px`);
  }
  if (!style.getPropertyValue('--safe-area-inset-right')) {
    style.setProperty('--safe-area-inset-right', `${insets.right}px`);
  }
  
  // Shortcut variables
  style.setProperty('--sat', 'var(--safe-area-inset-top, 0px)');
  style.setProperty('--sab', 'var(--safe-area-inset-bottom, 0px)');
  style.setProperty('--sal', 'var(--safe-area-inset-left, 0px)');
  style.setProperty('--sar', 'var(--safe-area-inset-right, 0px)');
};

/**
 * Check if video can be autoplayed
 */
export const canAutoplayVideo = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    
    const video = document.createElement('video');
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    
    const playPromise = video.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          video.pause();
          resolve(true);
        })
        .catch(() => {
          resolve(false);
        });
    } else {
      resolve(false);
    }
  });
};

/**
 * Utility to retry video play with different methods
 */
export const playVideoWithRetry = async (
  videoElement: HTMLVideoElement | HTMLIFrameElement,
  retries = 3
): Promise<boolean> => {
  for (let i = 0; i < retries; i++) {
    try {
      if (videoElement.tagName === 'VIDEO') {
        await (videoElement as HTMLVideoElement).play();
      } else if (videoElement.tagName === 'IFRAME') {
        // For iframes, we need to trigger play through postMessage
        (videoElement as HTMLIFrameElement).contentWindow?.postMessage(
          '{"event":"command","func":"playVideo","args":""}',
          '*'
        );
      }
      return true;
    } catch (error) {
      console.log(`Video play attempt ${i + 1} failed:`, error);
      
      if (i === retries - 1) {
        return false;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return false;
};

export default {
  isTelegramWebView,
  getTelegramWebApp,
  initTelegramApp,
  getOptimizedYoutubeUrl,
  getAlternativeYoutubeEmbed,
  hapticFeedback,
  showTelegramAlert,
  showTelegramConfirm,
  getTelegramInitData,
  closeTelegramApp,
  openTelegramLink,
  sendDataToBot,
  setupTelegramEvents,
  getSafeAreaInsets,
  applySafeAreaStyles,
  canAutoplayVideo,
  playVideoWithRetry,
};