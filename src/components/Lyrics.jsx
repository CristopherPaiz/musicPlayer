import { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";

const Lyrics = ({ lyrics, timeElapsed }) => {
  const [currentLines, setCurrentLines] = useState([]);
  const [selectedLineTime, setSelectedLineTime] = useState(null);
  const lyricsRef = useRef(null);

  useEffect(() => {
    const lines = lyrics.split("\n");
    lines.push("[99:99.00]");
    setCurrentLines(lines);
  }, [lyrics]);

  useEffect(() => {
    if (selectedLineTime !== null) {
      const index = currentLines.findIndex((line) => line.startsWith(`[${selectedLineTime}]`));
      if (index !== -1 && lyricsRef.current) {
        const selectedLineElement = lyricsRef.current.children[index];
        selectedLineElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [selectedLineTime, currentLines]);

  const handleClick = (line) => {
    const time = line.substring(1, 9);
    setSelectedLineTime(time);
  };

  return (
    <div
      ref={lyricsRef}
      style={{
        width: "400px",
        height: "300px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "10px",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        overflow: "auto",
        marginBottom: "100px",
        padding: "20px 10px 10px 10px",
        textWrap: "wrap",
      }}
    >
      {currentLines.map((line, index) => (
        <p
          key={index}
          style={{ color: index === 5 ? "red" : "white", padding: "0", lineHeigh: "1", margin: "5px" }}
          onClick={() => handleClick(line)}
        >
          {line.substring(10)}
        </p>
      ))}
    </div>
  );
};

Lyrics.propTypes = {
  lyrics: PropTypes.string.isRequired,
  timeElapsed: PropTypes.number.isRequired,
};

export default Lyrics;
