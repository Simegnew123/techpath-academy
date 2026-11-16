"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Chapter = {
  time: number; // seconds
  title: string;
};

type VideoQuiz = {
  id: string;
  time: number; // when to pause (seconds)
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

type TranscriptEntry = {
  time: number;
  text: string;
};

export default function InteractiveVideoPlayer({
  videoUrl,
  title,
  chapters = [],
  videoQuizzes = [],
  transcript = [],
}: {
  videoUrl: string;
  title: string;
  chapters?: Chapter[];
  videoQuizzes?: VideoQuiz[];
  transcript?: TranscriptEntry[];
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showQuiz, setShowQuiz] = useState<VideoQuiz | null>(null);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizResult, setQuizResult] = useState<"correct" | "wrong" | null>(null);
  const [answeredQuizzes, setAnsweredQuizzes] = useState<Set<string>>(new Set());
  const [showTranscript, setShowTranscript] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showChapters, setShowChapters] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  // Extract YouTube ID
  const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  const isYouTube = !!youtubeMatch;

  // ---- Time updates & in-video quiz triggers ----
  useEffect(() => {
    if (!videoRef.current || isYouTube) return;
    const video = videoRef.current;
    const onTimeUpdate = () => {
      const t = video.currentTime;
      setCurrentTime(t);
      // Check for in-video quizzes
      for (const quiz of videoQuizzes) {
        if (
          t >= quiz.time &&
          t < quiz.time + 1 &&
          !answeredQuizzes.has(quiz.id) &&
          !showQuiz
        ) {
          video.pause();
          setShowQuiz(quiz);
          setQuizAnswer("");
          setQuizResult(null);
        }
      }
    };
    const onLoadedMetadata = () => setDuration(video.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [videoQuizzes, answeredQuizzes, showQuiz, isYouTube]);

  // ---- Playback speed ----
  useEffect(() => {
    if (videoRef.current && !isYouTube) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, isYouTube]);

  // ---- Controls ----
  const togglePlay = useCallback(() => {
    if (!videoRef.current || isYouTube) return;
    if (videoRef.current.paused) videoRef.current.play();
    else videoRef.current.pause();
  }, [isYouTube]);

  const seekTo = (time: number) => {
    if (!videoRef.current || isYouTube) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const skipTime = (delta: number) => {
    if (!videoRef.current || isYouTube) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + delta));
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  // ---- Quiz handling ----
  const submitQuiz = () => {
    if (!showQuiz || !quizAnswer) return;
    const correct = quizAnswer === showQuiz.correctAnswer;
    setQuizResult(correct ? "correct" : "wrong");
    if (correct) {
      setAnsweredQuizzes(new Set([...answeredQuizzes, showQuiz.id]));
    }
  };

  const closeQuiz = () => {
    setShowQuiz(null);
    setQuizAnswer("");
    setQuizResult(null);
  };

  const continueAfterQuiz = () => {
    closeQuiz();
    if (videoRef.current && !isYouTube) videoRef.current.play();
  };

  // ---- Format helpers ----
  const fmtTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ---- Filtered transcript ----
  const filteredTranscript = searchQuery
    ? transcript.filter((t) => t.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : transcript;

  // ---- YouTube embed ----
  if (isYouTube) {
  return (
      <div ref={containerRef} className="relative overflow-hidden rounded-2xl bg-black shadow-lg">
        <iframe
          className="aspect-video w-full"
          src={`https://www.youtube.com/embed/${youtubeMatch![1]}?rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        {/* Chapters sidebar for YouTube */}
        {chapters.length > 0 && (
          <div className="mt-3 bg-slate-800 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-white mb-2">📍 Chapters</h4>
            <div className="flex flex-wrap gap-2">
              {chapters.map((ch, i) => (
                <a
                  key={i}
                  href={`https://www.youtube.com/watch?v=${youtubeMatch![1]}&t=${ch.time}s`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white transition"
                >
                  {fmtTime(ch.time)} — {ch.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- Custom HTML5 video player ----
  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-2xl bg-black shadow-lg">
      {/* Video */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="aspect-video w-full"
        onClick={togglePlay}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* In-video quiz overlay */}
      {showQuiz && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">❓</span>
              <h3 className="font-bold text-lg">Quick Check!</h3>
            </div>
            <p className="text-slate-700 mb-4">{showQuiz.question}</p>

            {quizResult === null ? (
              <>
                <div className="space-y-2 mb-4">
                  {showQuiz.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setQuizAnswer(opt)}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        quizAnswer === opt
                          ? "bg-blue-50 border-blue-400"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <button
                  onClick={submitQuiz}
                  disabled={!quizAnswer}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 hover:bg-blue-700"
                >
                  Submit
                </button>
              </>
            ) : (
              <div className="text-center">
                <div className="text-4xl mb-2">{quizResult === "correct" ? "✅" : "❌"}</div>
                <p className={`font-bold mb-2 ${quizResult === "correct" ? "text-green-600" : "text-red-600"}`}>
                  {quizResult === "correct" ? "Correct!" : "Not quite!"}
                </p>
                {showQuiz.explanation && (
                  <p className="text-sm text-slate-600 mb-4 italic">💡 {showQuiz.explanation}</p>
                )}
                {quizResult === "wrong" && (
                  <p className="text-sm text-slate-500 mb-4">
                    Correct answer: <strong>{showQuiz.correctAnswer}</strong>
                  </p>
                )}
                <button
                  onClick={continueAfterQuiz}
                  className="w-full py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900"
                >
                  Continue Video →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom controls bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3 z-10">
        {/* Progress bar with chapter markers */}
        <div className="relative mb-2">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={(e) => seekTo(parseFloat(e.target.value))}
            className="w-full h-1.5 cursor-pointer appearance-none rounded-full bg-slate-600 accent-blue-500"
            style={{
              background: `linear-gradient(to right, #3b82f6 ${duration ? (currentTime / duration) * 100 : 0}%, #475569 ${duration ? (currentTime / duration) * 100 : 0}%)`,
            }}
          />
          {/* Chapter markers */}
          {chapters.map((ch, i) => (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-yellow-400 pointer-events-none"
              style={{ left: `${duration ? (ch.time / duration) * 100 : 0}%` }}
              title={`${fmtTime(ch.time)} — ${ch.title}`}
            />
          ))}
        </div>

        {/* Control buttons */}
        <div className="flex items-center gap-3 text-white">
          <button onClick={togglePlay} className="hover:text-blue-400 transition text-lg">
            {playing ? "⏸" : "▶"}
          </button>
          <button onClick={() => skipTime(-10)} className="hover:text-blue-400 transition text-sm" title="Rewind 10s">
            ⏪ 10s
          </button>
          <button onClick={() => skipTime(10)} className="hover:text-blue-400 transition text-sm" title="Forward 10s">
            10s ⏩
          </button>
          <span className="text-xs font-mono text-slate-300">
            {fmtTime(currentTime)} / {fmtTime(duration)}
          </span>

          <div className="flex-1" />

          {/* Speed control */}
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            className="bg-slate-800 text-white text-xs rounded px-2 py-1 border border-slate-600"
          >
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
              <option key={s} value={s}>{s}x</option>
            ))}
          </select>

          {/* Transcript toggle */}
          {transcript.length > 0 && (
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className={`text-xs px-2 py-1 rounded transition ${showTranscript ? "bg-blue-600" : "bg-slate-800"}`}
            >
              📝 Transcript
            </button>
          )}

          {/* Chapters toggle */}
          {chapters.length > 0 && (
            <button
              onClick={() => setShowChapters(!showChapters)}
              className={`text-xs px-2 py-1 rounded transition ${showChapters ? "bg-blue-600" : "bg-slate-800"}`}
            >
              📍 Chapters
            </button>
          )}

          <button onClick={toggleFullscreen} className="hover:text-blue-400 transition text-sm">
            {fullscreen ? "🗗" : "⛶"}
          </button>
        </div>
      </div>

      {/* Chapters panel */}
      {showChapters && chapters.length > 0 && (
        <div className="absolute top-0 right-0 h-full w-56 bg-black/90 overflow-y-auto p-3 z-10 hidden sm:block">
          <h4 className="text-sm font-semibold text-white mb-2">📍 Chapters</h4>
          <div className="space-y-1">
            {chapters.map((ch, i) => (
              <button
                key={i}
                onClick={() => seekTo(ch.time)}
                className={`w-full text-left p-2 rounded text-xs transition ${
                  currentTime >= ch.time && (i === chapters.length - 1 || currentTime < chapters[i + 1].time)
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span className="font-mono text-yellow-400">{fmtTime(ch.time)}</span>
                <br />
                {ch.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Transcript panel */}
      {showTranscript && transcript.length > 0 && (
        <div className="absolute top-0 left-0 h-full w-72 bg-black/90 overflow-y-auto p-3 z-10">
          <input
            type="text"
            placeholder="🔍 Search transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 mb-2 bg-slate-800 text-white text-xs rounded border border-slate-600 outline-none focus:border-blue-400"
          />
          <div className="space-y-1">
            {filteredTranscript.map((entry, i) => (
              <button
                key={i}
                onClick={() => seekTo(entry.time)}
                className="w-full text-left p-2 rounded hover:bg-slate-800 transition"
              >
                <span className="font-mono text-xs text-blue-400">{fmtTime(entry.time)}</span>
                <p className="text-xs text-slate-300">{entry.text}</p>
              </button>
            ))}
            {filteredTranscript.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-4">No matches found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
