import { useEffect, useState } from "react";
import PropTypes from "prop-types";

const Lyrics = ({ lyrics, timeElapsed, color, darkColor, backgroundColor }) => {
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
        backgroundColor: backgroundColor,
        overflow: "hidden",
        padding: "20px 10px 10px 10px",
        textWrap: "wrap",
      }}
    >
      {currentLines.map((line, index) => (
        <p
          key={index}
          style={{
            color: index === 5 ? color : darkColor,
            lineHeigh: "1",
            fontWeight: index === 5 ? "bold" : "normal",
            margin: "5px",
            textAlign: "center",
            opacity: index === 5 ? "1" : "0.5",
            background:
              index === 5
                ? "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(128,128,128,0.4) 50%, rgba(0,0,0,0) 100%)"
                : "rgba(255,255,255,0)",
            padding: index === 5 ? "15px" : "0px",
            width: "100%",
          }}
        >
          {line}
        </p>
      ))}
    </div>
  );
};

Lyrics.propTypes = {
  lyrics: PropTypes.string.isRequired,
  timeElapsed: PropTypes.number.isRequired,
  color: PropTypes.string,
  darkColor: PropTypes.string,
  backgroundColor: PropTypes.string,
};

export default Lyrics;
