const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");

// Elementos da interface
const score1El = document.getElementById("score1");
const score2El = document.getElementById("score2");
const deuceIndicator = document.getElementById("deuce-indicator");
const overlay = document.getElementById("overlay");
const resultMessage = document.getElementById("result-message");
const resultImage = document.getElementById("result-image");
const resultSubtext = document.getElementById("result-subtext");

// Imagens customizadas para vitória/derrota
// Substitua pelas URLs ou caminhos das suas imagens no VS Code (ex: "imagens/vitoria.png")
const IMAGEM_VITORIA = "https://via.placeholder.com/200/00ff00/000000?text=Vitoria!";
const IMAGEM_DERROTA = "https://via.placeholder.com/200/ff0000/ffffff?text=Derrota!";

// Estado das Teclas
const keys = {};

// Propriedades dos Jogadores
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 80;
const PADDLE_SPEED = 6;

const player1 = { x: 10, y: canvas.height / 2 - PADDLE_HEIGHT / 2, score: 0 };
const player2 = { x: canvas.width - 10 - PADDLE_WIDTH, y: canvas.height / 2 - PADDLE_HEIGHT / 2, score: 0 };

// Regra "Vai a Dois" (Mata-Mata)
let isDeuceMode = false;
let deuceScore1 = 0;
let deuceScore2 = 0;

// Propriedades da Bola
const ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 8,
  speedX: 5,
  speedY: 5
};

let gameOver = false;

// Event Listeners de Teclado
window.addEventListener("keydown", (e) => { keys[e.key] = true; });
window.addEventListener("keyup", (e) => { keys[e.key] = false; });

function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.speedX = (Math.random() > 0.5 ? 1 : -1) * 5;
  ball.speedY = (Math.random() > 0.5 ? 1 : -1) * 3;
}

function updatePaddles() {
  // Controles Jogador 1 (W / S)
  if ((keys["w"] || keys["W"]) && player1.y > 0) {
    player1.y -= PADDLE_SPEED;
  }
  if ((keys["s"] || keys["S"]) && player1.y < canvas.height - PADDLE_HEIGHT) {
    player1.y += PADDLE_SPEED;
  }

  // Controles Jogador 2 (Setas Cima / Baixo)
  if (keys["ArrowUp"] && player2.y > 0) {
    player2.y -= PADDLE_SPEED;
  }
  if (keys["ArrowDown"] && player2.y < canvas.height - PADDLE_HEIGHT) {
    player2.y += PADDLE_SPEED;
  }
}

function updateBall() {
  if (gameOver) return;

  ball.x += ball.speedX;
  ball.y += ball.speedY;

  // Colisão superior e inferior
  if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= canvas.height) {
    ball.speedY = -ball.speedY;
  }

  // Colisão com Jogador 1
  if (
    ball.x - ball.radius <= player1.x + PADDLE_WIDTH &&
    ball.y >= player1.y &&
    ball.y <= player1.y + PADDLE_HEIGHT
  ) {
    ball.speedX = Math.abs(ball.speedX) * 1.05;
  }

  // Colisão com Jogador 2
  if (
    ball.x + ball.radius >= player2.x &&
    ball.y >= player2.y &&
    ball.y <= player2.y + PADDLE_HEIGHT
  ) {
    ball.speedX = -Math.abs(ball.speedX) * 1.05;
  }

  // Ponto para Jogador 2
  if (ball.x < 0) {
    registrarPonto(2);
  }

  // Ponto para Jogador 1
  if (ball.x > canvas.width) {
    registrarPonto(1);
  }
}

function registrarPonto(jogador) {
  if (isDeuceMode) {
    if (jogador === 1) deuceScore1++;
    if (jogador === 2) deuceScore2++;

    // Regra do "Vai a Dois" (Até 2x0 no desempate)
    if (deuceScore1 === 2 && deuceScore2 === 0) {
      finalizarJogo("Jogador 1 Venceu o Vai a Dois!", IMAGEM_VITORIA, "Venceu por 2 a 0 no desempate!");
      return;
    }
    if (deuceScore2 === 2 && deuceScore1 === 0) {
      finalizarJogo("Jogador 2 Venceu o Vai a Dois!", IMAGEM_VITORIA, "Venceu por 2 a 0 no desempate!");
      return;
    }
    // Se der 1 a 1 no desempate, reinicia a contagem para 0 a 0
    if (deuceScore1 === 1 && deuceScore2 === 1) {
      deuceScore1 = 0;
      deuceScore2 = 0;
    }
  } else {
    if (jogador === 1) player1.score++;
    if (jogador === 2) player2.score++;

    verificarCondicoesVitoria();
  }

  atualizarPlacarUI();
  resetBall();
}

function verificarCondicoesVitoria() {
  const p1 = player1.score;
  const p2 = player2.score;

  // Regra 1: 3 a 0 (Vitória direta)
  if (p1 === 3 && p2 === 0) {
    finalizarJogo("Jogador 1 Venceu!", IMAGEM_VITORIA, "Vitória por 3 a 0!");
    return;
  }
  if (p2 === 3 && p1 === 0) {
    finalizarJogo("Jogador 2 Venceu!", IMAGEM_VITORIA, "Vitória por 3 a 0!");
    return;
  }

  // Regra 2: 4 a 4 ("Vai a Dois")
  if (p1 === 4 && p2 === 4) {
    isDeuceMode = true;
    deuceScore1 = 0;
    deuceScore2 = 0;
    deuceIndicator.innerText = "VAI A DOIS! (Faça 2x0 para vencer)";
    return;
  }

  // Regra 3: Vitória por 5 ou mais pontos com pelo menos 1 ponto de vantagem (ex: 5x1, 5x2, 6x1...)
  if (p1 >= 5 && p1 - p2 >= 1) {
    finalizarJogo("Jogador 1 Venceu!", IMAGEM_VITORIA, `Vitória com placar de ${p1} a ${p2}!`);
    return;
  }
  if (p2 >= 5 && p2 - p1 >= 1) {
    finalizarJogo("Jogador 2 Venceu!", IMAGEM_VITORIA, `Vitória com placar de ${p2} a ${p1}!`);
    return;
  }
}

function atualizarPlacarUI() {
  if (isDeuceMode) {
    score1El.innerText = `4 (+${deuceScore1})`;
    score2El.innerText = `4 (+${deuceScore2})`;
  } else {
    score1El.innerText = player1.score;
    score2El.innerText = player2.score;
  }
}

function finalizarJogo(mensagem, imagemUrl, subtexto) {
  gameOver = true;
  resultMessage.innerText = mensagem;
  resultImage.src = imagemUrl;
  resultSubtext.innerText = subtexto;
  overlay.classList.remove("hidden");
}

function reiniciarJogo() {
  player1.score = 0;
  player2.score = 0;
  deuceScore1 = 0;
  deuceScore2 = 0;
  isDeuceMode = false;
  gameOver = false;

  deuceIndicator.innerText = "";
  atualizarPlacarUI();
  overlay.classList.add("hidden");
  resetBall();
}

function draw() {
  // Limpa a tela
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Linha central
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.strokeStyle = "#fff";
  ctx.stroke();
  ctx.setLineDash([]);

  // Desenha Jogador 1
  ctx.fillStyle = "#fff";
  ctx.fillRect(player1.x, player1.y, PADDLE_WIDTH, PADDLE_HEIGHT);

  // Desenha Jogador 2
  ctx.fillRect(player2.x, player2.y, PADDLE_WIDTH, PADDLE_HEIGHT);

  // Desenha Bola
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = "#ffcc00";
  ctx.fill();
  ctx.closePath();
}

function gameLoop() {
  updatePaddles();
  updateBall();
  draw();
  requestAnimationFrame(gameLoop);
}

// Iniciar o Jogo
gameLoop();