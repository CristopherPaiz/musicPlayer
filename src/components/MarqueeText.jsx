import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";

const MarqueeText = ({ text, className }) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const containerRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (container && textEl) {
      const checkOverflow = () => {
        setIsOverflowing(textEl.scrollWidth > container.clientWidth);
      };
      checkOverflow();
      window.addEventListener("resize", checkOverflow);
      return () => window.removeEventListener("resize", checkOverflow);
    }
  }, [text]);

  return (
    <div ref={containerRef} className={`w-full overflow-hidden whitespace-nowrap ${className}`}>
      <span ref={textRef} className={`inline-block ${isOverflowing ? "animate-marquee" : ""}`}>
        {text}
      </span>
      {isOverflowing && <span className="inline-block animate-marquee pl-16">{text}</span>}
    </div>
  );
};

MarqueeText.propTypes = {
  text: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default MarqueeText;
