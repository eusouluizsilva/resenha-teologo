import { useEffect, useRef, useState } from "react";

interface YouTubePlayerProps {
  videoId: string;
  onUnlocked: () => void;
  unlockThreshold?: number; // 0–1, default 0.9
}

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function YouTubePlayer({
  videoId,
  onUnlocked,
  unlockThreshold = 0.9,
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unlockedRef = useRef(false);
  const maxReachedRef = useRef(0); // high-water mark in seconds

  const [progress, setProgress] = useState(0); // 0–1
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    function initPlayer() {
      if (!containerRef.current) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onStateChange: (event: YT.OnStateChangeEvent) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              intervalRef.current = setInterval(tick, 500);
            } else {
              if (intervalRef.current) clearInterval(intervalRef.current);
            }
            if (event.data === window.YT.PlayerState.ENDED) {
              unlock();
            }
          },
        },
      });
    }

    function tick() {
      const player = playerRef.current;
      if (!player) return;
      const duration = player.getDuration?.();
      const current = player.getCurrentTime?.();
      if (!duration || duration === 0) return;

      // Anti-skip: if user jumped ahead of the high-water mark, seek back
      if (!unlockedRef.current && current > maxReachedRef.current + 2) {
        player.seekTo(maxReachedRef.current, true);
        return;
      }

      // Advance high-water mark
      if (current > maxReachedRef.current) {
        maxReachedRef.current = current;
      }

      const ratio = maxReachedRef.current / duration;
      setProgress(ratio);
      if (ratio >= unlockThreshold) unlock();
    }

    function unlock() {
      if (unlockedRef.current) return;
      unlockedRef.current = true;
      setUnlocked(true);
      onUnlocked();
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
      if (!document.getElementById("yt-iframe-api")) {
        const script = document.createElement("script");
        script.id = "yt-iframe-api";
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      playerRef.current?.destroy?.();
    };
  }, [videoId]);

  const pct = Math.min(Math.round(progress * 100), 100);

  return (
    <div className="space-y-3">
      <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {!unlocked && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Assista ao vídeo para liberar o quiz</span>
            <span className="text-slate-400 font-medium">{pct}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5">
            <div
              className="bg-amber-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-slate-600 text-xs">
            Quiz disponível a partir de {Math.round(unlockThreshold * 100)}% assistido
          </p>
        </div>
      )}

      {unlocked && (
        <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
          <span className="w-4 h-4 rounded-full bg-green-400/20 border border-green-400 flex items-center justify-center text-xs">✓</span>
          Quiz liberado!
        </div>
      )}
    </div>
  );
}
