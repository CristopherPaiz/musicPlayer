import { useEffect, useState } from "react";
import PropTypes from "prop-types";

const Lyrics = ({ lyrics, timeElapsed }) => {
  const [currentLines, setCurrentLines] = useState(Array(10).fill(""));

  useEffect(() => {
    const lines = lyrics.split("\n");
    //add time to final line
    lines.push("[99:99.00]");

    const timeElapsedInSeconds = timeElapsed;
    for (let i = 0; i < lines.length; i++) {
      const time = lines[i + 1].substring(1, 9);
      const minutes = parseInt(time.split(":")[0]);
      const seconds = parseFloat(time.split(":")[1]);
      const totalTimeInSeconds = minutes * 60 + seconds;
      if (totalTimeInSeconds > timeElapsedInSeconds) {
        let newLines = Array(10).fill("");
        for (let j = -5; j <= 5; j++) {
          if (i + j >= 0 && i + j < lines.length) {
            newLines[j + 5] = lines[i + j].substring(10);
          }
        }
        setCurrentLines(newLines);
        break;
      }
    }
  }, [timeElapsed, lyrics]);

  return (
    <div
      style={{
        width: "400px",
        height: "325px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "10px",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        overflow: "hidden",
        padding: "20px 10px 10px 10px",
        textWrap: "wrap",
      }}
    >
      {currentLines.map((line, index) => (
        <p key={index} style={{ color: index === 5 ? "red" : "white", padding: "0", lineHeigh: "1", margin: "5px" }}>
          {line}
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
