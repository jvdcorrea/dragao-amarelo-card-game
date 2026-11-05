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
  // sem avanço, hit-stop, tremida nem flash; só o sumiço das unidades mortas). O padrão segue o prefers-reduced-motion.
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
  impacto: {
    hitStopMin: 50,       // congelamento no contato: min + porDano × dano, até max
    hitStopMax: 100,
    hitStopPorDano: 10,
    flashMs: 150,         // flash branco no alvo, depois do hit-stop
    flashOpacidade: 0.85,
    flashBloqueio: 0.45,  // flash mais fraco quando Escudo ou Blindagem segura o dano
    tremidaPxPorDano: 1.2,  // tremida da mesa: px por ponto de dano somado no golpe
    tremidaMaxPx: 9,        // teto da tremida
    tremidaMinDano: 2,      // abaixo disso, não treme
    tremidaMs: 260,
    tremidaSocial: 0.5,     // multiplicador na negociação
    morteMs: 340,           // unidade morta some
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
  },
};
