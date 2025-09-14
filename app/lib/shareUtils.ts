export interface ShareData {
  title: string;
  text: string;
  url: string;
}

export interface ShareOptions {
  showNotification?: boolean;
  notificationDuration?: number;
  fallbackMessage?: string;
}

/**
 * Native share utility with fallback support
 * Supports Web Share API with clipboard fallback
 */
export async function shareContent(
  shareData: ShareData,
  options: ShareOptions = {}
): Promise<boolean> {
  const {
    showNotification = true,
    notificationDuration = 2000,
    fallbackMessage = "Link copied to clipboard!",
  } = options;

  // Check if we're in a browser environment
  if (typeof navigator === "undefined") {
    console.warn("Share functionality not available in server environment");
    return false;
  }

  try {
    // Check if native sharing is supported
    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare(shareData)
    ) {
      await navigator.share(shareData);
      return true;
    } else {
      // Fallback: copy to clipboard
      const shareText = `${shareData.text} ${shareData.url}`;
      await navigator.clipboard.writeText(shareText);

      if (showNotification) {
        showTemporaryNotification(fallbackMessage, notificationDuration);
      }

      return true;
    }
  } catch (error) {
    console.error("Error sharing:", error);

    // Final fallback: try clipboard again or show alert
    try {
      const shareText = `${shareData.text} ${shareData.url}`;
      await navigator.clipboard.writeText(shareText);

      if (showNotification) {
        showTemporaryNotification(fallbackMessage, notificationDuration);
      }

      return true;
    } catch (clipboardError) {
      return false;
    }
  }
}

/**
 * Show a temporary notification
 */
function showTemporaryNotification(
  message: string,
  duration: number = 2000
): void {
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.className =
    "fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg z-50 transition-opacity shadow-lg";
  notification.style.opacity = "1";

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, duration);
}

/**
 * Platform-specific share data generators
 */
export const shareTemplates = {
  inviteFriend: (baseUrl?: string): ShareData => ({
    title: "Join Meme Launchpad",
    text: "Check out this awesome meme token launchpad! 🚀 Launch and trade meme tokens with ease.",
    url:
      baseUrl ||
      (typeof window !== "undefined"
        ? window.location.origin
        : "https://meme-launchpad.com"),
  }),

  shareToken: (
    tokenName: string,
    tokenSymbol: string,
    baseUrl?: string
  ): ShareData => ({
    title: `Check out ${tokenName} (${tokenSymbol})`,
    text: `I found this interesting token ${tokenName} (${tokenSymbol}) on Meme Launchpad! 🚀`,
    url: `${baseUrl || (typeof window !== "undefined" ? window.location.origin : "https://meme-launchpad.com")}/token/${tokenSymbol}`,
  }),

  shareProfile: (username: string, baseUrl?: string): ShareData => ({
    title: `Check out ${username}'s profile`,
    text: `Follow ${username} on Meme Launchpad to see their latest token launches! 🚀`,
    url: `${baseUrl || (typeof window !== "undefined" ? window.location.origin : "https://meme-launchpad.com")}/profile/${username}`,
  }),
};

/**
 * Check if native sharing is available
 */
export function isNativeShareSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function"
  );
}

/**
 * Check if clipboard API is available
 */
export function isClipboardSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!(navigator.clipboard && navigator.clipboard.writeText)
  );
}
