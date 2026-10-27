import { playerState } from "../state.js";
import { startChapter } from "./chapterRunner.js";

function getChoiceEcho(scene, nodeId, variants, fallback = "") {
  const previous = (scene?.choiceHistory || []).slice().reverse()
    .find(choice => choice?.nodeId === nodeId);
  return variants[previous?.choiceId] || fallback;
}

function getProudReasonText() {
  if (playerState.proudReason === "save") {
    return "Au fond, j'ai toujours voulu croire que sauver quelqu'un suffisait encore à donner un sens à tout le reste.";
  }
  if (playerState.proudReason === "useful") {
    return "Au fond, j'avais besoin d'être utile. Tant que je pouvais servir à quelque chose, tout me paraissait encore tenir debout.";
  }
  if (playerState.proudReason === "exist") {
    return "Au fond, ce métier m'avait donné une place. Sans lui, je ne sais même pas si j'aurais su qui j'étais.";
  }
  return "";
}

function getBeliefHelpedText() {
  if (playerState.beliefHelped === true) {
    return "À cette époque, je croyais encore qu'on pouvait réellement soulager un peu la souffrance du monde.";
  }
  if (playerState.beliefHelped === false) {
    return "À cette époque déjà, une part de moi savait que nous arrivions souvent trop tard, et que je me mentais peut-être depuis longtemps.";
  }
  return "";
}
function getSirenReactionText() {
  if (playerState.traumaLoad >= 2 && playerState.tendernessToAngela >= 2) {
    return "Pendant une seconde, je n'ai pas seulement entendu une sirène. J'ai revu le visage de Nana à l'hôpital. Sa peur. Sa gifle. Et cette certitude atroce qu'un jour je pourrais ne pas rentrer.";
  }

  if (playerState.dutyAnchor >= 2) {
    return "Le bruit m'a traversé comme un ordre ancien. Mon corps savait déjà quoi faire avant même que je me l'avoue.";
  }

  if (playerState.familyAnchor >= 2) {
    return "Avant même de penser à la caserne, j'ai pensé à eux. Aux enfants. À Angela. À ce que cette alerte pouvait leur prendre.";
  }

  return "Le bruit m'a figé une seconde. Juste assez pour comprendre que plus rien ne serait normal à partir de maintenant.";
}

function getWaitingStateText() {
  if (playerState.stress >= 3) {
    return "Je sentais mes nerfs se tendre minute après minute. L'attente me paraissait pire que l'action.";
  }

  if (playerState.familyAnchor >= 3) {
    return "Chaque minute passée ici me donnait l'impression absurde d'être au mauvais endroit. Ma place aurait dû être auprès d'eux.";
  }

  if (playerState.selfControl >= 2) {
    return "Je faisais ce que j'avais toujours su faire : respirer, attendre, tenir.";
  }

  return "Le temps s'étirait d'une façon presque irréelle.";
}

function getBarracksExtraChoice() {
  if (playerState.traumaLoad >= 3) {
    return {
      id: "c2_barracks_breath",
      label: "Prendre une seconde pour reprendre mon souffle.",
      next: "c2_war_declared"
    };
  }
  return null;
}

function getMikaInnerColor() {
  if (playerState.traumaLoad >= 4 && playerState.tendernessToAngela >= 3) {
    return "Tout revenait avec trop de netteté. Les souvenirs n'étaient plus des souvenirs. C'étaient des blessures encore ouvertes.";
  }

  if (playerState.dutyAnchor >= 4) {
    return "Je continuais d'avancer comme je l'avais toujours fait : en mettant un pied devant l'autre, sans me demander tout de suite ce que cela me coûtait.";
  }

  if (playerState.familyAnchor >= 4) {
    return "Plus les choses se dégradaient, plus une seule idée revenait : protéger les miens, même si je n'avais aucune idée de la façon d'y parvenir.";
  }

  if (playerState.politicalLucidity >= 4) {
    return "Je voyais désormais le mécanisme presque clairement. La peur, la colère, le pouvoir. Tout s'enchaînait avec une logique monstrueuse.";
  }

  return "Je sentais seulement que quelque chose se refermait sur nous, lentement, sûrement.";
}

function getAngelaMemoryEcho() {
  if (playerState.tendernessToAngela >= 4) {
    return "Chaque fois que je pensais à elle, ce n'était pas une image qui revenait d'abord. C'était une présence. Une chaleur. Une façon d'être au monde moins seul.";
  }

  if (playerState.tendernessToAngela >= 2) {
    return "Penser à Angela, c'était encore trouver un point fixe au milieu du reste.";
  }

  return "Même en pensant à elle, tout me paraissait déjà plus fragile qu'avant.";
}

function getStressReactionChoice() {
  if (playerState.stress >= 4) {
    return {
      id: "c2_wait_crack",
      label: "Sentir que je commençais à craquer.",
      next: "c2_cigarette_outside"
    };
  }
  return null;
}

const NODES = {
    // =========================
// CHAPITRE 2 - LE DECLIN
// Bloc 1 : bascule politique + fausse normalité + adoption
// =========================
c2_intro: {
    id: "c2_intro",
  label: "Le lendemain",
  kind: "choice",
  visualFx: "rubble",
  image: "./assets/image_fond/scene1/black_soft.png",
    transition: "fade",
    text: "Le lendemain, il n'y avait déjà plus personne aux commandes.",
    choices: [
      { id: "c2_begin", label: "Se souvenir.", next: "c2_governor_resigns" }
    ]
  },

c2_governor_resigns: {

  id: "c2_governor_resigns",
  label: "Démission du gouverneur",
  kind: "choice",
  visualFx: "tvBlue",
  image: "./assets/image_fond/scene1/ch1_t2_governor.png",
  transition: "fade",
  text:
    "Comme on pouvait s'y attendre, dès le lendemain et devant cette écrasante victoire de la Ligue, " +
    "le gouverneur présenta sa démission.\n\n" +
    "Je ne me souviens pas de tout son discours. " +
    "Je me souviens de ses excuses. " +
    "Je me souviens de son ton. " +
    "La voix d'un homme déjà à terre.\n\n" +
    "Puis il s'est levé. " +
    "Face caméra, il a souhaité bon courage à l'ensemble des citoyens.\n\n" +
    "Et il a quitté la pièce. " +
    "Laissant derrière lui le bureau vide.",
  choiceReveal: { initialDelayMs: 450, staggerMs: 260 },
  choices: [
    { id: "c2_resigns_excuses", label: "Écouter ses excuses.", next: "c2_vornic_elected" },
    { id: "c2_resigns_emptydesk", label: "Regarder le bureau vide.", next: "c2_vornic_elected" },
    { id: "c2_resigns_understand", label: "Comprendre ce que ce vide annonce.", next: "c2_vornic_elected" }
  ]
},

c2_vornic_elected: {
  id: "c2_vornic_elected",
  label: "Vornic",
  kind: "choice",
  visualFx: "ligueRed",
  image: "./assets/image_fond/scene1/ligue_rise.png",
  transition: "fade",
  text:
    "Dans la foulée, la chambre des députés élut un nouveau gouverneur.\n\n" +
    "Sans surprise, le plus radical et le plus charismatique des dirigeants de la Ligue prit le pouvoir.\n\n" +
    "Vornic.\n\n" +
    "Son nom résonne encore pour moi comme une injure. " +
    "Une insulte à tout ce en quoi je croyais.\n\n" +
    "Il avait ce regard bleu acier qui glaçait le sang. " +
    "Et ce sourire capable de faire passer les idées les plus dures pour les paroles d'un enfant de chœur.",
  choiceReveal: { initialDelayMs: 450, staggerMs: 260 },
  choices: [
    { id: "c2_vornic_monster", label: "Le regarder comme un monstre.", next: "c2_full_powers" },
    { id: "c2_vornic_charisma", label: "Admettre qu'il savait convaincre.", next: "c2_full_powers" },
    { id: "c2_vornic_people", label: "Se demander comment les gens ont pu le suivre.", next: "c2_full_powers" }
  ]
},

c2_full_powers: {
  id: "c2_full_powers",
  label: "Les pleins pouvoirs",
  kind: "choice",
  visualFx: "ligueRed",
  image: "./assets/image_fond/scene1/ligue_election.png",
  transition: "fade",
  text:
    "Le soir même, devant 'l'urgence de la situation', comme il disait, " +
    "les pleins pouvoirs lui furent accordés.\n\n" +
    "En moins de vingt-quatre heures, " +
    "sans coup d'État, " +
    "sans chars dans les rues, " +
    "nous étions passés d'une démocratie à une dictature.\n\n" +
    "Et dehors, " +
    "la foule applaudissait.",
  choiceReveal: { initialDelayMs: 450, staggerMs: 260 },
  choices: [
    { id: "c2_power_fast", label: "Comprendre que tout allait désormais aller très vite.", next: "c2_stay_or_leave" },
    { id: "c2_power_denial", label: "Refuser encore d'y croire tout à fait.", next: "c2_stay_or_leave" },
    { id: "c2_power_children", label: "Penser d'abord aux enfants.", next: "c2_stay_or_leave" }
  ]
},

c2_stay_or_leave: {
  id: "c2_stay_or_leave",
  label: "Rester ou partir",
  kind: "choice",
  visualFx: "homeWarm",
  image: "./assets/image_fond/scene1/home_evening.png",
  transition: "fade",
  text:
    "Angela et moi savions déjà que les changements n'iraient pas dans le sens que nous espérions. " +
    "Les lois viendraient. " +
    "L'école changerait. " +
    "La rue aussi.\n\n" +
    "Si nous l'avions pu, " +
    "nous serions partis tout de suite. " +
    "Nous ne voulions pas élever les enfants là-dedans.\n\n" +
    "Mais pour aller où ? " +
    "Notre vie était ici. " +
    "Nos familles aussi.\n\n" +
    "Alors nous avons décidé de rester. " +
    "Et, s'il le fallait, " +
    "de nous battre pour nos valeurs.",
  choiceReveal: { initialDelayMs: 500, staggerMs: 300 },
  choices: [
  { id: "c2_stay_nowhere", label: "Rester parce que nous n'avions nulle part où aller.", next: "c2_daily_life" },
  { id: "c2_stay_hold", label: "Rester parce qu'il fallait tenir ici.", next: "c2_daily_life" },
  { id: "c2_stay_values", label: "Rester parce qu'abandonner aurait été trahir nos valeurs.", next: "c2_daily_life" },
  {
    id: "c2_stay_protect",
    label: "Rester parce qu'il faudrait bien que quelqu'un protège encore les autres.",
    next: "c2_daily_life",
    condition: (state) => state.proudReason === "save"
  }
]
},

c2_daily_life: {
  id: "c2_daily_life",
  label: "La vie continue",
  kind: "choice",
  visualFx: "homeWarm",
  image: "./assets/image_fond/scene1/ch1_h1_home.png",
  transition: "fade",
  text:
  () => "Les premiers temps, " +
  "malgré la présence croissante des milices dans les rues, " +
  "la vie semblait continuer presque normalement.\n\n" +
  "Angela et moi partions travailler comme avant. " +
  "Les enfants allaient à l'école. " +
  "À notre niveau, du moins, " +
  "rien n'avait encore vraiment changé.\n\n" +
  "Bien sûr, on sentait les tensions monter. " +
  "Mais elles restaient encore à distance. " +
  "Comme un orage qu'on voit au loin.\n\n" +
  getBeliefHelpedText(),
  choiceReveal: { initialDelayMs: 450, staggerMs: 260 },
  choices: [
    { id: "c2_daily_normal", label: "S'accrocher à cette normalité.", next: "c2_night_shift_reflection" },
    { id: "c2_daily_cracks", label: "Voir qu'elle était déjà fissurée.", next: "c2_night_shift_reflection" },
    { id: "c2_daily_routine", label: "Se réfugier dans la routine.", next: "c2_night_shift_reflection" }
  ]
},

c2_night_shift_reflection: {
  id: "c2_night_shift_reflection",
  label: "Les gardes de nuit",
  kind: "choice",
  visualFx: "firehouseCold",
  image: "./assets/image_fond/scene1/locker_room.png",
  transition: "fade",
  text:
  () => "Je travaillais souvent de nuit à cette époque. " +
  "J'aimais ça. " +
  "J'ai toujours préféré la nuit au jour.\n\n" +
  "Dans l'obscurité, " +
  "les choses me semblaient plus claires. " +
  "Les gens aussi.\n\n" +
  "Bien sûr, " +
  "notre vie de couple en prenait un coup. " +
  "Mais Angela et moi étions assez proches pour que les rares instants ensemble comptent vraiment.\n\n" +
  getProudReasonText(),
  choiceReveal: { initialDelayMs: 450, staggerMs: 260 },
  choices: [
    { id: "c2_night_work", label: "Penser au métier.", next: "c2_adoption_memory_intro" },
    { id: "c2_night_angela", label: "Penser à Angela.", next: "c2_adoption_memory_intro" },
    { id: "c2_night_cost", label: "Penser à ce que ce rythme nous coûtait.", next: "c2_adoption_memory_intro" }
  ]
},

c2_adoption_memory_intro: {

  id: "c2_adoption_memory_intro",
  label: "Le souvenir de l’adoption",
  kind: "choice",
  visualFx: "homeWarm",
  image: "./assets/image_fond/scene1/home_evening.png",
  transition: "fade",
  text:
    "Pour nous, " +
    "tout semblait presque s'arranger.\n\n" +
    "La mère biologique des enfants, " +
    "après de nombreux problèmes personnels, " +
    "avait renoncé à ses droits parentaux.\n\n" +
    "Je me souviens de ce jour où nous sommes allés tous ensemble au tribunal, " +
    "pour que l'adoption par Nana soit enfin officielle.\n\n" +
    "Rien que d'y repenser, " +
    "je sens encore remonter l'émotion.",
  choiceReveal: { initialDelayMs: 450, staggerMs: 260 },
  choices: [
    { id: "c2_adoption_memory", label: "Laisser le souvenir revenir.", next: "c2_courtroom" },
    { id: "c2_adoption_angela", label: "S'attarder sur Angela.", next: "c2_courtroom" },
    { id: "c2_adoption_present", label: "La douleur du présent me traverse encore.", next: "c2_courtroom" }
  ]
},

c2_courtroom: {
  id: "c2_courtroom",
  label: "Au tribunal",
  kind: "choice",
  visualFx: "homeWarm",
  image: "./assets/image_fond/scene1/home_evening.png",
  transition: "fade",
  text:
    "Nous étions tous les cinq dans le bureau du juge aux affaires familiales.\n\n" +
    "Je revois Angela prendre les enfants dans ses bras. " +
    "Tous les trois. " +
    "Fort.\n\n" +
    "Et je revois aussi le visage du juge. " +
    "Froid. " +
    "Inexpressif.\n\n" +
    "Comme s'il assistait à quelque chose de banal, " +
    "alors que, pour nous, " +
    "tout changeait.",
  choiceReveal: { initialDelayMs: 450, staggerMs: 260 },
  choices: [
    { id: "c2_court_children", label: "Regarder les enfants.", next: "c2_angela_becomes_mother" },
    { id: "c2_court_sign", label: "Regarder Angela signer.", next: "c2_angela_becomes_mother" },
    { id: "c2_court_judge", label: "Regarder le juge.", next: "c2_angela_becomes_mother" }
  ]
},

c2_angela_becomes_mother: {
  id: "c2_angela_becomes_mother",
  label: "Angela devient leur mère",
  kind: "choice",
  visualFx: "homeWarm",
  image: "./assets/image_fond/scene1/kitchen_back_kiss.png",
  transition: "fade",
  text:
    "Après cette étreinte avec les enfants, " +
    "Angela s'était avancée vers moi.\n\n" +
    "Je ne lui avais jamais vu ce regard-là. " +
    "Doux. " +
    "Reconnaissant. " +
    "Déterminé.\n\n" +
    "J'ai encore sur les lèvres la sensation de ses baisers.\n\n" +
    "C'était fait. " +
    "Enfin. " +
    "Elle était la mère qu'elle devait être. " +
    "Et cette fois, " +
    "elle l'était de plein droit.",
  choiceReveal: { initialDelayMs: 500, staggerMs: 300 },
  choices: [
    { id: "c2_angela_mother", label: "La voir comme la mère des enfants.", next: "c2_autumn_walk" },
    { id: "c2_angela_companion", label: "La voir comme ma compagne.", next: "c2_autumn_walk" },
    { id: "c2_angela_arrived", label: "Me dire qu'on y était enfin arrivés.", next: "c2_autumn_walk" }
  ]
},

c2_autumn_walk: {
  id: "c2_autumn_walk",
  label: "Promenade d’automne",
  kind: "choice",
  visualFx: "homeWarm",
  image: "./assets/image_fond/scene1/home_evening.png",
  transition: "fade",
  text:
    "C'était un mercredi, je crois. " +
    "Nous avions fait manquer la matinée d'école aux enfants. " +
    "Ce qui, évidemment, ne les avait pas contrariés.\n\n" +
    "Il faisait un temps magnifique pour ce début d'automne. " +
    "Les feuilles tombaient comme des flocons ambrés. " +
    "Tout semblait calme. " +
    "Serein. " +
    "Presque irréel.\n\n" +
    "Nous prenions le chemin du restaurant. " +
    "Juste une pizza. " +
    "C'était les enfants qui avaient choisi.",
  choiceReveal: { initialDelayMs: 500, staggerMs: 300 },
  choices: [
    { id: "c2_walk_enjoy", label: "Profiter de l'instant.", next: "c2_restaurant_plan" },
    { id: "c2_walk_children", label: "Regarder les enfants.", next: "c2_restaurant_plan" },
    { id: "c2_walk_fragile", label: "Essayer de retenir chaque détail de cette matinée.", next: "c2_restaurant_plan" }
  ]
},

c2_restaurant_plan: {
  id: "c2_restaurant_plan",
  label: "Fêter la famille",
  kind: "choice",
  visualFx: "homeWarm",
  image: "./assets/image_fond/scene1/home_evening.png",
  transition: "fade",
  text:
    (scene) =>
    "On allait simplement fêter ça. Notre famille. Cette nouvelle vie.\n\n" +
    "Quelque chose de simple. Quelque chose de normal.\n\n" +
    getChoiceEcho(scene, "c2_autumn_walk", {
      c2_walk_enjoy: "Je me laissais gagner par leur bonne humeur.",
      c2_walk_children: "Je regardais les enfants discuter de ce qu'ils allaient commander.",
      c2_walk_fragile: "Je voulais garder en mémoire les feuilles, la lumière et leurs voix."
    }, "Ce jour-là, nous avions toutes les raisons d'être heureux."),
  choices: [
    { id: "c2_to_gunshot_memory", label: "Repenser à ce qu'Angela avait déjà traversé avec moi.", next: "c2_gunshot_memory_intro" }
  ]
},

c2_gunshot_memory_intro: {

  id: "c2_gunshot_memory_intro",
  label: "La peur d’Angela",
  kind: "choice",
  visualFx: "rubble",
  image: "./assets/image_fond/scene1/memory_fragments_2.png",
  transition: "fade",
  text:
    "Bien avant cette matinée au tribunal, Nana avait déjà eu peur de me perdre en intervention.\n\n" +
    "Elle ne m'avait pas connu avant que je sois pompier. " +
    "Et les alertes avaient toujours rythmé notre vie.\n\n" +
    "Il était arrivé par deux fois qu'elle reçoive un appel de mon chef de garde pour lui annoncer que j'avais eu un problème. " +
    "La première fois, ce n'était pas très grave.\n\n" +
    "Je crois que ce qui la hantait encore, " +
    "c'était surtout la deuxième.",
  choiceReveal: { initialDelayMs: 450, staggerMs: 260 },
  choices: [
    { id: "c2_gunshot_herfear", label: "Repenser à sa peur.", next: "c2_drunk_man_scene" },
    { id: "c2_gunshot_myfault", label: "Repenser à ma propre inconscience.", next: "c2_drunk_man_scene" },
    { id: "c2_gunshot_minimize", label: "Me dire que j'avais survécu, après tout.", next: "c2_drunk_man_scene" }
  ]
},

c2_drunk_man_scene: {
  id: "c2_drunk_man_scene",
  label: "L’intervention",
  kind: "choice",
  visualFx: "rubble",
  image: "./assets/image_fond/scene1/memory_fragments_2.png",
  transition: "fade",
  text:
    "Il faisait nuit. " +
    "On avait été appelés pour un homme blessé à son domicile.\n\n" +
    "Il s'était blessé lui-même avec un tesson de bouteille. " +
    "Il s'était drogué. " +
    "Il avait bu.\n\n" +
    "Le salon était retourné. " +
    "Bouteilles vides. " +
    "Biscuits apéritifs. " +
    "Lignes de poudre sur la table basse.\n\n" +
    "Il était agressif. " +
    "Les gendarmes étaient dehors. " +
    "Et moi, " +
    "j'étais seul avec lui quand la situation m'a échappé.",
  choiceReveal: { initialDelayMs: 450, staggerMs: 260 },
  choices: [
    { id: "c2_drunk_danger", label: "Me souvenir du danger.", next: "c2_shot" },
    { id: "c2_drunk_error", label: "Me souvenir de l'instant où j'ai compris trop tard.", next: "c2_shot" },
    { id: "c2_drunk_chaos", label: "Me souvenir surtout du chaos.", next: "c2_shot" }
  ]
},

c2_shot: {
  id: "c2_shot",
  label: "Le coup de feu",
  kind: "choice",
  visualFx: "rubble",
  image: "./assets/image_fond/scene1/fire_silhouette.png",
  transition: "fade",
  text:
    "L'homme a bondi sur le côté du canapé. " +
    "Il a sorti un fusil. " +
    "Il a visé.\n\n" +
    "Il a tiré.\n\n" +
    "Je me souviens avoir heurté le mur derrière moi avant même de comprendre ce qu'il venait de se passer. " +
    "Avant même de sentir la balle dans mon torse.\n\n" +
    "Pour la suite, " +
    "je ne sais que ce qu'on m'a raconté. " +
    "J'étais déjà au bloc.",
  choiceReveal: { initialDelayMs: 450, staggerMs: 260 },
  choices: [
    { id: "c2_shot_pain", label: "Revenir à la douleur.", next: "c2_hospital_angela" },
    { id: "c2_shot_luck", label: "Me dire que j'avais eu de la chance.", next: "c2_hospital_angela" },
    { id: "c2_shot_her", label: "Penser à ce qu'Angela a dû vivre.", next: "c2_hospital_angela" }
  ]
},

c2_hospital_angela: {
  id: "c2_hospital_angela",
  label: "À l’hôpital",
  kind: "choice",
  visualFx: "homeWarm",
  image: "./assets/image_fond/scene1/ch1_f2_talk.png",
  transition: "fade",
  text:
    "Quand je me suis réveillé, " +
    "on m'a ramené en chambre. " +
    "Nana m'y attendait déjà.\n\n" +
    "Je crois qu'elle était passée par toutes les émotions. " +
    "J'ai eu droit à un immense baiser. " +
    "À une déclaration d'amour comme jamais elle ne m'en avait faite. " +
    "Et à une gifle à m'en décrocher la mâchoire.\n\n" +
    "Ce jour-là, à l'hôpital, j'avais compris à quel point elle avait eu peur. " +
    "Bien après ma sortie, chacun de mes départs continuerait de l'inquiéter.",
  choiceReveal: { initialDelayMs: 500, staggerMs: 300 },
  choices: [
    { id: "c2_hospital_love", label: "Retenir son amour.", next: "c2_siren" },
    { id: "c2_hospital_fear", label: "Retenir sa peur.", next: "c2_siren" },
    { id: "c2_hospital_anger", label: "Retenir sa colère.", next: "c2_siren" }
  ]
},

c2_siren: {
  id: "c2_siren",
  label: "La sirène",
  kind: "choice",
  visualFx: "streetCold",
  image: "./assets/image_fond/scene1/street_tensions.png",
  transition: "fade",
  text:
  () => "Le souvenir de l'hôpital s'efface. Je retrouve cette matinée d'automne : " +
  "Angela, les enfants, le chemin du restaurant. Nous allions fêter l'adoption.\n\n" +
  "Un bruit long et persistant a retenti dans toutes les rues de la ville.\n\n" +
  "La sirène d'alerte générale.\n\n" +
  "C'était la première fois que je l'entendais autrement que pour un essai. " +
  "Quelque chose de grave venait de se produire.\n\n" +
  getSirenReactionText() + "\n\n" +
  "Je connaissais la chanson. " +
  "Je devais partir.",
  choiceReveal: { initialDelayMs: 500, staggerMs: 300 },
  choices: [
    { id: "c2_siren_firefighter", label: "Redevenir pompier immédiatement.", next: "c2_goodbye_family" },
    { id: "c2_siren_angela", label: "Regarder d'abord Angela.", next: "c2_goodbye_family" },
    { id: "c2_siren_children", label: "Regarder d'abord les enfants.", next: "c2_goodbye_family" }
  ]
},

c2_goodbye_family: {
  id: "c2_goodbye_family",
  label: "Les adieux",
  kind: "choice",
  visualFx: "homeWarm",
  image: "./assets/image_fond/scene1/kitchen_back_kiss.png",
  transition: "fade",
  text:
  () => "J'ai embrassé les enfants sur le front. " +
  "Puis j'ai serré Nana longuement dans mes bras.\n\n" +
  "\"Je te tiens au courant chérie. " +
  "Rentre à la maison avec les enfants, c'est plus sûr. " +
  "Tu passeras chercher une pizza au kiosque de la place de l'église.\"\n\n" +
  "Elle me serrait fort. " +
  "Elle me supplia de faire attention. " +
  "De ne rien faire de stupide.\n\n" +
  getAngelaMemoryEcho() + "\n\n" +
  "Je l'ai embrassée pour tenter de la rassurer.",
  choiceReveal: { initialDelayMs: 500, staggerMs: 300 },
  choices: [
  { id: "c2_goodbye_fast", label: "Partir tout de suite.", next: "c2_run_to_barracks" },
  { id: "c2_goodbye_reassure", label: "Prendre une seconde de plus pour la rassurer.", next: "c2_run_to_barracks" },
  { id: "c2_goodbye_promise", label: "Promettre de la tenir au courant.", next: "c2_run_to_barracks" },
  { id: "c2_goodbye_hold", label: "Rester une seconde de trop contre elle.", next: "c2_run_to_barracks",
    condition: (state) => state.tendernessToAngela >= 3
  }
]
},

c2_run_to_barracks: {
  id: "c2_run_to_barracks",
  label: "Vers la caserne",
  kind: "choice",
  visualFx: "firehouseCold",
  image: "./assets/image_fond/scene1/locker_room.png",
  transition: "fade",
  text:
    "Je tournais les talons et je rejoignais en courant ma caserne à quelques centaines de mètres à peine.\n\n" +
    "En chemin, " +
    "je me disais que Nana se faisait toujours du mauvais sang quand je partais en intervention. " +
    "Et qu'elle avait de bonnes raisons pour ça.\n\n" +
    "Je me retournais dans ma course. " +
    "Je croisai son regard. " +
    "Je lui envoyai un baiser de la main. " +
    "Elle me cria qu'elle m'aimait. " +
    "Je lui répondis que moi aussi.",
  choiceReveal: { initialDelayMs: 450, staggerMs: 260 },
  choices: [
    { id: "c2_run_nolook", label: "Courir sans plus me retourner.", next: "c2_barracks_arrival" },
    { id: "c2_run_lastlook", label: "Garder encore un instant son regard avec moi.", next: "c2_barracks_arrival" },
    { id: "c2_run_cutoff", label: "Refouler tout le reste et avancer.", next: "c2_barracks_arrival" }
  ]
},

c2_barracks_arrival: {
  id: "c2_barracks_arrival",
  label: "C’est la guerre",
  kind: "choice",
  visualFx: "firehouseCold",
  image: "./assets/image_fond/scene1/locker_room.png",
  transition: "fade",
  text:
    () => "J'arrivai rapidement au centre. " +
    "Les hommes de la garde étaient déjà là.\n\n" +
    "Je rentrai dans la salle radio pour aller aux nouvelles. " +
    "Un caporal nouvellement arrivé me lança : " +
    "\"Tu devrais te mettre en tenue sergent, " +
    "c'est la guerre.\"\n\n" +
    "On utilise souvent cette expression. " +
    "Mais là, " +
    "il avait un air grave.\n\n" +
    "Je regardai le fax.\n\n" +
    "La guerre était déclarée.\n\n" +
    getProudReasonText() ,
  choiceReveal: { initialDelayMs: 450, staggerMs: 260 },
  choices: () => [
  { id: "c2_barracks_expression", label: "Me raccrocher un instant au sens habituel de cette expression.", next: "c2_war_declared" },
  { id: "c2_barracks_understand", label: "Comprendre immédiatement.", next: "c2_war_declared" },
  { id: "c2_barracks_absorb", label: "Encaisser sans commenter.", next: "c2_war_declared" },
  {
    id: "c2_barracks_bitter",
    label: "Me dire qu'on allait encore ramasser ce que d'autres avaient laissé pourrir.",
    next: "c2_war_declared",
    condition: (state) => state.beliefHelped === false
  },
  ...(getBarracksExtraChoice() ? [getBarracksExtraChoice()] : [])
]
},

c2_war_declared: {
  id: "c2_war_declared",
  label: "La dépêche",
  kind: "choice",
  visualFx: "tvBlue",
  image: "./assets/image_fond/scene1/ch1_t1_tv_alert.png",
  transition: "fade",
  text:
    "Tous les services étaient mobilisés en urgence. " +
    "Gendarmerie. " +
    "Police. " +
    "Pompiers. " +
    "Hôpitaux. " +
    "Armée.\n\n" +
    "La dépêche disait seulement que nous venions d'entrer en guerre " +
    "et que des attaques étaient imminentes.\n\n" +
    "On ne savait pas contre qui. " +
    "Ni pourquoi.",
  choiceReveal: { initialDelayMs: 450, staggerMs: 260 },
  choices: [
    { id: "c2_war_city", label: "Penser à la ville.", next: "c2_mobilisation" },
    { id: "c2_war_family", label: "Penser à ma famille.", next: "c2_mobilisation" },
    { id: "c2_war_mission", label: "Penser à ce qu'on allait devoir faire.", next: "c2_mobilisation" }
  ]
},

c2_mobilisation: {
  id: "c2_mobilisation",
  label: "La mobilisation",
  kind: "choice",
  visualFx: "firehouseCold",
  image: "./assets/image_fond/scene1/locker_room.png",
  transition: "fade",
  text:
    "Sur les hommes de la caserne, " +
    "nous n'étions qu'une partie à avoir répondu à l'appel. " +
    "Les autres n'avaient peut-être pas entendu la sirène. " +
    "Ou avaient rejoint un centre plus proche.\n\n" +
    "On s'était réparti les piquets à la hâte. " +
    "J'étais au fourgon incendie numéro un.",
  choiceReveal: { initialDelayMs: 450, staggerMs: 260 },
  choices: [
    { id: "c2_mob_accept", label: "Accepter ma place sans réfléchir.", next: "c2_gear_check" },
    { id: "c2_mob_colleagues", label: "Chercher les autres du regard.", next: "c2_gear_check" },
    { id: "c2_mob_numbers", label: "Mesurer déjà ce qui nous manquait.", next: "c2_gear_check" }
  ]
},

c2_gear_check: {
  id: "c2_gear_check",
  label: "Le matériel et la photo",
  kind: "choice",
  visualFx: "firehouseCold",
  image: "./assets/image_fond/scene1/locker_room.png",
  transition: "fade",
  text:
    "Les premières heures, " +
    "il ne se passa rien. " +
    "Alors nous avons vérifié les véhicules, " +
    "l'équipement, " +
    "le matériel.\n\n" +
    "Par précaution, " +
    "le chef de garde nous demanda de porter les gilets pare-balles. " +
    "Je détestais ça.\n\n" +
    "Dans mon casque, " +
    "glissée sous la résille, " +
    "il y avait une photo de Nana et des enfants. " +
    "Je la regardais avant chaque intervention.",
  choiceReveal: { initialDelayMs: 500, staggerMs: 300 },
  choices: [
    { id: "c2_gear_check", label: "Vérifier le matériel.", next: "c2_failed_call_home" },
    { id: "c2_gear_photo", label: "Regarder la photo.", next: "c2_failed_call_home" },
    { id: "c2_gear_call", label: "Essayer encore d'appeler.", next: "c2_failed_call_home" }
  ]
},

c2_failed_call_home: {
  id: "c2_failed_call_home",
  label: "Un appel impossible",
  kind: "choice",
  visualFx: "firehouseCold",
  image: "./assets/image_fond/scene1/ch1_f1_kitchen.png",
  transition: "fade",
  text:
    "Depuis le début de l'alerte, " +
    "les lignes téléphoniques étaient saturées. " +
    "Impossible de joindre qui que ce soit.\n\n" +
    "J'essayais sans cesse d'appeler Angela. " +
    "Pour lui dire le peu que je savais. " +
    "Pour la rassurer. " +
    "Ou me rassurer moi-même.\n\n" +
    "Rien à faire. " +
    "Toujours le même message préenregistré.",
  choiceReveal: { initialDelayMs: 450, staggerMs: 260 },
  choices: [
    { id: "c2_call_insist", label: "M'acharner encore.", next: "c2_waiting" },
    { id: "c2_call_focus", label: "Abandonner et me concentrer.", next: "c2_waiting" },
    { id: "c2_call_photo", label: "Me contenter de regarder la photo.", next: "c2_waiting" }
  ]
},

c2_waiting: {
  id: "c2_waiting",
  label: "L’attente",
  kind: "choice",
  visualFx: "firehouseCold",
  image: "./assets/image_fond/scene1/locker_room.png",
  transition: "fade",
  text:
  () => "Je regardais les minutes défiler au ralenti. " +
  "Je détestais ça.\n\n" +
  "On recevait des appels, oui. " +
  "Mais des interventions normales. " +
  "Rien de plus.\n\n" +
  "Certains ironisaient autour de la machine à café. " +
  "Moi, " +
  "je n'avais qu'une envie : rentrer chez moi. " +
  "Fêter avec Nana son nouveau statut de maman.\n\n" +
  getWaitingStateText() + "\n\n" +
  getMikaInnerColor(),
  choiceReveal: { initialDelayMs: 500, staggerMs: 300 },
  choices: () => [
  { id: "c2_wait_inside", label: "Attendre encore un peu avant de sortir.", next: "c2_cigarette_outside" },
  { id: "c2_wait_smoke", label: "Sortir fumer sur la murette.", next: "c2_cigarette_outside" },
  { id: "c2_wait_family", label: "Ressasser la journée avec eux.", next: "c2_cigarette_outside" },
  ...(getStressReactionChoice() ? [getStressReactionChoice()] : [])
]
},

c2_cigarette_outside: {
  id: "c2_cigarette_outside",
  label: "Sur la murette",
  kind: "choice",
  visualFx: "streetCold",
  image: "./assets/image_fond/scene1/street_tensions.png",
  transition: "fade",
  text:
    (scene) =>
    getChoiceEcho(scene, "c2_waiting", {
      c2_wait_inside: "J'étais resté encore un moment à l'intérieur, puis j'avais fini par sortir.\n\n",
      c2_wait_smoke: "J'étais sorti prendre cette pause que je repoussais depuis le début de l'alerte.\n\n",
      c2_wait_family: "À force de repenser à cette matinée avec eux, je n'arrivais plus à suivre les conversations. J'avais fini par sortir.\n\n",
      c2_wait_crack: "L'attente devenait trop lourde. J'étais sorti pour reprendre un peu d'air.\n\n"
    }) +
    "J'étais assis sur la murette, une cigarette entre les doigts.\n\n" +
    "Nana détestait que je fume. Elle le sentait toujours sur mes vêtements. Alors j'avais réduit.\n\n" +
    "Je regardais les gens passer dans la rue. Je rêvassais. " +
    "Comme si la journée pouvait encore reprendre un cours normal.",
  choiceReveal: { initialDelayMs: 450, staggerMs: 260 },
  choices: [
    { id: "c2_smoke_dream", label: "Rêvasser encore.", next: "c2_planes" },
    { id: "c2_smoke_watch", label: "Observer la rue.", next: "c2_planes" },
    { id: "c2_smoke_home", label: "Penser à rentrer.", next: "c2_planes" }
  ]
},

c2_planes: {
  id: "c2_planes",
  label: "Les avions",
  kind: "choice",
  visualFx: "streetCold",
  image: "./assets/image_fond/scene1/ch1_t3_escalation.png",
  transition: "fade",
  text:
    "Un bruit a résonné au-dessus de ma tête.\n\n" +
    "J'ai levé les yeux. " +
    "J'ai entrevu deux avions.",
  choices: [
    { id: "c2_planes_look", label: "Suivre les avions du regard.", next: "c2_explosions" },
    { id: "c2_planes_freeze", label: "Rester figé une seconde.", next: "c2_explosions" },
    { id: "c2_planes_late", label: "Chercher à comprendre ce qui se passait.", next: "c2_explosions" }
  ]
},

c2_explosions: {
  id: "c2_explosions",
  label: "Les explosions",
  kind: "choice",
  visualFx: "streetCold",
  image: "./assets/image_fond/scene1/street_tensions.png",
  transition: "fade",
  text:
    "Immédiatement, " +
    "quatre immenses explosions ont secoué la ville.\n\n" +
    "On aurait dit que le sol venait de s'effondrer. " +
    "Comme quatre tremblements de terre simultanés.\n\n" +
    "Tout le monde s'est figé. " +
    "Les voitures. " +
    "Les passants. " +
    "La rue entière.\n\n" +
    "Puis le bruit strident de mon bipper m'a arraché à cet état de choc.",
  choiceReveal: { initialDelayMs: 450, staggerMs: 260 },
  choices: [
    { id: "c2_blast_shock", label: "Rester sidéré une seconde de trop.", next: "c2_radio_order" },
    { id: "c2_blast_recover", label: "Me ressaisir immédiatement.", next: "c2_radio_order" },
    { id: "c2_blast_family", label: "Penser d'abord aux miens.", next: "c2_radio_order" }
  ]
},

c2_radio_order: {
  id: "c2_radio_order",
  label: "L’ordre de départ",
  kind: "choice",
  visualFx: "firehouseCold",
  image: "./assets/image_fond/scene1/locker_room.png",
  transition: "fade",
  text:
    "Je suis rentré dans la salle radio.\n\n" +
    "\"Mika, t'es au BAT. " +
    "Tu prends en charge Jérémy. " +
    "Vous partez sur une destruction de bâtiment.\"\n\n" +
    "Il n'y avait plus rien à comprendre. " +
    "Plus rien à discuter. " +
    "Il fallait partir.",
  choiceReveal: { initialDelayMs: 450, staggerMs: 260 },
  choices: [
    { id: "c2_order_absorb", label: "Encaisser l'ordre.", next: "c2_assignment" },
    { id: "c2_order_jeremy", label: "Chercher Jérémy du regard.", next: "c2_assignment" },
    { id: "c2_order_depart", label: "Ne penser qu'au départ.", next: "c2_assignment" }
  ]
},

c2_assignment: {
  id: "c2_assignment",
  label: "Vers le fourgon",
  kind: "choice",
  visualFx: "firehouseCold",
  image: "./assets/image_fond/scene1/locker_room.png",
  transition: "fade",
  text:
    "Je savais ce que cela voulait dire.\n\n" +
    "Le chapitre du doute se refermait. " +
    "Celui de l'action venait de s'ouvrir.\n\n" +
    "Je partis vers le fourgon.",
  choices: [
    { id: "c2_to_chapter3", label: "Monter dans le fourgon.", next: "c2_end_placeholder" }
  ]
},

c2_end_placeholder: {
  id: "c2_end_placeholder",
  label: "Fin du chapitre 2",
  kind: "end",
  visualFx: "rubble",
  image: "./assets/image_fond/scene1/black_soft.png",
  transition: "fade",
  text: "Fin du chapitre 2.",
  choices: []
}
}
const CHOICE_EFFECTS = {
  c2_resigns_excuses: { selfControl: 1 },
  c2_resigns_emptydesk: { stress: 1 },
  c2_resigns_understand: { politicalLucidity: 1 },

  c2_vornic_monster: { politicalLucidity: 1 },
  c2_vornic_charisma: { politicalLucidity: 1, selfControl: 1 },
  c2_vornic_people: { stress: 1 },

  c2_power_fast: { politicalLucidity: 1 },
  c2_power_denial: { selfControl: -1 },
  c2_power_children: { familyAnchor: 1 },

  c2_stay_nowhere: { familyAnchor: 1 },
  c2_stay_hold: { dutyAnchor: 1 },
  c2_stay_values: { politicalLucidity: 1, dutyAnchor: 1 },
  c2_stay_protect: { dutyAnchor: 1, familyAnchor: 1 },

  c2_daily_normal: { selfControl: 1 },
  c2_daily_cracks: { politicalLucidity: 1 },
  c2_daily_routine: { stress: 1 },

  c2_night_work: { dutyAnchor: 1 },
  c2_night_angela: { tendernessToAngela: 1 },
  c2_night_cost: { traumaLoad: 1 },

  c2_adoption_memory: { familyAnchor: 1 },
  c2_adoption_angela: { tendernessToAngela: 1 },
  c2_adoption_present: { traumaLoad: 1 },

  c2_court_children: { familyAnchor: 1 },
  c2_court_sign: { tendernessToAngela: 1 },
  c2_court_judge: { selfControl: 1 },

  c2_angela_mother: { familyAnchor: 1 },
  c2_angela_companion: { tendernessToAngela: 1 },
  c2_angela_arrived: { familyAnchor: 1, selfControl: 1 },

  c2_walk_enjoy: { tendernessToAngela: 1 },
  c2_walk_children: { familyAnchor: 1 },
  c2_walk_fragile: { traumaLoad: 1 },

  c2_gunshot_myfault: { traumaLoad: 1 },
  c2_gunshot_herfear: { tendernessToAngela: 1 },

  c2_drunk_error: { traumaLoad: 1, selfControl: -1 },

  c2_shot_pain: { traumaLoad: 1 },
  c2_shot_her: { tendernessToAngela: 1 },

  c2_hospital_love: { tendernessToAngela: 1 },
  c2_hospital_fear: { traumaLoad: 1 },

  c2_siren_firefighter: { dutyAnchor: 1 },
  c2_siren_children: { familyAnchor: 1 },

  c2_goodbye_reassure: { tendernessToAngela: 1 },
  c2_goodbye_promise: { familyAnchor: 1 },
  c2_goodbye_hold: { tendernessToAngela: 1, stress: 1 },

  c2_run_nolook: { dutyAnchor: 1 },
  c2_run_lastlook: { tendernessToAngela: 1 },

  c2_barracks_understand: { politicalLucidity: 1 },
  c2_barracks_absorb: { selfControl: 1 },
  c2_barracks_breath: { selfControl: 1, stress: -1 },

  c2_war_family: { familyAnchor: 1 },
  c2_war_mission: { dutyAnchor: 1 },

  c2_mob_accept: { dutyAnchor: 1 },
  c2_mob_numbers: { stress: 1 },

  c2_gear_photo: { familyAnchor: 1 },

  c2_call_insist: { stress: 1 },
  c2_call_focus: { selfControl: 1 },

  c2_wait_smoke: { stress: 1 },
  c2_wait_family: { familyAnchor: 1 },
  c2_wait_crack: { stress: 1, selfControl: -1 },

  c2_smoke_dream: { traumaLoad: 1 },

  c2_planes_freeze: { stress: 1 },

  c2_blast_shock: { selfControl: -1 },
  c2_blast_recover: { selfControl: 1 },

  c2_order_absorb: { selfControl: 1 },
  c2_order_depart: { dutyAnchor: 1 }
};


function applyChoiceEffects(scene, choice) {
  const effects = CHOICE_EFFECTS[choice.id] || {};
  for (const [key, delta] of Object.entries(effects)) {
    if (typeof playerState[key] === "number") {
      playerState[key] = Math.max(-5, Math.min(5, playerState[key] + delta));
    }
  }
}

for (const node of Object.values(NODES)) {
  const choices = typeof node.choices === "function" ? node.choices() : node.choices;
  node.mapNext = [...new Set((choices || []).map(choice => choice.next))];
}
export const chapter2Map = {
  id: "chapter2", title: "Chapitre 2 - Le déclin",
  start: "c2_intro", end: "c2_end_placeholder", nodes: NODES
};
export function startScene2(state = playerState, deps = {}) {
  return startChapter(chapter2Map, state, "scene2", deps, { onChoice: applyChoiceEffects });
}
