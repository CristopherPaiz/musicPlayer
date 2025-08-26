import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import PropTypes from "prop-types";

const PAUSE_THRESHOLD = 4;
const LYRICS_SEARCH_THRESHOLD = 2000;
const MIN_SEARCH_LENGTH = 4;

const lyricType = {
  SYNCED: "SYNCED",
  UNSYNCED: "UNSYNCED",
  NONE: "NONE",
};

const parseLyrics = (lyrics) => {
  if (!lyrics) return { type: lyricType.NONE, lines: [] };
  const lines = lyrics.split("\n");
  const isSynced = lines.some((line) => /\[\d{2}:\d{2}\.\d{2,3}\]/.test(line));
  if (!isSynced) return { type: lyricType.UNSYNCED, lines: lines.filter((text) => text.trim() !== "") };
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

const Lyrics = ({ lyrics, timeElapsed, color, darkColor, onSeek }) => {
  const { type, lines: parsedLyrics } = useMemo(() => parseLyrics(lyrics), [lyrics]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [longPauseInfo, setLongPauseInfo] = useState({ active: false, duration: 0, key: -1 });
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [fontSize, setFontSize] = useState(() => localStorage.getItem("lyricsFontSize") || "text-xl");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);

  const currentLineRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const lineRefs = useRef(new Map());

  const showSearch = useMemo(() => lyrics && lyrics.length > LYRICS_SEARCH_THRESHOLD, [lyrics]);

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    localStorage.setItem("lyricsFontSize", size);
  };

  useEffect(() => {
    if (!showSearch || searchTerm.length < MIN_SEARCH_LENGTH) {
      setSearchResults([]);
      setCurrentResultIndex(-1);
      return;
    }
    const results = [];
    const term = searchTerm.toLowerCase();
    parsedLyrics.forEach((line, index) => {
      if ((line.text || line).toLowerCase().includes(term)) {
        results.push(index);
      }
    });
    setSearchResults(results);
    setCurrentResultIndex(results.length > 0 ? 0 : -1);
  }, [searchTerm, parsedLyrics, showSearch]);

  useEffect(() => {
    if (currentResultIndex !== -1 && searchResults.length > 0) {
      const lineIndex = searchResults[currentResultIndex];
      const ref = lineRefs.current.get(lineIndex);
      if (ref) {
        ref.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentResultIndex, searchResults]);

  const handleNavResult = (direction) => {
    if (searchResults.length === 0) return;
    const newIndex = (currentResultIndex + direction + searchResults.length) % searchResults.length;
    setCurrentResultIndex(newIndex);
  };

  const resumeAutoScroll = () => {
    setIsUserScrolling(false);
    if (currentLineRef.current) {
      currentLineRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const scrollToCurrentLine = useCallback(() => {
    if (currentLineRef.current && !isUserScrolling && searchResults.length === 0) {
      currentLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [isUserScrolling, searchResults]);

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

  const renderHighlightedText = (text, term) => {
    if (!term || term.length < MIN_SEARCH_LENGTH) return text;
    const parts = text.split(new RegExp(`(${term})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === term.toLowerCase() ? (
            <mark key={i} className="bg-yellow-400 text-black px-1 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  if (type === lyricType.NONE) {
    return (
      <div className="flex items-center justify-center h-full w-full text-white/50">
        <p>Letra no disponible</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col items-center gap-4">
      <div
        ref={scrollContainerRef}
        onWheel={() => setIsUserScrolling(true)}
        onTouchMove={() => setIsUserScrolling(true)}
        className="h-full w-full overflow-y-auto scroll-smooth no-scrollbar p-8 text-left"
      >
        {parsedLyrics.map((line, index) => {
          const isCurrent = index === currentIndex;
          const isPrevForLongPause = longPauseInfo.key === index;
          const text = line.text || line;
          return (
            <div key={index} ref={isCurrent ? currentLineRef : (el) => lineRefs.current.set(index, el)}>
              <p
                onClick={() => type === lyricType.SYNCED && onSeek(line.time)}
                className={`transition-colors duration-300 py-[2px] ${type === lyricType.SYNCED ? "cursor-pointer" : ""} ${fontSize} ${
                  isCurrent ? "font-bold" : "font-normal line-clamp-2"
                }`}
                style={{ color: isCurrent ? color : darkColor }}
              >
                {renderHighlightedText(text, searchTerm)}
              </p>
              {longPauseInfo.active && isPrevForLongPause && (
                <div className="h-4 flex items-center">
                  <div className="w-full h-0.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      key={longPauseInfo.key}
                      className="h-full bg-white/60 rounded-full lyrics-progress-bar"
                      style={{ animationDuration: `${longPauseInfo.duration}s` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex-shrink-0 flex items-center justify-center gap-2 p-2 bg-black/20 rounded-full">
        {showSearch && (
          <div className="flex items-center gap-1 border-r border-white/20 pr-2">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-white placeholder-white/50 w-28 text-sm focus:outline-none px-2"
            />
            {searchResults.length > 0 && (
              <>
                <span className="text-xs text-white/70">
                  {currentResultIndex + 1}/{searchResults.length}
                </span>
                <button onClick={() => handleNavResult(-1)} className="text-white/70 hover:text-white text-lg leading-none">
                  ‹
                </button>
                <button onClick={() => handleNavResult(1)} className="text-white/70 hover:text-white text-lg leading-none">
                  ›
                </button>
              </>
            )}
          </div>
        )}
        <button
          onClick={() => handleFontSizeChange("text-sm")}
          className={`px-3 py-1 rounded-full text-base ${fontSize === "text-sm" ? "bg-white text-black" : "text-white/70"}`}
        >
          A
        </button>
        <button
          onClick={() => handleFontSizeChange("text-base")}
          className={`px-3 py-1 rounded-full text-base ${fontSize === "text-base" ? "bg-white text-black" : "text-white/70"}`}
        >
          A
        </button>
        <button
          onClick={() => handleFontSizeChange("text-lg")}
          className={`px-3 py-1 rounded-full text-lg ${fontSize === "text-lg" ? "bg-white text-black" : "text-white/70"}`}
        >
          A
        </button>
        {isUserScrolling && type === lyricType.SYNCED && (
          <button onClick={resumeAutoScroll} className="ml-2 px-3 py-1 rounded-full text-sm bg-white/20 text-white">
            Seguir
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
  onSeek: PropTypes.func.isRequired,
};

Lyrics.defaultProps = {
  color: "#FFFFFF",
  darkColor: "#CCCCCC",
};

export default Lyrics;
