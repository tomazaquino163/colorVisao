
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
  ...Array(6).fill("desaparecimento"),
  ...Array(5).fill("transformacao"),
  ...Array(4).fill("oculto"),
  ...Array(3).fill("azul-amarelo"),
  ...Array(3).fill("tons")
];

const TOTAL_QUESTOES = PLANO.length;

let questaoAtual = 0;
let numerosUsados = new Set();
let perguntas = [];
let respostas = [];
let pontos = [];
let mascaraA = null;
let mascaraB = null;
let animationId = null;
let inicioQuestao = 0;
let corBaseAtual = "#b5a57d";

// Paletas de controle/azul/tons.
const PALETAS = {
  controle: {
    fundo: ["#d6b66f", "#c9a66c", "#dfc27d", "#bea06a", "#d1ad72"],
    figura: ["#416f73", "#4b7979", "#38676d", "#5a8380"],
    base: "#c9aa70"
  },
  azul: {
    fundo: ["#b9a76d", "#c0ad73", "#b19f68", "#c5b277", "#b6a36a"],
    figura: ["#73899a", "#7c91a0", "#6b8194", "#8498a5", "#718797"],
    base: "#b5a46d"
  },
  tons: {
    fundo: ["#b49c82", "#baa288", "#ad957c", "#c0a78c", "#b09880"],
    figura: ["#9f8978", "#a58e7d", "#978274", "#aa9381", "#9b8576"],
    base: "#af9780"
  }
};

// DESAPARECIMENTO:
// cores diferentes em visão típica, mas escolhidas para se aproximarem
// em uma simulação matemática simplificada de deutan.
// Isso é experimental, não uma calibração clínica.
const DESAPARECIMENTO = {
  fundo: ["#c75c68", "#c26866", "#be6168", "#c96a6b", "#b95d64"],
  figura: ["#9ba346", "#a2a94c", "#95a043", "#a8ad51", "#9ca548"],
  base: "#b78c5f"
};

// NÚMERO OCULTO (reverse / hidden experimental):
// dentro e fora usam DOIS tons bastante diferentes para uma pessoa
// tricromata, produzindo "ruído cromático"; em simulação deutan, cada par
// tende a se agrupar em clusters diferentes, podendo revelar a máscara.
const OCULTO = {
  figura: ["#c64e57", "#9d993f"],   // vermelho + oliva
  fundo:  ["#3caf97", "#665cb5"],   // verde-azulado + violeta
  base: "#8b817d"
};

// TRANSFORMAÇÃO:
// número A é construído pelo princípio de desaparecimento;
// número B é construído pelo princípio de número oculto.
// A intenção é que respostas diferentes possam surgir de padrões cromáticos distintos.
const TRANSFORMACAO = {
  tipico: ["#9ba346", "#a2a94c", "#95a043"],
  fundo: ["#c75c68", "#c26866", "#be6168"],
  alternativo: ["#3caf97", "#665cb5"],
  base: "#aa826a"
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

  const tamanho = numero < 10 ? 245 : 205;
  mctx.font = `900 ${tamanho}px Arial, Helvetica, sans-serif`;
  mctx.fillText(String(numero), off.width / 2, off.height / 2 + 6);

  return mctx.getImageData(0, 0, off.width, off.height);
}

function naMascara(img, x, y) {
  if (!img) return false;
  const px = Math.max(0, Math.min(canvas.width - 1, Math.round(x)));
  const py = Math.max(0, Math.min(canvas.height - 1, Math.round(y)));
  return img.data[(py * canvas.width + px) * 4 + 3] > 80;
}

function dentroPlaca(x, y, margem = 0) {
  return Math.hypot(x - 250, y - 250) < 230 - margem;
}

function escolher(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

function criarPonto(x, y, grupo, cor) {
  pontos.push({
    baseX: x,
    baseY: y,
    grupo,
    raio: 4.3 + Math.random() * 2.2,
    cor,
    faseX: Math.random() * Math.PI * 2,
    faseY: Math.random() * Math.PI * 2,
    velocidade: 0.00065 + Math.random() * 0.00055,
    amplitude: 0.65 + Math.random() * 1.45
  });
}

function grupoNoPonto(categoria, x, y) {
  const a = naMascara(mascaraA, x, y);
  const b = naMascara(mascaraB, x, y);

  if (categoria === "transformacao") {
    if (a && !b) return "tipico";
    if (b && !a) return "alternativo";
    if (a && b) return "intersecao";
    return "fundo";
  }

  return a ? "figura" : "fundo";
}

function corParaGrupo(categoria, grupo) {
  if (categoria === "controle") {
    return escolher(grupo === "figura" ? PALETAS.controle.figura : PALETAS.controle.fundo);
  }

  if (categoria === "desaparecimento") {
    return escolher(grupo === "figura" ? DESAPARECIMENTO.figura : DESAPARECIMENTO.fundo);
  }

  if (categoria === "oculto") {
    // Cada região usa uma mistura de duas cores; isso reduz a "silhueta por uma cor só".
    return escolher(grupo === "figura" ? OCULTO.figura : OCULTO.fundo);
  }

  if (categoria === "transformacao") {
    if (grupo === "tipico") return escolher(TRANSFORMACAO.tipico);
    if (grupo === "alternativo") return escolher(TRANSFORMACAO.alternativo);
    if (grupo === "intersecao") {
      return Math.random() < 0.5 ? escolher(TRANSFORMACAO.tipico) : escolher(TRANSFORMACAO.alternativo);
    }
    return escolher(TRANSFORMACAO.fundo);
  }

  if (categoria === "azul-amarelo") {
    return escolher(grupo === "figura" ? PALETAS.azul.figura : PALETAS.azul.fundo);
  }

  return escolher(grupo === "figura" ? PALETAS.tons.figura : PALETAS.tons.fundo);
}

function gerarPontos(categoria) {
  pontos = [];

  if (categoria === "controle") corBaseAtual = PALETAS.controle.base;
  else if (categoria === "desaparecimento") corBaseAtual = DESAPARECIMENTO.base;
  else if (categoria === "oculto") corBaseAtual = OCULTO.base;
  else if (categoria === "transformacao") corBaseAtual = TRANSFORMACAO.base;
  else if (categoria === "azul-amarelo") corBaseAtual = PALETAS.azul.base;
  else corBaseAtual = PALETAS.tons.base;

  const passo = categoria === "controle" ? 12 : 10.2;

  for (let y = 24; y < 476; y += passo) {
    for (let x = 24; x < 476; x += passo) {
      const jitter = passo * 0.68;
      const jx = x + (Math.random() - 0.5) * jitter;
      const jy = y + (Math.random() - 0.5) * jitter;

      if (!dentroPlaca(jx, jy, 5)) continue;

      const grupo = grupoNoPonto(categoria, jx, jy);
      criarPonto(jx, jy, grupo, corParaGrupo(categoria, grupo));
    }
  }

  // Controle recebe reforço leve para garantir leitura.
  if (categoria === "controle") {
    let adicionados = 0;
    let tentativas = 0;
    while (adicionados < 250 && tentativas < 9000) {
      tentativas++;
      const x = 90 + Math.random() * 320;
      const y = 105 + Math.random() * 290;
      if (dentroPlaca(x, y, 6) && naMascara(mascaraA, x, y)) {
        criarPonto(x, y, "figura", escolher(PALETAS.controle.figura));
        adicionados++;
      }
    }
  }
}

function gerarQuestao() {
  const q = perguntas[questaoAtual];

  q.numeroTipico = gerarNumeroUnico();
  q.numeroAlternativo = null;

  mascaraA = criarMascara(q.numeroTipico);
  mascaraB = null;

  if (q.categoria === "transformacao") {
    q.numeroAlternativo = gerarNumeroUnico();
    mascaraB = criarMascara(q.numeroAlternativo);
  }

  // Em placa oculta, o número existe na máscara, mas a resposta típica esperada é "não vejo".
  if (q.categoria === "oculto") {
    q.numeroAlternativo = q.numeroTipico;
  }

  gerarPontos(q.categoria);
  inicioQuestao = performance.now();
}

function desenharPlacaAnimada(tempo) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.beginPath();
  ctx.arc(250, 250, 239, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = corBaseAtual;
  ctx.fillRect(0, 0, 500, 500);

  const categoria = perguntas[questaoAtual]?.categoria;

  for (const p of pontos) {
    let x = p.baseX + Math.sin(tempo * p.velocidade + p.faseX) * p.amplitude;
    let y = p.baseY + Math.cos(tempo * (p.velocidade * 0.91) + p.faseY) * p.amplitude;

    // Preserva a região lógica do ponto durante a animação.
    if (grupoNoPonto(categoria, x, y) !== p.grupo) {
      x = p.baseX;
      y = p.baseY;
    }

    ctx.beginPath();
    ctx.arc(x, y, p.raio, 0, Math.PI * 2);
    ctx.fillStyle = p.cor;
    ctx.fill();

    ctx.globalAlpha = 0.10;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 0.7;
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
  perguntas = embaralhar(PLANO).map(categoria => ({
    categoria,
    numeroTipico: null,
    numeroAlternativo: null
  }));

  resultado.classList.add("oculto");
  areaResposta.classList.remove("oculto");
  respostaInput.value = "";

  instrucao.textContent =
    "Observe a placa animada. Digite o número que você vê ou escolha “Não consigo identificar”.";
  atualizarProgresso();
  gerarQuestao();

  animationId = requestAnimationFrame(desenharPlacaAnimada);

  const secaoTeste = document.getElementById("teste");
  const topoDesejado = secaoTeste.getBoundingClientRect().top + window.scrollY - 28;

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

function interpretarResposta(q, informado) {
  // Controle, azul-amarelo e tons: leitura do número esperado.
  if (["controle", "azul-amarelo", "tons"].includes(q.categoria)) {
    return {
      tipicoCorreto: informado === q.numeroTipico,
      indicadorRG: false,
      classificacao: informado === q.numeroTipico ? "tipico" : "erro"
    };
  }

  // Desaparecimento: visão típica tende a identificar o número;
  // não identificar é tratado como indicador experimental vermelho-verde.
  if (q.categoria === "desaparecimento") {
    if (informado === q.numeroTipico) {
      return { tipicoCorreto: true, indicadorRG: false, classificacao: "tipico" };
    }
    if (informado === null) {
      return { tipicoCorreto: false, indicadorRG: true, classificacao: "indicador-rg" };
    }
    return { tipicoCorreto: false, indicadorRG: false, classificacao: "outro" };
  }

  // Transformação: A = padrão típico experimental; B = resposta alternativa experimental.
  if (q.categoria === "transformacao") {
    if (informado === q.numeroTipico) {
      return { tipicoCorreto: true, indicadorRG: false, classificacao: "tipico" };
    }
    if (informado === q.numeroAlternativo) {
      return { tipicoCorreto: false, indicadorRG: true, classificacao: "indicador-rg" };
    }
    return { tipicoCorreto: false, indicadorRG: false, classificacao: informado === null ? "nao-viu" : "outro" };
  }

  // Número oculto: para visão típica, "não consigo identificar" é a resposta-alvo.
  // Identificar o número oculto é registrado como indicador experimental RG.
  if (q.categoria === "oculto") {
    if (informado === null) {
      return { tipicoCorreto: true, indicadorRG: false, classificacao: "tipico" };
    }
    if (informado === q.numeroAlternativo) {
      return { tipicoCorreto: false, indicadorRG: true, classificacao: "indicador-rg" };
    }
    return { tipicoCorreto: false, indicadorRG: false, classificacao: "outro" };
  }

  return { tipicoCorreto: false, indicadorRG: false, classificacao: "outro" };
}

function registrarResposta(valor) {
  if (!perguntas.length || questaoAtual >= perguntas.length) return;

  const informado = valor === null || valor === "" ? null : Number(valor);
  const q = perguntas[questaoAtual];
  const interpretacao = interpretarResposta(q, informado);

  respostas.push({
    categoria: q.categoria,
    numeroTipico: q.numeroTipico,
    numeroAlternativo: q.numeroAlternativo,
    informado,
    tipicoCorreto: interpretacao.tipicoCorreto,
    indicadorRG: interpretacao.indicadorRG,
    classificacao: interpretacao.classificacao,
    tempoMs: Math.round(performance.now() - inicioQuestao)
  });

  if (questaoAtual < TOTAL_QUESTOES - 1) {
    questaoAtual++;
    respostaInput.value = "";
    atualizarProgresso();
    gerarQuestao();
    respostaInput.focus({ preventScroll: true });
  } else {
    finalizarTeste();
  }
}

function itensCategoria(categoria) {
  if (categoria === "vermelho-verde") {
    return respostas.filter(r =>
      ["desaparecimento", "transformacao", "oculto"].includes(r.categoria)
    );
  }
  return respostas.filter(r => r.categoria === categoria);
}

function resumoCategoria(categoria) {
  const itens = itensCategoria(categoria);
  return {
    total: itens.length,
    tipicos: itens.filter(r => r.tipicoCorreto).length,
    indicadores: itens.filter(r => r.indicadorRG).length,
    naoViu: itens.filter(r => r.informado === null).length
  };
}

function tempoMedioCategoria(categoria) {
  const itens = itensCategoria(categoria);
  if (!itens.length) return 0;
  return itens.reduce((soma, r) => soma + r.tempoMs, 0) / itens.length / 1000;
}

function linhaResultado(titulo, categoria) {
  const r = resumoCategoria(categoria);
  const pct = r.total ? Math.round((r.tipicos / r.total) * 100) : 0;
  const tempo = tempoMedioCategoria(categoria).toFixed(1).replace(".", ",");

  return `
    <div class="resultado-grupo">
      <div class="resultado-grupo-topo">
        <strong>${titulo}</strong>
        <span>${r.tipicos}/${r.total} • ${pct}% padrão típico</span>
      </div>
      <div class="resultado-barra">
        <div class="resultado-barra-preenchimento" style="width:${pct}%"></div>
      </div>
      <small>Tempo médio: ${tempo} s</small>
    </div>
  `;
}

function percentualTipico(categoria) {
  const r = resumoCategoria(categoria);
  return r.total ? (r.tipicos / r.total) * 100 : 0;
}

function totalIndicadoresRG() {
  return itensCategoria("vermelho-verde").filter(r => r.indicadorRG).length;
}

function gerarConclusao() {
  const controle = percentualTipico("controle");
  const azul = percentualTipico("azul-amarelo");
  const tons = percentualTipico("tons");
  const indicadores = totalIndicadoresRG();

  if (controle < 75) {
    return {
      classe: "status-inconclusivo",
      icone: "?",
      titulo: "Resultado inconclusivo",
      texto:
        "Houve dificuldade nas placas de controle. Repita o teste verificando brilho, iluminação, filtros de cor e compreensão das instruções."
    };
  }

  // 15 placas experimentais no eixo vermelho-verde.
  if (indicadores >= 5) {
    return {
      classe: "status-vermelho",
      icone: "!",
      titulo: "Padrão experimental vermelho-verde elevado",
      texto:
        `Foram registrados ${indicadores} comportamentos compatíveis com o padrão experimental vermelho-verde. Isso não confirma daltonismo e deve ser interpretado apenas como triagem educativa.`
    };
  }

  if (indicadores >= 2 || azul < 67 || tons < 67) {
    return {
      classe: "status-amarelo",
      icone: "!",
      titulo: "Possível dificuldade na percepção de cores",
      texto:
        `Foram registrados ${indicadores} indicadores experimentais no eixo vermelho-verde e/ou dificuldade em outras categorias. Recomenda-se repetir em boas condições de tela e iluminação.`
    };
  }

  return {
    classe: "status-verde",
    icone: "✓",
    titulo: "Percepção de cores dentro do esperado",
    texto:
      "O padrão de respostas ficou predominantemente dentro do esperado para esta experiência digital."
  };
}

function cardPadraoRG() {
  const d = resumoCategoria("desaparecimento");
  const t = resumoCategoria("transformacao");
  const o = resumoCategoria("oculto");
  const total = totalIndicadoresRG();

  return `
    <div class="padrao-rg-v18">
      <span>ANÁLISE EXPERIMENTAL VERMELHO-VERDE</span>
      <h4>${total} indicador(es) em 15 placas</h4>
      <p>
        Desaparecimento: <strong>${d.indicadores}/${d.total}</strong> •
        Transformação: <strong>${t.indicadores}/${t.total}</strong> •
        Número oculto: <strong>${o.indicadores}/${o.total}</strong>
      </p>
      <small>
        Em “número oculto”, não identificar nenhum número conta como padrão típico experimental;
        identificar o número mascarado é registrado como indicador vermelho-verde.
      </small>
    </div>
  `;
}

function formatarTempoTotal(ms) {
  const totalSegundos = Math.round(ms / 1000);
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return minutos === 0
    ? `${segundos} s`
    : `${minutos} min ${String(segundos).padStart(2, "0")} s`;
}

function finalizarTeste() {
  if (animationId) cancelAnimationFrame(animationId);
  animationId = null;

  areaResposta.classList.add("oculto");
  resultado.classList.remove("oculto");
  numeroQuestao.textContent = `${TOTAL_QUESTOES} / ${TOTAL_QUESTOES}`;
  barraProgresso.style.width = "100%";

  const conclusao = gerarConclusao();
  const totalMs = respostas.reduce((soma, r) => soma + r.tempoMs, 0);

  resultado.innerHTML = `
    <h3>Resultado educativo</h3>

    ${linhaResultado("Placas de controle", "controle")}
    ${cardPadraoRG()}

    <div class="subtipos-v16">
      <strong>Comportamentos pseudoisocromáticos experimentais</strong>
      ${linhaResultado("Desaparecimento", "desaparecimento")}
      ${linhaResultado("Transformação", "transformacao")}
      ${linhaResultado("Número oculto", "oculto")}
    </div>

    ${linhaResultado("Grupo azul-amarelo", "azul-amarelo")}
    ${linhaResultado("Distinção de tonalidades", "tons")}

    <div class="tempo-geral">
      ⏱️ <strong>Tempo médio geral:</strong>
      ${(totalMs / respostas.length / 1000).toFixed(1).replace(".", ",")} s por placa
      <br>
      ⏳ <strong>Tempo total do teste:</strong> ${formatarTempoTotal(totalMs)}
    </div>

    <p>
      <strong>Importante:</strong> esta versão usa comportamentos pseudoisocromáticos
      gerados experimentalmente. Ela não reproduz o teste clínico de Ishihara e
      não realiza diagnóstico.
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
  aplicarTema(document.body.classList.contains("tema-claro") ? "escuro" : "claro");
});

// Estado inicial
ctx.fillStyle = "#d4b879";
ctx.beginPath();
ctx.arc(250, 250, 238, 0, Math.PI * 2);
ctx.fill();

ctx.fillStyle = "rgba(255,255,255,.65)";
ctx.font = "700 27px Arial";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillText("ColorVisão", 250, 250);
