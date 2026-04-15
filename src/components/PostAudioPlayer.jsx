import React, { useEffect, useRef, useState } from "react";
import "../styles/PostAudioPlayer.css";

function formatAudioTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function PostAudioPlayer({ src }) {
  const audioRef = useRef(null);
  const trackRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return undefined;

    const onLoaded = () => setDuration(Number.isFinite(a.duration) ? a.duration : 0);
    const onTime = () => setCurrentTime(a.currentTime);
    const onEnded = () => {
      setPlaying(false);
      if (Number.isFinite(a.duration)) {
        setCurrentTime(a.duration);
      }
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnded);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);

    return () => {
      a.pause();
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
    };
  }, [src]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
    } else {
      if (Number.isFinite(a.duration) && a.currentTime >= a.duration - 0.25) {
        a.currentTime = 0;
        setCurrentTime(0);
      }
      a.play().catch(() => {});
    }
  };

  const onSeek = (e) => {
    const a = audioRef.current;
    const tr = trackRef.current;
    if (!a || !tr) return;
    const d = Number.isFinite(a.duration) ? a.duration : duration;
    if (!d) return;
    const rect = tr.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.min(1, Math.max(0, x / rect.width));
    const newTime = ratio * d;
    a.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progressPct =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="postCardAudio">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        className="postCardAudio__playBtn"
        onClick={togglePlay}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
            <rect x="6" y="5" width="4" height="14" fill="currentColor" rx="1" />
            <rect x="14" y="5" width="4" height="14" fill="currentColor" rx="1" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
            <polygon points="7,5 7,19 19,12" fill="currentColor" />
          </svg>
        )}
      </button>
      <span className="postCardAudio__time postCardAudio__time--elapsed">
        {formatAudioTime(currentTime)}
      </span>
      <div
        ref={trackRef}
        className="postCardAudio__track"
        onClick={onSeek}
        role="presentation"
      >
        <div
          className="postCardAudio__progress"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <span className="postCardAudio__time postCardAudio__time--total">
        {formatAudioTime(duration)}
      </span>
    </div>
  );
}
