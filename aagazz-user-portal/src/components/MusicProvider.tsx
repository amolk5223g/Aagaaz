import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

interface MusicContextValue {
  isPlaying: boolean;
  isMuted: boolean;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  toggleMute: () => void;
  /** Current low-frequency energy, 0 to 1. Zero while paused. */
  getBass: () => number;
}

const MusicContext = createContext<MusicContextValue | null>(null);

export const useMusic = () => {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusic must be used inside MusicProvider');
  return ctx;
};

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const graph = useRef<{ ctx: AudioContext; analyser: AnalyserNode; bins: Uint8Array<ArrayBuffer> } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const start = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!graph.current && 'AudioContext' in window) {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.55;
      ctx.createMediaElementSource(audio).connect(analyser);
      analyser.connect(ctx.destination);
      graph.current = { ctx, analyser, bins: new Uint8Array(analyser.frequencyBinCount) };
    }
    void graph.current?.ctx.resume();
    audio.play().catch(() => {});
  }, []);

  const stop = useCallback(() => audioRef.current?.pause(), []);

  const toggle = useCallback(() => {
    if (audioRef.current?.paused) start();
    else stop();
  }, [start, stop]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  }, []);

  // The anthem starts with the first click, unless that click is on a music control.
  useEffect(() => {
    const first = (e: Event) => {
      window.removeEventListener('click', first);
      if (e.target instanceof Element && e.target.closest('[data-music]')) return;
      start();
    };
    window.addEventListener('click', first);
    return () => window.removeEventListener('click', first);
  }, [start]);

  const getBass = useCallback(() => {
    const g = graph.current;
    if (!g || audioRef.current?.paused) return 0;
    g.analyser.getByteFrequencyData(g.bins);
    let sum = 0;
    for (let i = 1; i < 5; i++) sum += g.bins[i];
    return sum / (4 * 255);
  }, []);

  const value = useMemo(
    () => ({ isPlaying, isMuted, start, stop, toggle, toggleMute, getBass }),
    [isPlaying, isMuted, start, stop, toggle, toggleMute, getBass],
  );

  return (
    <MusicContext.Provider value={value}>
      <audio
        ref={audioRef}
        src="/aagazz_theme.mp3"
        loop
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      {children}
    </MusicContext.Provider>
  );
};
