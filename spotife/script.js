const app = document.querySelector(".phone-app");
const splashScreen = document.getElementById("splashScreen");
const SPLASH_DURATION_MS = 4600;

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
const filterTabs = document.querySelectorAll("[data-filter]");
const homePanels = document.querySelectorAll("[data-home-panel]");
const deviceIndicator = document.querySelector("[data-device-indicator]");
const miniDeviceIndicator = document.querySelector("[data-mini-device-indicator]");
let isPlaying = false;
let hasStartedPlaylist = false;

if (splashScreen) {
  window.setTimeout(() => {
    app.classList.add("splash-done");
    app.classList.remove("is-splashing");
    splashScreen.setAttribute("aria-hidden", "true");
  }, SPLASH_DURATION_MS);

  splashScreen.addEventListener("transitionend", (event) => {
    if (event.propertyName === "opacity") {
      splashScreen.remove();
    }
  });
}

const playbackDevice = {
  type: "speaker",
  label: ""
};

const deviceIcons = {
  speaker: `<svg class="device-icon speaker-device-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.7 6.8h7.2v10.4H4.7V6.8Zm9.3 1.7h2.1v7H14v-7Zm3.6-3h2.1v13h-2.1v-13Z"/></svg>`,
  headphones: `<svg class="device-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5A7.5 7.5 0 0 0 4.5 11v4.1c0 1.9 1.5 3.4 3.4 3.4h1.7v-7.1H6.5V11a5.5 5.5 0 0 1 11 0v.4h-3.1v7.1h1.7c1.9 0 3.4-1.5 3.4-3.4V11A7.5 7.5 0 0 0 12 3.5Z"/></svg>`
};

function renderPlaybackDevice() {
  const icon = deviceIcons[playbackDevice.type] || deviceIcons.speaker;
  const label = playbackDevice.label ? `<span>${playbackDevice.label}</span>` : "";
  const content = `${icon}${label}`;

  deviceIndicator.innerHTML = content;
  miniDeviceIndicator.innerHTML = content;
}

function clampColor(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function rgbToCss(color) {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

function shadeColor(color, amount) {
  return {
    r: clampColor(color.r * amount),
    g: clampColor(color.g * amount),
    b: clampColor(color.b * amount)
  };
}

function normalizePlayerColor(color) {
  const darkened = shadeColor(color, 0.55);
  const floor = 28;

  return {
    r: Math.max(floor, darkened.r),
    g: Math.max(floor, darkened.g),
    b: Math.max(floor, darkened.b)
  };
}

function applyPlayerColor(color) {
  const accent = normalizePlayerColor(color);
  const accentDark = shadeColor(accent, 0.58);

  app.style.setProperty("--player-accent", rgbToCss(accent));
  app.style.setProperty("--player-accent-dark", rgbToCss(accentDark));
}

function extractCoverColor(src) {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = src;

  image.addEventListener("load", () => {
    const canvas = document.createElement("canvas");
    const size = 48;
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(image, 0, 0, size, size);

    const { data } = context.getImageData(0, 0, size, size);
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;

    for (let index = 0; index < data.length; index += 16) {
      const alpha = data[index + 3];
      if (alpha < 180) {
        continue;
      }

      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const brightness = (red + green + blue) / 3;

      if (brightness > 238 || brightness < 14) {
        continue;
      }

      r += red;
      g += green;
      b += blue;
      count += 1;
    }

    if (count > 0) {
      applyPlayerColor({ r: r / count, g: g / count, b: b / count });
    }
  });

  image.addEventListener("error", () => {
    applyPlayerColor({ r: 32, g: 60, b: 54 });
  });
}
const song = {
  title: "Aquele gol que n\u00e3o valeu",
  artist: "Leandro Dias",
  album: "Minha melhor mem\u00f3ria",
  cover: "../img/foto-principal.jpg"
};

function setActiveFilter(filter) {
  filterTabs.forEach((tab) => {
    tab.classList.toggle("is-selected", tab.dataset.filter === filter);
  });
}

function showHomePanel(panelName) {
  homePanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.homePanel === panelName);
  });
}

function setHomeFilter(filter) {
  setActiveFilter(filter);

  if (filter === "playlists") {
    setScreen("playlist");
    return;
  }

  showHomePanel(filter === "music" ? "music" : "all");
  setScreen("home");
}

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

function showVisualFallback() {
  mediaWrap.classList.add("use-fallback");
}

function showVideoVisual() {
  mediaWrap.classList.remove("use-fallback");
}

async function startVisualLoop() {
  if (!visualLoop) {
    return;
  }

  try {
    await visualLoop.play();
  } catch (error) {
    showVisualFallback();
  }
}

function openMusicPlayer() {
  setScreen("player");
  playSong();
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
    if (button.dataset.open === "home") {
      setHomeFilter("all");
      return;
    }

    if (button.dataset.open === "playlist") {
      setActiveFilter("playlists");
    }

    setScreen(button.dataset.open);
  });
});

filterTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setHomeFilter(tab.dataset.filter);
  });
});

document.querySelectorAll("[data-play-open]").forEach((button) => {
  button.addEventListener("click", openMusicPlayer);
});

mainPlay.addEventListener("click", toggleSong);

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

visualLoop.addEventListener("error", showVisualFallback);
visualLoop.querySelectorAll("source").forEach((source) => {
  source.addEventListener("error", showVisualFallback);
});

visualLoop.addEventListener("loadeddata", showVideoVisual);

setRangeProgress(0);
updateMediaSession();

