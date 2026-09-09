# ColorVisão v19

Projeto escolar educativo sobre percepção de cores, daltonismo e acessibilidade.

## O que mudou na v2

- 20 questões por execução.
- Números aleatórios de 1 a 98 sem repetição na mesma sessão.
- Placas animadas com movimento suave dos pontos.
- Máscara reforçada para formar números mais legíveis.
- Grupos de teste: controle, vermelho-verde, azul-amarelo e tonalidades.
- Resultado separado por categoria.
- Novo teste gera outra sequência e novas placas.

## Tecnologias

HTML5, CSS3, JavaScript e Canvas API.

## Publicação

Envie `index.html`, `style.css` e `script.js` para a raiz do repositório
e publique com GitHub Pages.

## Importante

O ColorVisão é uma experiência educativa. As placas e pontuações do projeto
não possuem validação clínica e não devem ser usadas para diagnóstico médico.


## Novidades da v3

- Placa visualmente menor para caber melhor em notebooks de 15,6".
- Layout vertical do teste mais compacto.
- Card final em verde, amarelo ou vermelho.
- Estado cinza de resultado inconclusivo quando as placas de controle apresentam dificuldade.
- Conclusão indica qual grupo cromático apresentou maior dificuldade.


## Novidades da v4

- Logo oficial da escola incluída no projeto.
- Novo card institucional em destaque na página inicial.
- Identificação do projeto como iniciativa escolar.
- Card responsivo para desktop e celular.

## Novidades da v5

- Engenharia destacada no card institucional.
- Ênfase em Engenharia de Software como área do projeto.
- Texto do card relaciona problema escolar, solução digital, ciência, tecnologia e acessibilidade.
- Tag visual exclusiva para Engenharia de Software.

## Novidades da v6

- Teste reduzido de 20 para 10 placas para facilitar demonstrações e repetições.
- Distribuição: 2 controle, 4 vermelho-verde, 3 azul-amarelo e 1 tonalidades.
- Rolagem ao iniciar o teste ajustada para parar mais acima e alinhar melhor a placa em notebooks.
- Resultado recalibrado para a nova quantidade de questões.

## Novidades da v7

- Botão de modo claro/escuro em destaque no topo.
- Preferência de tema salva no navegador.
- Modo claro aplicado ao site inteiro, incluindo cards, formulário e card institucional.
- Rolagem ao iniciar o teste corrigida para manter o título da seção visível.
- Foco no campo de resposta não força mais uma segunda rolagem da página.

## Novidades da v8

- Teste ampliado de 10 para 12 placas.
- Distinção de tonalidades ampliada de 1 para 3 placas.
- Distribuição atual: 2 controle, 4 vermelho-verde, 3 azul-amarelo e 3 tonalidades.
- Cálculo final recalibrado para as 12 questões.
- Distinção de tonalidades agora também participa da identificação do grupo com maior dificuldade.

## Novidades da v9

- Cronometragem automática de cada resposta.
- Tempo médio exibido por categoria e no teste completo.
- Barras visuais de desempenho no resultado.
- Botão “Não consigo identificar” mais evidente.
- Análise automática do grupo com maior dificuldade.
- Explicação educativa da categoria com menor desempenho.
- Modo Feira no cabeçalho.
- No Modo Feira, o botão final muda para “Próximo participante”, facilitando demonstrações consecutivas.

## Novidades da v10

- Modo Feira removido para simplificar a experiência.
- Botão final alterado para “Iniciar teste para um novo participante”.
- Novo QR Code do projeto publicado.
- Card grande e responsivo próximo ao final da página para acesso pelo celular.
- Link oficial: https://tomazaquino163.github.io/colorVisao/

## Novidades da v11

- Teste ampliado novamente para 20 placas.
- Distribuição: 4 controle, 7 vermelho-verde, 5 azul-amarelo e 4 tonalidades.
- Resultados recalibrados para a nova quantidade de questões.
- Placas de controle agora exigem pelo menos 3 acertos em 4 para permitir interpretação cromática.
- Tempo total do teste acrescentado ao resultado.
- Menu superior alterado para Início | Sobre | QR Code.
- Item Teste removido do menu.
- QR Code no menu leva suavemente ao card de acesso no final da página.

## Novidades da v12

- Cache-busting aplicado ao CSS e JavaScript.
- `style.css?v=12` e `script.js?v=12` forçam celulares e navegadores a baixar a versão atual.
- Mantidas as 20 placas e todos os recursos da v11.

## Novidades da v13

- Paleta vermelho-verde corrigida.
- Nas placas dessa categoria, os números agora usam tons avermelhados.
- O fundo das placas vermelho-verde agora usa tons esverdeados.
- Mantidas as 20 placas, QR Code, modo claro/escuro, cronômetros e resultados.
- Cache-busting atualizado para `?v=13`.

## Novidades da v14

- Identidade oficial do projeto incorporada ao site: **ÍRIS • Engenharia da Visão**.
- ColorVisão passa a ser apresentado explicitamente como a solução tecnológica do projeto ÍRIS.
- Identidade reforçada no card institucional da escola.
- Layout responsivo preservado.
- Cache-busting atualizado para `?v=14`.

## Novidades da v15 — motor pseudoisocromático experimental

- Reformulação do gerador após teste com participante com daltonismo.
- 20 placas: 4 controle, 8 vermelho-verde, 4 azul-amarelo e 4 tonalidades.
- Quatro variantes de paleta vermelho-verde com luminâncias mais próximas.
- Figura e fundo agora usam densidade equivalente de pontos nas placas cromáticas.
- Removido o reforço de pontos dentro do número nas placas cromáticas, reduzindo pistas de forma/densidade.
- Fundo da placa passa a acompanhar uma cor neutra da paleta, evitando vazamentos dourados.
- Mantida animação sutil sem permitir que pontos atravessem a máscara.
- Aviso explícito: método educativo pseudoisocromático experimental; não reproduz nem substitui Ishihara clínico.
- Cache-busting atualizado para `?v=15`.

## Novidades da v16
- 25 placas: 4 controle, 6 desaparecimento, 5 transformação, 4 número oculto, 3 azul-amarelo e 3 tonalidades.
- Novos comportamentos vermelho-verde experimentais no resultado.
- Não reproduz nem substitui o Ishihara clínico.
- Cache atualizado para ?v=16.

## Correção crítica da v17

- Corrigido o cálculo de acertos.
- `registrarResposta()` grava `correto` e `informado`, mas a v16 consultava por engano `acertou` e `resposta`.
- Esse erro fazia o resultado considerar todas as respostas como erradas, mesmo quando estavam corretas.
- Resultado detalhado dos comportamentos vermelho-verde acrescentado.
- Cache-busting atualizado para `?v=17`.

## Novidades da v18 — três motores experimentais de verdade

- 25 placas mantidas.
- Desaparecimento agora usa pares cromáticos escolhidos para perder contraste em uma simulação simplificada de deutan.
- Transformação agora contém dois números diferentes: um padrão típico experimental e um número alternativo.
- Número oculto agora tem interpretação reversa: “Não consigo identificar” é a resposta típica experimental; identificar o número mascarado registra um indicador vermelho-verde.
- O resultado não trata mais todas as questões como simples acerto/erro.
- O sistema conta indicadores experimentais vermelho-verde separadamente.
- Cache atualizado para `?v=18`.

### Limitação
Os pares cromáticos foram projetados experimentalmente por algoritmo e não são placas clínicas validadas. A resposta de participantes reais deve ser usada para calibrar as próximas versões.

## Novidades da v19 — calibração algorítmica

- Motor de número oculto redesenhado.
- Figura e fundo das placas ocultas agora usam as mesmas quatro cores; muda apenas a proporção entre dois agrupamentos.
- As combinações foram selecionadas por busca matemática para:
  - parecerem mais misturadas para visão típica;
  - agruparem-se de forma mais distinta em simulações simplificadas protan/deutan.
- Transformação agora mistura dois canais:
  - número típico por desaparecimento;
  - número alternativo por padrão oculto.
- As placas ocultas e de transformação usam maior densidade de pontos para reduzir pistas geométricas.
- Banco com várias calibrações é sorteado a cada questão.
- Cache-busting atualizado para `?v=19`.

### Importante
“Calibrada” nesta versão significa calibração algorítmica contra modelos matemáticos simplificados.
Não significa validação clínica. O próximo passo correto é comparar sistematicamente resultados de
participantes com visão típica e participantes com deficiência de visão de cores conhecida.
