export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notification");
    return false;
  }
  
  if (Notification.permission === "granted") {
    return true;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
};

export const getNotificationPermissionState = (): NotificationPermission | 'unsupported' => {
  if (!("Notification" in window)) return 'unsupported';
  return Notification.permission;
};

// Generates a pleasant "Sparkle" sound using Web Audio API (no external files needed)
const playSparkleSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // Create a high pitched 'ting'
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    // Slide from high to higher
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1); // A6
    
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(now + 0.5);
  } catch (e) {
    // Ignore audio errors (e.g. user hasn't interacted yet)
  }
};

export const sendNotification = async (title: string, body?: string) => {
  if (Notification.permission === "granted") {
    
    // Play sound for all notifications
    playSparkleSound();

    try {
      // 1. Try to use Service Worker (Best for PWA / Mobile / Modern Desktop)
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration) {
          await registration.showNotification(title, {
            body,
            icon: 'https://cdn-icons-png.flaticon.com/512/2936/2936956.png',
            badge: 'https://cdn-icons-png.flaticon.com/512/2936/2936956.png',
            tag: 'barbie-remind', // Prevents duplicates
            renotify: true,
            vibrate: [200, 100, 200],
            data: { url: window.location.href } // Data for click handler
          } as any);
          return;
        }
      }

      // 2. Fallback to standard API (Legacy Desktop / Simple web)
      const notification = new Notification(title, {
        body,
        icon: 'https://cdn-icons-png.flaticon.com/512/2936/2936956.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/2936/2936956.png',
        tag: 'barbie-remind',
        renotify: true,
      } as any);

      // On desktop, clicking the notification should focus the window
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
    } catch (e) {
      console.error("Notification failed", e);
    }
  }
};