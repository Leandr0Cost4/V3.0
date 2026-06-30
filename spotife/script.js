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
let visualLoopCopy = null;
let activeVisualLoop = visualLoop;
let standbyVisualLoop = null;
let visualLoopSwitching = false;
let visualLoopWatcherStarted = false;
const VISUAL_LOOP_OVERLAP_SECONDS = 0.2;
const VISUAL_CROSSFADE_MS = 90;
const mediaWrap = document.querySelector(".player-media-wrap");
const mainPlay = document.getElementById("mainPlay");
const progressBar = document.getElementById("progressBar");
const currentTime = document.getElementById("currentTime");
const durationTime = document.getElementById("durationTime");
const miniToggle = document.querySelector("[data-mini-toggle]");
const spotifyPlay = document.querySelector(".spotify-play");
const playbackModeButtons = document.querySelectorAll("[data-playback-mode-toggle]");
const shareSheet = document.querySelector("[data-share-sheet]");
const speedSheet = document.querySelector("[data-speed-sheet]");
const speedOpenButton = document.querySelector("[data-speed-open]");
const speedOptionButtons = document.querySelectorAll("[data-speed-option]");
const shareStatus = document.querySelector("[data-share-status]");
const shareTargetButtons = document.querySelectorAll("[data-share-target]");
const filterTabs = document.querySelectorAll("[data-filter]");
const homePanels = document.querySelectorAll("[data-home-panel]");
const deviceIndicator = document.querySelector("[data-device-indicator]");
const miniDeviceIndicator = document.querySelector("[data-mini-device-indicator]");
let isPlaying = false;
let hasStartedPlaylist = false;
const playbackModes = ["shuffle", "repeat", "order"];
let playbackModeIndex = 0;
let playbackMode = playbackModes[playbackModeIndex];
let shareTarget = "link";
let playbackSpeed = 1;
const IMAGE_VERSION = "images-refresh-1";

function versionedImage(path) {
  return `${path}?v=${IMAGE_VERSION}`;
}

const playbackModeIcons = {
  shuffle: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 3h5v5h-2V6.4l-4.6 4.6L13 9.6 17.6 5H16V3ZM4 7h3.2c1.8 0 3.1.8 4.4 2.7l-1.5 1.5C9 9.6 8.2 9 7.2 9H4V7Zm9.1 7.4 1.4-1.4 4.5 4.6V16h2v5h-5v-2h1.6l-4.5-4.6ZM4 15h3.2c1 0 1.8-.6 2.9-2.2l1.5 1.5C10.3 16.2 9 17 7.2 17H4v-2Z"/></svg>`,
  repeat: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h9.2l-2.6-2.6L15 3l5 5-5 5-1.4-1.4L16.2 9H7a3 3 0 0 0-3 3v1H2v-1a5 5 0 0 1 5-5Zm10 10H7.8l2.6 2.6L9 21l-5-5 5-5 1.4 1.4L7.8 15H17a3 3 0 0 0 3-3v-1h2v1a5 5 0 0 1-5 5Z"/></svg>`,
  order: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h12v2H4V6Zm0 5h10v2H4v-2Zm0 5h8v2H4v-2Zm12.5-4.5V7l5 3.5-5 3.5Z"/></svg>`
};

const playbackModeLabels = {
  shuffle: "Modo aleat\u00f3rio",
  repeat: "Modo repeti\u00e7\u00e3o",
  order: "Modo em ordem"
};

function syncPlaybackModeBehavior() {
  audio.loop = playbackMode === "repeat";
}

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

function normalizePlaylistColor(color) {
  const muted = shadeColor(color, 0.82);
  const floor = 34;

  return {
    r: Math.max(floor, muted.r),
    g: Math.max(floor, muted.g),
    b: Math.max(floor, muted.b)
  };
}

function applyPlaylistColor(color) {
  const accent = normalizePlaylistColor(color);
  const accentMid = shadeColor(accent, 0.58);
  const accentDark = shadeColor(accent, 0.32);

  app.style.setProperty("--playlist-accent", rgbToCss(accent));
  app.style.setProperty("--playlist-accent-mid", rgbToCss(accentMid));
  app.style.setProperty("--playlist-accent-dark", rgbToCss(accentDark));
}

function applyCoverColor(color) {
  applyPlayerColor(color);
  applyPlaylistColor(color);
}

function extractCoverColor(src, applyColor = applyCoverColor) {
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
      applyColor({ r: r / count, g: g / count, b: b / count });
    } else {
      applyColor({ r: 74, g: 64, b: 60 });
    }
  });

  image.addEventListener("error", () => {
    applyColor({ r: 74, g: 64, b: 60 });
  });
}
const playlist = {
  cover: versionedImage("imagens/capa-playlist.jpg")
};

const song = {
  title: "Aquele gol que n\u00e3o valeu",
  artist: "Leandro Dias",
  album: "Minha melhor mem\u00f3ria",
  cover: versionedImage("imagens/capa-musica.jpg")
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

function applyInitialRoute() {
  if (window.location.hash === "#playlist") {
    setActiveFilter("playlists");
    setScreen("playlist");
    return;
  }

  if (window.location.hash === "#player") {
    setActiveFilter("playlists");
    setScreen("player");
  }
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
  spotifyPlay.setAttribute("aria-label", playing ? "Pausar playlist" : "Tocar playlist");
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

function handlePlaylistPlayButton() {
  if (isPlaying) {
    pauseSong();
    return;
  }

  setScreen("player");
  playSong();
}

function updatePlaybackModeButton() {
  syncPlaybackModeBehavior();

  playbackModeButtons.forEach((button) => {
    button.innerHTML = playbackModeIcons[playbackMode];
    button.classList.remove("is-shuffle", "is-repeat", "is-order");
    button.classList.add(`is-${playbackMode}`);
    button.setAttribute("aria-label", playbackModeLabels[playbackMode]);
    button.title = playbackModeLabels[playbackMode];
  });
}
function cyclePlaybackMode() {
  playbackModeIndex = (playbackModeIndex + 1) % playbackModes.length;
  playbackMode = playbackModes[playbackModeIndex];
  updatePlaybackModeButton();
}

function getBaseShareUrl() {
  return window.location.href.split("#")[0];
}

function getShareUrl() {
  const baseUrl = getBaseShareUrl();

  if (shareTarget === "playlist") {
    return `${baseUrl}#playlist`;
  }

  if (shareTarget === "music") {
    return `${baseUrl}#player`;
  }

  return baseUrl;
}

function getShareData() {
  const title = shareTarget === "music"
    ? "Aquele gol que n\u00e3o valeu - SpotiF\u00ea"
    : "Minha melhor mem\u00f3ria - SpotiF\u00ea";

  return {
    title,
    text: "Escutar Aquele gol que n\u00e3o valeu no SpotiF\u00ea.",
    url: getShareUrl()
  };
}

function setShareTarget(target) {
  shareTarget = target;

  shareTargetButtons.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.shareTarget === target);
  });

  setShareStatus("");
}

function setShareStatus(message) {
  if (!shareStatus) {
    return;
  }

  shareStatus.textContent = message;
}

function openShareSheet() {
  if (!shareSheet) {
    return;
  }

  shareSheet.classList.add("is-open");
  shareSheet.setAttribute("aria-hidden", "false");
  setShareStatus("");
}

function closeShareSheet() {
  if (!shareSheet) {
    return;
  }

  shareSheet.classList.remove("is-open");
  shareSheet.setAttribute("aria-hidden", "true");
}

function formatSpeedLabel(speed) {
  return `${speed.toFixed(1).replace(".", ",")}x`;
}

function updateSpeedButtons() {
  speedOptionButtons.forEach((button) => {
    const speed = Number(button.dataset.speedOption);
    button.classList.toggle("is-selected", speed === playbackSpeed);
  });

  if (!speedOpenButton) {
    return;
  }

  const speedLabel = formatSpeedLabel(playbackSpeed);
  speedOpenButton.classList.toggle("is-speed-adjusted", playbackSpeed !== 1);
  speedOpenButton.setAttribute("aria-label", `Velocidade ${speedLabel}`);
  speedOpenButton.title = `Velocidade ${speedLabel}`;
}

function setPlaybackSpeed(speed) {
  playbackSpeed = speed;
  audio.playbackRate = speed;
  [visualLoop, visualLoopCopy].forEach((video) => {
    if (video) {
      video.playbackRate = speed;
    }
  });
  updateSpeedButtons();
}

function openSpeedSheet() {
  if (!speedSheet) {
    return;
  }

  closeShareSheet();
  speedSheet.classList.add("is-open");
  speedSheet.setAttribute("aria-hidden", "false");
}

function closeSpeedSheet() {
  if (!speedSheet) {
    return;
  }

  speedSheet.classList.remove("is-open");
  speedSheet.setAttribute("aria-hidden", "true");
}
function fallbackCopyText(value) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

async function copyShareLink() {
  const { url } = getShareData();

  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    } else {
      fallbackCopyText(url);
    }
    setShareStatus("Link copiado");
  } catch (error) {
    fallbackCopyText(url);
    setShareStatus("Link copiado");
  }
}

async function nativeShare() {
  const shareData = getShareData();

  if (navigator.share) {
    await navigator.share(shareData);
    return;
  }

  await copyShareLink();
}

function shareToWhatsApp() {
  const shareData = getShareData();
  const payload = encodeURIComponent(`${shareData.text} ${shareData.url}`);
  window.open(`https://wa.me/?text=${payload}`, "_blank", "noopener");
}

function shareToSms() {
  const shareData = getShareData();
  const payload = encodeURIComponent(`${shareData.text} ${shareData.url}`);
  window.location.href = `sms:?&body=${payload}`;
}

async function handleShareAction(action) {
  if (action === "copy") {
    await copyShareLink();
    return;
  }

  if (action === "whatsapp") {
    shareToWhatsApp();
    return;
  }

  if (action === "sms") {
    shareToSms();
    return;
  }

  try {
    await nativeShare();
  } catch (error) {
    setShareStatus("");
  }
}

function showVisualFallback() {
  mediaWrap.classList.add("use-fallback");
}

function showVideoVisual() {
  mediaWrap.classList.remove("use-fallback");
}

function prepareVisualVideo(video) {
  video.loop = false;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.playbackRate = playbackSpeed;
  video.addEventListener("error", showVisualFallback);
  video.addEventListener("loadeddata", showVideoVisual);
  video.addEventListener("ended", () => {
    if (video !== activeVisualLoop) {
      return;
    }

    video.currentTime = 0;
    video.play().catch(showVisualFallback);
  });

  video.querySelectorAll("source").forEach((source) => {
    source.addEventListener("error", showVisualFallback);
  });
}

function setupSeamlessVisualLoop() {
  if (!visualLoop || visualLoopCopy) {
    return;
  }

  prepareVisualVideo(visualLoop);
  visualLoopCopy = visualLoop.cloneNode(true);
  visualLoopCopy.removeAttribute("id");
  visualLoopCopy.classList.remove("is-active");
  visualLoopCopy.setAttribute("aria-hidden", "true");
  prepareVisualVideo(visualLoopCopy);
  visualLoop.after(visualLoopCopy);
  standbyVisualLoop = visualLoopCopy;
}

function resetHiddenVisual(video) {
  window.setTimeout(() => {
    video.pause();
    video.currentTime = 0;
    visualLoopSwitching = false;
  }, VISUAL_CROSSFADE_MS);
}

async function switchVisualLoop() {
  if (visualLoopSwitching || !activeVisualLoop || !standbyVisualLoop) {
    return;
  }

  visualLoopSwitching = true;

  try {
    standbyVisualLoop.currentTime = 0;
    await standbyVisualLoop.play();
    standbyVisualLoop.classList.add("is-active");
    activeVisualLoop.classList.remove("is-active");

    const previousVisual = activeVisualLoop;
    activeVisualLoop = standbyVisualLoop;
    standbyVisualLoop = previousVisual;
    resetHiddenVisual(previousVisual);
  } catch (error) {
    visualLoopSwitching = false;
    try {
      activeVisualLoop.currentTime = 0;
      await activeVisualLoop.play();
      showVideoVisual();
    } catch (fallbackError) {
      showVisualFallback();
    }
  }
}

function watchSeamlessVisualLoop() {
  if (!visualLoopWatcherStarted) {
    return;
  }

  if (activeVisualLoop && !activeVisualLoop.paused && !mediaWrap.classList.contains("use-fallback")) {
    const duration = activeVisualLoop.duration;
    const remaining = duration - activeVisualLoop.currentTime;

    if (Number.isFinite(duration) && duration > VISUAL_LOOP_OVERLAP_SECONDS && remaining <= VISUAL_LOOP_OVERLAP_SECONDS) {
      switchVisualLoop();
    }
  }

  window.requestAnimationFrame(watchSeamlessVisualLoop);
}

function startVisualLoopWatcher() {
  if (visualLoopWatcherStarted) {
    return;
  }

  visualLoopWatcherStarted = true;
  window.requestAnimationFrame(watchSeamlessVisualLoop);
}

async function startVisualLoop() {
  if (!visualLoop) {
    return;
  }

  setupSeamlessVisualLoop();

  try {
    await activeVisualLoop.play();
    showVideoVisual();
    startVisualLoopWatcher();
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

spotifyPlay.addEventListener("click", handlePlaylistPlayButton);

playbackModeButtons.forEach((button) => {
  button.addEventListener("click", cyclePlaybackMode);
});

if (speedOpenButton) {
  speedOpenButton.addEventListener("click", openSpeedSheet);
}

speedOptionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setPlaybackSpeed(Number(button.dataset.speedOption));
    closeSpeedSheet();
  });
});

if (speedSheet) {
  speedSheet.querySelectorAll("[data-speed-close]").forEach((button) => {
    button.addEventListener("click", closeSpeedSheet);
  });
}
document.querySelectorAll("[data-share-open]").forEach((button) => {
  button.addEventListener("click", openShareSheet);
});

shareTargetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setShareTarget(button.dataset.shareTarget);
  });
});

if (shareSheet) {
  shareSheet.querySelectorAll("[data-share-close]").forEach((button) => {
    button.addEventListener("click", closeShareSheet);
  });

  shareSheet.querySelectorAll("[data-share-action]").forEach((button) => {
    button.addEventListener("click", () => {
      handleShareAction(button.dataset.shareAction);
    });
  });
}

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
  if (playbackMode === "repeat") {
    audio.currentTime = 0;
    playSong();
    return;
  }

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

setupSeamlessVisualLoop();
updatePlaybackModeButton();
setShareTarget("link");
setPlaybackSpeed(1);
applyInitialRoute();
extractCoverColor(song.cover, applyPlayerColor);
extractCoverColor(playlist.cover, applyPlaylistColor);
setRangeProgress(0);
updateMediaSession();

