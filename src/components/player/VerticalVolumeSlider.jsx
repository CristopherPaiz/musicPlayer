import { useRef, useCallback } from "react";
import PropTypes from "prop-types";

const VerticalVolumeSlider = ({ volume, setVolume }) => {
  const sliderRef = useRef(null);

  const handleVolumeChange = useCallback(
    (e) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const relativeY = clientY - rect.top;
      let newVolume = 1 - relativeY / rect.height;
      if (newVolume < 0) newVolume = 0;
      if (newVolume > 1) newVolume = 1;
      setVolume(newVolume);
    },
    [setVolume]
  );

  const handleInteractionStart = useCallback(
    (e) => {
      handleVolumeChange(e);
      const handleInteractionMove = (moveEvent) => {
        handleVolumeChange(moveEvent);
      };
      const handleInteractionEnd = () => {
        window.removeEventListener("mousemove", handleInteractionMove);
        window.removeEventListener("mouseup", handleInteractionEnd);
        window.removeEventListener("touchmove", handleInteractionMove);
        window.removeEventListener("touchend", handleInteractionEnd);
      };

      window.addEventListener("mousemove", handleInteractionMove);
      window.addEventListener("mouseup", handleInteractionEnd);
      window.addEventListener("touchmove", handleInteractionMove);
      window.addEventListener("touchend", handleInteractionEnd);
    },
    [handleVolumeChange]
  );

  return (
    <div
      ref={sliderRef}
      className="w-8 h-32 flex justify-center cursor-pointer p-2 bg-black/50 rounded-lg backdrop-blur-sm"
      onMouseDown={handleInteractionStart}
      onTouchStart={handleInteractionStart}
    >
      <div className="relative w-1 h-dvh bg-white/20 rounded-full">
        <div className="absolute bottom-0 w-full bg-white rounded-full" style={{ height: `${volume * 100}%` }}>
          <div className="absolute left-1/2 -translate-x-1/2 -top-1 size-3 bg-white rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

VerticalVolumeSlider.propTypes = {
  volume: PropTypes.number.isRequired,
  setVolume: PropTypes.func.isRequired,
};

export default VerticalVolumeSlider;
