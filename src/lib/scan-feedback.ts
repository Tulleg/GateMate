/**
 * Akustisches und haptisches Feedback für den Ticket-Scanner (GateMate Check-In).
 * Nutzt die Web Audio API für frequenzbasierte Töne und die Vibration API für Smartphones.
 */

export type FeedbackType = "success" | "duplicate" | "error";

/**
 * Spielt ein präzises akustisches Feedback ohne externe MP3-Dateien ab.
 */
export function playScanFeedbackAudio(type: FeedbackType): void {
  if (typeof window === "undefined") return;

  try {
    const AudioCtx = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();

    if (type === "success") {
      // Zweiklang Chime (C5 -> E5, 523.25Hz -> 659.25Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1);
      gain1.gain.setValueAtTime(0.35, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.3);
    } else if (type === "duplicate") {
      // Doppel-Warnsummen (A4 -> F4, 440Hz -> 349Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(349.23, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else {
      // Tiefer Fehler-Brummton (150Hz Sägezahn)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.45, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (err) {
    console.error("[Feedback] Web Audio API Error:", err);
  }
}

/**
 * Löst ein haptisches Vibrations-Feedback auf unterstützten Mobilgeräten aus.
 */
export function triggerScanVibration(type: FeedbackType): void {
  if (typeof window === "undefined" || !("vibrate" in navigator)) return;

  try {
    if (type === "success") {
      navigator.vibrate([80]);
    } else if (type === "duplicate") {
      navigator.vibrate([80, 50, 80]);
    } else {
      navigator.vibrate([200, 100, 200]);
    }
  } catch (err) {
    console.error("[Feedback] Vibration API Error:", err);
  }
}

/**
 * Löst sowohl Audio- als auch Haptik-Feedback aus.
 */
export function triggerScanFeedback(type: FeedbackType): void {
  playScanFeedbackAudio(type);
  triggerScanVibration(type);
}
