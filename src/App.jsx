import { useEffect, useState } from "react";
import SongPlayer from "./components/SongPlayer";
import { FastAverageColor } from "fast-average-color";
import PropTypes from "prop-types";
import Lyrics from "./components/Lyrics";

const App = ({ URL_BASE, playlist, folder, playlistData, changePlaylist, setChangePlaylist }) => {
  const [songs, setSongs] = useState(playlist);
  const [selectedSong, setSelectedSong] = useState(null);
  const [random, setRandom] = useState(false);
  const [endSong, setEndSong] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [previousSong, setPreviousSong] = useState(null);
  const [image, setImage] = useState(null);
  const [folderRoot] = useState("Music");
  const [seek, setSeek] = useState(0);
  const [userSeek, setUserSeek] = useState(0);
  const [lyrics, setLyrics] = useState(null);
  const [color, setColor] = useState(null);
  const [colorDark, setColorDark] = useState(null);
  const [colorLight, setColorLight] = useState(null);
  const [colorText, setColorText] = useState(null);

  console.log(songs);
  //initialize selectedSong null
  useEffect(() => {
    setSelectedSong(null);
  }, []);

  // CONTINUE SONGS
  useEffect(() => {
    if (!selectedSong) return;
    const playNext = () => {
      if (endSong) {
        const index = songs.findIndex((song) => song.id === selectedSong.id);
        setSelectedSong(songs[index + 1] || null);
        setPreviousSong(false);
        setEndSong(false);
      }
    };

    playNext();
  }, [endSong, selectedSong, songs]);

  //previous song
  useEffect(() => {
    const playPrevious = () => {
      if (previousSong) {
        const index = songs.findIndex((song) => song.id === selectedSong.id);
        setSelectedSong(songs[index - 1] || songs[songs.length - 1]);
        setPreviousSong(false);
        setEndSong(false);
      }
    };

    playPrevious();
  }, [previousSong]);

  useEffect(() => {
    function shuffleArray(array) {
      const shuffledArray = [...array];
      for (let i = shuffledArray.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[randomIndex]] = [shuffledArray[randomIndex], shuffledArray[i]];
      }
      //set current song to the top and shuffle the rest
      const index = shuffledArray.findIndex((song) => song.id === selectedSong.id);
      const currentSong = shuffledArray[index];
      shuffledArray.splice(index, 1);
      shuffledArray.unshift(currentSong);
      setSongs(shuffledArray);
    }

    if (random) {
      shuffleArray(songs);
    }
  }, [random]);

  //force refresh checkboxes when next song is pressed
  useEffect(() => {
    if (selectedSong) {
      setChangePlaylist(false);
      setSelectedSong(selectedSong);
    }
  }, [selectedSong, setChangePlaylist]);

  //charge image dinamically
  useEffect(() => {
    // import(`./${folderRoot}/${folder}/${selectedSong.artist}/${selectedSong.title}/cover.webp`).then((module) => {
    //   setImage(module.default);
    // });
    if (!selectedSong) return;
    setSeek(0);

    const fetchImages = async () => {
      if (!playlist) return;
      const response = await fetch(
        URL_BASE + folder + "/" + selectedSong.artist + "/" + selectedSong.title + "/" + "cover.webp"
      );
      const data = await response.blob();
      const url = URL.createObjectURL(data);
      setImage(url);
    };
    fetchImages();
  }, [selectedSong, URL_BASE, folder, folderRoot, playlist]);

  //charge LRC lyrics dinamically
  useEffect(() => {
    if (!selectedSong) return;
    const fetchLyrics = async () => {
      try {
        const response = await fetch(
          URL_BASE + folder + "/" + selectedSong.artist + "/" + selectedSong.title + "/" + "lyrics.lrc"
        );
        const data = await response.text();
        if (data.includes("NoSuchKey")) {
          setLyrics(null);
          return;
        }
        setLyrics(data);
      } catch (error) {
        setLyrics(null);
      }
    };
    fetchLyrics();
  }, [selectedSong, URL_BASE, folder]);

  //listen changes playlist
  useEffect(() => {
    setSongs(playlist);
    // setSelectedSong(playlist[0]);
    setSeek(0);
    setChangePlaylist(true);
  }, [playlist]);

  //handle seek and change value and update setInterval to change seek +1 every second from new value
  const handleSeek = (e) => {
    setSeek(parseInt(e.target.value));
    setUserSeek(parseInt(e.target.value));
  };

  //if seek is equal to song length, next song
  useEffect(() => {
    if (!selectedSong) return;
    if (seek === parseInt(selectedSong.length)) {
      setEndSong(true);
    }
  }, [seek, selectedSong]);

  //GET COLOR IMAGE AND SET BACKGROUND AND COLOR
  useEffect(() => {
    if (!image) return;
    const fac = new FastAverageColor();
    //destroy fac instance
    fac.destroy();
    setColor(null);
    fac
      .getColorAsync(image, { algorithm: "dominant", mode: "speed" })
      .then((color) => {
        const root = document.documentElement;
        root.style.setProperty("background-color", color.hex);
        root.style.setProperty("color", color.isDark ? "white" : "black");
        setColor(color.hex);
        // reduce the color to 10% to get a darker color
        const darkColor = color.value.map((c) => c * 0.8);
        setColorDark(`rgb(${darkColor.join(",")})`);
        // reduce the color to 90% to get a lighter color
        const lightColor = color.value.map((c) => c * 1.5);
        setColorLight(`rgb(${lightColor.join(",")})`);

        root.style.setProperty("--colorLight", colorLight);
        root.style.setProperty("--textColorLigth", color.isDark ? "white" : "black");
        setColorText(color.isDark ? "white" : "black");
      })
      .catch((e) => {
        console.error(e);
      });
  }, [image, colorLight]);

  return (
    <div className="w-full h-screen flex max-h-screen">
      <div className="flex flex-col w-full">
        {/* TITULO PLAYLIST */}
        <article
          style={{
            background: `linear-gradient(90deg, ${colorDark} 0%, ${color} 100%)`,
            color: colorText,
          }}
          className="flex p-4 gap-x-4 items-center"
        >
          <img src={playlistData.cover} alt={playlistData.name} className="w-32 h-32 rounded-2xl" />
          <div className="flex flex-col w-full max-h-w-32 gap-y-1">
            <h1 className="font-bold uppercase text-4xl">{playlistData.name}</h1>
            <h2 className="text-2xl">{playlistData.artist}</h2>
            <p className="text-xl font-thin">{playlistData.description}</p>
          </div>
        </article>

        {/* CENTER */}
        <div className="w-full flex flex-row mb-5 overflow-y-auto">
          {/* PLAYLIST PRINCIPAL */}
          {!selectedSong ? (
            <div className="w-full flex flex-col h-full p-5">
              <div className="grid-rows-6 flex text-center">
                <p className="w-1/12">#</p>
                <p className="w-1/12"></p>
                <p className="w-1/3">Titulo</p>
                <p className="w-1/6">Album</p>
                <p className="w-1/6">Fecha</p>
                <p className="w-1/6">Duración</p>
              </div>
              {songs.map((song) => (
                <div
                  key={song.id}
                  onClick={() => setSelectedSong(song)}
                  className="text-center cursor-pointer py-3 bg-black/10 border-white/30 border-2 grid-rows-6 rounded-md my-1 flex items-center"
                >
                  <p className="w-1/12">{song.id}</p>
                  <div className="w-1/12">
                    <img
                      src={URL_BASE + folder + "/" + song.artist + "/" + song.title + "/" + "cover.webp"}
                      alt="cover"
                      loading="lazy"
                      className="w-10 h-10 object-cover rounded-md mr-3"
                    />
                  </div>
                  <div className="w-1/3 text-left font-bold text-lg flex flex-col">
                    <p>{song.title}</p>
                    <p>{song.artist}</p>
                  </div>
                  <p className="w-1/6">{song.album}</p>
                  <p className="w-1/6">{song.date.substr(0, 4)}</p>
                  <p className="w-1/6">{new Date(song.length * 1000).toISOString().substr(14, 5)}</p>
                </div>
              ))}
              {/* {image && <img src={image} style={{ width: "400px", height: "400px" }} alt="cover" />} */}
            </div>
          ) : (
            <div className="flex flex-col w-full flex-1 p-5">
              <h2>
                {/* render song title and artist */}
                {selectedSong && (
                  <>
                    {selectedSong.title} - {selectedSong.artist}
                  </>
                )}
              </h2>

              {/* Checkbox for randomizer */}
              <div>
                <input type="checkbox" id="random" name="random" checked={random} onChange={() => setRandom(!random)} />
                <label htmlFor="random">Random</label>
              </div>

              {/* slider range for volume */}
              <div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                />
              </div>

              {/* TIME BAR */}
              <div style={{ width: "100%", display: "flex" }}>
                {/* <span>0:00</span> */}
                <span>{new Date(seek * 1000).toISOString().substr(14, 5)}</span>
                {/* duation bar based on selectedSong.length like input range*/}
                <input
                  style={{ flex: "1" }}
                  value={seek}
                  type="range"
                  min="0"
                  max={selectedSong ? selectedSong.length : 0}
                  step="1"
                  onChange={handleSeek}
                />
                {selectedSong ? (
                  <>
                    <span>{new Date(selectedSong.length * 1000).toISOString().substr(14, 5)}</span>
                  </>
                ) : (
                  <span>00:00</span>
                )}
              </div>

              {/* SONGPLAYER */}
              <SongPlayer
                root={`${URL_BASE}${folder}`}
                artist={selectedSong ? selectedSong.artist : ""}
                song={selectedSong ? selectedSong.title : ""}
                setPreviousSong={setPreviousSong}
                setEndSong={setEndSong}
                totalFragments={selectedSong ? selectedSong.fragments : 0}
                volume={volume}
                setSeek={setSeek}
                userSeek={userSeek}
                changePlaylist={changePlaylist}
              />

              {/* LYRICS */}
              {selectedSong && (
                <div>
                  <h3>Letra</h3>
                  {lyrics === null ? (
                    <div>No hay letra disponible</div>
                  ) : (
                    <>
                      <Lyrics lyrics={lyrics} timeElapsed={seek} />
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* RIGHT */}
      {selectedSong && (
        <div className="w-[280px] overflow-y-auto bg-black/10">
          <div
            style={{
              backgroundColor: color,
              filter: "brightness(0.90)",
            }}
            className={`text-2xl font-bold text-center py-2 sticky top-0`}
          >
            <h3 className="pt-2 pb-3">En cola</h3>
          </div>
          <div className="pl-3 pr-2 pb-5">
            {songs.map((song) => (
              <div key={song.id}>
                <div
                  key={song.id}
                  onClick={() => setSelectedSong(song)}
                  style={{
                    backgroundColor: song.id === selectedSong.id ? "#a8a8a8" : "",
                    color: song.id === selectedSong.id ? "#000" : "",
                  }}
                  className="cursor-pointer cursor-hover flex flex-row items-center px-2 py-2 rounded-md"
                >
                  <div>
                    <img
                      src={URL_BASE + folder + "/" + song.artist + "/" + song.title + "/" + "cover.webp"}
                      alt="cover"
                      loading="lazy"
                      className="size-[35px] min-w-[35px] object-cover rounded-md"
                    />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <p className="ml-2 text-ellipsis overflow-hidden whitespace-nowrap text-[15px]">{song.title}</p>
                    <p className="ml-2 text-ellipsis overflow-hidden whitespace-nowrap text-[12px]">{song.artist}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

App.propTypes = {
  URL_BASE: PropTypes.string,
  playlist: PropTypes.array,
  folder: PropTypes.string,
  playlistData: PropTypes.object,
  changePlaylist: PropTypes.bool,
  setChangePlaylist: PropTypes.func,
};
