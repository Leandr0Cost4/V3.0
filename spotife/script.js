const app = document.querySelector(".phone-app");
const screens = {
  home: document.getElementById("homeScreen"),
  playlist: document.getElementById("playlistScreen"),
  player: document.getElementById("playerScreen")
};

const audio = document.getElementById("audioPlayer");
const visualLoop = document.getElementById("visualLoop");
const mediaWrap = document.querySelector(".player-media-wrap");
const mainPlay = document.getElementById("mainPlay");
const progressBar = document.getElementById("progressBar");
const currentTime = document.getElementById("currentTime");
const durationTime = document.getElementById("durationTime");
const miniToggle = document.querySelector("[data-mini-toggle]");
const spotifyPlay = document.querySelector(".spotify-play");
let isPlaying = false;
let hasStartedPlaylist = false;

const song = {
  title: "Aquele gol que n\u00e3o valeu",
  artist: "Leandro Dias",
  album: "Minha melhor mem\u00f3ria",
  cover: "../img/foto-principal.jpg"
};

function setScreen(name) {
  Object.entries(screens).forEach(([key, screen]) => {
    screen.classList.toggle("is-active", key === name);
  });

  app.dataset.screen = name;

  if (name === "player") {
    startVisualLoop();
  }
}

function formatTime(value) {
  if (!Number.isFinite(value)) {
    return "0:00";
  }

  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function setRangeProgress(value) {
  progressBar.style.setProperty("--progress", `${value}%`);
}

function markPlaylistStarted() {
  if (hasStartedPlaylist) {
    return;
  }

  hasStartedPlaylist = true;
  app.classList.add("has-played");
}

function syncPlayState(playing) {
  isPlaying = playing;
  mainPlay.classList.toggle("is-playing", playing);
  spotifyPlay.classList.toggle("is-playing", playing);
  miniToggle.classList.toggle("is-playing", playing);
  mainPlay.setAttribute("aria-label", playing ? "Pausar m\u00fasica" : "Tocar m\u00fasica");
}

async function playSong() {
  try {
    await audio.play();
    markPlaylistStarted();
    syncPlayState(true);
    updateMediaSession();
  } catch (error) {
    syncPlayState(false);
  }
}

function pauseSong() {
  audio.pause();
  syncPlayState(false);
}

function toggleSong() {
  if (isPlaying) {
    pauseSong();
  } else {
    playSong();
  }
}

async function startVisualLoop() {
  if (!visualLoop) {
    return;
  }

  try {
    await visualLoop.play();
  } catch (error) {
    mediaWrap.classList.add("use-fallback");
  }
}

function updateMediaSession() {
  if (!("mediaSession" in navigator)) {
    return;
  }

  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.title,
    artist: song.artist,
    album: song.album,
    artwork: [
      { src: song.cover, sizes: "512x512", type: "image/jpeg" }
    ]
  });

  navigator.mediaSession.setActionHandler("play", playSong);
  navigator.mediaSession.setActionHandler("pause", pauseSong);
}

document.querySelectorAll("[data-open]").forEach((button) => {
  button.addEventListener("click", () => {
    setScreen(button.dataset.open);
  });
});

document.querySelectorAll("[data-play-open]").forEach((button) => {
  button.addEventListener("click", () => {
    setScreen(button.dataset.playOpen);
    playSong();
  });
});

mainPlay.addEventListener("click", toggleSong);

spotifyPlay.addEventListener("click", (event) => {
  event.stopPropagation();
  setScreen("player");
  playSong();
});

document.querySelector(".mini-player").addEventListener("click", (event) => {
  if (event.target.closest("[data-mini-toggle]")) {
    event.stopPropagation();
    toggleSong();
    return;
  }

  setScreen("player");
});

miniToggle.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleSong();
});

audio.addEventListener("loadedmetadata", () => {
  durationTime.textContent = formatTime(audio.duration);
});

audio.addEventListener("timeupdate", () => {
  const progress = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  progressBar.value = progress;
  currentTime.textContent = formatTime(audio.currentTime);
  setRangeProgress(progress);
});

audio.addEventListener("ended", () => {
  syncPlayState(false);
  audio.currentTime = 0;
  setRangeProgress(0);
});

progressBar.addEventListener("input", () => {
  const nextTime = (Number(progressBar.value) / 100) * audio.duration;
  if (Number.isFinite(nextTime)) {
    audio.currentTime = nextTime;
  }
  setRangeProgress(Number(progressBar.value));
});

visualLoop.addEventListener("error", () => {
  mediaWrap.classList.add("use-fallback");
});

visualLoop.addEventListener("loadeddata", () => {
  mediaWrap.classList.remove("use-fallback");
});

setRangeProgress(0);
updateMediaSession();

