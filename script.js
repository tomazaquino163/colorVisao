
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
const temaToggle = document.getElementById("temaToggle");
const temaIcone = document.getElementById("temaIcone");
const temaTexto = document.getElementById("temaTexto");

const PLANO = [
  ...Array(4).fill("controle"),
  ...Array(7).fill("vermelho-verde"),
  ...Array(5).fill("azul-amarelo"),
  ...Array(4).fill("tons")
];

const TOTAL_QUESTOES = PLANO.length;

let questaoAtual = 0;
let numeroAtual = null;
let numerosUsados = new Set();
let perguntas = [];
let respostas = [];
let pontos = [];
let mascara = null;
let animationId = null;
let inicioQuestao = 0;

const paletas = {
  controle: {
    fundo: ["#d5b56f", "#c9a46b", "#dfc17e", "#b99a64", "#d2ad73"],
    figura: ["#496d70", "#557b78", "#3f6468", "#638582"]
  },
  "vermelho-verde": {
    fundo: ["#b6a05e", "#c0aa68", "#aa9659", "#c7b06d", "#b09b62"],
    figura: ["#a65f55", "#b16a5c", "#9b5c50", "#ad6558", "#a25e54"]
  },
  "azul-amarelo": {
    fundo: ["#c5a95d", "#d0b66c", "#b99d55", "#d7bd72", "#c0a45c"],
    figura: ["#587b93", "#63859c", "#4e718a", "#6b8ca0", "#55778e"]
  },
  tons: {
    fundo: ["#b99c72", "#c0a47a", "#ad926c", "#c6aa80", "#b29770"],
    figura: ["#8c796b", "#917e70", "#857367", "#998476", "#8a776a"]
  }
};

function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function gerarNumeroUnico() {
  let n;
  do {
    n = Math.floor(Math.random() * 98) + 1;
  } while (numerosUsados.has(n));
  numerosUsados.add(n);
  return n;
}

function criarMascara(numero) {
  const off = document.createElement("canvas");
  off.width = canvas.width;
  off.height = canvas.height;
  const mctx = off.getContext("2d");

  mctx.clearRect(0, 0, off.width, off.height);
  mctx.fillStyle = "#fff";
  mctx.textAlign = "center";
  mctx.textBaseline = "middle";

  // Números de dois dígitos precisam ser menores para manter contorno limpo.
  const tamanho = numero < 10 ? 245 : 205;
  mctx.font = `900 ${tamanho}px Arial, Helvetica, sans-serif`;
  mctx.fillText(String(numero), off.width / 2, off.height / 2 + 6);

  return mctx.getImageData(0, 0, off.width, off.height);
}

function estaNaMascara(x, y) {
  const px = Math.max(0, Math.min(canvas.width - 1, Math.round(x)));
  const py = Math.max(0, Math.min(canvas.height - 1, Math.round(y)));
  return mascara.data[(py * canvas.width + px) * 4 + 3] > 80;
}

function dentroPlaca(x, y, margem = 0) {
  return Math.hypot(x - 250, y - 250) < 230 - margem;
}

function escolherCor(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

function criarPonto(x, y, grupo, paleta, tamanhoMin, tamanhoMax) {
  pontos.push({
    baseX: x,
    baseY: y,
    grupo,
    raio: tamanhoMin + Math.random() * (tamanhoMax - tamanhoMin),
    cor: escolherCor(grupo === "figura" ? paleta.figura : paleta.fundo),
    faseX: Math.random() * Math.PI * 2,
    faseY: Math.random() * Math.PI * 2,
    velocidade: 0.00065 + Math.random() * 0.00055,
    amplitude: 0.7 + Math.random() * 1.6
  });
}

function gerarPontos(categoria) {
  pontos = [];
  const paleta = paletas[categoria];

  // Grade com jitter: cobre muito melhor a placa que pontos puramente aleatórios.
  const passo = 13;
  for (let y = 28; y < 472; y += passo) {
    for (let x = 28; x < 472; x += passo) {
      const jx = x + (Math.random() - 0.5) * 8;
      const jy = y + (Math.random() - 0.5) * 8;
      if (!dentroPlaca(jx, jy, 7)) continue;

      const grupo = estaNaMascara(jx, jy) ? "figura" : "fundo";
      criarPonto(jx, jy, grupo, paleta, 4.8, 7.2);
    }
  }

  // Reforço proposital dentro do número para deixar a silhueta contínua.
  let adicionados = 0;
  let tentativas = 0;
  while (adicionados < 430 && tentativas < 12000) {
    tentativas++;
    const x = 90 + Math.random() * 320;
    const y = 105 + Math.random() * 290;
    if (dentroPlaca(x, y, 6) && estaNaMascara(x, y)) {
      criarPonto(x, y, "figura", paleta, 3.8, 6.3);
      adicionados++;
    }
  }
}

function gerarQuestao() {
  numeroAtual = gerarNumeroUnico();
  const categoria = perguntas[questaoAtual].categoria;
  mascara = criarMascara(numeroAtual);
  gerarPontos(categoria);
  perguntas[questaoAtual].numero = numeroAtual;
  inicioQuestao = performance.now();
}

function desenharPlacaAnimada(tempo) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.beginPath();
  ctx.arc(250, 250, 239, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = "#d4b879";
  ctx.fillRect(0, 0, 500, 500);

  for (const p of pontos) {
    let dx = Math.sin(tempo * p.velocidade + p.faseX) * p.amplitude;
    let dy = Math.cos(tempo * (p.velocidade * 0.91) + p.faseY) * p.amplitude;

    // O movimento é pequeno para preservar a máscara.
    let x = p.baseX + dx;
    let y = p.baseY + dy;

    // Se o movimento atravessar a fronteira do número, mantém a posição base.
    if (estaNaMascara(x, y) !== (p.grupo === "figura")) {
      x = p.baseX;
      y = p.baseY;
    }

    ctx.beginPath();
    ctx.arc(x, y, p.raio, 0, Math.PI * 2);
    ctx.fillStyle = p.cor;
    ctx.fill();

    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  ctx.beginPath();
  ctx.arc(250, 250, 239, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,.25)";
  ctx.lineWidth = 4;
  ctx.stroke();

  animationId = requestAnimationFrame(desenharPlacaAnimada);
}

function iniciarTeste() {
  if (animationId) cancelAnimationFrame(animationId);

  questaoAtual = 0;
  numerosUsados = new Set();
  respostas = [];
  perguntas = embaralhar(PLANO).map(categoria => ({ categoria, numero: null }));

  resultado.classList.add("oculto");
  areaResposta.classList.remove("oculto");
  respostaInput.value = "";

  instrucao.textContent =
    "Observe a placa animada e informe o número que você consegue identificar.";
  atualizarProgresso();
  gerarQuestao();

  animationId = requestAnimationFrame(desenharPlacaAnimada);
  const secaoTeste = document.getElementById("teste");

  // Mantém o título "Teste educativo de percepção de cores" visível.
  // O deslocamento considera o cabeçalho fixo e deixa uma margem confortável.
  const topoDesejado =
    secaoTeste.getBoundingClientRect().top + window.scrollY - 28;

  window.scrollTo({
    top: Math.max(0, topoDesejado),
    behavior: "smooth"
  });

  setTimeout(() => respostaInput.focus({ preventScroll: true }), 650);
}

function atualizarProgresso() {
  numeroQuestao.textContent = `${questaoAtual + 1} / ${TOTAL_QUESTOES}`;
  barraProgresso.style.width = `${((questaoAtual + 1) / TOTAL_QUESTOES) * 100}%`;
}

function registrarResposta(valor) {
  if (!perguntas.length || questaoAtual >= perguntas.length) return;

  const respostaNum = valor === null || valor === "" ? null : Number(valor);
  const q = perguntas[questaoAtual];

  respostas.push({
    categoria: q.categoria,
    esperado: q.numero,
    informado: respostaNum,
    correto: respostaNum === q.numero,
    tempoMs: Math.round(performance.now() - inicioQuestao)
  });

  if (questaoAtual < TOTAL_QUESTOES - 1) {
    questaoAtual++;
    respostaInput.value = "";
    atualizarProgresso();
    gerarQuestao();
    respostaInput.focus();
  } else {
    finalizarTeste();
  }
}

function resumoCategoria(categoria) {
  const itens = respostas.filter(r => r.categoria === categoria);
  return {
    total: itens.length,
    acertos: itens.filter(r => r.correto).length
  };
}

function tempoMedioCategoria(categoria) {
  const itens = respostas.filter(r => r.categoria === categoria);
  if (!itens.length) return 0;
  return itens.reduce((soma, r) => soma + r.tempoMs, 0) / itens.length / 1000;
}

function linhaResultado(titulo, categoria) {
  const r = resumoCategoria(categoria);
  const pct = r.total ? Math.round((r.acertos / r.total) * 100) : 0;
  const tempo = tempoMedioCategoria(categoria).toFixed(1).replace(".", ",");

  return `
    <div class="resultado-grupo">
      <div class="resultado-grupo-topo">
        <strong>${titulo}</strong>
        <span>${r.acertos}/${r.total} • ${pct}%</span>
      </div>
      <div class="resultado-barra">
        <div class="resultado-barra-preenchimento" style="width:${pct}%"></div>
      </div>
      <small>Tempo médio de resposta: ${tempo} s</small>
    </div>
  `;
}

function percentualCategoria(categoria) {
  const r = resumoCategoria(categoria);
  return r.total ? (r.acertos / r.total) * 100 : 0;
}

function gerarConclusao() {
  const controle = percentualCategoria("controle");
  const vermelhoVerde = percentualCategoria("vermelho-verde");
  const azulAmarelo = percentualCategoria("azul-amarelo");
  const tons = percentualCategoria("tons");

  // Se até as placas de controle apresentarem dificuldade,
  // evitamos interpretar o resultado cromático.
  if (controle < 75) {
    return {
      classe: "status-inconclusivo",
      icone: "?",
      titulo: "Resultado inconclusivo",
      texto:
        "Houve dificuldade também nas placas de controle. Recomendamos repetir o teste verificando brilho, iluminação, filtros de cor da tela e se as instruções foram compreendidas."
    };
  }

  const grupos = [
    { nome: "vermelho-verde", valor: vermelhoVerde },
    { nome: "azul-amarelo", valor: azulAmarelo },
    { nome: "distinção de tonalidades", valor: tons }
  ];

  const mediaCromatica =
    (vermelhoVerde * 7 + azulAmarelo * 5 + tons * 4) / 16;

  const pior = [...grupos].sort((a, b) => a.valor - b.valor)[0];

  if (mediaCromatica >= 80 && pior.valor >= 67) {
    return {
      classe: "status-verde",
      icone: "✓",
      titulo: "Percepção de cores dentro do esperado",
      texto:
        "Seu desempenho foi alto nas combinações avaliadas e não houve dificuldade relevante nos grupos apresentados."
    };
  }

  if (mediaCromatica >= 55) {
    return {
      classe: "status-amarelo",
      icone: "!",
      titulo: "Possível dificuldade na percepção de cores",
      texto:
        `Foram observadas algumas dificuldades, principalmente no grupo ${pior.nome}. Vale repetir o teste em boas condições de tela e iluminação.`
    };
  }

  let detalhe;
  if (vermelhoVerde < 55 && azulAmarelo < 55) {
    detalhe = "As dificuldades apareceram em diferentes grupos de cores.";
  } else if (vermelhoVerde <= azulAmarelo && vermelhoVerde <= tons) {
    detalhe = "A maior dificuldade foi observada no grupo vermelho-verde.";
  } else if (azulAmarelo <= vermelhoVerde && azulAmarelo <= tons) {
    detalhe = "A maior dificuldade foi observada no grupo azul-amarelo.";
  } else {
    detalhe = "A maior dificuldade foi observada na distinção de tonalidades.";
  }

  return {
    classe: "status-vermelho",
    icone: "!",
    titulo: "Dificuldade significativa na percepção de cores",
    texto:
      `${detalhe} Este resultado não confirma daltonismo, mas uma dificuldade semelhante no cotidiano pode justificar avaliação por um profissional da visão.`
  };
}

function explicacaoMaiorDificuldade() {
  const grupos = [
    { categoria: "vermelho-verde", nome: "Vermelho-verde", valor: percentualCategoria("vermelho-verde") },
    { categoria: "azul-amarelo", nome: "Azul-amarelo", valor: percentualCategoria("azul-amarelo") },
    { categoria: "tons", nome: "Tonalidades", valor: percentualCategoria("tons") }
  ];

  const pior = grupos.sort((a, b) => a.valor - b.valor)[0];

  const textos = {
    "vermelho-verde":
      "Este grupo utiliza combinações destinadas a explorar diferenças de percepção entre tons próximos das famílias vermelho-verde. Dificuldades aqui não determinam um tipo específico de daltonismo.",
    "azul-amarelo":
      "Este grupo explora combinações relacionadas à distinção entre tons das famílias azul-amarelo. Alterações nesse eixo são menos comuns e um teste digital não fornece diagnóstico.",
    "tons":
      "Este grupo avalia a capacidade de separar tonalidades próximas. Brilho, contraste e qualidade da tela podem influenciar bastante esse resultado."
  };

  return `
    <div class="explicacao-resultado">
      <span>ANÁLISE DO TESTE</span>
      <h4>Grupo com maior dificuldade: ${pior.nome}</h4>
      <p>${textos[pior.categoria]}</p>
    </div>
  `;
}

function formatarTempoTotal(ms) {
  const totalSegundos = Math.round(ms / 1000);
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;

  if (minutos === 0) {
    return `${segundos} s`;
  }

  return `${minutos} min ${String(segundos).padStart(2, "0")} s`;
}

function finalizarTeste() {
  if (animationId) cancelAnimationFrame(animationId);
  animationId = null;

  areaResposta.classList.add("oculto");
  resultado.classList.remove("oculto");
  numeroQuestao.textContent = `${TOTAL_QUESTOES} / ${TOTAL_QUESTOES}`;
  barraProgresso.style.width = "100%";

  const conclusao = gerarConclusao();

  resultado.innerHTML = `
    <h3>Resultado educativo</h3>
    ${linhaResultado("Placas de controle", "controle")}
    ${linhaResultado("Grupo vermelho-verde", "vermelho-verde")}
    ${linhaResultado("Grupo azul-amarelo", "azul-amarelo")}
    ${linhaResultado("Distinção de tonalidades", "tons")}

    <div class="tempo-geral">
      ⏱️ <strong>Tempo médio geral:</strong>
      ${(respostas.reduce((soma, r) => soma + r.tempoMs, 0) / respostas.length / 1000).toFixed(1).replace(".", ",")} s por placa
      <br>
      ⏳ <strong>Tempo total do teste:</strong>
      ${formatarTempoTotal(respostas.reduce((soma, r) => soma + r.tempoMs, 0))}
    </div>

    ${explicacaoMaiorDificuldade()}

    <p>
      O desempenho mostra apenas como você respondeu às combinações de cores
      utilizadas nesta experiência digital.
    </p>
    <p>
      <strong>Este projeto não realiza diagnóstico de daltonismo.</strong>
      Tela, brilho, iluminação, filtros de cor e características do dispositivo
      podem alterar o resultado. Dificuldades percebidas no cotidiano devem ser
      avaliadas por um profissional da visão.
    </p>

    <div class="card-conclusao ${conclusao.classe}">
      <div class="status-topo">
        <div class="status-icone">${conclusao.icone}</div>
        <h4>${conclusao.titulo}</h4>
      </div>
      <p>${conclusao.texto}</p>
    </div>

    <button class="btn principal btn-proximo" id="btnReiniciar" style="margin-top:22px;">
      👤 Iniciar teste para um novo participante
    </button>
    <p class="novo-participante-aviso">
      Uma nova sequência de placas e números será gerada automaticamente.
    </p>
  `;

  document.getElementById("btnReiniciar").addEventListener("click", iniciarTeste);
}

btnComecar.addEventListener("click", iniciarTeste);

btnResponder.addEventListener("click", () => {
  const valor = respostaInput.value.trim();
  if (valor !== "") registrarResposta(valor);
});

btnNaoVejo.addEventListener("click", () => registrarResposta(null));

respostaInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    const valor = respostaInput.value.trim();
    if (valor !== "") registrarResposta(valor);
  }
});


// TEMA CLARO / ESCURO
function aplicarTema(tema) {
  const claro = tema === "claro";
  document.body.classList.toggle("tema-claro", claro);

  temaIcone.textContent = claro ? "🌙" : "☀️";
  temaTexto.textContent = claro ? "Modo escuro" : "Modo claro";
  temaToggle.setAttribute("aria-pressed", claro ? "true" : "false");

  localStorage.setItem("colorvisao-tema", tema);
}

const temaSalvo = localStorage.getItem("colorvisao-tema") || "escuro";
aplicarTema(temaSalvo);

temaToggle.addEventListener("click", () => {
  const estaClaro = document.body.classList.contains("tema-claro");
  aplicarTema(estaClaro ? "escuro" : "claro");
});

// Estado inicial.
ctx.fillStyle = "#d4b879";
ctx.beginPath();
ctx.arc(250, 250, 238, 0, Math.PI * 2);
ctx.fill();

ctx.fillStyle = "rgba(255,255,255,.65)";
ctx.font = "700 27px Arial";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillText("ColorVisão", 250, 250);
