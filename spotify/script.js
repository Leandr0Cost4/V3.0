// Dados da playlist
const playlist = [
    { titulo: "Mulher Feita", arquivo: "musicas/musica1.mp3", capa: "capas/musica1.jpg", artista: "PROJOTA" },
    { titulo: "Baixinha", arquivo: "musicas/musica2.mp3", capa: "capas/musica2.jpg", artista: "CHININHA & L7NNON " },
    { titulo: "Ela só quer Paz", arquivo: "musicas/musica3.mp3", capa: "capas/musica3.jpg", artista: "PROJOTA" },
    { titulo: "Minha Vida", arquivo: "musicas/musica4.mp3", capa: "capas/musica4.jpg", artista: "Italo Melo ft. Junior Lord" },
    { titulo: "Amor Livre", arquivo: "musicas/musica5.mp3", capa: "capas/musica5.jpg", artista: "Filipe Ret" },
    { titulo: "Cópia Proibida", arquivo: "musicas/musica6.mp3", capa: "capas/musica6.jpg", artista: "Léo Foguete" }
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

    // Atualiza áudio, capa e textos
    audio.src = music.arquivo;
    capa.src = music.capa;
    titulo.textContent = music.titulo;
    artista.textContent = music.artista;
    audio.load();

    // Atualiza fundo com gradiente baseado na capa
    updateBackgroundColor();

    // === Media Session API para tela de bloqueio e player do iPhone ===
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: music.titulo,
            artist: music.artista,
            album: '', // opcional
            artwork: [
                { src: music.capa, sizes: '512x512', type: 'image/jpeg' }
            ]
        });

        navigator.mediaSession.setActionHandler('play', () => {
            audio.play();
            playBtn.classList.add('playing');
        });
        navigator.mediaSession.setActionHandler('pause', () => {
            audio.pause();
            playBtn.classList.remove('playing');
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
            prevMusic();
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
            nextMusic();
        });
    }
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

// Lógica de final de música corrigida
audio.addEventListener("ended", () => {
    if (playerState.repeatMode === "one") {
        // Se o modo de repetição de uma música estiver ativado, reinicie a música
        audio.currentTime = 0;
        audio.play();
    } else {
        // Caso contrário, avance para a próxima música.
        // A função `nextMusic()` já lida com o modo aleatório
        // e a repetição de toda a playlist.
        nextMusic();
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

// Lógica para o botão de aleatório (agora mutuamente exclusivo)
shuffleBtn.addEventListener("click", () => {
    playerState.isShuffling = !playerState.isShuffling;

    if (playerState.isShuffling) {
        // Se o modo aleatório for ativado, desative o modo de repetição
        playerState.repeatMode = "none";
        repeatBtn.classList.remove("active");
        repeatBtn.classList.remove("pulse");
        shuffleBtn.classList.add("active");
        shuffleBtn.classList.add("pulse");
    } else {
        shuffleBtn.classList.remove("active");
        shuffleBtn.classList.remove("pulse");
    }
});

// Lógica para o botão de repetição (agora mutuamente exclusivo)
repeatBtn.addEventListener("click", () => {
    // Muda o modo de repetição: nenhum -> um -> todos -> nenhum
    if (playerState.repeatMode === "none") {
        playerState.repeatMode = "one";
    } else if (playerState.repeatMode === "one") {
        playerState.repeatMode = "all";
    } else {
        playerState.repeatMode = "none";
    }

    // Atualiza a aparência do botão de repetição
    if (playerState.repeatMode !== "none") {
        repeatBtn.classList.add("active");
        repeatBtn.classList.add("pulse");
        // Se o modo de repetição for ativado, desative o modo aleatório
        playerState.isShuffling = false;
        shuffleBtn.classList.remove("active");
        shuffleBtn.classList.remove("pulse");
    } else {
        repeatBtn.classList.remove("active");
        repeatBtn.classList.remove("pulse");
    }
});

// Inicialização
loadMusic();
