
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

// CALIBRAÇÃO ALGORÍTMICA v19
// As paletas abaixo foram selecionadas procurando dois comportamentos:
// 1) DESAPARECIMENTO: alta diferença cromática para visão típica e
//    forte aproximação após simulações simplificadas protan/deutan.
// 2) NÚMERO OCULTO: quatro cores parecem ruído misturado para visão típica,
//    mas formam dois agrupamentos mais separados após simulação protan/deutan.
//
// Isso NÃO é calibração clínica e NÃO reproduz as placas originais de Ishihara.

const DESAPARECIMENTO_BANCO = [
  { figura:"#758610", fundo:"#ad5966", base:"#92705c" },
  { figura:"#9eaa38", fundo:"#d87b82", base:"#b9935f" },
  { figura:"#9fbb01", fundo:"#d5997f", base:"#b8aa51" },
  { figura:"#899a51", fundo:"#bf6e84", base:"#a78369" },
  { figura:"#829404", fundo:"#b6725c", base:"#9a8250" },
  { figura:"#97a434", fundo:"#cf8587", base:"#b29662" }
];

const OCULTO_BANCO = [
  {
    grupoA:["#3c88f1","#5863f8"],
    grupoB:["#8591f8","#8a6cf7"],
    dentroA:0.59, foraA:0.41, base:"#747be8"
  },
  {
    grupoA:["#6a9cc8","#8066ce"],
    grupoB:["#6169e1","#269edc"],
    dentroA:0.59, foraA:0.41, base:"#657fcf"
  },
  {
    grupoA:["#4a8eb2","#795ac4"],
    grupoB:["#944db2","#6c979f"],
    dentroA:0.58, foraA:0.42, base:"#7476ae"
  },
  {
    grupoA:["#7997bd","#a236ce"],
    grupoB:["#6e81d7","#8164e3"],
    dentroA:0.59, foraA:0.41, base:"#8175cf"
  }
];

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

function limitar(v, min = 0, max = 255) {
  return Math.max(min, Math.min(max, v));
}

function variarHex(hex, amplitude = 5) {
  const limpo = hex.replace("#", "");
  const r = parseInt(limpo.slice(0, 2), 16);
  const g = parseInt(limpo.slice(2, 4), 16);
  const b = parseInt(limpo.slice(4, 6), 16);

  const variacao = () => Math.round((Math.random() * 2 - 1) * amplitude);

  const rr = limitar(r + variacao());
  const gg = limitar(g + variacao());
  const bb = limitar(b + variacao());

  return `rgb(${rr}, ${gg}, ${bb})`;
}

function escolherCalibracao(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

function criarPonto(x, y, assinatura, cor) {
  pontos.push({
    baseX: x,
    baseY: y,
    assinatura,
    raio: 4.15 + Math.random() * 2.15,
    cor,
    faseX: Math.random() * Math.PI * 2,
    faseY: Math.random() * Math.PI * 2,
    velocidade: 0.00065 + Math.random() * 0.00055,
    amplitude: 0.55 + Math.random() * 1.25
  });
}

function assinaturaPonto(categoria, x, y) {
  const a = naMascara(mascaraA, x, y);
  const b = naMascara(mascaraB, x, y);

  if (categoria === "transformacao") {
    return `${a ? 1 : 0}${b ? 1 : 0}`;
  }

  return a ? "1" : "0";
}

function corOculta(q, dentro) {
  const cfg = q.calibracaoOculto;
  const pGrupoA = dentro ? cfg.dentroA : cfg.foraA;
  const grupo = Math.random() < pGrupoA ? cfg.grupoA : cfg.grupoB;
  return variarHex(escolher(grupo), 4);
}

function corDesaparecimento(q, dentro) {
  const cfg = q.calibracaoDesap;
  return variarHex(dentro ? cfg.figura : cfg.fundo, 5);
}

function corParaPonto(categoria, x, y) {
  const q = perguntas[questaoAtual];
  const dentroA = naMascara(mascaraA, x, y);
  const dentroB = naMascara(mascaraB, x, y);

  if (categoria === "controle") {
    return escolher(dentroA ? PALETAS.controle.figura : PALETAS.controle.fundo);
  }

  if (categoria === "desaparecimento") {
    return corDesaparecimento(q, dentroA);
  }

  if (categoria === "oculto") {
    // Figura e fundo usam AS MESMAS quatro cores.
    // O que muda é apenas a proporção entre dois agrupamentos de cor.
    // Isso reduz muito a silhueta visível para visão típica.
    return corOculta(q, dentroA);
  }

  if (categoria === "transformacao") {
    // Dois canais se misturam na mesma placa:
    // A) número típico por desaparecimento (~57% dos pontos)
    // B) número alternativo por padrão oculto (~43% dos pontos)
    //
    // Em visão típica, A tende a dominar. Em simulação protan/deutan,
    // A perde contraste e B tende a ganhar organização perceptual.
    if (Math.random() < 0.57) {
      return corDesaparecimento(q, dentroA);
    }
    return corOculta(q, dentroB);
  }

  if (categoria === "azul-amarelo") {
    return escolher(dentroA ? PALETAS.azul.figura : PALETAS.azul.fundo);
  }

  return escolher(dentroA ? PALETAS.tons.figura : PALETAS.tons.fundo);
}

function gerarPontos(categoria) {
  pontos = [];
  const q = perguntas[questaoAtual];

  if (categoria === "controle") corBaseAtual = PALETAS.controle.base;
  else if (categoria === "desaparecimento") corBaseAtual = q.calibracaoDesap.base;
  else if (categoria === "oculto") corBaseAtual = q.calibracaoOculto.base;
  else if (categoria === "transformacao") {
    // Média visual aproximada entre os dois canais.
    corBaseAtual = q.calibracaoOculto.base;
  }
  else if (categoria === "azul-amarelo") corBaseAtual = PALETAS.azul.base;
  else corBaseAtual = PALETAS.tons.base;

  // Oculto e transformação usam densidade maior para reduzir espaços que
  // poderiam revelar o contorno do número por diferenças geométricas.
  const passo =
    categoria === "controle" ? 12 :
    (categoria === "oculto" || categoria === "transformacao") ? 9.1 : 10.2;

  for (let y = 22; y < 478; y += passo) {
    for (let x = 22; x < 478; x += passo) {
      const jitter = passo * 0.72;
      const jx = x + (Math.random() - 0.5) * jitter;
      const jy = y + (Math.random() - 0.5) * jitter;

      if (!dentroPlaca(jx, jy, 5)) continue;

      const assinatura = assinaturaPonto(categoria, jx, jy);
      criarPonto(jx, jy, assinatura, corParaPonto(categoria, jx, jy));
    }
  }

  // Somente controle recebe reforço de densidade na figura.
  if (categoria === "controle") {
    let adicionados = 0;
    let tentativas = 0;
    while (adicionados < 250 && tentativas < 9000) {
      tentativas++;
      const x = 90 + Math.random() * 320;
      const y = 105 + Math.random() * 290;
      if (dentroPlaca(x, y, 6) && naMascara(mascaraA, x, y)) {
        criarPonto(
          x, y, "1",
          escolher(PALETAS.controle.figura)
        );
        adicionados++;
      }
    }
  }
}

function gerarQuestao() {
  const q = perguntas[questaoAtual];

  q.numeroTipico = gerarNumeroUnico();
  q.numeroAlternativo = null;

  q.calibracaoDesap = escolherCalibracao(DESAPARECIMENTO_BANCO);
  q.calibracaoOculto = escolherCalibracao(OCULTO_BANCO);

  mascaraA = criarMascara(q.numeroTipico);
  mascaraB = null;

  if (q.categoria === "transformacao") {
    q.numeroAlternativo = gerarNumeroUnico();
    mascaraB = criarMascara(q.numeroAlternativo);
  }

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
    if (assinaturaPonto(categoria, x, y) !== p.assinatura) {
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
      <strong>Importante:</strong> a v19 usa paletas selecionadas por calibração algorítmica
      contra simulações simplificadas de visão protan/deutan. Ainda assim, as placas são
      experimentais, não reproduzem o teste clínico de Ishihara e não realizam diagnóstico.
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
