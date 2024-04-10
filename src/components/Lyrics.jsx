import { useEffect, useState } from "react";
import PropTypes from "prop-types";

const Lyrics = ({ lyrics, timeElapsed }) => {
  const [currentLine, setCurrentLine] = useState("");
  const [previousLine, setPreviousLine] = useState("");
  const [nextLine, setNextLine] = useState("");

  useEffect(() => {
    const lines = lyrics.split("\n");
    const timeElapsedInSeconds = timeElapsed;
    for (let i = 0; i < lines.length; i++) {
      const time = lines[i].substring(1, 9);
      const minutes = parseInt(time.split(":")[0]);
      const seconds = parseFloat(time.split(":")[1]);
      const totalTimeInSeconds = minutes * 60 + seconds;
      if (totalTimeInSeconds > timeElapsedInSeconds) {
        setCurrentLine(i > 0 ? lines[i - 1].substring(10) : "");
        setPreviousLine(i > 1 ? lines[i - 2].substring(10) : "");
        setNextLine(i < lines.length ? lines[i].substring(10) : "");
        break;
      }
    }
  }, [timeElapsed, lyrics]);

  return (
    <div
      style={{
        width: "400px",
        height: "400px",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <p>{previousLine}</p>
      <p style={{ color: "red" }}>{currentLine}</p>
      <p>{nextLine}</p>
    </div>
  );
};

Lyrics.propTypes = {
  lyrics: PropTypes.string.isRequired,
  timeElapsed: PropTypes.string.isRequired,
};

export default Lyrics;
