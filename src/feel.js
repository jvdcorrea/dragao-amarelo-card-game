/* Game feel (P94): durações, intensidades e sons num lugar só. Ajuste aqui sem caçar valores no código.
   Tempos em milissegundos; volumes de 0 a 1. */
const FEEL = {
  audio: {
    pasta: 'assets/audio/',
    formatos: ['ogg', 'wav'],   // tenta nesta ordem: os sons do Kenney entram como .ogg, os placeholders são .wav
    padroes: { efeitos: 0.8, musica: 0.5, mudo: false },   // valores iniciais das Configurações
    etapaMs: 70,                // espaço entre as etapas de uma ação (veja etapa em cada som)
    maxIguais: 2,               // cópias do mesmo som numa ação: dano em área não vira barulheira
    variacaoTom: 0.06,          // cada toque sai até 6% mais rápido ou mais lento
    forteApartir: 5,            // dano a partir do qual toca impacto_forte em vez de impacto
  },
  // Modos de animação: normal (1x), rapida (2x), instantanea (sem animação, só som) e desligada (sem movimento:
  // sem avanço, hit-stop, flash nem corte; números e vida mudam no lugar e as unidades mortas só esmaecem).
  // O padrão segue o prefers-reduced-motion.
  tempo: {
    escala: { normal: 1, rapida: 0.5, instantanea: 0, desligada: 1 },
    passoInimigo: { normal: 500, rapida: 250, instantanea: 100, desligada: 150 },   // pausa entre ações do inimigo
    depoisJogar: 120,     // da carta jogada até o primeiro impacto de um feitiço
    entreGolpes: 70,      // respiro depois de cada grupo de impactos
  },
  ataque: {
    idaMs: 140,           // atacante vai até o alvo
    voltaMs: 170,         // e volta, depois do hit-stop
    alcance: 0.7,         // fração da distância até o alvo que o atacante percorre
    escala: 1.08,         // cresce um pouco no golpe
  },
  arma: {
    corteMs: 260,         // o corte atravessa o alvo quando o protagonista ataca com arma
    contatoMs: 90,        // do início do corte até o impacto
    angulo: -32,          // inclinação do corte, em graus
    espessura: 6,         // px
    comprimento: 1.5,     // em relação à diagonal do alvo
    cor: '#e8a524',       // borda do corte; o miolo é branco
  },
  impacto: {
    hitStopMin: 50,       // congelamento no contato: min + porDano × dano, até max
    hitStopMax: 100,
    hitStopPorDano: 10,
    flashMs: 150,         // flash branco no alvo, depois do hit-stop
    flashOpacidade: 0.85,
    flashBloqueio: 0.45,  // flash mais fraco quando Escudo ou Blindagem segura o dano
    morteMs: 340,         // unidade morta some
    barraMs: 260,         // barra de vida do líder desce ou sobe
  },
  cura: {
    brilhoMs: 700,        // brilho verde em volta do número de vida que subiu
    cor: '#3fcf62',
    raioPx: 10,
  },
  // Números flutuantes sobre o alvo, depois do hit-stop.
  // Evolução: momento raro (3 por partida), então ganha mais camadas que um golpe comum, mas sem hit-stop:
  // a peça se encolhe (antecipação), cresce com sobra e assenta; anéis dourados se abrem, faíscas sobem,
  // os atributos pulsam e o “+2/+2” flutua. Depois, uma pausa curta antes dos efeitos Ao Evoluir.
  evoluir: {
    ms: 640,              // a peça encolhe, cresce e assenta
    encolhe: 0.92,        // antecipação
    escala: 1.16,         // pico, antes de assentar com sobra
    subirPx: 8,
    cor: '#f0bd48',       // dourado da Evolução (anéis, brilho, faíscas e o texto)
    aneis: 2,             // anéis que se abrem a partir da peça
    anelMs: 560,
    anelIntervalo: 130,
    anelEscala: 1.55,
    faiscas: 12,          // faíscas que sobem da peça
    faiscaMs: 760,
    faiscaAltura: 70,     // px
    statPop: 1.4,         // ataque e vida pulsam
    pausaDepois: 280,     // respiro antes dos efeitos Ao Evoluir
  },
  numeros: {
    ms: 900,
    subirPx: 44,
    pop: 1.3,             // escala no começo
    pilhaPx: 20,          // números seguidos no mesmo alvo sobem em degraus
    contornoPx: 2.5,      // contorno em volta dos números, para ler sobre qualquer fundo
    contornoCor: '#fff',
    cores: { dano: '#e5483c', cura: '#3fcf62' },   // Escudo e Blindagem saem como os selos das cartas
    rotulos: { escudo: 'Escudo', escudoSocial: 'Álibi', bloq: 'Blindagem' },
  },
  // Mão e cartas em movimento.
  mao: {
    subirPx: 12,          // carta sob o mouse sobe
    escala: 1.05,         // e cresce um pouco
    inclinacao: 8,        // graus máximos de inclinação 3D seguindo o cursor
    brilho: 0.35,         // reflexo que acompanha o cursor (0 desliga)
    arcoMs: 340,          // carta jogada voa da mão até o destino
    arcoAltura: 0.3,      // altura do arco, em fração da distância
    arcoGiro: 6,          // graus de giro no meio do voo
    arcoEscalaFeitico: 0.8, // feitiços chegam um pouco menores e somem
    pousoMs: 200,         // a peça pousa com um leve aperto
    pousoEscala: 1.08,
    entradaMs: 260,       // peças do inimigo e criadas por efeito caem no lugar
    compraMs: 280,        // carta comprada chega à mão
    compraIntervalo: 90,  // entre cartas compradas juntas
    compraDesloc: 60,     // px de onde ela vem (direita e baixo)
    reflowMs: 220,        // cartas e peças que mudam de lugar deslizam
  },
  // Música ambiente: uma faixa em loop por estado, com troca suave entre elas.
  musica: {
    fadeMs: 1400,         // na troca, a faixa que sai some enquanto a que entra cresce
    retomar: true,        // ao voltar a um estado, a faixa continua de onde parou (false: recomeça)
    // Arquivos em assets/audio/music/<estado>_<n>.ogg (ou .wav); sorteia uma variação quando o estado começa.
    faixas: {
      menu:    { arqs: 1, vol: 0.5 },    // título, guilda, cidade e o resto fora da dungeon
      mapa:    { arqs: 1, vol: 0.5 },    // descida: mapa, eventos e cenas da dungeon
      combate: { arqs: 1, vol: 0.55 },   // batalhas comuns, Elites e defesas
      chefe:   { arqs: 1, vol: 0.6 },    // chefes
      social:  { arqs: 1, vol: 0.5 },    // negociações
    },
  },
  // Arquivos em assets/audio/sfx/<nome>_<n>.ogg (ou .wav), de 1 até arqs; um sorteado a cada toque.
  // vol multiplica o volume de efeitos; etapa 0 toca na hora, 1 depois de etapaMs, 2 depois do dobro.
  sons: {
    comprar:       { arqs: 3, vol: 0.55, etapa: 1 },   // carta comprada ou criada na sua mão
    embaralhar:    { arqs: 1, vol: 0.6,  etapa: 0 },   // troca da mão inicial
    jogar:         { arqs: 2, vol: 0.7,  etapa: 0 },   // carta jogada, sua ou do inimigo
    impacto:       { arqs: 3, vol: 0.75, etapa: 1 },   // dano ou perda de vida
    impacto_forte: { arqs: 2, vol: 0.9,  etapa: 1 },   // dano de forteApartir ou mais
    bloqueio:      { arqs: 1, vol: 0.7,  etapa: 1 },   // Escudo ou Blindagem segurou o dano
    cura:          { arqs: 1, vol: 0.6,  etapa: 1 },   // líder recuperou vida
    morte:         { arqs: 2, vol: 0.8,  etapa: 2 },   // unidade morreu ou estrutura caiu
    evoluir:       { arqs: 2, vol: 0.8,  etapa: 0 },   // Evolução (Enfatizar na negociação)
  },
};
