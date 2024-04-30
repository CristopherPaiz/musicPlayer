const Bienvenida = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-6 text-center">
      <div
        style={{
          position: "absolute",
          inset: "0",
          zIndex: "-10",
          height: "100%",
          width: "100%",
          background: "white",
          backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      ></div>
      <div className="flex-1 w-full items-center justify-center flex flex-col mt-10">
        <h1 className="text-2xl  font-extralight -mb-1 mr-1 text-black/40">Bienvenido a</h1>
        <h2 className="text-6xl font-bold">Music Player</h2>
        <h3 className="mt-10 animate-bounce text-4xl text-gray-400 text-center">
          ← Selecciona una playlist para comenzar ♪
        </h3>
      </div>
      <h4 className="mb-2">
        Esta aplicación fue hecha por
        <a href="https://www.github.com/CristopherPaiz" target="_blank" className="mx-1 hover:underline text-blue-700">
          Cristopher Paiz
        </a>
      </h4>
      <p className="text-[9px] text-gray-500 text-balance text-center bottom-0 mb-4">
        ** El propósito fundamental detrás de esta aplicación ha sido facilitar la reproducción inmediata de audio,
        evitando la necesidad de que el usuario descargue la totalidad de la canción. Para lograr este cometido, se ha
        empleado la técnica de fragmentación de las canciones, lo que debería permitir una carga más rápida. Es
        importante destacar que este proyecto carece de backend, por lo que es posible que no funcione de manera óptima
        en todos los casos. No obstante, se ha realizado el mejor esfuerzo, para tratar de simular el streaming que
        hacen las grandes plataformas. **
      </p>
    </div>
  );
};

export default Bienvenida;
