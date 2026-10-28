import { showScreen } from "../router.js";
import { playerState, savePlayerState } from "../state.js";
import { createSceneEngine } from "./engine.js";

const PLAYER_STATE_NUMERIC_KEYS = [
  "selfControl",
  "familyAnchor",
  "dutyAnchor",
  "politicalLucidity",
  "tendernessToAngela",
  "traumaLoad",
  "stress",
  "memoryStability"
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function ensurePlayerStateShape() {
  if (typeof playerState.proudReason === "undefined") {
    playerState.proudReason = null;
  }

  if (typeof playerState.beliefHelped === "undefined") {
    playerState.beliefHelped = null;
  }

  for (const key of PLAYER_STATE_NUMERIC_KEYS) {
    if (typeof playerState[key] !== "number") {
      playerState[key] = 0;
    }
  }
}

function ensureSceneState(state) {
  if (!state.scene2) {
    state.scene2 = {
      currentNodeId: null,
      visitedNodes: [],
      visitedSet: {},
      flags: {},
      ended: false
    };
  }

  const scene = state.scene2;
  scene.visitedNodes ||= [];
  scene.visitedSet ||= {};
  scene.flags ||= {};
  scene.ended ||= false;

  ensurePlayerStateShape();

  return scene;
}

function visitNode(scene, nodeId) {
  if (!scene.visitedSet[nodeId]) {
    scene.visitedSet[nodeId] = true;
    scene.visitedNodes.push(nodeId);
  }
}

function setFlag(scene, key, value = true) {
  scene.flags[key] = value;
}

function applyPlayerStatePatch(patch = {}) {
  for (const [key, delta] of Object.entries(patch)) {
    if (!PLAYER_STATE_NUMERIC_KEYS.includes(key)) continue;
    playerState[key] = clamp((playerState[key] || 0) + delta, -5, 5);
  }
}

function applyPlayerStateSet(setters = {}) {
  for (const [key, value] of Object.entries(setters)) {
    playerState[key] = value;
  }
}

function applyOnEnter(node, scene) {
  if (!node?.onEnter) return;

  if (node.onEnter.flags) {
    for (const [key, value] of Object.entries(node.onEnter.flags)) {
      setFlag(scene, key, value);
    }
  }

  if (node.onEnter.playerState) {
    applyPlayerStatePatch(node.onEnter.playerState);
  }

  if (node.onEnter.setPlayerState) {
    applyPlayerStateSet(node.onEnter.setPlayerState);
  }

  savePlayerState();
}

function applyChoiceEffects(scene, choice) {
  if (!choice?.effects) return;

  if (choice.effects.playerState) {
    applyPlayerStatePatch(choice.effects.playerState);
  }

  if (choice.effects.setPlayerState) {
    applyPlayerStateSet(choice.effects.setPlayerState);
  }

  if (choice.effects.flags) {
    for (const [key, value] of Object.entries(choice.effects.flags)) {
      setFlag(scene, key, value);
    }
  }

  savePlayerState();
}

const chapterCard = document.getElementById("chapterCard");
const sceneImage = document.getElementById("scene1Image");
const choicePanel = document.getElementById("choicePanel");
const choiceTitle = document.getElementById("choiceTitle");
const choiceList = document.getElementById("choiceList");
const textContainer = document.getElementById("text-container");
const fade = document.getElementById("fade");

let currentGoToNode = null;
let currentScene = null;
let currentChapterEndHandler = null;

function handleChoice(choiceId) {
  const choiceMap = engine.getChoiceMap();
  const payload = choiceMap.get(choiceId);

  if (!payload) return;

  if (payload.type === "choice") {
    applyChoiceEffects(currentScene, payload.choice);
    currentGoToNode(payload.choice.next);
    return;
  }

  if (payload.type === "next") {
    currentGoToNode(payload.nextNodeId);
    return;
  }

  if (payload.type === "end") {
    currentScene.ended = true;
    currentChapterEndHandler({
      chapterId: chapter2Map.id,
      scene: currentScene,
      map: chapter2Map
    });
  }
}

const engine = createSceneEngine({
  chapterCard,
  sceneImage,
  choicePanel,
  choiceTitle,
  choiceList,
  textContainer,
  fade,
  onChoice: handleChoice
});

const {
  clearTimers,
  wait,
  typeText,
  clearChoices,
  hideChoices,
  showChoices,
  showPanelOnly,
  setChoiceMap
} = engine;

export const chapter2Map = {
  id: "chapter2",
  title: "Chapitre 2 - Le déclin",
  start: "ch2_p0_rubble_reprise",
  end: "ch2_end",

   nodes: {
    ch2_p0_rubble_reprise: {
      id: "ch2_p0_rubble_reprise",
      label: "Reprendre",
      kind: "scene",
      image: "./assets/image_fond/scene1/ch1_r1_rubble_return.png",
      transition: "fade",
      visualFx: "rubble",

      text: [ "Je reprends.",
         "", 
         "Enfin...", 
         "J’essaie.", 
         "", 
         "Les souvenirs ne reviennent pas dans l’ordre.", 
         "Ils n’ont plus cette politesse-là.", 
         "", 
         "Ils remontent comme ils peuvent.", 
         "Par morceaux.", 
         "Par images.", 
         "Par blessures.", 
         "", 
         "Et parfois, sous les gravats, je sens bien que mon esprit cherche à tricher.", 
         "", 
         "Il me propose d’autres chemins.", 
         "D’autres décisions.", 
         "D’autres vies.", 
         "", 
         "Des versions où j’aurais compris plus vite.", 
         "Où j’aurais fui.", 
         "Où j’aurais sauvé tout le monde.", 
         "", 
         "Mais ce ne sont pas ces versions-là qu’il faut suivre.", 
         "", 
         "Il faut reprendre là où tout a vraiment continué de tomber." 
        ],

      next: "ch2_v1_empty_desk"
    },

    ch2_v1_empty_desk: {
      id: "ch2_v1_empty_desk",
      label: "Bureau vide",
      kind: "choice",
      image: "./assets/image_fond/scene1/ch1_t2_governor.png",
      transition: "fade",
      visualFx: "tvBlue",

      text: [
  "Le lendemain, il n’y avait déjà plus personne aux commandes.",
  "",
  "Le gouverneur a présenté sa démission.",
  "",
  "Je ne me souviens pas de tout son discours.",
  "Je me souviens surtout de ses excuses.",
  "De son ton.",
  "",
  "La voix d’un homme qui sait qu’il a perdu.",
  "",
  "À la fin, il s’est levé.",
  "Face caméra, il a souhaité bon courage à l’ensemble des citoyens.",
  "",
  "Puis il s’est retourné.",
  "Et il a quitté la pièce.",
  "",
  "La caméra a continué de filmer quelques secondes.",
  "",
  "Le bureau.",
  "La chaise.",
  "Le silence.",
  "",
  "Une image toute simple.",
  "",
  "Et pourtant, je crois que tout était déjà là.",
  "",
  "À partir de ce moment-là, il n’y avait plus personne pour retenir quoi que ce soit."
],


      choices: [
        {
          id: "desk_institutions",
          label: "Se dire que les institutions tiendront encore",
          next: "ch2_v2_vornic_screen",
          effects: {
            playerState: {
              selfControl: 1,
              memoryStability: -1
            }
          }
        },
        {
          id: "desk_understand",
          label: "Comprendre que le pays vient de changer de nature",
          next: "ch2_v2_vornic_screen",
          effects: {
            playerState: {
              politicalLucidity: 1,
              stress: 1,
              memoryStability: 1
            }
          }
        },
        {
          id: "desk_family",
          label: "Penser immédiatement à Angela et aux filles",
          next: "ch2_v2_vornic_screen",
          effects: {
            playerState: {
              familyAnchor: 1,
              tendernessToAngela: 1,
              stress: 1
            }
          }
        },
        {
          id: "desk_escape",
          label: "Fuir tout de suite avec Angela et les filles",
          next: "ch2_dead_escape",
          condition: ({ playerState }) => {
            return playerState.familyAnchor >= 1 || playerState.stress >= 1;
          },
          effects: {
            playerState: {
              memoryStability: -1,
              traumaLoad: 1
            }
          }
        }
      ]
    },

    ch2_dead_escape: {
      id: "ch2_dead_escape",
      label: "Fuite",
      kind: "scene",
      image: "./assets/image_fond/scene1/ch1_r1_rubble_return.png",
      transition: "fade",
      visualFx: "rubble",

      text: [
  "Dans cette version-là, nous partons.",
  "",
  "Nous remplissons des sacs sans réfléchir.",
  "Angela serre les filles contre elle.",
  "Je ferme la maison sans vérifier les lumières.",
  "",
  "La route est noire.",
  "Les phares découpent les arbres.",
  "Les barrages apparaissent au loin.",
  "",
  "Je serre le volant.",
  "Je répète que tout va bien.",
  "",
  "Je mens si fort que j’arrive presque à m’entendre y croire.",
  "",
  "Puis le souvenir se tord.",
  "",
  "Les visages changent.",
  "Les cris arrivent avant les mots.",
  "Les corps vont trop vite.",
  "",
  "Et je comprends.",
  "",
  "Ce n’est pas un souvenir.",
  "",
  "C’est une sortie de secours.",
  "Une fuite inventée par mon cerveau.",
  "Une excuse.",
  "",
  "Non.",
  "",
  "Nous ne sommes pas partis.",
  "",
  "Peut-être qu’on aurait dû.",
  "Peut-être qu’une autre vie s’est ouverte quelque part à cet endroit précis.",
  "",
  "Mais pas la mienne.",
  "",
  "Je divague.",
  "",
  "La poussière revient.",
  "Le sang aussi.",
  "Le poids.",
  "",
  "Il faut reprendre.",
  "Reprendre correctement."
],

      next: "ch2_v1_empty_desk"
    },

    ch2_v2_vornic_screen: {
      id: "ch2_v2_vornic_screen",
      label: "Vornic",
      kind: "scene",
      image: "./assets/image_fond/scene1/ligue_election.png",
      transition: "fade",
      visualFx: "ligueRed",

      text: () => {
  const lines = [
    "Dans la foulée, la chambre des députés a élu un nouveau gouverneur.",
    "",
    "Sans surprise.",
    "",
    "Vornic.",
    "",
    "Même aujourd’hui, son nom a quelque chose de sale dans ma bouche.",
    "",
    "Il représentait tout ce qui me répugnait.",
    "",
    "Le rejet.",
    "La peur transformée en programme.",
    "La brutalité habillée en bon sens.",
    "",
    "Et pourtant, il savait parler.",
    "",
    "C’est ça qui me revient.",
    "",
    "Son regard bleu acier.",
    "Son sourire calme.",
    "Sa manière de donner aux idées les plus dures l’apparence d’une évidence.",
    "",
    "Il ne criait pas toujours.",
    "Il n’en avait pas besoin.",
    "",
    "Il savait prendre la colère des gens.",
    "La nettoyer.",
    "La rendre présentable.",
    "",
    "Puis la leur rendre sous forme de devoir."
  ];

        if (playerState.beliefHelped === true) {
          lines.push(
            "",
      "J’avais voulu croire que les gestes politiques pouvaient encore réparer quelque chose.",
      "",
      "Ce jour-là, j’ai compris qu’ils pouvaient aussi achever un pays."
          );
        }

        if (playerState.beliefHelped === false) {
          lines.push(
            "",
      "Je n’étais pas vraiment surpris.",
      "",
      "C’est peut-être ça le pire.",
      "",
      "Une part de moi avait vu venir la chute.",
      "Et je n’avais rien fait d’autre que la regarder arriver."
          );
        }

        if (playerState.politicalLucidity >= 2) {
          lines.push(
            "",
      "Le mécanisme était presque visible.",
      "",
      "La peur.",
      "La fatigue.",
      "La colère.",
      "",
      "Puis l’ordre promis comme une délivrance."
          );
        }

        if (playerState.familyAnchor >= 2 || playerState.tendernessToAngela >= 2) {
          lines.push(
            "",
      "Et pendant qu’il parlait, je pensais à Angela.",
      "Aux filles.",
      "À l’école.",
      "",
      "Aux mots qu’elles entendraient bientôt.",
      "Aux phrases qu’on leur demanderait peut-être de répéter."
          );
        }

        return lines;
      },

      next: "ch2_v3_full_powers"
    },

    ch2_v3_full_powers: {
      id: "ch2_v3_full_powers",
      label: "Pleins pouvoirs",
      kind: "choice",
      image: "./assets/image_fond/scene1/ligue_rise.png",
      transition: "fade",
      visualFx: "ligueRed",

      text: [
  "Le soir même, devant l’urgence de la situation, comme il disait, les pleins pouvoirs lui ont été donnés.",
  "",
  "Toutes les chaînes diffusaient le même communiqué.",
  "Toutes les radios répétaient les mêmes phrases.",
  "Même les panneaux publicitaires semblaient avoir appris à parler d’une seule voix.",
  "",
  "En moins de vingt-quatre heures, sans coup d’État, sans chars dans les rues, sans bruit de bottes dans les couloirs, nous étions passés d’une démocratie à une dictature.",
  "",
  "Tout était légal.",
  "",
  "C’est peut-être ce qui rendait la chose encore plus monstrueuse.",
  "",
  "Et dehors, la foule applaudissait.",
  "",
  "Je crois que c’est ça qui me revient le plus.",
  "",
  "Pas la décision.",
  "Pas le communiqué.",
  "Pas même son visage.",
  "",
  "Les applaudissements."
],

      choices: [
        {
          id: "powers_lucidity",
          label: "Comprendre que tout allait désormais aller très vite",
          next: "ch2_s1_leave_or_stay",
          effects: {
            playerState: {
              politicalLucidity: 1,
              stress: 1,
              memoryStability: 1
            }
          }
        },
        {
          id: "powers_denial",
          label: "Refuser encore d’y croire tout à fait",
          next: "ch2_s1_leave_or_stay",
          effects: {
            playerState: {
              selfControl: 1,
              memoryStability: -1
            }
          }
        },
        {
          id: "powers_children",
          label: "Penser d’abord aux enfants",
          next: "ch2_s1_leave_or_stay",
          effects: {
            playerState: {
              familyAnchor: 1,
              tendernessToAngela: 1,
              stress: 1
            }
          }
        }
      ]
    },

    ch2_s1_leave_or_stay: {
      id: "ch2_s1_leave_or_stay",
      label: "Partir ?",
      kind: "choice",
      image: "./assets/image_fond/scene1/ch1_h1_home.png",
      transition: "fade",
      visualFx: "homeWarm",

      text: [
  "Angela et moi avons très vite compris que les choses allaient changer.",
  "",
  "Pas dans le sens que nous espérions.",
  "",
  "Les lois viendraient.",
  "Les interdictions.",
  "Les contrôles.",
  "",
  "Les petites phrases d’abord murmurées.",
  "Puis répétées.",
  "Puis hurlées.",
  "",
  "Et puis il y aurait l’école.",
  "",
  "Ce qu’on apprendrait aux enfants.",
  "Ce qu’on ne leur apprendrait plus.",
  "Ce qu’on leur demanderait peut-être de croire pour rester du bon côté.",
  "",
  "Si nous l’avions pu, nous serions partis.",
  "",
  "Tout de suite.",
  "",
  "Mais partir où ?",
  "",
  "Notre vie était ici.",
  "Notre maison.",
  "Nos familles.",
  "Nos habitudes.",
  "",
  "Tous ces petits liens invisibles qui vous retiennent à un endroit, même quand cet endroit commence à vous faire peur.",
  "",
  "Alors nous sommes restés.",
  "",
  "Et nous nous sommes dit que, s’il le fallait, nous nous battrions pour nos valeurs."
],

      choices: [
        {
          id: "stay_no_choice",
          label: "Rester parce qu’on ne savait pas où aller",
          next: "ch2_s2_life_goes_on",
          effects: {
            playerState: {
              stress: 1,
              memoryStability: 1
            }
          }
        },
        {
          id: "stay_life_here",
          label: "Rester parce que notre vie était ici",
          next: "ch2_s2_life_goes_on",
          effects: {
            playerState: {
              familyAnchor: 1,
              tendernessToAngela: 1
            }
          }
        },
        {
          id: "stay_values",
          label: "Rester parce qu’abandonner aurait été trahir nos valeurs",
          next: "ch2_s2_life_goes_on",
          effects: {
            playerState: {
              politicalLucidity: 1,
              dutyAnchor: 1
            }
          }
        },
        {
          id: "stay_protect",
          label: "Rester parce qu’il faudrait bien protéger encore quelqu’un",
          next: "ch2_s2_life_goes_on",
          condition: ({ playerState }) => {
            return playerState.proudReason === "save" || playerState.dutyAnchor >= 2;
          },
          effects: {
            playerState: {
              dutyAnchor: 1,
              familyAnchor: 1
            }
          }
        },
        {
          id: "escape_after_all",
          label: "Fuir malgré tout",
          next: "ch2_dead_escape",
          condition: ({ playerState }) => {
            return playerState.memoryStability <= -1 || playerState.stress >= 2;
          },
          effects: {
            playerState: {
              memoryStability: -1,
              traumaLoad: 1
            }
          }
        }
      ]
    },

    ch2_s2_life_goes_on: {
      id: "ch2_s2_life_goes_on",
      label: "La vie continue",
      kind: "scene",
      image: "./assets/image_fond/scene1/street_tensions.png",
      transition: "fade",
      visualFx: "streetCold",

      text: () => {
  const lines = [
    "Le plus étrange, c’est que la vie ne s’est pas arrêtée.",
    "",
    "Pas tout de suite.",
    "",
    "Les milices étaient de plus en plus visibles dans les rues.",
    "Les regards changeaient.",
    "Les conversations aussi.",
    "",
    "Mais à notre niveau, les journées continuaient.",
    "",
    "Angela et moi partions travailler.",
    "Les enfants allaient à l’école.",
    "Les courses se faisaient encore.",
    "Les portes se fermaient à la même heure.",
    "",
    "Tout avait l’air presque normal.",
    "",
    "Et c’est peut-être ça, le plus dangereux.",
    "",
    "Quand les choses changent assez lentement pour qu’on se demande si on a vraiment le droit d’avoir peur."
  ];

  if (playerState.politicalLucidity >= 2) {
    lines.push(
      "",
      "Je voyais pourtant les fissures.",
      "",
      "Les contrôles plus fréquents.",
      "Les uniformes qui n’étaient pas tout à fait ceux de l’État.",
      "Les silences qui tombaient dès que quelqu’un entrait dans une pièce."
    );
  }

  if (playerState.familyAnchor >= 2) {
    lines.push(
      "",
      "À la maison, je m’accrochais encore plus fort aux gestes simples.",
      "",
      "Un repas.",
      "Un rire des filles.",
      "La main d’Angela qui restait une seconde de plus dans la mienne.",
      "",
      "Des petites choses.",
      "",
      "Mais parfois, c’est tout ce qui tient encore debout."
    );
  }

  if (playerState.selfControl >= 2) {
    lines.push(
      "",
      "Moi, comme souvent, je rangeais l’inquiétude dans un coin.",
      "",
      "Pas pour l’oublier.",
      "",
      "Pour continuer à fonctionner."
    );
  }

  if (playerState.memoryStability <= -1) {
    lines.push(
      "",
      "Mais même maintenant, le souvenir tremble.",
      "",
      "Je ne sais plus toujours si nous étions calmes.",
      "Ou seulement trop fatigués pour paniquer."
    );
  }

  return lines;
},

      next: "ch2_n1_night_shift"
    },

        ch2_n1_night_shift: {
      id: "ch2_n1_night_shift",
      label: "Nuits",
      kind: "choice",
      image: "./assets/image_fond/scene1/locker_room.png",
      transition: "fade",
      visualFx: "firehouseCold",

      text: () => {
  const lines = [
    "Je travaillais souvent de nuit à cette époque.",
    "",
    "J’aimais ça.",
    "",
    "J’ai toujours préféré la nuit au jour.",
    "",
    "Dans l’obscurité, les choses me semblaient plus nettes.",
    "Les gens aussi.",
    "",
    "La nuit enlève une partie du décor.",
    "Elle garde seulement ce qui tremble vraiment.",
    "",
    "Bien sûr, notre vie de couple en prenait un coup.",
    "",
    "Mais Angela et moi étions assez proches pour que les rares instants ensemble comptent vraiment.",
    "",
    "On faisait avec.",
    "",
    "Mes gardes.",
    "Son rythme.",
    "Les enfants.",
    "La maison.",
    "",
    "Et puis, d’une certaine manière, ça nous arrangeait.",
    "",
    "Pas de frais de garde.",
    "Pas trop de questions à se poser.",
    "",
    "On faisait fonctionner notre vie comme on pouvait."
  ];

  if (playerState.proudReason === "save") {
    lines.push(
      "",
      "Je crois que je pensais encore en pompier.",
      "",
      "Sauver.",
      "Protéger.",
      "Revenir.",
      "",
      "Comme si ces trois verbes pouvaient suffire à tenir une famille debout."
    );
  }

  if (playerState.proudReason === "useful") {
    lines.push(
      "",
      "J’avais besoin d’être utile.",
      "",
      "À la caserne.",
      "À la maison.",
      "Dans le monde.",
      "",
      "Tant qu’on avait besoin de moi, je savais à peu près où me tenir."
    );
  }

  if (playerState.proudReason === "exist") {
    lines.push(
      "",
      "La tenue me donnait une forme.",
      "",
      "Un rôle.",
      "Une place.",
      "Un contour.",
      "",
      "Sans elle, je ne suis pas sûr que j’aurais toujours su qui j’étais."
    );
  }

  return lines;
},

      choices: [
        {
          id: "night_work",
          label: "Penser au métier",
          next: "ch2_a1_adoption_intro",
          effects: {
            playerState: {
              dutyAnchor: 1,
              selfControl: 1
            }
          }
        },
        {
          id: "night_angela",
          label: "Penser à Angela",
          next: "ch2_a1_adoption_intro",
          effects: {
            playerState: {
              tendernessToAngela: 1,
              familyAnchor: 1
            }
          }
        },
        {
          id: "night_cost",
          label: "Penser à ce que ce rythme nous coûtait",
          next: "ch2_a1_adoption_intro",
          effects: {
            playerState: {
              traumaLoad: 1,
              stress: 1
            }
          }
        }
      ]
    },

    ch2_a1_adoption_intro: {
      id: "ch2_a1_adoption_intro",
      label: "Adoption",
      kind: "choice",
      image: "./assets/image_fond/scene1/home_evening.png",
      transition: "fade",
      visualFx: "homeWarm",

      text: [
  "Et puis, pour nous, tout semblait presque s’arranger.",
  "",
  "La mère biologique des filles, après de nombreux problèmes personnels, de santé, et une obligation de soins, avait renoncé à ses droits parentaux.",
  "",
  "Je me souviens du jour où nous sommes allés tous ensemble au tribunal.",
  "",
  "Tous les cinq.",
  "",
  "Pas pour nous défendre.",
  "Pas pour perdre encore quelque chose.",
  "",
  "Pour officialiser ce que nous savions déjà.",
  "",
  "Angela était leur mère.",
  "",
  "Elle l’était dans les gestes.",
  "Dans les nuits.",
  "Dans les repas.",
  "Dans les inquiétudes.",
  "Dans les colères parfois.",
  "Dans l’amour, surtout.",
  "",
  "Mais ce jour-là, le monde allait enfin l’écrire quelque part.",
  "",
  "Rien que d’y repenser, je sens encore quelque chose remonter.",
  "",
  "Une émotion chaude.",
  "Presque intacte.",
  "",
  "Comme si ce souvenir refusait de mourir avec le reste."
],

      choices: [
        {
          id: "adoption_let_memory",
          label: "Laisser le souvenir revenir",
          next: "ch2_a2_courtroom",
          effects: {
            playerState: {
              memoryStability: 1,
              familyAnchor: 1
            }
          }
        },
        {
          id: "adoption_angela",
          label: "S’attarder sur Angela",
          next: "ch2_a2_courtroom",
          effects: {
            playerState: {
              tendernessToAngela: 1,
              familyAnchor: 1
            }
          }
        },
        {
          id: "adoption_present_pain",
          label: "Sentir la douleur du présent traverser le souvenir",
          next: "ch2_a2_courtroom",
          effects: {
            playerState: {
              traumaLoad: 1,
              memoryStability: -1
            }
          }
        }
      ]
    },

    ch2_a2_courtroom: {
      id: "ch2_a2_courtroom",
      label: "Tribunal",
      kind: "choice",
      image: "./assets/image_fond/scene1/ch1_f1_kitchen.png",
      transition: "fade",
      visualFx: "homeWarm",

      text: [
  "Nous étions tous les cinq dans le bureau du juge aux affaires familiales.",
  "",
  "Je revois encore la pièce.",
  "",
  "Trop claire.",
  "Trop calme.",
  "Trop administrative pour ce que nous étions en train d’y vivre.",
  "",
  "Il y avait des dossiers.",
  "Des chaises alignées.",
  "Une table trop grande.",
  "Des stylos qu’on repose toujours au même endroit.",
  "",
  "Et au milieu de tout ça, il y avait nous.",
  "",
  "Une famille entière suspendue à quelques signatures.",
  "",
  "Le juge avait un visage froid.",
  "Presque inexpressif.",
  "",
  "Pas méchant.",
  "Pas bienveillant non plus.",
  "",
  "Simplement absent à notre joie.",
  "",
  "Comme si ce moment n’était qu’un dossier de plus.",
  "",
  "Pour nous, c’était autre chose.",
  "",
  "Une famille qui prenait enfin sa forme complète."
],

      choices: [
        {
          id: "court_children",
          label: "Regarder les filles",
          next: "ch2_a3_angela_mother",
          effects: {
            playerState: {
              familyAnchor: 1,
              memoryStability: 1
            }
          }
        },
        {
          id: "court_angela_sign",
          label: "Regarder Angela signer",
          next: "ch2_a3_angela_mother",
          effects: {
            playerState: {
              tendernessToAngela: 1,
              familyAnchor: 1
            }
          }
        },
        {
          id: "court_judge",
          label: "Regarder le juge",
          next: "ch2_a3_angela_mother",
          effects: {
            playerState: {
              selfControl: 1,
              stress: 1
            }
          }
        }
      ]
    },

    ch2_a3_angela_mother: {
      id: "ch2_a3_angela_mother",
      label: "Mère",
      kind: "scene",
      image: "./assets/image_fond/scene1/kitchen_back_kiss.png",
      transition: "fade",
      visualFx: "homeWarm",
      mapNext: ["ch2_a4_deeper_memory", "ch2_r1_blood_eye"],

      text: [
  "Angela a signé.",
  "",
  "Je revois encore ses yeux à ce moment-là.",
  "",
  "Il y avait des larmes.",
  "Mais pas seulement.",
  "",
  "Il y avait quelque chose de plus fort.",
  "",
  "Une certitude.",
  "",
  "Comme si elle avait attendu cette place toute sa vie sans jamais oser la réclamer entièrement.",
  "",
  "Puis elle a pris les filles dans ses bras.",
  "",
  "Toutes les deux.",
  "Fort.",
  "",
  "Ce n’était pas une étreinte de politesse.",
  "Pas une photo de famille qu’on prend parce qu’il faut marquer le moment.",
  "",
  "C’était plus profond que ça.",
  "",
  "Comme si elle les serrait aussi pour toutes les fois où elle avait déjà été leur mère sans que personne ne l’ait encore écrit.",
  "",
  "Après cette étreinte, elle s’est avancée vers moi.",
  "",
  "Je crois que c’est la première fois que je lui voyais ce regard-là.",
  "",
  "Doux.",
  "Reconnaissant.",
  "Déterminé.",
  "",
  "J’ai encore sur les lèvres la sensation de ses baisers.",
  "",
  "C’était fait.",
  "",
  "Enfin.",
  "",
  "Elle était la mère qu’elle devait être.",
  "",
  "Et elle l’était de plein droit."
],

      getNext: () => {
        if (playerState.familyAnchor >= 3 || playerState.tendernessToAngela >= 3) {
          return "ch2_a4_deeper_memory";
        }

        return "ch2_r1_blood_eye";
      }
    },

    ch2_a4_deeper_memory: {
      id: "ch2_a4_deeper_memory",
      label: "Plus profond",
      kind: "scene",
      image: "./assets/image_fond/scene1/ch1_h1_home.png",
      transition: "fade",
      visualFx: "homeWarm",

      text: [
  "Je crois que, ce jour-là, j’ai compris quelque chose.",
  "",
  "Angela n’entrait pas seulement dans une case administrative.",
  "",
  "Elle ne recevait pas seulement un droit.",
  "",
  "Elle recevait une reconnaissance.",
  "",
  "Une place que, dans nos vies, elle occupait déjà depuis longtemps.",
  "",
  "Les filles le savaient.",
  "Moi aussi.",
  "",
  "Mais il y avait quelque chose d’immense à voir le monde finir par le reconnaître.",
  "",
  "Pendant quelques minutes, j’ai vraiment cru que les choses pouvaient s’arranger.",
  "",
  "Pas le pays.",
  "Pas le monde.",
  "",
  "Nous.",
  "",
  "Notre petite partie du monde.",
  "",
  "Et parfois, quand tout s’effondre, c’est ce genre de souvenir qui fait le plus mal.",
  "",
  "Pas parce qu’il est sombre.",
  "",
  "Parce qu’il ne l’est pas."
],

      next: "ch2_r1_blood_eye"
    },

    ch2_r1_blood_eye: {
      id: "ch2_r1_blood_eye",
      label: "Sang dans l’œil",
      kind: "scene",
      image: "./assets/image_fond/scene1/ch1_r1_rubble_return.png",
      transition: "fade",
      visualFx: "rubble",

      text: () => {
  const lines = [
    "Une larme coule sur mon visage.",
    "",
    "Je la sens tracer son chemin dans la poussière et le sang.",
    "",
    "Pendant une seconde, je ne sais plus si elle appartient au souvenir ou au présent.",
    "",
    "Puis la douleur tranche.",
    "",
    "Mon œil gauche se remplit de sang.",
    "Ma vue se brouille.",
    "",
    "Encore une partie de moi qui m’échappe.",
    "",
    "Je ne contrôle plus grand-chose.",
    "",
    "Ni mon corps.",
    "Ni mes souvenirs.",
    "Ni ce qui remonte.",
    "",
    "Je voudrais fermer les yeux.",
    "",
    "Mais même ça, mon corps le fait mal.",
    "",
    "Allez.",
    "",
    "Concentre-toi.",
    "",
    "Retrouve le fil.",
    "",
    "Ne reste pas ici.",
    "",
    "Pas encore."
  ];

  if (playerState.memoryStability <= -1) {
    lines.push(
      "",
      "Les souvenirs tremblent.",
      "",
      "Ils cherchent des issues.",
      "Ils essaient de m’épargner.",
      "",
      "Ou de me mentir."
    );
  }

  if (playerState.traumaLoad >= 2) {
    lines.push(
      "",
      "Chaque battement dans mon crâne ressemble à une porte qu’on enfonce.",
      "",
      "Je sens que je pourrais disparaître là.",
      "",
      "Entre deux images.",
      "Entre deux respirations."
    );
  }

  return lines;
},


      next: "ch2_st1_autumn_street"
    },

    ch2_st1_autumn_street: {
      id: "ch2_st1_autumn_street",
      label: "Automne",
      kind: "scene",
      image: "./assets/image_fond/scene1/home_evening.png",
      transition: "fade",
      visualFx: "homeWarm",

      text: [
  "C’était un mercredi, il me semble.",
  "",
  "Nous avions fait rater aux filles la matinée d’école.",
  "",
  "Elles ne s’en plaignaient pas.",
  "",
  "Bien au contraire.",
  "",
  "Il faisait un temps magnifique pour ce début d’automne.",
  "",
  "Les arbres perdaient leurs feuilles.",
  "Elles tombaient lentement, comme des flocons ambrés.",
  "",
  "Tout donnait à cette journée une sensation presque irréelle.",
  "",
  "Comme si le monde avait décidé, pendant quelques minutes, de nous laisser croire que la beauté suffisait encore.",
  "",
  "Nous étions en train de prendre le chemin du restaurant.",
  "",
  "Rien d’extraordinaire.",
  "",
  "Juste une pizza.",
  "",
  "C’étaient les filles qui avaient choisi.",
  "",
  "Et, pendant quelques minutes, c’était assez.",
  "",
  "C’était même tout."
],

      next: "ch2_st2_general_alarm"
    },

        ch2_st2_general_alarm: {
      id: "ch2_st2_general_alarm",
      label: "Sirène",
      kind: "choice",
      image: "./assets/image_fond/scene1/street_tensions.png",
      transition: "fade",
      visualFx: "streetCold",

      text: () => {
  const lines = [
    "Puis un bruit long et persistant a retenti dans toutes les rues de la ville.",
    "",
    "La sirène d’alerte générale.",
    "",
    "Je l’avais déjà entendue.",
    "",
    "Bien sûr.",
    "",
    "Mais jamais comme ça.",
    "",
    "Jamais autrement que pour un essai.",
    "Jamais avec cette façon de traverser les murs, les corps, les conversations.",
    "",
    "Les filles se sont arrêtées.",
    "Angela aussi.",
    "",
    "Pendant une seconde, plus personne n’a bougé.",
    "",
    "Même les feuilles semblaient tomber moins vite.",
    "",
    "Et dans ce silence étrange, entre deux hurlements de sirène, j’ai compris que quelque chose venait de se produire.",
    "",
    "Quelque chose de grave.",
    "",
    "Je connaissais la chanson.",
    "",
    "Je devais partir."
  ];

  if (playerState.dutyAnchor >= 2) {
    lines.push(
      "",
      "Mon corps l’a compris avant moi.",
      "",
      "Avant même que je décide quoi que ce soit, une partie de moi était déjà en route vers la caserne."
    );
  }

  if (playerState.familyAnchor >= 3) {
    lines.push(
      "",
      "Mais mon premier réflexe n’a pas été la caserne.",
      "",
      "Ça, je m’en souviens.",
      "",
      "Mon premier réflexe, ça a été elles."
    );
  }

  if (playerState.traumaLoad >= 2 && playerState.tendernessToAngela >= 2) {
    lines.push(
      "",
      "Et sur le visage d’Angela, j’ai revu toutes les autres fois.",
      "",
      "Toutes les alertes.",
      "Toutes les attentes.",
      "Tous les retours qui auraient pu ne jamais arriver."
    );
  }

  return lines;
},

      choices: [
        {
          id: "alarm_reassure",
          label: "Rassurer Angela",
          next: "ch2_st3_goodbye",
          effects: {
            playerState: {
              tendernessToAngela: 1,
              selfControl: 1
            }
          }
        },
        {
          id: "alarm_children",
          label: "Embrasser d’abord les filles",
          next: "ch2_st3_goodbye",
          effects: {
            playerState: {
              familyAnchor: 1,
              tendernessToAngela: 1
            }
          }
        },
        {
          id: "alarm_duty",
          label: "Redevenir pompier immédiatement",
          next: "ch2_st3_goodbye",
          effects: {
            playerState: {
              dutyAnchor: 1,
              selfControl: 1
            }
          }
        },
        {
          id: "alarm_stay",
          label: "Rester avec elles",
          next: "ch2_dead_stay_family",
          condition: ({ playerState }) => {
            return playerState.familyAnchor >= 3 || playerState.stress >= 3;
          },
          effects: {
            playerState: {
              memoryStability: -1,
              traumaLoad: 1
            }
          }
        }
      ]
    },

    ch2_dead_stay_family: {
      id: "ch2_dead_stay_family",
      label: "Rester",
      kind: "scene",
      image: "./assets/image_fond/scene1/ch1_r1_rubble_return.png",
      transition: "fade",
      visualFx: "rubble",

      text: [
  "Dans cette version-là, je reste.",
  "",
  "Je ferme la porte.",
  "Je garde Angela contre moi.",
  "Je garde les filles dans mes bras.",
  "",
  "La sirène continue dehors.",
  "",
  "Je fais semblant de croire qu’un mur peut suffire.",
  "Qu’une serrure peut suffire.",
  "Que quelques mots d’amour peuvent tenir le monde à distance.",
  "",
  "Pendant quelques secondes, j’y crois presque.",
  "",
  "Nous sommes ensemble.",
  "Nous sommes vivants.",
  "Nous sommes encore à nous.",
  "",
  "Puis le souvenir se déchire.",
  "",
  "Non.",
  "",
  "Je ne suis pas resté.",
  "",
  "Je n’ai jamais su rester quand ça sonnait.",
  "",
  "Ce n’est pas comme ça que ça s’est passé.",
  "",
  "Je divague.",
  "",
  "La poussière revient.",
  "Le goût du sang aussi.",
  "",
  "Reprendre.",
  "",
  "Encore."
],

      next: "ch2_st2_general_alarm"
    },

    ch2_st3_goodbye: {
      id: "ch2_st3_goodbye",
      label: "Départ",
      kind: "scene",
      image: "./assets/image_fond/scene1/kitchen_back_kiss.png",
      transition: "fade",
      visualFx: "homeWarm",

      text: () => {
  const lines = [
    "J’ai embrassé les filles sur le front.",
    "",
    "L’une après l’autre.",
    "",
    "Puis j’ai serré Angela longuement dans mes bras.",
    "",
    "Trop longuement, peut-être.",
    "",
    "« Je te tiens au courant, chérie.",
    "Rentre à la maison avec les filles, c’est plus sûr.",
    "Tu passeras chercher une pizza au kiosque de la place de l’église en rentrant. »",
    "",
    "Je me souviens de cette phrase.",
    "",
    "La pizza.",
    "",
    "Comme si mettre un détail normal dans une situation anormale pouvait encore protéger quelque chose.",
    "",
    "Angela me serrait fort.",
    "",
    "Je connaissais ce regard.",
    "",
    "Elle était inquiète.",
    "",
    "Pas inquiète comme on l’est par habitude.",
    "",
    "Inquiète comme quelqu’un qui sent que le monde vient de changer de poids.",
    "",
    "Elle m’a supplié de faire attention.",
    "De ne rien faire de stupide.",
    "",
    "Je l’ai embrassée pour tenter de la rassurer."
  ];

  if (playerState.tendernessToAngela >= 3) {
    lines.push(
      "",
      "Je savais que ça ne suffisait pas.",
      "",
      "Un baiser n’a jamais protégé personne.",
      "",
      "Mais parfois, avant de partir, c’est tout ce qu’on trouve à laisser derrière soi."
    );
  }

  if (playerState.dutyAnchor >= 3) {
    lines.push(
      "",
      "Et pourtant, une partie de moi était déjà ailleurs.",
      "",
      "À la caserne.",
      "Aux ordres.",
      "Aux gestes qu’il faudrait faire sans trembler."
    );
  }

  if (playerState.familyAnchor >= 4) {
    lines.push(
      "",
      "Je crois que c’est ça qui me fait le plus mal aujourd’hui.",
      "",
      "Je suis parti d’une scène de vie.",
      "",
      "Pas d’un drame.",
      "Pas d’un adieu.",
      "",
      "D’une pizza promise aux enfants."
    );
  }

  return lines;
},

      next: "ch2_f1_angela_fear"
    },

    ch2_f1_angela_fear: {
      id: "ch2_f1_angela_fear",
      label: "Sa peur",
      kind: "scene",
      image: "./assets/image_fond/scene1/ch1_f2_talk.png",
      transition: "fade",
      visualFx: "homeWarm",

      text: [
  "Nana se faisait toujours du mauvais sang quand je partais en intervention.",
  "",
  "Je crois que je lui en voulais parfois.",
  "",
  "Pas vraiment.",
  "Pas profondément.",
  "",
  "Mais je lui en voulais de me rappeler une chose que je préférais ne pas regarder en face.",
  "",
  "Je pouvais ne pas revenir.",
  "",
  "Elle ne m’avait pas connu avant que je sois pompier.",
  "",
  "Les alertes avaient toujours rythmé notre vie.",
  "Les départs aussi.",
  "Les retours, quand il y en avait.",
  "",
  "Et il était arrivé deux fois qu’elle reçoive un appel de mon chef de garde.",
  "",
  "Deux fois où quelqu’un lui avait annoncé que j’avais eu un problème.",
  "",
  "La première fois, ce n’était pas très grave.",
  "",
  "Enfin...",
  "",
  "C’est ce qu’on dit après coup, quand on s’en sort.",
  "",
  "Une fuite de mon masque ARI sur un feu d’appartement.",
  "Une intoxication.",
  "Une nuit en caisson hyperbare.",
  "",
  "J’étais sur pied le lendemain.",
  "",
  "Alors j’avais minimisé.",
  "",
  "Bien sûr que j’avais minimisé.",
  "",
  "Mais la deuxième fois...",
  "",
  "La deuxième fois, je crois que quelque chose s’était installé en elle pour de bon."
],

      next: "ch2_f2_shooting"
    },

    ch2_f2_shooting: {
      id: "ch2_f2_shooting",
      label: "Coup de feu",
      kind: "choice",
      image: "./assets/image_fond/scene1/locker_room.png",
      transition: "fade",
      visualFx: "firehouseCold",

      text: [
  "Il faisait nuit.",
  "",
  "On avait été appelés pour un homme blessé à son domicile.",
  "",
  "Il était environ deux heures du matin.",
  "",
  "L’homme s’était ouvert avec un tesson de bouteille.",
  "",
  "Il avait bu.",
  "Il s’était drogué.",
  "",
  "Le salon était sens dessus dessous.",
  "",
  "Des bouteilles vides.",
  "Des biscuits apéritifs écrasés au sol.",
  "Des lignes de poudre blanche sur la table basse.",
  "",
  "Une scène banale, d’une certaine manière.",
  "",
  "Le genre de chaos domestique qu’on apprend à traverser sans trop y penser.",
  "",
  "Sauf que lui était agressif.",
  "",
  "Pas seulement agité.",
  "",
  "Agressif.",
  "",
  "Les gendarmes étaient dehors.",
  "Mon collègue aussi.",
  "",
  "Et moi, j’étais seul avec lui quand la situation m’a échappé."
],

      choices: [
        {
          id: "shooting_danger",
          label: "Me souvenir du danger",
          next: "ch2_f3_shot",
          effects: {
            playerState: {
              traumaLoad: 1,
              stress: 1
            }
          }
        },
        {
          id: "shooting_error",
          label: "Me souvenir de l’instant où j’ai compris trop tard",
          next: "ch2_f3_shot",
          effects: {
            playerState: {
              traumaLoad: 1,
              selfControl: -1
            }
          }
        },
        {
          id: "shooting_angela",
          label: "Penser à ce qu’Angela a dû vivre",
          next: "ch2_f3_shot",
          effects: {
            playerState: {
              tendernessToAngela: 1,
              traumaLoad: 1
            }
          }
        }
      ]
    },

    ch2_f3_shot: {
      id: "ch2_f3_shot",
      label: "Impact",
      kind: "scene",
      image: "./assets/image_fond/scene1/ch1_r1_rubble_return.png",
      transition: "fade",
      visualFx: "rubble",

      text: [
  "L’homme a bondi sur le côté du canapé.",
  "",
  "Un geste brusque.",
  "Trop rapide.",
  "",
  "Il a sorti un fusil.",
  "",
  "Il a visé.",
  "",
  "Il a tiré.",
  "",
  "Je me souviens avoir heurté le mur derrière moi avant même de comprendre ce qu’il venait de se passer.",
  "",
  "Avant même de sentir la balle dans mon torse.",
  "",
  "Le bruit est venu après.",
  "",
  "Ou peut-être avant.",
  "",
  "Je ne sais plus.",
  "",
  "Je me souviens du sol.",
  "Des cris.",
  "Des gendarmes qui entraient arme au poing.",
  "",
  "Je me souviens surtout d’une pensée absurde.",
  "",
  "Nana va me tuer.",
  "",
  "Pour la suite, je ne sais que ce qu’on m’a raconté.",
  "",
  "J’étais déjà au bloc."
],

      next: "ch2_f4_hospital"
    },

    ch2_f4_hospital: {
      id: "ch2_f4_hospital",
      label: "Hôpital",
      kind: "scene",
      image: "./assets/image_fond/scene1/ch1_f1_kitchen.png",
      transition: "fade",
      visualFx: "homeWarm",

      text: [
  "Quand je me suis réveillé, on m’a ramené en chambre.",
  "",
  "Nana m’y attendait déjà.",
  "",
  "Je crois qu’elle était passée par toutes les émotions possibles avant même que j’ouvre les yeux.",
  "",
  "La peur.",
  "La colère.",
  "Le soulagement.",
  "L’amour.",
  "",
  "Tout en même temps.",
  "",
  "J’ai eu droit à un énorme baiser.",
  "",
  "À une déclaration d’amour comme jamais elle ne m’en avait faite.",
  "",
  "Et à une gifle à m’en décrocher la mâchoire.",
  "",
  "Je l’avais méritée, sûrement.",
  "",
  "Pas parce que j’avais été blessé.",
  "",
  "Parce que je lui avais fait vivre l’attente.",
  "",
  "Cette attente-là.",
  "",
  "Celle où le téléphone sonne et où votre vie peut changer avant même que vous décrochiez.",
  "",
  "Je pense que c’était de cela qu’elle avait peur.",
  "",
  "Que cette fois, je n’aie pas autant de chance."
],

      next: "ch2_f5_wings"
    },

    ch2_f5_wings: {
      id: "ch2_f5_wings",
      label: "Ses ailes",
      kind: "scene",
      image: "./assets/image_fond/scene1/kitchen_back_kiss.png",
      transition: "fade",
      visualFx: "homeWarm",

      text: [
  "Quand elle avait ces peurs-là, je lui disais toujours la même phrase.",
  "",
  "Je souriais.",
  "",
  "Comme si sourire suffisait à rendre les choses moins graves.",
  "",
  "« Tu es mon ange.",
  "Je t’emprunte tes ailes.",
  "Et tu veilleras sur moi. »",
  "",
  "Au début, elle trouvait ça adorable.",
  "",
  "Je crois qu’elle aimait l’idée.",
  "",
  "Moi qui partais avec un morceau d’elle.",
  "Elle qui restait avec une manière de me protéger malgré tout.",
  "",
  "Puis, avec le temps, cette phrase a changé de goût.",
  "",
  "Je crois qu’elle s’est mise à la détester.",
  "",
  "Parce qu’elle savait très bien ce qu’elle voulait dire.",
  "",
  "Je partais.",
  "",
  "Et je lui demandais de croire en quelque chose qu’elle ne contrôlait pas.",
  "",
  "Ce jour-là encore, j’ai dû lui dire.",
  "",
  "Ou peut-être seulement le penser.",
  "",
  "Je ne sais plus.",
  "",
  "Mais je me souviens de son regard quand je me suis retourné."
],

      next: "ch2_c1_run_to_firehouse"
    },

    ch2_c1_run_to_firehouse: {
      id: "ch2_c1_run_to_firehouse",
      label: "Course",
      kind: "scene",
      image: "./assets/image_fond/scene1/street_tensions.png",
      transition: "fade",
      visualFx: "streetCold",

      text: [
  "Je me suis retourné dans ma course.",
  "",
  "J’ai croisé son regard.",
  "",
  "Je lui ai envoyé un baiser de la main.",
  "",
  "Elle m’a crié qu’elle m’aimait.",
  "",
  "Je lui ai répondu que moi aussi.",
  "",
  "Puis j’ai couru vers la caserne.",
  "",
  "Quelques centaines de mètres à peine.",
  "",
  "Une distance ridicule.",
  "",
  "Assez courte pour que mon corps connaisse déjà le chemin.",
  "",
  "Assez longue pour que, derrière moi, leurs voix commencent déjà à disparaître.",
  "",
  "À chaque foulée, je redevenais pompier.",
  "",
  "Et à chaque foulée, je m’éloignais d’elles."
],

      next: "ch2_c2_firehouse_arrival"
    },

        ch2_c2_firehouse_arrival: {
      id: "ch2_c2_firehouse_arrival",
      label: "Caserne",
      kind: "choice",
      image: "./assets/image_fond/scene1/locker_room.png",
      transition: "fade",
      visualFx: "firehouseCold",

      text: [
  "J’ai rapidement rejoint le centre de secours.",
  "",
  "Les hommes de la garde étaient déjà là.",
  "",
  "Pas tous.",
  "Pas encore.",
  "",
  "Mais assez pour que l’air de la caserne ait déjà changé.",
  "",
  "On le sent, ce genre de tension.",
  "",
  "Des pas plus rapides.",
  "Des portes qu’on ferme trop fort.",
  "Des regards qui cherchent une réponse avant même qu’une question soit posée.",
  "",
  "Je suis entré dans la salle radio.",
  "",
  "Un caporal nouvellement arrivé m’a lancé :",
  "",
  "« Tu devrais te mettre en tenue, sergent.",
  "C’est la guerre. »",
  "",
  "On utilise souvent cette expression.",
  "",
  "Quand ça tombe de partout.",
  "Quand les appels s’enchaînent.",
  "Quand la garde comprend qu’elle va passer une sale nuit.",
  "",
  "Mais là, il avait un air grave.",
  "",
  "Pas l’air d’un homme qui exagère.",
  "",
  "L’air d’un homme qui répète quelque chose qu’il vient lui-même de comprendre."
],

      choices: [
        {
          id: "firehouse_expression",
          label: "Croire un instant à une simple expression",
          next: "ch2_c3_war_fax",
          effects: {
            playerState: {
              memoryStability: -1,
              selfControl: 1
            }
          }
        },
        {
          id: "firehouse_understand",
          label: "Comprendre immédiatement",
          next: "ch2_c3_war_fax",
          effects: {
            playerState: {
              politicalLucidity: 1,
              stress: 1
            }
          }
        },
        {
          id: "firehouse_absorb",
          label: "Encaisser sans commenter",
          next: "ch2_c3_war_fax",
          effects: {
            playerState: {
              selfControl: 1,
              dutyAnchor: 1
            }
          }
        },
        {
          id: "firehouse_bitter",
          label: "Me dire qu’on allait encore ramasser ce que d’autres avaient laissé pourrir",
          next: "ch2_c3_war_fax",
          condition: ({ playerState }) => {
            return playerState.beliefHelped === false || playerState.politicalLucidity >= 3;
          },
          effects: {
            playerState: {
              politicalLucidity: 1,
              traumaLoad: 1
            }
          }
        }
      ]
    },

    ch2_c3_war_fax: {
      id: "ch2_c3_war_fax",
      label: "Fax",
      kind: "scene",
      image: "./assets/image_fond/scene1/ch1_t2_governor.png",
      transition: "fade",
      visualFx: "tvBlue",

      text: () => {
  const lines = [
    "Le fax était posé sur le bureau.",
    "",
    "Une feuille blanche.",
    "Quelques lignes imprimées.",
    "",
    "Rien d’impressionnant.",
    "",
    "C’est souvent comme ça que les catastrophes commencent dans les services.",
    "",
    "Pas par une explosion.",
    "Pas par un cri.",
    "",
    "Par une feuille qu’on lit trop vite.",
    "",
    "La guerre était déclarée.",
    "",
    "Tous les services étaient mobilisés en urgence.",
    "",
    "Gendarmerie.",
    "Police.",
    "Pompiers.",
    "Hôpitaux.",
    "Armée.",
    "",
    "La dépêche disait seulement que des attaques étaient imminentes.",
    "",
    "On ne savait pas où.",
    "On ne savait pas contre qui.",
    "On ne savait pas vraiment pourquoi.",
    "",
    "Mais on savait déjà que ça allait tomber."
  ];

  if (playerState.proudReason === "save") {
    lines.push(
      "",
      "Je crois que je pensais encore avec mes vieux réflexes.",
      "",
      "Sauver.",
      "Extraire.",
      "Ramener.",
      "",
      "Comme si la guerre acceptait les mêmes règles qu’un accident de voiture."
    );
  }

  if (playerState.proudReason === "useful") {
    lines.push(
      "",
      "J’avais presque besoin qu’on me donne quelque chose à faire.",
      "",
      "Un ordre.",
      "Une tâche.",
      "Une place.",
      "",
      "L’attente me détruisait davantage que le danger."
    );
  }

  if (playerState.proudReason === "exist") {
    lines.push(
      "",
      "La tenue me rassurait.",
      "",
      "Elle me donnait une forme claire.",
      "Un rôle.",
      "Un contour.",
      "",
      "Sans elle, je crois que je me serais senti disparaître."
    );
  }

  return lines;
},

      next: "ch2_c4_mobilisation"
    },

    ch2_c4_mobilisation: {
      id: "ch2_c4_mobilisation",
      label: "Mobilisation",
      kind: "choice",
      image: "./assets/image_fond/scene1/fire_silhouette.png",
      transition: "fade",
      visualFx: "firehouseCold",

      text: [
  "La sirène avait rappelé tout le monde.",
  "",
  "Sur les quatre-vingt-dix hommes du centre, nous étions une quarantaine à avoir répondu.",
  "",
  "Certains n’avaient peut-être pas entendu.",
  "D’autres avaient peut-être rejoint un centre plus proche.",
  "D’autres encore étaient peut-être restés auprès des leurs.",
  "",
  "Personne ne posait vraiment la question.",
  "",
  "Pas à voix haute.",
  "",
  "On s’est réparti les piquets à la hâte.",
  "",
  "Des noms.",
  "Des véhicules.",
  "Des fonctions.",
  "",
  "Moi, j’étais affecté au fourgon incendie numéro un.",
  "",
  "Une place claire.",
  "Une mission claire.",
  "",
  "Dans ces moments-là, on s’accroche à ce qui ressemble encore à une organisation.",
  "",
  "Même quand on sait très bien qu’elle ne tiendra peut-être pas longtemps."
],

      choices: [
        {
          id: "mobilisation_accept",
          label: "Accepter ma place sans réfléchir",
          next: "ch2_c5_waiting",
          effects: {
            playerState: {
              dutyAnchor: 1,
              selfControl: 1
            }
          }
        },
        {
          id: "mobilisation_colleagues",
          label: "Chercher les autres du regard",
          next: "ch2_c5_waiting",
          effects: {
            playerState: {
              familyAnchor: 1,
              stress: 1
            }
          }
        },
        {
          id: "mobilisation_numbers",
          label: "Mesurer déjà ce qui nous manquait",
          next: "ch2_c5_waiting",
          effects: {
            playerState: {
              politicalLucidity: 1,
              stress: 1
            }
          }
        }
      ]
    },

    ch2_c5_waiting: {
      id: "ch2_c5_waiting",
      label: "Attente",
      kind: "choice",
      image: "./assets/image_fond/scene1/locker_room.png",
      transition: "fade",
      visualFx: "firehouseCold",

      text: () => {
  const lines = [
    "Les premières heures, il ne s’est rien passé.",
    "",
    "Rien de ce qu’on attendait, en tout cas.",
    "",
    "On recevait encore des appels.",
    "",
    "Des interventions normales.",
    "Des malaises.",
    "Des accidents domestiques.",
    "Des choses presque rassurantes à force d’être ordinaires.",
    "",
    "Certains plaisantaient autour de la machine à café.",
    "",
    "Comme toujours.",
    "",
    "Parce qu’il faut bien remplir le silence.",
    "",
    "Alors nous avons fait ce qu’on sait faire quand l’action ne vient pas.",
    "",
    "Vérifier les véhicules.",
    "Contrôler le matériel.",
    "Remettre les sangles droites.",
    "Ouvrir et refermer des coffres qu’on connaissait par cœur.",
    "",
    "Le chef de garde nous a demandé de porter les gilets pare-balles.",
    "",
    "Je détestais ça.",
    "",
    "Ce poids sur le torse.",
    "Cette gêne dans les mouvements.",
    "Cette sensation absurde d’être devenu une cible.",
    "",
    "J’étais pompier.",
    "",
    "J’étais censé porter secours.",
    "",
    "Pas me préparer comme si quelqu’un allait me tirer dessus."
  ];

  if (playerState.stress >= 3) {
    lines.push(
      "",
      "Je sentais mes nerfs se tendre minute après minute.",
      "",
      "L’attente me paraissait pire que l’action.",
      "",
      "Au moins, dans l’action, on sait quoi faire de ses mains."
    );
  }

  if (playerState.familyAnchor >= 3) {
    lines.push(
      "",
      "Chaque minute passée ici me donnait l’impression d’être au mauvais endroit.",
      "",
      "Ma place aurait dû être auprès d’elles.",
      "",
      "Ou du moins, c’est ce que la partie de moi qui n’était pas pompier répétait sans arrêt."
    );
  }

  if (playerState.selfControl >= 3) {
    lines.push(
      "",
      "Je faisais pourtant ce que j’avais toujours su faire.",
      "",
      "Respirer.",
      "Attendre.",
      "Tenir.",
      "",
      "Donner à mon corps l’ordre de ne pas penser trop fort."
    );
  }

  return lines;
},

      choices: [
        {
          id: "waiting_check_gear",
          label: "Vérifier le matériel pour ne pas penser",
          next: "ch2_c6_helmet_photo",
          effects: {
            playerState: {
              dutyAnchor: 1,
              selfControl: 1
            }
          }
        },
        {
          id: "waiting_call_angela",
          label: "Essayer encore d’appeler Angela",
          next: "ch2_c7_failed_call",
          effects: {
            playerState: {
              familyAnchor: 1,
              stress: 1
            }
          }
        },
        {
          id: "waiting_watch_photo",
          label: "Regarder la photo dans mon casque",
          next: "ch2_c6_helmet_photo",
          effects: {
            playerState: {
              familyAnchor: 1,
              tendernessToAngela: 1,
              traumaLoad: 1
            }
          }
        },
        {
          id: "waiting_take_action",
          label: "Prendre les devants avant l’ordre",
          next: "ch2_dead_heroic",
          condition: ({ playerState }) => {
            return playerState.dutyAnchor >= 3 || playerState.proudReason === "save";
          },
          effects: {
            playerState: {
              memoryStability: -1,
              stress: 1
            }
          }
        }
      ]
    },

    ch2_dead_heroic: {
      id: "ch2_dead_heroic",
      label: "Faux héroïsme",
      kind: "scene",
      image: "./assets/image_fond/scene1/ch1_r1_rubble_return.png",
      transition: "fade",
      visualFx: "rubble",

      text: [
  "Dans cette version-là, je pars avant les autres.",
  "",
  "Bien sûr.",
  "",
  "Je comprends avant tout le monde.",
  "Je devine le danger.",
  "Je monte dans le fourgon sans attendre l’ordre.",
  "",
  "Je sauve avant qu’on me le demande.",
  "",
  "C’est presque confortable, comme mensonge.",
  "",
  "Un Mika plus grand.",
  "Plus courageux.",
  "Plus nécessaire.",
  "",
  "Puis le souvenir s’écroule.",
  "",
  "Non.",
  "",
  "Même ici, même maintenant, j’essaie encore parfois de me donner un rôle plus beau que celui que j’avais.",
  "",
  "La vérité est plus simple.",
  "",
  "J’ai attendu.",
  "",
  "Comme les autres.",
  "",
  "J’ai attendu qu’on me dise où aller.",
  "",
  "Je divague.",
  "",
  "Reprendre."
],


      next: "ch2_c5_waiting"
    },

    ch2_c6_helmet_photo: {
      id: "ch2_c6_helmet_photo",
      label: "Photo",
      kind: "scene",
      image: "./assets/image_fond/scene1/fire_silhouette.png",
      transition: "fade",
      visualFx: "firehouseCold",

      text: () => {
  const lines = [
    "J’ai vérifié mon équipement.",
    "",
    "Les rangers.",
    "Le surpantalon.",
    "La veste.",
    "Les gants.",
    "Les cales.",
    "Les craies.",
    "",
    "Des gestes connus.",
    "",
    "Presque rassurants.",
    "",
    "Puis j’ai pris mon casque.",
    "",
    "Le casque argenté.",
    "Celui qu’on reconnaissait de loin.",
    "",
    "À l’intérieur, juste sous la résille, j’avais glissé une photo.",
    "",
    "Angela.",
    "Les filles.",
    "",
    "Une image minuscule.",
    "Presque ridicule dans un équipement pareil.",
    "",
    "Et pourtant, je la regardais avant chaque intervention.",
    "",
    "Pas longtemps.",
    "",
    "Juste assez pour me rappeler pourquoi il fallait rentrer.",
    "",
    "Ce soir-là, la photo m’a paru plus lourde que le casque lui-même."
  ];

  if (playerState.tendernessToAngela >= 3) {
    lines.push(
      "",
      "Je revois son sourire sur cette photo.",
      "",
      "Ce n’était pas seulement le visage d’Angela.",
      "",
      "C’était mon point fixe."
    );
  }

  if (playerState.familyAnchor >= 4) {
    lines.push(
      "",
      "Je crois que j’aurais pu rester là longtemps.",
      "",
      "À regarder cette petite image.",
      "À essayer de croire qu’elle suffisait à les garder près de moi."
    );
  }

  if (playerState.traumaLoad >= 3) {
    lines.push(
      "",
      "Mais plus je la regardais, plus elle me faisait mal.",
      "",
      "Comme si le souvenir du bonheur annonçait déjà sa perte."
    );
  }

  return lines;
},

      next: "ch2_c7_failed_call"
    },

    ch2_c7_failed_call: {
      id: "ch2_c7_failed_call",
      label: "Lignes saturées",
      kind: "choice",
      image: "./assets/image_fond/scene1/ch1_f2_talk.png",
      transition: "fade",
      visualFx: "homeWarm",

      text: [
  "Depuis le début de l’alerte, les lignes téléphoniques étaient saturées.",
  "",
  "Impossible de joindre qui que ce soit.",
  "",
  "J’essayais sans cesse d’appeler Angela.",
  "",
  "Pour lui dire le peu que je savais.",
  "Pour lui dire de rentrer.",
  "Pour lui dire que j’allais faire attention.",
  "",
  "Pour entendre sa voix, surtout.",
  "",
  "Rien à faire.",
  "",
  "Toujours le même message préenregistré.",
  "",
  "La même voix calme.",
  "La même phrase.",
  "La même impossibilité.",
  "",
  "C’est fou comme une voix automatique peut devenir violente quand elle vous empêche d’atteindre quelqu’un que vous aimez."
],


      choices: [
        {
          id: "call_insist",
          label: "M’acharner encore",
          next: "ch2_c8_smoke_wall",
          effects: {
            playerState: {
              stress: 1,
              familyAnchor: 1
            }
          }
        },
        {
          id: "call_focus",
          label: "Abandonner et me concentrer",
          next: "ch2_c8_smoke_wall",
          effects: {
            playerState: {
              selfControl: 1,
              dutyAnchor: 1
            }
          }
        },
        {
          id: "call_photo",
          label: "Me contenter de regarder la photo",
          next: "ch2_c8_smoke_wall",
          effects: {
            playerState: {
              tendernessToAngela: 1,
              traumaLoad: 1
            }
          }
        }
      ]
    },

    ch2_c8_smoke_wall: {
      id: "ch2_c8_smoke_wall",
      label: "Murette",
      kind: "choice",
      image: "./assets/image_fond/scene1/street_tensions.png",
      transition: "fade",
      visualFx: "streetCold",

      text: [
  "Je suis sorti.",
  "",
  "J’avais besoin d’air.",
  "",
  "Ou d’un geste à faire avec mes mains.",
  "",
  "Je me suis assis sur la murette devant la caserne.",
  "",
  "Une cigarette entre les doigts.",
  "",
  "Angela détestait que je fume.",
  "",
  "Elle le sentait toujours sur mes vêtements.",
  "La moindre odeur me trahissait.",
  "",
  "Alors j’avais réduit.",
  "",
  "Une ou deux par jour.",
  "Parfois aucune.",
  "",
  "Ce soir-là, je crois que je n’avais pas la force de faire semblant d’être raisonnable.",
  "",
  "Il devait être dix-huit heures.",
  "",
  "La ville passait encore devant moi.",
  "",
  "Des voitures.",
  "Des gens.",
  "Des fenêtres allumées.",
  "",
  "Tout ce qui ressemblait encore à une vie normale.",
  "",
  "La ville semblait attendre avec nous."
],


      choices: [
        {
          id: "smoke_dream",
          label: "Rêvasser encore",
          next: "ch2_c9_planes",
          effects: {
            playerState: {
              memoryStability: -1,
              traumaLoad: 1
            }
          }
        },
        {
          id: "smoke_watch",
          label: "Observer la rue",
          next: "ch2_c9_planes",
          effects: {
            playerState: {
              politicalLucidity: 1,
              selfControl: 1
            }
          }
        },
        {
          id: "smoke_home",
          label: "Penser à rentrer",
          next: "ch2_c9_planes",
          effects: {
            playerState: {
              familyAnchor: 1,
              stress: 1
            }
          }
        }
      ]
    },

    ch2_c9_planes: {
      id: "ch2_c9_planes",
      label: "Avions",
      kind: "scene",
      image: "./assets/image_fond/scene1/ch1_p2_trigger.png",
      transition: "fade",
      visualFx: "rubble",

      text: [
  "Un bruit a traversé le ciel.",
  "",
  "Pas un bruit de moteur comme les autres.",
  "",
  "Quelque chose de trop bas.",
  "Trop lourd.",
  "Trop rapide.",
  "",
  "J’ai levé les yeux.",
  "",
  "J’ai aperçu deux avions.",
  "",
  "Le temps s’est étiré.",
  "",
  "Une seconde.",
  "Peut-être deux.",
  "",
  "Assez pour que mon cerveau comprenne.",
  "",
  "Pas assez pour que mon corps fasse quoi que ce soit."
],

      next: "ch2_c10_explosions"
    },

    ch2_c10_explosions: {
      id: "ch2_c10_explosions",
      label: "Explosions",
      kind: "choice",
      image: "./assets/image_fond/scene1/ch1_r1_rubble_return.png",
      transition: "fade",
      visualFx: "rubble",

      text: [
  "Puis quatre explosions ont secoué la ville.",
  "",
  "Quatre.",
  "",
  "Pas une.",
  "Pas deux.",
  "",
  "Quatre immenses déflagrations.",
  "",
  "Le sol a tremblé comme s’il venait de s’effondrer sous nous.",
  "",
  "Les vitres ont vibré.",
  "Des alarmes se sont déclenchées.",
  "Des oiseaux ont jailli des toits comme une fumée vivante.",
  "",
  "Pendant une seconde, tout le monde s’est figé.",
  "",
  "Les voitures.",
  "Les passants.",
  "Les hommes devant la caserne.",
  "",
  "La ville entière a retenu son souffle.",
  "",
  "Puis mon bipper a hurlé."
],

      choices: [
        {
          id: "blast_shock",
          label: "Rester sidéré une seconde de trop",
          next: "ch2_c11_radio_order",
          effects: {
            playerState: {
              selfControl: -1,
              stress: 1,
              traumaLoad: 1
            }
          }
        },
        {
          id: "blast_recover",
          label: "Me ressaisir immédiatement",
          next: "ch2_c11_radio_order",
          effects: {
            playerState: {
              selfControl: 1,
              dutyAnchor: 1
            }
          }
        },
        {
          id: "blast_family",
          label: "Penser d’abord aux miens",
          next: "ch2_c11_radio_order",
          effects: {
            playerState: {
              familyAnchor: 1,
              stress: 1
            }
          }
        }
      ]
    },

    ch2_c11_radio_order: {
      id: "ch2_c11_radio_order",
      label: "Ordre",
      kind: "choice",
      image: "./assets/image_fond/scene1/locker_room.png",
      transition: "fade",
      visualFx: "firehouseCold",

      text: [
  "Je suis rentré dans la salle radio.",
  "",
  "Tout allait plus vite.",
  "",
  "Les voix.",
  "Les pas.",
  "Les ordres.",
  "",
  "Le chef de garde m’a regardé.",
  "",
  "« Mika, t’es au BAT.",
  "Tu prends en charge Jérémy.",
  "Vous partez sur une destruction de bâtiment. »",
  "",
  "Destruction de bâtiment.",
  "",
  "Les mots sont tombés dans ma tête avec un poids particulier.",
  "",
  "Pas parce que je savais.",
  "",
  "Pas encore.",
  "",
  "Mais parce qu’une partie de moi avait déjà compris que cette intervention ne ressemblerait pas aux autres.",
  "",
  "Il n’y avait plus rien à discuter.",
  "",
  "Il fallait partir."
],


      choices: [
        {
          id: "order_absorb",
          label: "Encaisser l’ordre",
          next: "ch2_c12_departure",
          effects: {
            playerState: {
              selfControl: 1
            }
          }
        },
        {
          id: "order_jeremy",
          label: "Chercher Jérémy du regard",
          next: "ch2_c12_departure",
          effects: {
            playerState: {
              dutyAnchor: 1,
              stress: 1
            }
          }
        },
        {
          id: "order_depart",
          label: "Ne penser qu’au départ",
          next: "ch2_c12_departure",
          effects: {
            playerState: {
              dutyAnchor: 1,
              memoryStability: 1
            }
          }
        }
      ]
    },

        ch2_c12_departure: {
      id: "ch2_c12_departure",
      label: "Départ",
      kind: "scene",
      image: "./assets/image_fond/scene1/fire_silhouette.png",
      transition: "fade",
      visualFx: "firehouseCold",

      text: [
  "Je savais ce que cela voulait dire.",
  "",
  "Destruction de bâtiment.",
  "",
  "Victimes probables.",
  "Accès difficiles.",
  "Risques secondaires.",
  "",
  "Poussières.",
  "Feu.",
  "Béton.",
  "",
  "Le genre d’intervention où tout peut changer à chaque seconde.",
  "",
  "J’ai attrapé mon casque.",
  "",
  "Jérémy était déjà près du fourgon.",
  "",
  "Nos regards se sont croisés.",
  "",
  "Pas besoin de grandes phrases.",
  "",
  "On savait.",
  "",
  "Les portes ont claqué.",
  "",
  "Le moteur a grondé.",
  "",
  "Puis la sirène a hurlé.",
  "",
  "Et le fourgon est parti."
],
      next: "ch2_end"
    },

        ch2_end: {
      id: "ch2_end",
      label: "Fin chapitre 2",
      kind: "end",
      image: "./assets/image_fond/black_soft.png",
      transition: "fade",
      visualFx: "rubble",

      text: [
        "Chapitre 2 — Le déclin",
        "",
        "Fin."
      ]
    }
  }
}

function resolveText(node, scene) {
  const raw = typeof node.text === "function" ? node.text(scene) : node.text;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") return [raw];
  return [];
}

function getNode(nodeId) {
  return chapter2Map.nodes[nodeId] || null;
}

function getNextNodeId(scene, node) {
  if (!node) return null;
  if (typeof node.getNext === "function") return node.getNext(scene);
  if (node.next) return node.next;
  return null;
}

function canShowChoice(choice, scene) {
  if (!choice) return false;

  if (typeof choice.condition !== "function") {
    return true;
  }

  try {
    return !!choice.condition({
      playerState,
      scene
    });
  } catch (error) {
    console.warn("Erreur dans la condition du choix :", choice.id, error);
    return false;
  }
}

function getVisibleChoices(node, scene) {
  if (!Array.isArray(node?.choices)) {
    return [];
  }

  return node.choices.filter((choice) => canShowChoice(choice, scene));
}

function normalizeRendererDeps(deps = {}) {
  const noop = () => {};

  return {
    mount: deps.mount || document.getElementById("app") || document.body,
    onChapterEnd: deps.onChapterEnd || noop,
    onStateChange: deps.onStateChange || noop,
    beforeRender: deps.beforeRender || noop,
    afterRender: deps.afterRender || noop
  };
}

function applyScene2VisualFx(fxName) {
  if (!sceneImage) return;

  sceneImage.classList.remove(
    "fx-rubble",
    "fx-homeWarm",
    "fx-tvBlue",
    "fx-streetCold",
    "fx-ligueRed",
    "fx-firehouseCold"
  );

  if (!fxName) return;

  const allowedFx = [
    "rubble",
    "homeWarm",
    "tvBlue",
    "streetCold",
    "ligueRed",
    "firehouseCold"
  ];

  if (allowedFx.includes(fxName)) {
    sceneImage.classList.add(`fx-${fxName}`);
  }
}

async function renderNode(node, scene, deps, goToNode) {
  const { beforeRender, afterRender } = deps;

  currentGoToNode = goToNode;
  currentScene = scene;
  currentChapterEndHandler = deps.onChapterEnd;

  clearTimers();
  hideChoices();
  showPanelOnly("");

  await beforeRender({ node, scene });

  if (node.transition === "fade" && node.image) {
    await engine.transitionToImage(node.image, 900);
  } else if (node.image && sceneImage) {
    sceneImage.style.backgroundImage = `url("${node.image}")`;
    sceneImage.classList.add("is-visible");
  }

  applyScene2VisualFx(node.visualFx || "");

  const lines = resolveText(node, scene);
  await typeText(lines, {
    speed: 32,
    lineGapMs: 360,
    clearFirst: true
  });

  if (node.kind === "choice" && Array.isArray(node.choices)) {
    const visibleChoices = getVisibleChoices(node, scene);

    if (visibleChoices.length === 0) {
      console.warn(`[scene2] Aucun choix visible pour le nœud : ${node.id}`);

      showChoices("", [
        {
          id: "next_scene2",
          label: "Continuer"
        }
      ]);

      const nextNodeId = getNextNodeId(scene, node);

      setChoiceMap(
        new Map([
          [
            "next_scene2",
            nextNodeId
              ? { type: "next", nextNodeId }
              : { type: "end" }
          ]
        ])
      );
    } else {
      const uiChoices = visibleChoices.map((choice) => ({
        id: choice.id,
        label: choice.label
      }));

      showChoices("", uiChoices, {
        initialDelayMs: 250,
        staggerMs: 120
      });

      setChoiceMap(
        new Map(
          visibleChoices.map((choice) => [
            choice.id,
            { type: "choice", choice }
          ])
        )
      );
    }
  } else if (node.kind === "end") {
    showChoices("", [
      { id: "end_scene2", label: "Afficher la carte du chapitre" }
    ]);

    setChoiceMap(
      new Map([
        ["end_scene2", { type: "end" }]
      ])
    );
  } else {
    const nextNodeId = getNextNodeId(scene, node);

    showChoices("", [
      {
        id: "next_scene2",
        label: nextNodeId ? "Continuer" : "Finir"
      }
    ]);

    if (nextNodeId) {
      setChoiceMap(
        new Map([
          ["next_scene2", { type: "next", nextNodeId }]
        ])
      );
    } else {
      setChoiceMap(
        new Map([
          ["next_scene2", { type: "end" }]
        ])
      );
    }
  }

  afterRender({ node, scene });
}

export function getChapter2Progress(state = {}) {
  const scene = ensureSceneState(state);

  return {
    chapterId: chapter2Map.id,
    title: chapter2Map.title,
    currentNodeId: scene.currentNodeId,
    visitedNodes: [...scene.visitedNodes],
    visitedSet: { ...scene.visitedSet },
    flags: { ...scene.flags },
    playerState: { ...playerState },
    ended: scene.ended
  };
}

export function getChapter2MapData() {
  return chapter2Map;
}

export function resetScene2(state = {}) {
  state.scene2 = {
    currentNodeId: null,
    visitedNodes: [],
    visitedSet: {},
    flags: {},
    ended: false
  };

  return state.scene2;
}

async function playScene2Intro() {
  clearTimers();
  hideChoices();

  if (textContainer) {
    textContainer.innerHTML = "";
    textContainer.style.opacity = "0";
  }

  if (choicePanel) {
    choicePanel.classList.remove("on");
  }

  if (sceneImage) {
    sceneImage.style.backgroundImage = 'url("./assets/image_fond/black_soft.png")';
    sceneImage.classList.add("is-visible");
  }

  if (chapterCard) {
    chapterCard.textContent = chapter2Map.title;

    chapterCard.classList.remove("is-hiding");
    chapterCard.classList.remove("is-visible");

    void chapterCard.offsetWidth;

    chapterCard.classList.add("is-visible");
  }

  await wait(1800);

  if (chapterCard) {
    chapterCard.classList.add("is-hiding");
    chapterCard.classList.remove("is-visible");
  }

  await wait(1400);

  if (chapterCard) {
    chapterCard.classList.remove("is-hiding");
  }

  if (textContainer) {
    textContainer.style.opacity = "1";
  }
}

export async function startScene2(state = {}, deps = {}) {
  const scene = ensureSceneState(state);
  const rendererDeps = normalizeRendererDeps(deps);

  showScreen("scene1");

  const isFirstLaunch = !scene.currentNodeId;

  if (isFirstLaunch) {
    await playScene2Intro();
  } else {
    if (sceneImage) {
      sceneImage.classList.add("is-visible");
    }

    if (textContainer) {
      textContainer.style.opacity = "1";
    }
  }

  async function goToNode(nodeId) {
    const node = getNode(nodeId);

    if (!node) {
      throw new Error(`[scene2] Node introuvable: ${nodeId}`);
    }

    scene.currentNodeId = nodeId;
    visitNode(scene, nodeId);
    applyOnEnter(node, scene);
    rendererDeps.onStateChange(getChapter2Progress(state));
    await renderNode(node, scene, rendererDeps, goToNode);
  }

  const entryNodeId = scene.currentNodeId || chapter2Map.start;
  await goToNode(entryNodeId);

  return {
    goToNode,
    getProgress: () => getChapter2Progress(state),
    getMap: () => chapter2Map,
    reset: () => resetScene2(state)
  };
}