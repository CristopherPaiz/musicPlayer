import { useState } from "react";
import { Howl } from "howler";

const SongPlayer = () => {
  const [playlist] = useState(["fragmento1.mp3", "fragmento2.mp3", "fragmento3.mp3"]); // Agrega aquí los nombres de archivo de los fragmentos de la canción
  const [currentFragment, setCurrentFragment] = useState(0);

  const playNextFragment = () => {
    const nextFragment = currentFragment + 1;
    if (nextFragment < playlist.length) {
      setCurrentFragment(nextFragment);
    }
  };

  const playSong = () => {
    const sound = new Howl({
      src: [playlist[currentFragment]],
      onend: playNextFragment,
    });
    sound.play();
  };

  return (
    <div>
      <button onClick={playSong}>Reproducir</button>
    </div>
  );
};

export default SongPlayer;
