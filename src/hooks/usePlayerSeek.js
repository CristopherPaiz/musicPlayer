import { useState, useEffect } from "react";
import { usePlayer } from "../context/PlayerContext";

export const usePlayerSeek = () => {
  const { subscribeToSeek, getSeek } = usePlayer();
  const [seek, setSeek] = useState(getSeek());

  useEffect(() => {
    const unsubscribe = subscribeToSeek(setSeek);
    return () => unsubscribe();
  }, [subscribeToSeek]);

  return seek;
};
