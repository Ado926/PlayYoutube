// --- Pruebas Internas (para desarrollo) ---
// Establecer en true para ejecutar pruebas básicas en la consola al cargar el script.
const EJECUTAR_PRUEBAS_INTERNAS = false;

// Obtener referencias a los elementos del DOM
const formularioBusqueda = document.getElementById("search-form");
const entradaBusqueda = document.getElementById("search-input");
const listaMusica = document.getElementById("music-list");
const mensajeCargando = document.getElementById("loading-message");
const reproductorAudio = document.getElementById("audio-player");

// --- Configuración General ---
// URL del proxy CORS. Cambiar si es necesario o si el actual deja de funcionar.
// Asegúrate de que el proxy que elijas sea compatible y añada la URL de la API después de su propia URL.
// Ejemplo: https://proxy.ejemplo.com/?url_de_la_api
// Actualmente se usa corsproxy.io, pero otros como allorigins.win (https://api.allorigins.win/raw?url=) podrían servir.
const enlaceProxyCors = 'https://corsproxy.io/?';

// URLs de APIs para obtener el audio (MP3) - Se prueban en orden
const apisAudio = [
  (url) => `https://api.siputzx.my.id/api/d/ytmp3?url=${url}`,
  (url) => `https://api.zenkey.my.id/api/download/ytmp3?apikey=zenkey&url=${url}`
  // Puedes añadir más APIs aquí si es necesario
];

// URLs de APIs para obtener el video (MP4)
const apisVideo = [
  (url) => `https://api.siputzx.my.id/api/d/ytmp4?url=${url}`,
  (url) => `https://api.zenkey.my.id/api/download/ytmp4?apikey=zenkey&url=${url}`,
  (url) => `https://axeel.my.id/api/download/video?url=${encodeURIComponent(url)}`,
  (url) => `https://delirius-apiofc.vercel.app/download/ytmp4?url=${url}`
  // Puedes añadir más APIs aquí si es necesario
];

// --- Funciones Utilitarias ---

// Función para normalizar texto (eliminar acentos y convertir a minúsculas)
const normalizarTexto = (texto) =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Función para calcular la puntuación de un video basada en la consulta
function calcularPuntuacionVideo(tituloNormalizado, canalNormalizado, consultaNormalizada, palabrasClaveNormalizadas) {
  let puntuacion = 0;
  // Coincidencia de frase completa (mayor peso)
  if (tituloNormalizado.includes(consultaNormalizada)) {
    puntuacion += 3;
  }
  if (canalNormalizado.includes(consultaNormalizada)) {
    puntuacion += 1.5;
  }
  // Coincidencia de palabras clave individuales
  palabrasClaveNormalizadas.forEach(palabra => {
    if (tituloNormalizado.includes(palabra)) {
      puntuacion += 1;
    }
    if (canalNormalizado.includes(palabra)) {
      puntuacion += 0.5;
    }
  });
  return puntuacion;
}

// --- Creación de Elementos del DOM ---

// Función para crear una tarjeta de música
function crearTarjetaMusica(infoVideo) {
  const tarjeta = document.createElement("div");
  tarjeta.className = "music-card";

  const imagen = document.createElement("img");
  imagen.src = infoVideo.miniatura;
  imagen.alt = `Miniatura de ${infoVideo.titulo}`;

  const informacion = document.createElement("div");
  informacion.className = "music-info";

  const titulo = document.createElement("div");
  titulo.className = "music-title";
  titulo.textContent = infoVideo.titulo;

  const artista = document.createElement("div");
  artista.className = "music-artist";
  artista.textContent = infoVideo.canal;

  const botonReproducirAudio = document.createElement("button");
  botonReproducirAudio.className = "play-button";
  botonReproducirAudio.innerHTML = `<i class="fas fa-play"></i> Reproducir audio`;

  botonReproducirAudio.onclick = async () => {
    botonReproducirAudio.textContent = "Cargando audio...";
    reproductorAudio.style.display = "none";
    let audioObtenido = false;
    for (const api of apisAudio) {
      try {
        const respuesta = await fetch(api(infoVideo.url));
        if (respuesta.ok) {
            const jsonRespuesta = await respuesta.json();
            const urlAudio = jsonRespuesta?.result?.url || jsonRespuesta?.data?.url || jsonRespuesta?.data?.dl || jsonRespuesta?.url;
            if (urlAudio) {
              reproductorAudio.src = urlAudio;
              reproductorAudio.style.display = "block";
              reproductorAudio.play();
              botonReproducirAudio.innerHTML = `<i class="fas fa-play"></i> Reproducir audio`;
              audioObtenido = true;
              return;
            }
        }
      } catch (error) {
        console.warn(`API de audio (${api(infoVideo.url)}) falló:`, error.message);
      }
    }
    botonReproducirAudio.textContent = "Error al cargar";
    if (!audioObtenido) {
        alert("No se pudo obtener el audio para esta canción. Por favor, intenta con otra o verifica tu conexión.");
    }
  };

  const botonDescargarVideo = document.createElement("button");
  botonDescargarVideo.className = "download-button";
  botonDescargarVideo.innerHTML = `<i class="fas fa-video"></i> Descargar vídeo`;

  botonDescargarVideo.onclick = async () => {
    botonDescargarVideo.textContent = "Buscando vídeo...";
    let videoObtenido = false;
    for (const api of apisVideo) {
      try {
        const respuesta = await fetch(api(infoVideo.url));
         if (respuesta.ok) {
            const jsonRespuesta = await respuesta.json();
            const urlVideo = jsonRespuesta?.data?.dl || jsonRespuesta?.result?.download?.url || jsonRespuesta?.downloads?.url || jsonRespuesta?.data?.download?.url || jsonRespuesta?.url;
            if (urlVideo) {
              const enlaceDescarga = document.createElement("a");
              enlaceDescarga.href = urlVideo;
              enlaceDescarga.download = `${infoVideo.titulo}.mp4`;
              document.body.appendChild(enlaceDescarga);
              enlaceDescarga.click();
              document.body.removeChild(enlaceDescarga);
              botonDescargarVideo.innerHTML = `<i class="fas fa-video"></i> Descargar vídeo`;
              videoObtenido = true;
              return;
            }
        }
      } catch (error) {
        console.warn(`API de vídeo (${api(infoVideo.url)}) falló:`, error.message);
      }
    }
    botonDescargarVideo.textContent = "Error al descargar";
    if (!videoObtenido) {
        alert("No se pudo obtener el vídeo para descargar. Por favor, intenta con otro o verifica tu conexión.");
    }
  };

  informacion.appendChild(titulo);
  informacion.appendChild(artista);
  tarjeta.appendChild(imagen);
  tarjeta.appendChild(informacion);
  tarjeta.appendChild(botonReproducirAudio);
  tarjeta.appendChild(botonDescargarVideo);

  return tarjeta;
}

// --- Lógica Principal de Búsqueda ---
formularioBusqueda.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const consulta = entradaBusqueda.value.trim();
  if (!consulta) {
    alert("Por favor, ingresa un término de búsqueda.");
    return;
  }

  listaMusica.innerHTML = "";
  mensajeCargando.textContent = "Buscando...";
  mensajeCargando.style.display = "block";
  reproductorAudio.style.display = "none";

  try {
    const urlApi = `https://night-api-seven.vercel.app/api/search/youtube?q=${encodeURIComponent(consulta)}`;
    const respuestaBusqueda = await fetch(enlaceProxyCors + encodeURIComponent(urlApi));

    if (!respuestaBusqueda.ok) {
        throw new Error(`Error en la solicitud de búsqueda: ${respuestaBusqueda.status} ${respuestaBusqueda.statusText}`);
    }

    const datos = await respuestaBusqueda.json();
    mensajeCargando.style.display = "none";

    if (!datos.status || !datos.result || datos.result.length === 0) {
      listaMusica.innerHTML = `<p style="text-align:center;">No se encontraron resultados para "${consulta}". Intenta con otros términos.</p>`;
      return;
    }

    const consultaNormalizada = normalizarTexto(consulta);
    const palabrasClave = consultaNormalizada.split(/\s+/).filter(p => p.length > 1);

    const resultadosFiltrados = datos.result
      .map(video => { // 'video' aquí es el objeto original de la API (infoVideo)
        const tituloNormalizado = normalizarTexto(video.titulo);
        const canalNormalizado = normalizarTexto(video.canal);
        // Usar la nueva función para calcular la puntuación
        const puntuacion = calcularPuntuacionVideo(tituloNormalizado, canalNormalizado, consultaNormalizada, palabrasClave);
        return { video, puntuacion }; // Devolver el objeto original de la API y su puntuación
      })
      .filter(item => item.puntuacion > 0)
      .sort((a, b) => b.puntuacion - a.puntuacion)
      .slice(0, 15);

    if (resultadosFiltrados.length === 0) {
      listaMusica.innerHTML = `<p style="text-align:center;">No se encontraron resultados suficientemente relevantes para "${consulta}".</p>`;
      return;
    }

    resultadosFiltrados.forEach(item => { // 'item' aquí es { video, puntuacion }
      const nuevaTarjeta = crearTarjetaMusica(item.video); // Pasar el objeto 'video' original
      listaMusica.appendChild(nuevaTarjeta);
    });

  } catch (error) {
    console.error("Error detallado en la búsqueda:", error);
    mensajeCargando.style.display = "none";
    listaMusica.innerHTML = `<p style="text-align:center; color: red;">Ocurrió un error al realizar la búsqueda. Por favor, inténtalo de nuevo más tarde.</p><p style="text-align:center; font-size:0.8em;">Detalle: ${error.message}</p>`;
  }
});

// --- Sección de Pruebas Internas ---

// Función de ayuda para mostrar los resultados de las pruebas en la consola
function afirmarIgualdad(descripcionPrueba, valorEsperado, valorObtenido) {
  // Usar JSON.stringify para una comparación más robusta de objetos y arrays
  const esperadoString = JSON.stringify(valorEsperado);
  const obtenidoString = JSON.stringify(valorObtenido);

  if (esperadoString === obtenidoString) {
    console.log(`✅ PRUEBA PASADA: ${descripcionPrueba}`);
  } else {
    console.error(`❌ PRUEBA FALLIDA: ${descripcionPrueba}`);
    console.error(`   Esperado: ${esperadoString}`);
    console.error(`   Obtenido: ${obtenidoString}`);
  }
}

if (EJECUTAR_PRUEBAS_INTERNAS) {
  console.log("--- Iniciando Pruebas Internas ---");

  // Pruebas para normalizarTexto
  console.log("\n--- Pruebas para normalizarTexto ---");
  afirmarIgualdad("normalizarTexto: Minúsculas y espacios", "hola mundo", normalizarTexto("Hola Mundo"));
  afirmarIgualdad("normalizarTexto: Acentos y mayúsculas", "cancion de año nuevo", normalizarTexto("CAnción dE Año nuevo"));
  afirmarIgualdad("normalizarTexto: Texto vacío", "", normalizarTexto(""));
  afirmarIgualdad("normalizarTexto: Sin cambios necesarios", "texto simple", normalizarTexto("texto simple"));
  afirmarIgualdad("normalizarTexto: Caracteres especiales (no normalizados)", "texto!@#$", normalizarTexto("Texto!@#$"));

  // Pruebas para calcularPuntuacionVideo
  console.log("\n--- Pruebas para calcularPuntuacionVideo ---");
  const palabrasEjemplo1 = ["cancion", "oficial"];
  afirmarIgualdad(
    "calcularPuntuacionVideo: Coincidencia frase completa en título y palabras clave también presentes",
    5, // Frase completa (3) + "cancion" en título (1) + "oficial" en título (1) = 5.
    calcularPuntuacionVideo("video cancion oficial", "canal x", "cancion oficial", palabrasEjemplo1)
  );
   afirmarIgualdad(
    "calcularPuntuacionVideo: Coincidencia frase completa en título (sin palabras clave extra)",
    3,
    calcularPuntuacionVideo("cancion oficial", "canal x", "cancion oficial", ["cancion", "oficial"])
  );
  afirmarIgualdad(
    "calcularPuntuacionVideo: Coincidencia frase completa en canal",
    1.5,
    calcularPuntuacionVideo("video random", "super cancion oficial", "cancion oficial", palabrasEjemplo1)
  );
  afirmarIgualdad(
    "calcularPuntuacionVideo: Coincidencia solo palabras clave en título",
    2, // "cancion" (1) + "oficial" (1)
    calcularPuntuacionVideo("video de la cancion super oficial", "canal y", "consulta no presente", palabrasEjemplo1)
  );
  afirmarIgualdad(
    "calcularPuntuacionVideo: Coincidencia palabras clave en título y canal",
    3, // "cancion" en título (1) + "oficial" en título (1) + "cancion" en canal (0.5) + "oficial" en canal (0.5)
    calcularPuntuacionVideo("esta es la cancion oficial", "mi cancion oficial favorita", "consulta no presente", palabrasEjemplo1)
  );
  afirmarIgualdad(
    "calcularPuntuacionVideo: Sin coincidencia",
    0,
    calcularPuntuacionVideo("otro video", "otro canal", "consulta inexistente", ["consulta", "inexistente"])
  );
  const palabrasEjemplo2 = ["mix", "electronica"];
  afirmarIgualdad(
    "calcularPuntuacionVideo: Coincidencia palabras sueltas título y canal",
    1.5, // "mix" en título (1) + "electronica" en canal (0.5)
    calcularPuntuacionVideo("super mix musica", "canal electronica principal", "frase no presente", palabrasEjemplo2)
  );
   afirmarIgualdad(
    "calcularPuntuacionVideo: Coincidencia frase y palabras clave en título y canal",
    9, // Título: "live set"(3)+"electronica"(1)+"live"(1)+"set"(1) = 6. Canal: "live set"(1.5)+"electronica"(0.5)+"live"(0.5)+"set"(0.5) = 3. Total = 9.
    calcularPuntuacionVideo("electronica live set 2024", "canal de electronica con live set", "live set", ["electronica", "live", "set"])
  );


  console.log("\n--- Fin de Pruebas Internas ---");
}
