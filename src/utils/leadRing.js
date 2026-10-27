// New-lead ring, made with the Web Audio API (no sound file). Browsers only allow sound after the
// user has interacted with the page once, so unlockLeadRing() runs on the first click / key press
// (LeadNotificationsContext) and isRingReady() tells the UI whether a ring can be heard.

let ctx = null;

function context() {
  if (ctx) return ctx;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  ctx = new AudioContext();
  return ctx;
}

export function unlockLeadRing() {
  const audio = context();
  if (audio && audio.state === 'suspended') audio.resume().catch(() => {});
}

export const isRingReady = () => Boolean(ctx && ctx.state === 'running');

// One "ring": two quick dual-tone pulses, like a desk phone.
function pulse(audio, start, volume) {
  const gain = audio.createGain();
  gain.connect(audio.destination);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.setValueAtTime(volume, start + 0.32);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);
  [880, 1320].forEach((freq) => {
    const osc = audio.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    // A light trill makes it sound like a bell rather than a beep.
    const lfo = audio.createOscillator();
    const depth = audio.createGain();
    lfo.frequency.value = 18;
    depth.gain.value = freq * 0.012;
    lfo.connect(depth);
    depth.connect(osc.frequency);
    osc.connect(gain);
    osc.start(start);
    lfo.start(start);
    osc.stop(start + 0.42);
    lfo.stop(start + 0.42);
  });
}

/** Plays the ring `times` times (about 1.4 s each). Returns false when sound is blocked. */
export function playLeadRing({ times = 2, volume = 0.35 } = {}) {
  const audio = context();
  if (!audio) return false;
  if (audio.state === 'suspended') audio.resume().catch(() => {});
  if (audio.state !== 'running') return false;
  const now = audio.currentTime + 0.05;
  for (let i = 0; i < times; i += 1) {
    const at = now + i * 1.4;
    pulse(audio, at, volume);
    pulse(audio, at + 0.5, volume);
  }
  return true;
}
