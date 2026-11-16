import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, Music, Disc } from 'lucide-react';

export const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Attempt auto-play on first user interaction anywhere on document
    const handleFirstInteraction = () => {
      if (!hasInteracted && audioRef.current && !isPlaying) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          setHasInteracted(true);
        }).catch(() => {
          // Browser prevented autoplay before interaction
        });
      }
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [hasInteracted, isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setHasInteracted(true);
        setShowTooltip(false);
      }).catch((e) => console.log('Audio playback prevented:', e));
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <>
      <audio
        ref={audioRef}
        src="/aagazz_theme.mp3"
        loop
        preload="auto"
      />

      {/* Floating 3D Gold Audio Console (Bottom Right) */}
      <aside aria-label="Audio player" className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {/* Pulsing Hint Tooltip */}
        {showTooltip && !isPlaying && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#15100C]/90 border border-[#FFD78A]/50 text-[#FFD78A] text-[11px] font-bold shadow-[0_0_20px_rgba(217,172,99,0.35)] animate-bounce backdrop-blur-md">
            <Music className="w-3.5 h-3.5 text-[#FFD78A] animate-spin" style={{ animationDuration: '4s' }} />
            <span>Turn On Rocking Beats! 🔊</span>
          </div>
        )}

        <div
          onClick={togglePlay}
          className="group relative cursor-pointer flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-[#15100C] via-[#221F1B] to-[#15100C] border border-[#D9AC63]/40 shadow-[0_10px_30px_rgba(0,0,0,0.85)] hover:border-[#FFD78A] hover:shadow-[0_0_25px_rgba(217,172,99,0.4)] transition-all duration-300 backdrop-blur-xl active:scale-95"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className={`absolute inset-0 rounded-2xl bg-[#D9AC63]/10 blur-md transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />

          {/* Rotating Vinyl Disc / Sound Wave */}
          <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-[#080604] border border-[#D9AC63]/50 shadow-inner">
            <Disc
              className={`w-5 h-5 text-[#FFD78A] transition-transform ${isPlaying ? 'animate-spin' : ''}`}
              style={{ animationDuration: '3s' }}
            />
            {/* Center Play/Pause Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-[#080604]/80 rounded-full transition-opacity">
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 text-[#FFD78A]" />
              ) : (
                <Play className="w-3.5 h-3.5 text-[#FFD78A] fill-[#FFD78A]" />
              )}
            </div>
          </div>

          {/* Sound wave visualizer bars */}
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#FFD78A]">
                Aagazz Beats
              </span>
              {/* Equalizer Bars */}
              <div className="flex items-end gap-0.5 h-3 w-4">
                <span className={`w-0.5 bg-[#FFD78A] rounded-full transition-all ${isPlaying ? 'h-3 animate-pulse' : 'h-1'}`} />
                <span className={`w-0.5 bg-[#D9AC63] rounded-full transition-all ${isPlaying ? 'h-2 animate-bounce' : 'h-1'}`} style={{ animationDuration: '600ms' }} />
                <span className={`w-0.5 bg-[#FFD78A] rounded-full transition-all ${isPlaying ? 'h-3.5 animate-pulse' : 'h-1.5'}`} style={{ animationDuration: '800ms' }} />
                <span className={`w-0.5 bg-[#B88643] rounded-full transition-all ${isPlaying ? 'h-2 animate-bounce' : 'h-1'}`} style={{ animationDuration: '500ms' }} />
              </div>
            </div>

            <span className="text-[9px] text-[#B9ADA0] font-mono tracking-wider">
              {isPlaying ? 'NOW PLAYING' : 'CLICK TO ROCK'}
            </span>
          </div>

          {/* Mute button */}
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-lg text-[#B9ADA0] hover:text-[#FFD78A] hover:bg-[#080604]/60 transition-colors ml-1"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#D9AC63]" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

