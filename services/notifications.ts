export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (e) {
    console.error("Error requesting permission", e);
    return false;
  }
};

export const getNotificationPermissionState = (): NotificationPermission | 'unsupported' => {
  if (!("Notification" in window)) return 'unsupported';
  return Notification.permission;
};

// Generates a pleasant "Sparkle" sound
// Note: On mobile, this often requires a direct user gesture to play.
const playSparkleSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    
    // Resume context if it's suspended (common on mobile)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(e => console.log("Audio resume failed", e));
    }

    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1); // A6
    
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(now + 0.5);
  } catch (e) {
    // Ignore audio errors silently
  }
};

export const sendNotification = async (title: string, body?: string) => {
  // 1. Check Permission
  if (Notification.permission !== "granted") {
    console.log("Notification permission not granted");
    return;
  }

  // 2. Play Sound (might fail in background on mobile, but worth trying)
  playSparkleSound();

  // 3. Trigger Notification
  try {
    // Priority A: Service Worker (Required for Android/iOS in many cases)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration) {
        await registration.showNotification(title, {
          body,
          icon: 'https://cdn-icons-png.flaticon.com/512/2936/2936956.png',
          badge: 'https://cdn-icons-png.flaticon.com/512/2936/2936956.png',
          tag: 'barbie-remind',
          renotify: true,
          vibrate: [200, 100, 200],
          data: { url: window.location.href }
        } as any);
        return;
      }
    }

    // Priority B: Fallback to classic API (Desktop)
    new Notification(title, {
      body,
      icon: 'https://cdn-icons-png.flaticon.com/512/2936/2936956.png',
      badge: 'https://cdn-icons-png.flaticon.com/512/2936/2936956.png',
      tag: 'barbie-remind',
      renotify: true,
    } as any);

  } catch (e) {
    console.error("Notification failed", e);
  }
};