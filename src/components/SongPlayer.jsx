import { useState } from "react";
import { Howl } from "howler";

const SongPlayer = () => {
  const [artist] = useState("El Trono de Mexico");
  const [nameSong] = useState("La Ciudad Del Olvido");
  const [urlSong, setUrlSong] = useState(
    `https://github.com/CristopherPaiz/musicPlayer/raw/main/src/Music/${artist}/${nameSong}/1.mp3`
  );
  //   const [urlSong, setUrlSong] = useState(
  //     `https://github.com/CristopherPaiz/musicPlayer/raw/main/src/Music/${artist}/${nameSong}/1.mp3`
  //   );
  const [totalFragments] = useState(19);

  //https://raw.githack.com/brython-dev/brython/master/www/tests/index.html
  const playNextFragment = () => {
    const newUrlSong = `https://github.com/CristopherPaiz/musicPlayer/raw/main/src/Music/${artist}/${nameSong}/${fragment}.mp3`;
    // const newUrlSong = `https://github.com/CristopherPaiz/musicPlayer/raw/main/src/Music/${artist}/${nameSong}/${fragment}.mp3`;
    const fragment = Math.floor(Math.random() * totalFragments) + 1;
    setUrlSong(encodeURI(newUrlSong));
    playSong();
  };

  const playSong = () => {
    console.log(encodeURI(urlSong));
    const sound = new Howl({
      src: [encodeURI(urlSong)],
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
