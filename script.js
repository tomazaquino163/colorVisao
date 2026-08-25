const canvas = document.getElementById("placa");
const ctx = canvas.getContext("2d");

const btnComecar = document.getElementById("btnComecar");
const btnResponder = document.getElementById("btnResponder");
const btnNaoVejo = document.getElementById("btnNaoVejo");
const respostaInput = document.getElementById("resposta");
const areaResposta = document.getElementById("areaResposta");
const resultado = document.getElementById("resultado");
const numeroQuestao = document.getElementById("numeroQuestao");
const barraProgresso = document.getElementById("barraProgresso");
const instrucao = document.getElementById("instrucao");

const TOTAL_QUESTOES = 5;

let questaoAtual = 0;
let acertos = 0;
let respostaCorreta = null;

const paletas = [
  {
    fundo: ["#d9a86c", "#c7b46d", "#b99566", "#d2bd80", "#a9a66c"],
    figura: ["#7e9560", "#889a61", "#78905b", "#91a46a"]
  },
  {
    fundo: ["#d7b17d", "#c69b6a", "#b68b61", "#e0bd89", "#c5a56f"],
    figura: ["#81935d", "#738b57", "#8b9c62", "#76905c"]
  },
  {
    fundo: ["#d5b976", "#c89f69", "#b98d65", "#dab283", "#caa970"],
    figura: ["#7c8f5e", "#849966", "#6f8659", "#90a16c"]
  }
];

function numeroAleatorio(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function corAleatoria(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

function dentroDoCirculo(x, y, cx, cy, raio) {
  return Math.hypot(x - cx, y - cy) <= raio;
}

function gerarMascaraNumero(numero) {
  const mascara = document.createElement("canvas");
  mascara.width = canvas.width;
  mascara.height = canvas.height;

  const mctx = mascara.getContext("2d");

  mctx.clearRect(0, 0, mascara.width, mascara.height);
  mctx.fillStyle = "#ffffff";
  mctx.textAlign = "center";
  mctx.textBaseline = "middle";
  mctx.font = "900 250px Arial, sans-serif";
  mctx.fillText(String(numero), mascara.width / 2, mascara.height / 2 + 8);

  return mctx.getImageData(0, 0, mascara.width, mascara.height);
}

function pontoEstaNaFigura(mascara, x, y) {
  const px = Math.max(0, Math.min(canvas.width - 1, Math.round(x)));
  const py = Math.max(0, Math.min(canvas.height - 1, Math.round(y)));
  const indice = (py * canvas.width + px) * 4 + 3;
  return mascara.data[indice] > 60;
}

function gerarPlaca() {
  const paleta = paletas[Math.floor(Math.random() * paletas.length)];

  respostaCorreta = numeroAleatorio(2, 9);
  const mascara = gerarMascaraNumero(respostaCorreta);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.beginPath();
  ctx.arc(250, 250, 238, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = "#d8bd83";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let criados = 0;
  let tentativas = 0;
  const maxPontos = 560;

  while (criados < maxPontos && tentativas < 5000) {
    tentativas++;

    const raio = numeroAleatorio(5, 13);
    const x = numeroAleatorio(18, canvas.width - 18);
    const y = numeroAleatorio(18, canvas.height - 18);

    if (!dentroDoCirculo(x, y, 250, 250, 228 - raio)) {
      continue;
    }

    const pertence = pontoEstaNaFigura(mascara, x, y);

    ctx.beginPath();
    ctx.arc(x, y, raio, 0, Math.PI * 2);
    ctx.fillStyle = pertence ? corAleatoria(paleta.figura) : corAleatoria(paleta.fundo);
    ctx.fill();

    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;

    criados++;
  }

  ctx.restore();

  ctx.beginPath();
  ctx.arc(250, 250, 239, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,.18)";
  ctx.lineWidth = 4;
  ctx.stroke();
}

function iniciarTeste() {
  questaoAtual = 1;
  acertos = 0;

  resultado.classList.add("oculto");
  areaResposta.classList.remove("oculto");

  atualizarProgresso();
  gerarPlaca();

  respostaInput.value = "";
  respostaInput.focus();

  instrucao.textContent =
    "Observe a placa e informe o número que você consegue identificar.";

  document.getElementById("teste").scrollIntoView({ behavior: "smooth" });
}

function atualizarProgresso() {
  numeroQuestao.textContent = `${questaoAtual} / ${TOTAL_QUESTOES}`;
  barraProgresso.style.width = `${(questaoAtual / TOTAL_QUESTOES) * 100}%`;
}

function registrarResposta(valor) {
  if (questaoAtual === 0) return;

  if (Number(valor) === respostaCorreta) {
    acertos++;
  }

  if (questaoAtual < TOTAL_QUESTOES) {
    questaoAtual++;
    atualizarProgresso();
    gerarPlaca();
    respostaInput.value = "";
    respostaInput.focus();
  } else {
    finalizarTeste();
  }
}

function finalizarTeste() {
  areaResposta.classList.add("oculto");
  resultado.classList.remove("oculto");

  numeroQuestao.textContent = `${TOTAL_QUESTOES} / ${TOTAL_QUESTOES}`;
  barraProgresso.style.width = "100%";

  const percentual = Math.round((acertos / TOTAL_QUESTOES) * 100);

  let mensagem = "";

  if (acertos === TOTAL_QUESTOES) {
    mensagem =
      "Você identificou todas as placas desta demonstração.";
  } else if (acertos >= 3) {
    mensagem =
      "Você identificou a maior parte das placas, mas apresentou dificuldade em algumas combinações.";
  } else {
    mensagem =
      "Você apresentou dificuldade em várias placas desta demonstração.";
  }

  resultado.innerHTML = `
    <h3>Resultado da demonstração</h3>
    <p><strong>${acertos} de ${TOTAL_QUESTOES}</strong> respostas identificadas corretamente (${percentual}%).</p>
    <p>${mensagem}</p>
    <p>
      <strong>Este resultado não é diagnóstico.</strong>
      A percepção pode ser influenciada pela tela, brilho, iluminação e outros fatores.
    </p>
    <button class="btn principal" id="btnReiniciar">Fazer novamente</button>
  `;

  document
    .getElementById("btnReiniciar")
    .addEventListener("click", iniciarTeste);
}

btnComecar.addEventListener("click", iniciarTeste);

btnResponder.addEventListener("click", () => {
  if (respostaInput.value.trim() === "") return;
  registrarResposta(respostaInput.value);
});

btnNaoVejo.addEventListener("click", () => {
  registrarResposta(null);
});

respostaInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && respostaInput.value.trim() !== "") {
    registrarResposta(respostaInput.value);
  }
});

// Desenho inicial
ctx.fillStyle = "#d8bd83";
ctx.beginPath();
ctx.arc(250, 250, 238, 0, Math.PI * 2);
ctx.fill();

ctx.fillStyle = "rgba(255,255,255,.55)";
ctx.font = "700 26px Arial";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillText("ColorVisão", 250, 250);
