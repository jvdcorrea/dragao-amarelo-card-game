/* Inglês (P101): regras que não cabem no dicionário. */
I18N.regras.en = {
  // palavras-chave em destaque no texto das cartas (o português está em KW_PT, no ui.js)
  kw: 'Requires Tempo \\d|Tempo \\d(?: or \\d)?|On Enter|On Death|On Evolve|On Reveal|On Activate|Bloodprice \\d+|Ritual \\d+|Hurry \\d+|Foresee \\d+|Guard|Haste|Rush|Lethal|Drain|Shield|Ambush|Echo|Delay|Crystals|Crystal|Awaken|Traps|Trap|Orbit|Modules|Module|Sprout|Rooted|Root|Plating \\d+|Plating|Overheat|Pierce|Felines|Feline|Dragons|Dragon|Opener|Fallout|Sore Spot|Alibi|On Emphasize|(?:Greed|Vanity|Principles|Procedure|Respect) Profile|Composure|Resolve|Charm|Rumors|Rumor|Constructs|Construct|Rituals|Ritual|Charges|Charge|Evolve|Sacrifice',
  // frases que são só palavras-chave (“Guard. Echo.”)
  kwSo: 'Sore Spot|Alibi|Guard|Haste|Rush|Lethal|Drain|Shield|Ambush|Echo|Delay|Feline|Dragon|Construct|Orbit|Module|Trap|Ritual \\d+|Bloodprice \\d+|Hurry \\d+|Weapon \\d+/\\d+',
  // no social, o texto da batalha troca de vocabulário
  social: [[/Not enough mana/g, 'Not enough Charm'], [/ Health/g, ' Composure'], [/ mana/g, ' Charm'], [/units/g, 'Arguments'], [/ evolves: /g, ' gains Emphasis: '], [/ dies\./g, ' falls apart.']],
};
// O jogador aparece como “You” nas frases feitas para qualquer líder (“{0} plays {1}”): acerta o verbo e a maiúscula.
const EN_VERBOS = { is: 'are', was: 'were', has: 'have', does: 'do', goes: 'go' };
I18N.ajuste('en', s => (s.indexOf('You') < 0 ? s : s
  .replace(/\bYou’s\b/g, 'Your')
  .replace(/\b(attacks|with|to|at|on|against|hits) You\b/g, '$1 you')
  .replace(/\bYou (is|was|has|does|goes)\b/g, (m, v) => 'You ' + EN_VERBOS[v])
  .replace(/\bYou (plays|attacks|gains|loses|takes|draws|evolves|overheats|reveals|returns|comes|falls|arrives|appears|breaks|dies|sprouts|gets|casts|destroys|gives|restores)\b/g, (m, v) => 'You ' + v.slice(0, -1))));
