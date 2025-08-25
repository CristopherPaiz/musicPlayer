import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import PropTypes from "prop-types";

const PAUSE_THRESHOLD = 4;

const lyricType = {
  SYNCED: "SYNCED",
  UNSYNCED: "UNSYNCED",
  NONE: "NONE",
};

const parseLyrics = (lyrics) => {
  if (!lyrics) return { type: lyricType.NONE, lines: [] };

  const lines = lyrics.split("\n");
  const isSynced = lines.some((line) => /\[\d{2}:\d{2}\.\d{2,3}\]/.test(line));

  if (!isSynced) {
    return { type: lyricType.UNSYNCED, lines: lines.filter((text) => text.trim() !== "") };
  }

  const parsed = lines
    .map((line) => {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
      if (!match) return null;
      const [, minutes, seconds, milliseconds, text] = match;
      const time = parseInt(minutes, 10) * 60 + parseInt(seconds, 10) + parseInt(milliseconds, 10) / 1000;
      return { time, text: text.trim() };
    })
    .filter((line) => line && line.text);

  return { type: lyricType.SYNCED, lines: parsed };
};

const Lyrics = ({ lyrics, timeElapsed, color, darkColor }) => {
  const { type, lines: parsedLyrics } = useMemo(() => parseLyrics(lyrics), [lyrics]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [longPauseInfo, setLongPauseInfo] = useState({ active: false, duration: 0, key: -1 });
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    const savedSize = localStorage.getItem("lyricsFontSize");
    return savedSize || "text-2xl";
  });

  const currentLineRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    localStorage.setItem("lyricsFontSize", size);
  };

  const handleUserScroll = () => {
    setIsUserScrolling(true);
    clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {}, 3000);
  };

  const resumeAutoScroll = () => {
    setIsUserScrolling(false);
    if (currentLineRef.current) {
      currentLineRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const scrollToCurrentLine = useCallback(() => {
    if (currentLineRef.current && !isUserScrolling) {
      currentLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [isUserScrolling]);

  useEffect(() => {
    if (type !== lyricType.SYNCED) return;

    const newIndex = parsedLyrics.findIndex((line, i) => {
      const nextLine = parsedLyrics[i + 1];
      return timeElapsed >= line.time && (!nextLine || timeElapsed < nextLine.time);
    });

    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);

      let pauseDuration = 0;
      if (newIndex === -1 && parsedLyrics.length > 0) {
        pauseDuration = parsedLyrics[0].time;
      } else if (parsedLyrics[newIndex + 1]) {
        pauseDuration = parsedLyrics[newIndex + 1].time - parsedLyrics[newIndex].time;
      }

      if (pauseDuration > PAUSE_THRESHOLD) {
        setLongPauseInfo({ active: true, duration: pauseDuration, key: newIndex });
      } else {
        setLongPauseInfo({ active: false, duration: 0, key: -1 });
      }
    }
  }, [timeElapsed, parsedLyrics, currentIndex, type]);

  useEffect(() => {
    scrollToCurrentLine();
  }, [currentIndex, scrollToCurrentLine]);

  if (type === lyricType.NONE) {
    return (
      <div className="flex items-center justify-center h-dvh pb-24 w-full text-white/50">
        <p>Letra no disponible</p>
      </div>
    );
  }

  return (
    <div className="h-dvh w-full flex flex-col items-center gap-4">
      <div
        ref={scrollContainerRef}
        onWheel={handleUserScroll}
        onTouchMove={handleUserScroll}
        className="h-dvh w-full overflow-y-auto scroll-smooth no-scrollbar p-8 text-left"
      >
        {type === lyricType.SYNCED ? (
          parsedLyrics.map((line, index) => {
            const isCurrent = index === currentIndex;
            const isPrevForLongPause = longPauseInfo.key === index;
            return (
              <div key={index} ref={isCurrent ? currentLineRef : null}>
                <p
                  className={`transition-all duration-300 py-[2px] text-balance ${fontSize} ${
                    isCurrent ? `font-bold opacity-100` : `font-semibold opacity-50`
                  }`}
                  style={{ color: isCurrent ? color : darkColor }}
                >
                  {line.text}
                </p>
                {longPauseInfo.active && isPrevForLongPause && (
                  <div className="h-4 flex items-center">
                    <div className="w-full h-0.5 bg-white/20 rounded-full overflow-hidden">
                      <div
                        key={longPauseInfo.key}
                        className="h-dvh bg-white/60 rounded-full lyrics-progress-bar"
                        style={{ animationDuration: `${longPauseInfo.duration}s` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className={`font-semibold opacity-80 text-white/80 ${fontSize}`}>
            {parsedLyrics.map((line, index) => (
              <p key={index} className="py-1">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 flex items-center justify-center gap-2 p-2 bg-black/20 rounded-full">
        <button
          onClick={() => handleFontSizeChange("text-sm")}
          className={`px-3 py-1 rounded-full text-sm ${fontSize === "text-sm" ? "bg-white text-black" : "text-white/70"}`}
        >
          A
        </button>
        <button
          onClick={() => handleFontSizeChange("text-lg")}
          className={`px-3 py-1 rounded-full text-base ${fontSize === "text-lg" ? "bg-white text-black" : "text-white/70"}`}
        >
          A
        </button>
        <button
          onClick={() => handleFontSizeChange("text-xl")}
          className={`px-3 py-1 rounded-full text-lg ${fontSize === "text-xl" ? "bg-white text-black" : "text-white/70"}`}
        >
          A
        </button>
        {isUserScrolling && type === lyricType.SYNCED && (
          <button onClick={resumeAutoScroll} className="ml-4 px-3 py-1 rounded-full text-sm bg-white/20 text-white">
            Seguir Letra
          </button>
        )}
      </div>
    </div>
  );
};

Lyrics.propTypes = {
  lyrics: PropTypes.string,
  timeElapsed: PropTypes.number.isRequired,
  color: PropTypes.string,
  darkColor: PropTypes.string,
};

Lyrics.defaultProps = {
  color: "#FFFFFF",
  darkColor: "#CCCCCC",
};

export default Lyrics;
