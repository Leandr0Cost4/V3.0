// Dados da playlist
const playlist = [
  { titulo: "Mulher Feita", arquivo: "musicas/musica1.mp3", capa: "capas/musica1.jpg", artista: "PROJOTA" },
  { titulo: "Baixinha", arquivo: "musicas/musica2.mp3", capa: "capas/musica2.jpg", artista: "CHININHA & L7NNON " },
  { titulo: "Ela só quer Paz", arquivo: "musicas/musica3.mp3", capa: "capas/musica3.jpg", artista: "PROJOTA" },
  { titulo: "Música 4", arquivo: "musicas/musica4.mp3", capa: "capas/musica4.jpg", artista: "Artista 4" },
  { titulo: "Música 5", arquivo: "musicas/musica5.mp3", capa: "capas/musica5.jpg", artista: "Artista 5" }
];

// Mapeamento de elementos do DOM
const audio = document.getElementById("audio");
const capa = document.getElementById("capa");
const titulo = document.getElementById("titulo");
const artista = document.getElementById("artista");
const playBtn = document.getElementById("play");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const barra = document.getElementById("barra");
const tempoAtual = document.getElementById("tempo-atual");
const tempoTotal = document.getElementById("tempo-total");
const speedBtn = document.getElementById("speed-btn");
const speedOptions = document.getElementById("speed-options");
const shuffleBtn = document.getElementById("shuffle");
const repeatBtn = document.getElementById("repeat");

// Estado do player
const playerState = {
  currentMusicIndex: 0,
  isShuffling: false,
  repeatMode: "none" // "none", "one", "all"
};

const colorThief = new ColorThief();

// --- Funções do Player ---

// Carrega a música baseada no índice do estado
function loadMusic() {
  const music = playlist[playerState.currentMusicIndex];
  audio.src = music.arquivo;
  capa.src = music.capa;
  titulo.textContent = music.titulo;
  artista.textContent = music.artista;
  audio.load();
  updateBackgroundColor();
}

// Alterna entre play e pause
function togglePlayPause() {
  if (audio.paused) {
    audio.play();
    playBtn.classList.add("playing");
  } else {
    audio.pause();
    playBtn.classList.remove("playing");
  }
}

// Reproduz a próxima música
function nextMusic() {
  if (playerState.isShuffling) {
    let newIndex;
    do {
      // Garante que o índice gerado é válido e não é o mesmo que o atual
      newIndex = Math.floor(Math.random() * playlist.length);
    } while (newIndex === playerState.currentMusicIndex);
    playerState.currentMusicIndex = newIndex;
  } else {
    playerState.currentMusicIndex = (playerState.currentMusicIndex + 1) % playlist.length;
  }
  loadMusic();
  audio.play();
  playBtn.classList.add("playing");
}

// Reproduz a música anterior
function prevMusic() {
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
  } else {
    playerState.currentMusicIndex = (playerState.currentMusicIndex - 1 + playlist.length) % playlist.length;
    loadMusic();
    audio.play();
    playBtn.classList.add("playing");
  }
}

// Atualiza a cor de fundo com base na capa
function updateBackgroundColor() {
  if (capa.complete) {
    const color = colorThief.getColor(capa);
    document.body.style.background = `linear-gradient(135deg, rgb(${color[0]}, ${color[1]}, ${color[2]}), #000)`;
  } else {
    capa.addEventListener("load", () => {
      const color = colorThief.getColor(capa);
      document.body.style.background = `linear-gradient(135deg, rgb(${color[0]}, ${color[1]}, ${color[2]}), #000)`;
    });
  }
}

// Formata o tempo em minutos e segundos
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

// --- Event Listeners ---

playBtn.addEventListener("click", togglePlayPause);
nextBtn.addEventListener("click", nextMusic);
prevBtn.addEventListener("click", prevMusic);

// Barra de progresso e tempo
audio.addEventListener("timeupdate", () => {
  const progress = (audio.currentTime / audio.duration) * 100 || 0;
  barra.value = progress;
  tempoAtual.textContent = formatTime(audio.currentTime);
  if (!isNaN(audio.duration)) {
    tempoTotal.textContent = formatTime(audio.duration);
  }
});

barra.addEventListener("input", () => {
  audio.currentTime = (barra.value / 100) * audio.duration;
});

// Lógica de final de música
audio.addEventListener("ended", () => {
  if (playerState.repeatMode === "one") {
    audio.currentTime = 0;
    audio.play();
  } else if (playerState.repeatMode === "all") {
    nextMusic();
  } else {
    playBtn.classList.remove("playing");
  }
});

// Lógica para o botão de velocidade
speedBtn.addEventListener("click", () => {
  speedOptions.style.display = speedOptions.style.display === 'flex' ? 'none' : 'flex';
});

speedOptions.querySelectorAll("button").forEach(btn => {
  btn.addEventListener("click", () => {
    audio.playbackRate = parseFloat(btn.dataset.speed);
    speedOptions.style.display = 'none';
  });
});

// Lógica para o botão de aleatório
shuffleBtn.addEventListener("click", () => {
  playerState.isShuffling = !playerState.isShuffling;
  shuffleBtn.classList.toggle("active", playerState.isShuffling);
  shuffleBtn.classList.toggle("pulse", playerState.isShuffling);
});

// Lógica para o botão de repetição
repeatBtn.addEventListener("click", () => {
  if (playerState.repeatMode === "none") {
    playerState.repeatMode = "one";
    repeatBtn.classList.add("active");
    repeatBtn.classList.add("pulse");
  } else if (playerState.repeatMode === "one") {
    playerState.repeatMode = "all";
    repeatBtn.classList.add("pulse");
  } else {
    playerState.repeatMode = "none";
    repeatBtn.classList.remove("active");
    repeatBtn.classList.remove("pulse");
  }
});

// Inicialização
loadMusic();