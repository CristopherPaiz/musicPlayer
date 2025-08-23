import { useEffect, useState, useCallback } from "react";
import SongPlayer from "./components/SongPlayer";
import { FastAverageColor } from "fast-average-color";
import PropTypes from "prop-types";
import Lyrics from "./components/Lyrics";
import Random from "./components/icons/Random";
import NoRandom from "./components/icons/NoRandom";
import Drawer from "react-modern-drawer";

const App = ({ URL_BASE, playlist, folder, playlistData }) => {
  const [songs, setSongs] = useState(playlist);
  const [selectedSong, setSelectedSong] = useState(null);
  const [random, setRandom] = useState(false);
  const [endSong, setEndSong] = useState(false);
  const [volume, setVolume] = useState(1);
  const [previousSong, setPreviousSong] = useState(false);
  const [image, setImage] = useState(null);
  const [seek, setSeek] = useState(0);
  const [userSeek, setUserSeek] = useState(0);
  const [lyrics, setLyrics] = useState(null);
  const [color, setColor] = useState(null);
  const [colorDark, setColorDark] = useState(null);
  const [colorLight, setColorLight] = useState(null);
  const [colorTextLight, setColorTextLight] = useState(null);
  const [colorText, setColorText] = useState(null);
  const [openQueue, setOpenQueue] = useState(false);

  useEffect(() => {
    setSongs(playlist);
    setSelectedSong(null);
    setSeek(0);
  }, [playlist]);

  useEffect(() => {
    if (!selectedSong || !endSong) return;

    const currentIndex = songs.findIndex((song) => song.id === selectedSong.id);
    const nextSong = songs[currentIndex + 1] || null;

    setSelectedSong(nextSong);
    setEndSong(false);
  }, [endSong, selectedSong, songs]);

  useEffect(() => {
    if (!selectedSong || !previousSong) return;

    const currentIndex = songs.findIndex((song) => song.id === selectedSong.id);
    const prevSong = songs[currentIndex - 1] || songs[songs.length - 1];

    setSelectedSong(prevSong);
    setPreviousSong(false);
  }, [previousSong, selectedSong, songs]);

  useEffect(() => {
    if (!random || !selectedSong) return;

    const shuffleArray = (array) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const currentIndex = shuffled.findIndex((song) => song.id === selectedSong.id);
      if (currentIndex !== -1) {
        const current = shuffled.splice(currentIndex, 1)[0];
        shuffled.unshift(current);
      }
      return shuffled;
    };
    setSongs(shuffleArray(songs));
  }, [random]);

  useEffect(() => {
    if (!selectedSong) {
      setImage(null);
      setLyrics(null);
      return;
    }

    setSeek(0);

    const fetchData = async () => {
      try {
        const imageUrl = `${URL_BASE}${folder}/${selectedSong.artist}/${selectedSong.title}/cover.webp`;
        const lyricsUrl = `${URL_BASE}${folder}/${selectedSong.artist}/${selectedSong.title}/lyrics.lrc`;

        const [imageResponse, lyricsResponse] = await Promise.all([fetch(imageUrl), fetch(lyricsUrl)]);

        if (imageResponse.ok) {
          const blob = await imageResponse.blob();
          setImage(URL.createObjectURL(blob));
        }

        if (lyricsResponse.ok) {
          const text = await lyricsResponse.text();
          if (!text.includes("NoSuchKey")) {
            setLyrics(text);
          } else {
            setLyrics(null);
          }
        } else {
          setLyrics(null);
        }
      } catch (error) {
        console.error("Failed to fetch song data:", error);
        setImage(null);
        setLyrics(null);
      }
    };

    fetchData();
  }, [selectedSong, URL_BASE, folder]);

  useEffect(() => {
    if (!image) return;
    const fac = new FastAverageColor();
    fac
      .getColorAsync(image, { algorithm: "dominant", mode: "precision" })
      .then((colorResult) => {
        const root = document.documentElement;
        root.style.setProperty("background-color", colorResult.hex);
        root.style.setProperty("color", colorResult.isDark ? "white" : "black");

        setColor(colorResult.hex);
        const dark = colorResult.value.map((c) => c * 0.8);
        setColorDark(`rgb(${dark.join(",")})`);
        const light = colorResult.value.map((c) => c * 1.5);
        setColorLight(`rgb(${light.join(",")})`);
        const textLight = colorResult.value.map((c) => c * 2);
        setColorTextLight(`rgb(${textLight.join(",")})`);

        root.style.setProperty("--colorLight", `rgb(${light.join(",")})`);
        root.style.setProperty("--textColorLigth", colorResult.isDark ? "white" : "black");
        setColorText(colorResult.isDark ? "white" : "black");
      })
      .catch((e) => console.error(e));

    return () => fac.destroy();
  }, [image]);

  const handleSeek = (e) => {
    const newSeek = parseInt(e.target.value, 10);
    setSeek(newSeek);
    setUserSeek(newSeek);
  };

  const handleSetEndSong = useCallback((value) => setEndSong(value), []);
  const handleSetPreviousSong = useCallback((value) => setPreviousSong(value), []);
  const handleSetSeek = useCallback((value) => setSeek(value), []);

  const toggleQueue = () => setOpenQueue((prevState) => !prevState);

  return (
    <div className="w-full h-screen flex max-h-screen">
      <div className="flex flex-col w-full">
        <article
          style={{
            background: `linear-gradient(90deg, ${colorDark} 0%, ${color} 100%)`,
            color: colorText,
          }}
          className="flex p-4 gap-x-4 items-center w-full max-w-full"
        >
          <img src={playlistData.cover} alt={playlistData.name} className="size-20 sm:size-32 rounded-2xl" />
          <div className="flex flex-col w-full max-h-w-32 gap-y-1 sm:text-wrap text-nowrap overflow-hidden text-ellipsis">
            <h1 className="font-bold uppercase sm:text-4xl text-xl sm:text-wrap text-nowrap overflow-hidden text-ellipsis">{playlistData.name}</h1>
            <h2 className="sm:text-2xl text-lg text-wrap">{playlistData.artist}</h2>
            <p className="text-sm sm:text-xl font-thin">{playlistData.description}</p>
          </div>
        </article>

        <div className="w-full h-full flex flex-col overflow-y-auto">
          {!selectedSong ? (
            <>
              <div
                className="hidden p-5 grid-cols-6 sm:flex text-center sticky top-0 backdrop-blur-md bg-black/50 text-white"
                style={{ gridTemplateColumns: "0.5fr 0.5fr 2fr 1fr 1fr 1fr", color: colorText }}
              >
                <p>#</p>
                <p></p>
                <p className="text-left">Titulo</p>
                <p>Album</p>
                <p>Fecha</p>
                <p>Duración</p>
              </div>
              <div className="hidden w-full sm:flex flex-col h-full px-5 ">
                {songs.map((song, index) => (
                  <div
                    key={song.id}
                    onClick={() => setSelectedSong(song)}
                    className="text-center cursor-pointer py-2 bg-black/10 border-white/30 border-2 grid grid-cols-6 items-center rounded-md my-1"
                    style={{ gridTemplateColumns: "0.5fr 0.5fr 2fr 1fr 1fr 1fr" }}
                  >
                    <p>{index + 1}</p>
                    <div>
                      <img
                        src={`${URL_BASE}${folder}/${song.artist}/${song.title}/cover.webp`}
                        alt="cover"
                        loading="lazy"
                        className="size-12 object-cover rounded-md mr-3 border-[1px] border-black/30 bg-gray-500/30"
                      />
                    </div>
                    <div className="text-left text-lg flex flex-col">
                      <p className="font-bold">{song.title}</p>
                      <p>{song.artist}</p>
                    </div>
                    <p>{song.album}</p>
                    <p>{song.date.substr(0, 4)}</p>
                    <p>{new Date(song.length * 1000).toISOString().substr(14, 5)}</p>
                  </div>
                ))}
              </div>
              <div className="sm:hidden w-full flex flex-col h-full pl-5 pr-3">
                {songs.map((song) => (
                  <div
                    key={song.id}
                    onClick={() => setSelectedSong(song)}
                    className="text-center cursor-pointer px-3 py-3 bg-black/10 border-white/30 border-2 rounded-md my-1 flex items-center w-full"
                  >
                    <div className="w-1/6 mr-3">
                      <img
                        src={`${URL_BASE}${folder}/${song.artist}/${song.title}/cover.webp`}
                        alt="cover"
                        loading="lazy"
                        className="size-12 object-cover rounded-md border-[1px] border-black/30 bg-gray-500/30"
                      />
                    </div>
                    <div className="w-full text-left text-lg flex flex-col">
                      <p className="font-bold">{song.title}</p>
                      <p>{song.artist}</p>
                    </div>
                    <p className="w-1/6">{new Date(song.length * 1000).toISOString().substr(14, 5)}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col w-full p-5 pt-[50px] sm:pt-0 sm:m-auto max-w-[1200px] items-center justify-center">
              <div className="flex flex-col sm:flex-row px-5 gap-14 w-11/12 m-auto">
                <div className="flex flex-col flex-1 items-center sm:items-start">
                  {image && (
                    <img
                      src={image}
                      className="mb-5 w-[300px] min-w-[200px] max-w-[600px] h-auto aspect-square drop-shadow-2xl border-[3px] border-gray-500/30"
                      alt="cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-ellipsis overflow-hidden">{selectedSong.title}</h2>
                  <h2 className="text-xl text-nowrap text-ellipsis overflow-hidden">{selectedSong.artist}</h2>
                  <div className="hidden sm:flex mt-4">
                    {lyrics ? (
                      <Lyrics
                        lyrics={lyrics}
                        timeElapsed={seek}
                        color={colorTextLight}
                        darkColor={colorDark}
                        backgroundColor={colorText === "black" ? "#00000099" : "#ffffff99"}
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <p>No hay letra disponible</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="relative w-10/12 justify-center m-auto mt-8">
                <div style={{ width: "100%", display: "flex", gap: "15px" }} className="mb-2 items-center">
                  <span>{new Date(seek * 1000).toISOString().substr(14, 5)}</span>
                  <input
                    style={{ flex: "1" }}
                    value={seek}
                    type="range"
                    min="0"
                    max={selectedSong ? Math.floor(selectedSong.length) : 0}
                    step="1"
                    onChange={handleSeek}
                  />
                  <span>{new Date(selectedSong.length * 1000).toISOString().substr(14, 5)}</span>
                </div>
                <SongPlayer
                  colorText={colorText}
                  root={`${URL_BASE}${folder}`}
                  artist={selectedSong.artist}
                  song={selectedSong.title}
                  setPreviousSong={handleSetPreviousSong}
                  setEndSong={handleSetEndSong}
                  totalFragments={selectedSong.fragments}
                  volume={volume}
                  setSeek={handleSetSeek}
                  userSeek={userSeek}
                />
                <div className="flex flex-row items-center justify-between mt-2">
                  <div className="flex flex-row gap-4">
                    <button
                      onClick={() => setRandom(!random)}
                      style={{ border: `4px solid transparent` }}
                      className="rounded-full p-2 hover:scale-105"
                    >
                      {random ? <Random color={colorText} /> : <NoRandom color={colorText} />}
                    </button>
                  </div>
                  <div className="hidden sm:flex flex-row gap-4 items-center">
                    <span>{(volume * 100).toFixed(0)}%</span>
                    <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {selectedSong && (
        <div className="w-0 sm:w-[350px] sm:min-w-[150px] overflow-y-auto bg-black/10">
          <button className="sm:hidden bg-slate-400/90 p-3 w-40 rounded-md h-20 absolute bottom-0 right-0 text-center z-10" onClick={toggleQueue}>
            QUEUE
          </button>
          <div className="hidden sm:block">
            <div style={{ backgroundColor: color, filter: "brightness(0.90)" }} className={`text-2xl font-bold text-center py-2 sticky top-0`}>
              <h3 className="pt-2 pb-3">En cola</h3>
            </div>
            <ul className="pl-3 pr-2 pb-5">
              {songs.map((song) => (
                <li
                  key={song.id}
                  onClick={() => setSelectedSong(song)}
                  style={{
                    backgroundColor: song.id === selectedSong.id ? "#a8a8a8" : "",
                    color: song.id === selectedSong.id ? "#000" : "",
                  }}
                  className="cursor-pointer cursor-hover flex flex-row items-center px-2 py-2 rounded-md"
                >
                  <img
                    src={`${URL_BASE}${folder}/${song.artist}/${song.title}/cover.webp`}
                    alt="cover"
                    loading="lazy"
                    className="size-[35px] min-w-[35px] object-cover rounded-md"
                  />
                  <div className="flex flex-col overflow-hidden">
                    <p className="ml-2 text-ellipsis overflow-hidden whitespace-nowrap text-[15px]">{song.title}</p>
                    <p className="ml-2 text-ellipsis overflow-hidden whitespace-nowrap text-[12px]">{song.artist}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <Drawer
            open={openQueue}
            onClose={toggleQueue}
            direction="bottom"
            className="overflow-y-auto"
            size={"80vh"}
            enableOverlay
            style={{ backgroundColor: color }}
          >
            <div>
              <div
                style={{ backgroundColor: color, filter: "brightness(0.90)" }}
                className={`text-2xl font-bold -mt-1 text-center py-2 sticky top-0`}
              >
                <h3 className="pt-2 pb-3">En cola</h3>
              </div>
              <ul className="pl-3 pr-2 pb-5">
                {songs.map((song) => (
                  <li
                    key={song.id}
                    onClick={() => {
                      setSelectedSong(song);
                      toggleQueue();
                    }}
                    style={{
                      backgroundColor: song.id === selectedSong.id ? "#a8a8a8" : "",
                      color: song.id === selectedSong.id ? "#000" : "",
                    }}
                    className="cursor-pointer cursor-hover flex flex-row items-center px-2 py-2 rounded-md"
                  >
                    <img
                      src={`${URL_BASE}${folder}/${song.artist}/${song.title}/cover.webp`}
                      alt="cover"
                      loading="lazy"
                      className="size-[35px] min-w-[35px] object-cover rounded-md"
                    />
                    <div className="flex flex-col overflow-hidden">
                      <p className="ml-2 text-ellipsis overflow-hidden whitespace-nowrap text-[15px]">{song.title}</p>
                      <p className="ml-2 text-ellipsis overflow-hidden whitespace-nowrap text-[12px]">{song.artist}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Drawer>
        </div>
      )}
    </div>
  );
};

App.propTypes = {
  URL_BASE: PropTypes.string,
  playlist: PropTypes.array,
  folder: PropTypes.string,
  playlistData: PropTypes.object,
};

export default App;
