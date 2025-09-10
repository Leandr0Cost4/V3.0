const opcoes = [
  {titulo:"Você é maravilhosa 😍", info:"Envie uma mensagem ou emoji mostrando o quanto você me acha especial!"},
  {titulo:"Abraço virtual 🤗", info:"Envie um abraço virtual ou gif fofo para mim."},
  {titulo:"Me conte um segredo 💌", info:"Compartilhe algo divertido ou curioso comigo."},
  {titulo:"Sorriso contagiante 😄", info:"Envie um sorriso em foto, gif ou emoji."},
  {titulo:"Escolha meu próximo desafio 😏", info:"Decida algo divertido que eu devo fazer."},
  {titulo:"Mensagem surpresa 💌", info:"Receba uma mensagem carinhosa inesperada."},
  {titulo:"Momento música 🎵", info:"Envie uma música que te faz lembrar de mim ou peça que eu envie uma."},
  {titulo:"Diga algo fofo para mim 😘", info:"Uma pequena provocação romântica e divertida."},
  {titulo:"Gif fofo 🐶", info:"Envie um gif engraçado ou fofo entre nós."},
  {titulo:"Piada só para você 😂", info:"Conte uma piada só para mim rir."},
  {titulo:"Desafio emoji 🎭", info:"Envie um emoji que represente como se sente agora."},
  {titulo:"Momento sinceridade 🥰", info:"Responda uma pergunta leve para nos conhecermos melhor."}
];

const canvas = document.getElementById('roleta');
const ctx = canvas.getContext('2d');
const raio = canvas.width / 2;
let anguloAtual = 0;

const resultadoContainer = document.getElementById('resultado-container');
const resultadoTitulo = document.getElementById('resultado-titulo');
const resultadoInfo = document.getElementById('resultado-info');

const botaoGirar = document.getElementById('girar');

const somRoleta = document.getElementById('som-roleta');
const somFim = document.getElementById('som-fim');

// Desenhar roleta
function desenharRoleta() {
    const fatias = opcoes.length;
    const anguloFatia = (2 * Math.PI) / fatias;

    for (let i = 0; i < fatias; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'darkred' : 'red';
        ctx.beginPath();
        ctx.moveTo(raio, raio);
        ctx.arc(raio, raio, raio, i * anguloFatia, (i + 1) * anguloFatia);
        ctx.closePath();
        ctx.fill();

        ctx.save();
        ctx.translate(raio, raio);
        ctx.rotate(i * anguloFatia + anguloFatia / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#fff";
        ctx.font = "14px Arial";
        ctx.fillText(opcoes[i].titulo, raio - 10, 5);
        ctx.restore();
    }
}

desenharRoleta();

// Neon pulsante
function neonPulse() {
    const intensity = 10 + Math.sin(Date.now() / 100) * 5;
    canvas.style.boxShadow = `0 0 ${intensity}px 3px #ff0000, 0 0 ${intensity*2}px 6px #ff0000 inset`;
    requestAnimationFrame(neonPulse);
}
neonPulse();

// Girar roleta
botaoGirar.addEventListener('click', () => {
    botaoGirar.disabled = true;
    resultadoContainer.style.display = 'none';

    const girarGraus = Math.floor(Math.random() * 3600) + 720;
    const girarRad = girarGraus * Math.PI / 180;
    let inicio = null;
    const duracao = 4000;
    const anguloInicial = anguloAtual;

    // Inicia som da roleta
    somRoleta.currentTime = 0;
    somRoleta.volume = 1;
    somRoleta.play();

    function animar(timestamp) {
        if (!inicio) inicio = timestamp;
        const progresso = timestamp - inicio;
        const t = Math.min(progresso / duracao, 1);
        const easeOut = 1 - Math.pow(1 - t, 3);
        anguloAtual = anguloInicial + girarRad * easeOut;

        // Diminuir volume progressivamente
        somRoleta.volume = 1 - easeOut;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(raio, raio);
        ctx.rotate(anguloAtual);
        ctx.translate(-raio, -raio);
        desenharRoleta();
        ctx.restore();

        if (t < 1) {
            requestAnimationFrame(animar);
        } else {
            somRoleta.pause();
            somRoleta.currentTime = 0;

            const fatias = opcoes.length;
            const anguloFatia = (2 * Math.PI) / fatias;
            let anguloTopo = (3 * Math.PI / 2 - anguloAtual) % (2 * Math.PI);
            if (anguloTopo < 0) anguloTopo += 2 * Math.PI;
            const indice = Math.floor(anguloTopo / anguloFatia);

            // Mostra container após 1s e toca som final
            setTimeout(() => {
                resultadoTitulo.textContent = opcoes[indice].titulo;
                resultadoInfo.textContent = opcoes[indice].info;
                resultadoContainer.style.display = 'flex';

                somFim.currentTime = 0;
                somFim.play();

                // Reabilita botão 0,5s depois
                setTimeout(() => {
                    botaoGirar.disabled = false;
                }, 500);

            }, 1000);
        }
    }

    requestAnimationFrame(animar);
});
