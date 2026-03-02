import { showScreen } from "../router.js";

const chapterCard = document.getElementById("chapterCard");
const scene1Image = document.getElementById("scene1Image");
const ambience = document.getElementById("scene1Ambience");
const choicePanel = document.getElementById("choicePanel");
const choiceTitle = document.getElementById("choiceTitle");
const choiceList = document.getElementById("choiceList");
const textContainer = document.getElementById("text-container");
const fade = document.getElementById("fade");

// Option: image provisoire
const TEMP_SCENE_IMAGE = "./assets/image_fond/scene1_gravats.png";

// Stocke les timeouts pour éviter doublons si on relance
let timers = [];
function clearTimers() {
  for (const t of timers) clearTimeout(t);
  timers = [];
}

// Petit helper
function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/* =========================
   TYPEWRITER (cinéma)
   ========================= */
let isTyping = false;

function getPauseForChar(ch) {
  if (ch === ",") return 120;
  if (ch === ";" || ch === ":") return 180;
  if (ch === ".") return 280;
  if (ch === "!" || ch === "?") return 320;
  if (ch === "\n") return 220;
  if (ch === "…") return 420;
  return 0;
}

function typeWriter(text, speed = 40) {
  return new Promise((resolve) => {
    const el = textContainer;
    if (!el) return resolve();

    el.textContent = "";
    let i = 0;
    isTyping = true;

    function step() {
      if (!isTyping) {
        el.textContent = text;
        return resolve();
      }

      if (i >= text.length) {
        isTyping = false;
        return resolve();
      }

      const ch = text[i];
      el.textContent += ch;
      i++;

      setTimeout(step, speed + getPauseForChar(ch));
    }

    step();

    // clic sur le texte = skip
    el.onclick = () => {
      isTyping = false;
    };
  });
}

function fadeToBlack(ms = 1200){
  if (!fade) return wait(ms);
  fade.classList.add("on");
  return wait(ms);
}

function fadeFromBlack(ms = 1200){
  if (!fade) return wait(ms);
  fade.classList.remove("on");
  return wait(ms);
}
async function transitionToImage(newImageUrl, ms = 900){
  await fadeToBlack(ms);

  if (scene1Image && newImageUrl){
    // on change l'image pendant que l'écran est noir
    scene1Image.style.backgroundImage = `url("${newImageUrl}")`;
    scene1Image.classList.add("is-visible"); // au cas où
  }

  await fadeFromBlack(ms);
}

/* =========================
   UI choices
   ========================= */
function clearChoices() {
  if (!choiceList) return;
  choiceList.innerHTML = "";
}

function showPanelOnly(title = "") {
  if (choiceTitle) choiceTitle.textContent = title;
  clearChoices(); // vide les boutons
  if (choicePanel) choicePanel.classList.add("on"); // rend visible
}

function showChoices(title, choices) {
  // choices = [{ id, label }]
  if (choiceTitle) choiceTitle.textContent = title ?? "Choisir :";
  clearChoices();

  for (const c of choices) {
    const b = document.createElement("button");
    b.className = "choiceBtn";
    b.type = "button";
    b.textContent = c.label;
    b.addEventListener("click", () => onChoice(c.id), { once: true });
    choiceList.appendChild(b);
  }

  if (choicePanel) choicePanel.classList.add("on");
}

function hideChoices() {
  if (choicePanel) choicePanel.classList.remove("on");
}

async function onChoice(choiceId){
  hideChoices();
  await goToBranch(choiceId);
}

function playSFX(src, volume = 1.0){
  const audio = new Audio(src);
  audio.volume = volume;
  audio.play().catch(e => console.warn("SFX bloqué:", e));
}

/* =========================
   MOTEUR NARRATIF
   ========================= */
let currentChoiceMap = new Map();

// Gating (obligatoire : voir les 2 branches avant de continuer)
let seenFamily = false;
let seenPolitics = false;

const NODES = {
  intro: {
    title: "",
    text:
      "Je ne sens plus ma jambe. Je ne sens plus mon bras.\n" +
      "La poussière qui entre à chaque inspiration me brûle la gorge.\n" +
      "Chaque respiration, chaque tentative de mouvement est une souffrance…",
    choices: [
      { id: "stay_still", label: "Ne pas bouger. Économiser l’air.", next: "still_1" },
      { id: "listen", label: "Écouter. Chercher un son, une présence.", next: "listen_1" },
      { id: "move_out", label: "Tenter de se dégager.", next: "move_1" },
    ],
  },

  still_1: {
    title: "QUE FAIRE ?",
    text:
      "Je ne bouge pas essayant d'économiser mes forces.\n" +
      "Les secondes passent chacune plus douloureuse que la précédente.\n" +
      "L’air est lourd, chaque inspiration est difficile, épuisante.",
    choices: [
      { id: "still_keep", label: "Rester ainsi. S'économiser en espérant... une aide providentielle.", next: "still_2" },
      { id: "still_change", label: "Changer légèrement de position.", next: "move_1" },
    ],
  },

  listen_1: {
    title: "QUE FAIRE ?",
    text:
      "Je tente de bloquer ma respiration pour mieux entendre.\n" +
      "Au loin… un bruit de pas... Amicaux... Ou non... Une illusion peut-être.",
    choices: [
      { id: "listen_focus", label: "Se concentrer. Écouter encore.", next: "listen_2" },
      { id: "listen_call", label: "Se risquer à appeler à l'aide.", next: "call_1" },
    ],
  },

  call_1: {
    title: "QUE FAIRE ?",
    text:
      "J'ouvre la bouche, tente d'appeler tout bas.\n" +
      "Rien ne sort...\n" +
      "Un souffle cassé... de la poussière entre.",
    choices: [
      { id: "call_stop", label: "Cesser de s'acharner. S'économiser.", next: "still_1" },
      { id: "call_again", label: "Appeler une seconde fois.", next: "call_2" },
    ],
  },
  still_2: {
    title: "ET MAINTENANT...",
    text: 
    "Je reste immobile, la douleur augmente encore et encore, il faut que ça s'arrête...\n" +
    "La mort me tend les bras, elle semble si douce, comme une délivrance",
    choices: [
        { id: "back_intro", label: "Tenter de résister", next: "intro" },
        { id: "remember1", label: "Se laisser glisser", next: "TV_news"}
    ],
  },
  move_1: {
    title: "…",
    text: "Je bouges d’un millimètre à grands efforts. Quelque chose grince au-dessus de moi.\n" +
    "La douleur est insoutenable...\n" +
    "Impossible de me dégager.",
    choices: [
        { id: "back_still_1", label: "Arrêter de bouger", next: "still_1" },
        { id: "fall_unconscious", label: "Essayer de se dégager encore", next: "fall_unconscious"}
    ],
  },
  listen_2: {
    title: "…",
    text: "Le bruit semble se rapprocher...\n" +
    "Des pas... Ce sont des pas...",
    choices: [
        { id: "look", label: "Tenter de tourner la tête", next: "move_1" },
        { id: "stay_still", label: "Se faire discret", next : "listen_3"}
    ],
  },
  call_2: {
    title: "…",
    text: "Je force la voix. Un son sort mais bien trop faible.\n" +
    "Cela me provoque une irrépressible envie de tousser.",
    choices: [{ id: "fall_unconscious", label: "Tousser", next: "fall_unconscious"}],
  },
  listen_3: {
    title: "…",
    text: "Les pas s'éloignent et je me retrouve seul de nouveau.\n" +
    "Personne ne viendra m'aider désormais.\n" +
    "On me laissera pour mort, ici... je n'aurai pas réussi finalement...",
    choices: [
        { id: "back_intro", label: "Tenter de résister encore", next: "intro" },
        { id: "remember1", label: "Se laisser glisser", next: "TV_news"}],
  },
    fall_unconscious: {
    title: "…",
    text: "Ma vue se trouble...\n" +
    "Je me sens partir...\n" +
    "C'est presque agréable comme sensation...",
    choices: [
        { id: "back_intro", label: "Tenter de résister encore", next: "intro" },
        { id: "remember1", label: "Se laisser glisser", next: "TV_news"}],
  },
  TV_news: {
  image: "./assets/image_fond/tv_news.png",
  transition: "fade",
  text: "C'était il y a six ans, bien loin d'ici, dans un pays qu'auparavant j'aurais été incapable de situer sur une carte, et qui d'ailleurs n'existe même plus de nos jours, une guerre a éclaté.\n" +
  "Une guerre civile comme on en voit tant d'autres au journal de 20h que ça ne fait même plus la une en comparaison de la victoire de l'équipe nationale de football.\n" + 
  "Voilà l'origine de tout ça. Au départ, personne n'avait prêté un regard à cette guerre, même pas nos dirigeants, '2000 km de nos frontières c'est bien assez loin pour qu'on ne soit pas impactés' devaient-ils se dire.\n" + 
  "Comme tout le monde, je me disais que nous, les Etats-Unis d'Europe, étions suffisamment solides et puissants pour ne pas avoir peur de ce petit conflit. C'est fou comme le fait d'être nombreux nous rend arrogant.",
  choices: [{ id: "tv_sound", label: "Prendre la télécommande et monter le son", next: "tv_sound" },
    ]
  },
  tv_sound: {
  await: wait(400),
    image: "./assets/image_fond/gravats_close.png",
  transition: "fade",
  text: "Le son grésille.\n" +
    "Puis tout disparaît.\n\n" +
    "Je reviens ici.\n" +
    "Sous le béton.\n\n" +
    "Je ne sens plus mes doigts.",
  choices: [{ id: "focus_breath", label: "Essayer de bouger les doigts.", next: "attempt_move" }
  ]
  },
  attempt_move: {
  text:
    "La sensation des doigts de ma main droite vient de disparaître. Dans un sens, c'est agréable, au moins je n'ai plus mal.\n" + 
    "Dans un autre, je ne suis pas dupe, des cas comme ça j'en ai vu plus d'un dans ma vie d'avant, j'étais pompier et, je sais bien que, si je ne sens plus mes doigts, c'est que les gravats qui écrasent mon bras l'ont tué et que, si jamais je venais à m'en sortir par un miracle absolu, il faudrait m'amputer.\n" + 
    "Sur l'instant, la seule chose à laquelle je pense c'est 'de toute façon je n'ai plus rien à écrire, alors main droite ou gauche quelle importance'. ",
  choices: [
    { id: "back_to_past", label: "Retrouver le fil de mes pensées.", next: "tv_news_2" }
  ]
 },
  tv_news_2: {
  await: wait(400),
    image: "./assets/image_fond/tv_news_2.png",
  transition: "fade",
  text: "Je disais... \n\n" +
  "oui, la guerre civile. \n" + 
  "Cette guerre avait duré trois ans sans que rien ne change. On faisait tous nos petites vies sans même se soucier qu'à quelques milliers de kilomètres à peine, des gens mourraient, des femmes, des enfants, des hommes, des vieux, le décompte des victimes était devenu une routine avant que le présentateur du journal ne rende l'antenne.\n" + 
  "Maintenant, avec le recul, avec ce que j'ai vu et compris, je me dis que nous étions des monstres. Pendant trois années nous avons laissé pourrir cette situation sans bouger le petit doigt et ensuite, quand elle nous a sauté au visage, on a tous eu l'air d'une bande d'ahuris.",
  choices: [
    { id: "return_self", label: "Repenser à ma vie d'avant.", next: "life_before_1" },
    { id: "back_present", label: "Revenir à ma situation.", next: "attempt_move" }
  ]
  },
  // -------------------------
  // Vie d'avant (profession / morale)
  // -------------------------
  life_before_1: {
    await: wait(400),
    image: "./assets/image_fond/home_evening.png",
    transition: "fade",
    text:
      "Pendant toutes ces années, comme tout le monde, je n’ai rien fait de plus que penser à moi.\n" +
      "Ma petite vie de famille.\n" +
      "Le crédit de la maison.\n" +
      "Les enfants à conduire à l'école.\n\n" +
      "Et ma carrière de sapeur-pompier professionnel.\n" +
      "J'étais fier de faire ce métier.",
    choices: [
      { id: "why_proud", label: "Pourquoi j'étais fier ?", next: "life_before_2" },
      { id: "back_gravats_1", label: "La douleur me ramène ici.", next: "attempt_move" }
    ]
  },

  life_before_2: {
    image: "./assets/image_fond/locker_room.png",
    transition: "fade",
    text:
      "Comme j'étais fier de faire ce métier, j'étais rentré comme volontaire à l'âge de 21 ans tout au bas de l'échelle et j'avais fait mon trou comme on dit.\n\n" +
      "Je me revois devant mon vestiaire me préparant à aller au feu.",
    choices: [
      { id: "proud_save", label: "Parce que je sauvais des vies.", next: "life_before_3" },
      { id: "proud_useful", label: "Parce que j'étais utile.", next: "life_before_3" },
      { id: "proud_exist", label: "Parce que j'existais enfin.", next: "life_before_3" }
    ]
  },

  life_before_3: {
    image: "./assets/image_fond/fire_ready.png",
    transition: "fade",
    text:
      "Je rentrais à chaque fin de garde chez moi avec la sensation d'avoir fait le bien autour de moi et ça me suffisait à être heureux.\n\n" +
      "Je me souviens de chaque intervention ou presque.\n" +
      "Souvent il m'est arrivé d'y repenser pour me remonter le moral.\n\n" +
      "Je sais bien que ça peut paraître bizarre, mais lorsque je montais à l'ambulance je savais qu’une fois arrivé à l'hôpital, j'aurais été en mesure de diminuer la souffrance des gens qui m'avaient appelé.",
    choices: [
      { id: "believe_that", label: "Je le croyais sincèrement.", next: "life_before_4" },
      { id: "doubt_that", label: "Aujourd'hui j'en doute.", next: "life_before_4" }
    ]
  },

  life_before_4: {
    image: "./assets/image_fond/memory_fragments_2.png",
    transition: "fade",
    text:
      "Maintenant que j'y pense, j'ai certainement tué plus de personnes que j'en ai sauvées.\n" +
      "En y restant ici, c'est qu'un juste retour des choses après tout.\n\n" +
      "Les images de ma vie passée défilent devant mes yeux comme un film en réalité augmentée sans aucune suite logique entre les différents souvenirs.",
    choices: [
      { id: "back_to_present", label: "Je dois me concentrer. Respirer.", next: "attempt_move" },
      { id: "keep_drifting", label: "Laisser les souvenirs continuer.", next: "life_flash_1" }
    ]
  },

  // -------------------------
  // Carrefour : double entrée obligatoire (famille / politique)
  // -------------------------
  life_flash_1: {
    image: "./assets/image_fond/fire_silhouette.png",
    transition: "fade",
    text:
      "Je suis debout, et même si je ne contrôle rien je n'ai pas peur car je sais que j'ai déjà vécu toutes ces scènes et je sais comment elles se terminent.\n\n" +
      "Je sens l'adrénaline de ces instants particuliers.\n" +
      "Cette espèce de sensation entre la peur et l'excitation.\n" +
      "Le tout contrôlé.",
    choices: [
      { id: "go_family", label: "Revoir le salon ce soir-là.", next: "life_home_1" },
      { id: "go_politics", label: "Revenir au communiqué du gouverneur.", next: "governor_intro_1" }
    ]
  },

  // -------------------------
  // Branche FAMILIALE
  // -------------------------
  life_home_1: {
    await: wait(400),
    image: "./assets/image_fond/home_return.png",
    transition: "fade",
    text:
      "Je me revois rentrer chez moi, embrasser Angéla, faire une caresse à mon chien qui me fait la fête comme à chaque fois que je rentre.\n" +
      "Je revois mes deux filles occupées à jouer avec leurs figurines. Je n’ose pas les déranger, elles sont sages, elles jouent ensemble toutes les deux.\n\n" +
      "Cette situation me parait tellement réelle. Je suis moi, c'est mon corps, c'est ma vie, et pourtant je n'ai aucune prise sur les évènements.\n" +
      "Je suis un spectateur dans mon propre corps.",
    choices: [
      { id: "home_deeper", label: "Rester encore un peu.", next: "life_home_2" }
    ]
  },

  life_home_2: {
    image: "./assets/image_fond/home_argument.png",
    transition: "fade",
    text:
      "Si je pouvais je prendrais Angéla dans mes bras, je lui dirais à quel point elle me manque, à quel point j'ai tout fait pour la retrouver et à quel point je suis désolé de ne pas avoir réussi.\n\n" +
      "Au lieu de ça, ce soir-là, on se fâchait pour une stupide histoire de rayure sur la voiture.\n" +
      "Une putain de rayure sur cette putain de voiture.\n\n" +
      "Une larme coule le long de ma joue.\n" +
      "Pas une larme de tristesse.\n" +
      "Une larme de joie.\n\n" +
      "Au moins je l'aurais revue une dernière fois, même si ce n'est rien de plus qu'un souvenir.",
    choices: [
      { id: "to_gate_from_family", label: "La télévision était allumée, ce soir-là…", next: "converge_gate_1" }
    ]
  },

  // -------------------------
  // Branche POLITIQUE
  // -------------------------
  governor_intro_1: {
    await: wait(400),
    image: "./assets/image_fond/tv_governor.png",
    transition: "fade",
    text:
      "Un soir, le gouverneur avait annoncé par un communiqué officiel que notre état allait faire quelque chose pour ce petit pays en guerre et dont tout le monde, même le présentateur du journal avait oublié l'existence.\n\n" +
      "C'était un de ces communiqués barbant du soir, similaires à ceux des vœux.\n" +
      "Un de ces communiqués qui commencent par l'hymne national et que l'on est obligé de regarder parce qu'ils sont diffusés sur toutes les chaînes.\n\n" +
      "Hormis les vœux de la nouvelle année j'ai toujours aimé suivre ces communiqués.\n" +
      "Ça signifiait toujours qu'une décision importante avait été prise, une de celles qui peuvent marquer l'histoire.",
    choices: [
      { id: "gov_react", label: "Regarder Angéla.", next: "governor_react_1" }
    ]
  },

  governor_react_1: {
    image: "./assets/image_fond/home_tv_react.png",
    transition: "fade",
    text:
      "Je me souviens de sa première réaction.\n" +
      "De cette seconde où elle comprend avant moi.\n\n" +
      "Elle ne disait pas grand-chose.\n" +
      "Mais je sentais que quelque chose venait de bouger.\n" +
      "Dans la pièce.\n" +
      "Dans l'air.\n" +
      "Entre nous.",
    choices: [
      { id: "to_gate_from_politics", label: "Revoir le salon comme il était vraiment…", next: "converge_gate_1" }
    ]
  },

  // -------------------------
  // Gate : impose de voir les 2 blocs avant de continuer
  // -------------------------
  converge_gate_1: {
    title: "…",
    image: "./assets/image_fond/black_soft.png",
    transition: "fade",
    text:
      "Je sens que je tiens quelque chose.\n" +
      "Un fil.\n" +
      "Mais ma mémoire refuse de me donner tout d'un seul coup.\n\n" +
      "Il manque encore une pièce.",
    choices: [
      { id: "gate_continue", label: "Continuer.", next: "gate_route" }
    ]
  },

  gate_route: {
    title: "",
    text: "",
    choices: [
      { id: "gate_route", label: "…", next: "gate_route" }
    ]
  },

  // -------------------------
  // Convergence (suite du chapitre)
  // -------------------------
  ligue_rise_1: {
    await: wait(400),
    image: "./assets/image_fond/ligue_rise.png",
    transition: "fade",
    text:
      "Et c'est là que tout a commencé à se fissurer.\n" +
      "Pas d'un coup.\n" +
      "Pas avec un grand fracas.\n\n" +
      "Doucement.\n" +
      "Par petites phrases.\n" +
      "Par petites peurs.\n" +
      "Par petites lâchetés.\n\n" +
      "La Ligue.",
    choices: [
      { id: "to_continue", label: "Continuer.", next: "attempt_move" } // placeholder : remplace par ligue_rise_2 ensuite
    ]
  },

};

async function runNode(nodeId) {
  const node = NODES[nodeId];
  if (!node) return;

  // Marquage des branches (ordre libre, mais passage obligatoire des deux)
  if (nodeId === "life_home_1") seenFamily = true;
  if (nodeId === "governor_intro_1") seenPolitics = true;

  // 🔥 Gestion image + transition
  if (node.transition === "fade" && node.image) {
    await transitionToImage(node.image, 900);
  }
  else if (node.image && scene1Image) {
    scene1Image.style.backgroundImage = `url("${node.image}")`;
  }

  showPanelOnly(node.title ?? "");
  await typeWriter(node.text ?? "", 45);
  await wait(250);

  showChoices(
    node.title ?? "Que fais-tu ?",
    (node.choices ?? []).map(c => ({ id: c.id, label: c.label }))
  );

  currentChoiceMap = new Map(
    (node.choices ?? []).map(c => [c.id, c.next])
  );
}


async function goToBranch(choiceId) {
  const next = currentChoiceMap.get(choiceId);
  if (!next) {
    console.warn("Aucune suite définie pour:", choiceId);
    return;
  }

  // Gate obligatoire : impose de voir les 2 branches (famille + politique)
  if (next === "gate_route") {
    if (!seenFamily) return await runNode("life_home_1");
    if (!seenPolitics) return await runNode("governor_intro_1");
    return await runNode("ligue_rise_1");
  }

  // Exemple : transition spéciale vers TV_news
  if (next === "TV_news") {
    const TV_NEWS_IMAGE = "./assets/image_fond/tv_news.png"; // <-- mets ton vrai fichier
    await transitionToImage(TV_NEWS_IMAGE, 900);
  }

  await runNode(next);
}


/* =========================
   START SCENE 1
   ========================= */
export async function startScene1() {
  clearTimers();

  showScreen("scene1");

  // Reset visuels
  if (chapterCard) chapterCard.classList.remove("is-visible");
  if (scene1Image) scene1Image.classList.remove("is-visible");

  // Reset UI texte/choix
  if (textContainer) textContainer.textContent = "";
  clearChoices();
  hideChoices();

  // Carton
  if (chapterCard) {
    chapterCard.textContent = "Chapitre 1 - L'origine";
    await wait(50);
    chapterCard.classList.add("is-visible");
  }

  // Audio
  if (ambience) {
    try {
      ambience.currentTime = 0;
      ambience.volume = 1.0;
      await ambience.play();
    } catch (e) {
      console.warn("Audio scene1 bloqué :", e);
    }
  }

  // Fade out du carton
  timers.push(
    setTimeout(() => {
      if (chapterCard) chapterCard.classList.remove("is-visible");
    }, 3000)
  );

  // Image puis lancement du node "intro"
  timers.push(
    setTimeout(() => {
      if (!scene1Image) return;
      scene1Image.style.backgroundImage = `url("${TEMP_SCENE_IMAGE}")`;
      scene1Image.classList.add("is-visible");

      // 1s après image => démarre le moteur narratif
      setTimeout(() => {
        runNode("intro");
      }, 1000);
    }, 10000)
  );
}
