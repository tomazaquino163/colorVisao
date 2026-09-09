
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
  ...Array(8).fill("vermelho-verde"),
  ...Array(4).fill("azul-amarelo"),
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
  controle: [
    {
      fundo: ["#d6b66f", "#c9a66c", "#dfc27d", "#bea06a", "#d1ad72"],
      figura: ["#416f73", "#4b7979", "#38676d", "#5a8380"],
      base: "#c9aa70"
    }
  ],

  // Paletas experimentais pseudoisocromáticas:
  // figura e fundo têm luminância visual aproximada para reduzir pistas de brilho.
  "vermelho-verde": [
    {
      fundo: ["#788f63", "#82976c", "#70875d", "#879c70", "#758c61"],
      figura: ["#a66f67", "#ad756c", "#9d6962", "#b07970", "#a36d66"],
      base: "#7d9068"
    },
    {
      fundo: ["#82906a", "#778861", "#8b9871", "#73835e", "#85936c"],
      figura: ["#a87368", "#9f6b62", "#b07a6d", "#a26e65", "#aa7569"],
      base: "#81906a"
    },
    {
      fundo: ["#6f8660", "#7b8f68", "#748961", "#82966e", "#6b825c"],
      figura: ["#9e6c65", "#a8736a", "#95645f", "#ac786e", "#a06d66"],
      base: "#778a64"
    },
    {
      fundo: ["#87936f", "#7c8b67", "#909a77", "#748461", "#83906b"],
      figura: ["#aa766d", "#a16e67", "#b17d72", "#99665f", "#a87369"],
      base: "#84906d"
    }
  ],

  "azul-amarelo": [
    {
      fundo: ["#b9a76d", "#c0ad73", "#b19f68", "#c5b277", "#b6a36a"],
      figura: ["#73899a", "#7c91a0", "#6b8194", "#8498a5", "#718797"],
      base: "#b5a46d"
    },
    {
      fundo: ["#b4a16a", "#bdab72", "#aa9864", "#c1ae75", "#b09e68"],
      figura: ["#6f8495", "#788d9d", "#657c90", "#8094a3", "#6c8293"],
      base: "#b19f69"
    }
  ],

  tons: [
    {
      fundo: ["#b49c82", "#baa288", "#ad957c", "#c0a78c", "#b09880"],
      figura: ["#9f8978", "#a58e7d", "#978274", "#aa9381", "#9b8576"],
      base: "#af9780"
    }
  ]
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

function escolherPaleta(categoria) {
  const variantes = paletas[categoria];
  return variantes[Math.floor(Math.random() * variantes.length)];
}

// Aproxima a luminância relativa para evitar que o número seja revelado
// apenas por diferença de brilho/contraste.
function luminanciaHex(hex) {
  const rgb = hex.replace("#", "").match(/.{2}/g).map(v => parseInt(v, 16) / 255);
  const linear = rgb.map(c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
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
  const paleta = escolherPaleta(categoria);

  // Grade mais fechada para impedir que a cor de base revele o desenho.
  // Figura e fundo recebem a MESMA densidade de pontos.
  const passo = categoria === "controle" ? 12 : 10.5;

  for (let y = 24; y < 476; y += passo) {
    for (let x = 24; x < 476; x += passo) {
      const jitter = passo * 0.68;
      const jx = x + (Math.random() - 0.5) * jitter;
      const jy = y + (Math.random() - 0.5) * jitter;
      if (!dentroPlaca(jx, jy, 5)) continue;

      const grupo = estaNaMascara(jx, jy) ? "figura" : "fundo";
      criarPonto(
        jx, jy, grupo, paleta,
        categoria === "controle" ? 4.6 : 4.3,
        categoria === "controle" ? 7.0 : 6.6
      );
    }
  }

  // Só as placas de controle recebem reforço da figura.
  // Nas demais, reforçar o número cria uma pista de densidade que facilita demais.
  if (categoria === "controle") {
    let adicionados = 0;
    let tentativas = 0;
    while (adicionados < 260 && tentativas < 9000) {
      tentativas++;
      const x = 90 + Math.random() * 320;
      const y = 105 + Math.random() * 290;
      if (dentroPlaca(x, y, 6) && estaNaMascara(x, y)) {
        criarPonto(x, y, "figura", paleta, 3.8, 6.0);
        adicionados++;
      }
    }
  }

  // Guarda a cor neutra da placa para o desenho.
  pontos.corBase = paleta.base;
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

  ctx.fillStyle = pontos.corBase || "#b5a57d";
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
    (vermelhoVerde * 8 + azulAmarelo * 4 + tons * 4) / 16;

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
