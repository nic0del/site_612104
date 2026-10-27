import { playerState } from "../state.js";
import { startChapter, getSceneState } from "./chapterRunner.js";

const PLAYER_STATE_NUMERIC_KEYS = [
  "selfControl",
  "familyAnchor",
  "dutyAnchor",
  "politicalLucidity",
  "tendernessToAngela",
  "traumaLoad",
  "stress"
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setFlag(scene, key, value = true) {
  scene.flags[key] = value;
}

function getFlag(scene, key) {
  return scene.flags[key];
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

function getScene1MikaStateText() {
  let controlText = "Je tiens encore debout mentalement, mais de justesse.";
  if (playerState.selfControl >= 2) {
    controlText = "Je garde encore assez de contrôle pour penser clairement.";
  } else if (playerState.selfControl <= -2) {
    controlText = "Je sens que quelque chose cède en moi à chaque instant.";
  }

  let familyText = "Je pourrais encore faire semblant de croire que tout cela ne concerne que moi.";
  if (playerState.familyAnchor >= 2 || playerState.tendernessToAngela >= 2) {
    familyText = "Plus je pense à eux, moins j’ai le droit de lâcher.";
  }

  let politicsText = "Le monde pourrait encore n’être qu’un décor effondré autour de moi.";
  if (playerState.politicalLucidity >= 2) {
    politicsText = "Je vois déjà que ce qui m’arrive ne vient pas de nulle part.";
  } else if (playerState.stress >= 2) {
    politicsText = "Le réel se brouille par moments, mais je sens qu’il s’est passé quelque chose de plus vaste.";
  }

  return `${controlText} ${familyText} ${politicsText}`;
}

export const chapter1Map = {
  id: "chapter1",
  title: "Chapitre 1 - L'origine",
  start: "ch1_p0_black",
  end: "ch1_end",

  nodes: {
    ch1_p0_black: {
  id: "ch1_p0_black",
  label: "Black / souffle / impact",
  kind: "scene",
  x: 80,
  y: 300,
  image: "./assets/image_fond/scene1/ch1_p0_black.png",
  transition: "fade",
  visualFx: "rubble",

  text: [
    "Il n’y a plus rien. Pas même la douleur, au début.",
    "Puis l’air revient d’un coup, lourd, brûlant, chargé de poussière. Et avec lui, tout le reste."
  ],

  next: "ch1_p1_eyes",
},

    ch1_p1_eyes: {
  id: "ch1_p1_eyes",
  label: "Les yeux s'ouvrent",
  kind: "choice",
  x: 260,
  y: 300,
  image: "./assets/image_fond/scene1/ch1_p1_eyes.png",
  transition: "fade",
  visualFx: "rubble",

  text: [
    "J’ouvre les yeux à peine.",
    "Lumière sale. Béton. Poussière. Rien ne répond comme il faut.",
    "Pendant quelques secondes, je ne comprends pas vraiment où je suis. Puis le corps se charge de me le rappeler.",
    "Je suis vivant.",
    "Mais à peine."
  ],

  choices: [
    {
      id: "p1_focus",
      label: "Se concentrer sur sa respiration",
      next: "ch1_p1a_breathe",
      effects: { playerState: { selfControl: 1 } },
    },
    {
      id: "p1_panic",
      label: "Laisser monter la panique",
      next: "ch1_p1b_panic",
      effects: { playerState: { selfControl: -1, stress: 1 } },
    },
    {
      id: "p1_call",
      label: "Appeler à l'aide",
      next: "ch1_p1c_call",
      effects: { playerState: { tendernessToAngela: 1 } },
    },
  ],
},

    ch1_p1a_breathe: {
  id: "ch1_p1a_breathe",
  label: "Respiration contrôlée",
  kind: "scene",
  x: 460,
  y: 220,
  visualFx: "rubble",

  text: [
    "Je fais ce qu’on apprend à faire quand le corps commence à paniquer.",
    "Inspirer peu. Expirer plus lentement. Ne pas gaspiller l’air. Ne pas laisser la peur décider à ma place.",
    "C’est presque ridicule, quand on y pense. On peut avoir passé sa vie à intervenir pour les autres, et se retrouver à négocier avec sa propre respiration comme avec une victime qu’il faudrait empêcher de lâcher."
  ],

  next: "ch1_p2_trigger",
},

ch1_p1b_panic: {
  id: "ch1_p1b_panic",
  label: "Panique",
  kind: "scene",
  x: 460,
  y: 300,
  visualFx: "rubble",

  text: [
    "Mon souffle s’emballe avant même que je puisse le retenir. Le corps ne demande pas l’autorisation.",
    "Il cherche de l’air. Il cherche une issue. Il cherche n’importe quoi.",
    "Et plus il lutte, plus il me trahit.",
    "Je le sens très clairement : si je le laisse faire, il me tuera avant les gravats."
  ],

  next: "ch1_p2_trigger",
},

    ch1_p1c_call: {
  id: "ch1_p1c_call",
  label: "Appel à l'aide",
  kind: "scene",
  x: 460,
  y: 380,
  visualFx: "rubble",

  text: [
    "J’essaie d’appeler. Pas fort. Je sais très bien que je n’en ai pas les moyens.",
    "Ma voix sort mal, écrasée, étranglée par la poussière.",
    "Aucune réponse.",
    "Seulement ce monde cassé qui me renvoie mon propre souffle. Je crois que c’est là que je comprends vraiment que je suis seul."
  ],

  next: "ch1_p2_trigger",
},

    ch1_p2_trigger: {
  id: "ch1_p2_trigger",
  label: "Déclencheur mémoire",
  kind: "choice",
  x: 700,
  y: 300,
  image: "./assets/image_fond/scene1/ch1_p2_trigger.png",
  transition: "fade",
  visualFx: "rubble",

  text: [
    "Je tente de me concentrer. Pas sur mon corps. Surtout pas sur mon corps.",
    "Alors je fais ce que l’esprit humain fait toujours quand il est coincé quelque part et qu’il refuse d’admettre qu’il n’a plus de prise.",
    "Je cherche une cause. Un début. Un responsable.",
    "La situation du monde. Mes choix. Mes lâchetés.",
    "Je voudrais pouvoir accuser quelqu’un d’autre. Mais au fond, je crois que je sais déjà.",
    "Alors je reprends depuis le départ."
  ],

  choices: [
    {
      id: "memory_home",
      label: "Revenir à la maison",
      next: "ch1_h1_home"
    },
    {
      id: "memory_firefighter",
      label: "Repenser à ma vie d’avant",
      next: "ch1_firefighter_1",
      effects: {
        playerState: {
          dutyAnchor: 1
        }
      }
    }
  ]
},

ch1_firefighter_1: {
  id: "ch1_firefighter_1",
  label: "Vie d'avant / pompier",
  kind: "scene",
  x: 880,
  y: 520,
  image: "./assets/image_fond/scene1/locker_room.png",
  transition: "fade",
  visualFx: "firehouseCold",

  text: [
    "Avant tout ça, j’étais pompier. C’est étrange de le dire comme ça. Comme si c’était une autre vie.",
    "Pourtant je me revois encore devant mon vestiaire. La veste lourde. Les bottes. L’odeur du cuir, de la sueur froide et du matériel qu’on remet toujours à la même place.",
    "J’étais fier de ce métier. Pas fier comme on l’est sur une photo officielle. Fier parce que, certains jours, j’avais vraiment l’impression d’avoir une utilité dans ce monde."
  ],

  next: "ch1_firefighter_2"
},

ch1_firefighter_2: {
  id: "ch1_firefighter_2",
  label: "Pourquoi j'étais fier ?",
  kind: "choice",
  x: 1080,
  y: 520,
  image: "./assets/image_fond/scene1/fire_silhouette.png",
  transition: "fade",
  visualFx: "firehouseCold",

  text: [
    "Je crois que cette fierté ne venait pas seulement du feu, des départs en urgence ou de cette adrénaline particulière qu’on finit presque par aimer.",
    "Elle venait d’ailleurs. D’un besoin plus profond.",
    "Mais lequel ?"
  ],

  choices: [
    {
      id: "proud_save",
      label: "Parce que je sauvais des vies",
      next: "ch1_firefighter_3",
      effects: {
        setPlayerState: { proudReason: "save" },
        playerState: { dutyAnchor: 1 }
      }
    },
    {
      id: "proud_useful",
      label: "Parce que j’étais utile",
      next: "ch1_firefighter_3",
      effects: {
        setPlayerState: { proudReason: "useful" },
        playerState: { dutyAnchor: 1, selfControl: 1 }
      }
    },
    {
      id: "proud_exist",
      label: "Parce que j’existais enfin",
      next: "ch1_firefighter_3",
      effects: {
        setPlayerState: { proudReason: "exist" },
        playerState: { traumaLoad: 1 }
      }
    }
  ]
},

ch1_firefighter_3: {
  id: "ch1_firefighter_3",
  label: "Ambivalence",
  kind: "scene",
  x: 1280,
  y: 520,
  image: "./assets/image_fond/scene1/memory_fragments_2.png",
  transition: "fade",
  visualFx: "firehouseCold",

  text: [
    "Pendant longtemps, ça m’a suffi. Rentrer de garde avec cette sensation simple d’avoir fait le bien. D’avoir diminué un peu la souffrance de quelqu’un. D’avoir gagné quelques minutes. Parfois une vie.",
    "Aujourd’hui, évidemment, je ne suis plus aussi sûr de rien. Quand on regarde tout depuis les décombres, même les bonnes actions finissent par prendre une couleur douteuse.",
    "Je me demande parfois combien de personnes j’ai vraiment sauvées. Et combien j’ai seulement aidées à tenir un peu plus longtemps dans un monde qui les aurait rattrapées de toute façon."
  ],

  next: "ch1_h1_home"
},

    ch1_h1_home: {
  id: "ch1_h1_home",
  label: "Maison / calme apparent",
  kind: "choice",
  x: 980,
  y: 300,
  image: "./assets/image_fond/scene1/ch1_h1_home.png",
  transition: "fade",
  visualFx: "homeWarm",

  text: [
    "La maison est là. Debout. Ordinaire. Presque intacte dans ma mémoire.",
    "C’est étrange comme certains souvenirs résistent mieux que les corps.",
    "Je revois les murs, les lumières, les gestes du soir. Tout ce qu’on traverse sans y penser quand on croit encore avoir du temps."
  ],

  choices: [
    {
      id: "home_to_family",
      label: "Rejoindre Angela dans la cuisine",
      next: "ch1_f1_kitchen",
    },
    {
      id: "home_to_tv",
      label: "Jeter un oeil aux infos",
      next: "ch1_t1_tv_alert",
    },
  ],
},

    ch1_f1_kitchen: {
  id: "ch1_f1_kitchen",
  label: "Cuisine / Angela",
  kind: "scene",
  x: 1280,
  y: 120,
  image: "./assets/image_fond/scene1/ch1_f1_kitchen.png",
  transition: "fade",
  visualFx: "homeWarm",

  text: [
    "Quand je pense à cette soirée, je ne revois pas d’abord les mots.",
    "Je revois la cuisine. La lumière sur le plan de travail. Le bruit léger des choses qu’on déplace sans y faire attention.",
    "Et Angela. Pas comme une image figée. Comme une présence.",
    "Elle était là, derrière moi, dans cette évidence tranquille des gens qu’on aime et qu’on croit retrouver toujours.",
    "Aujourd’hui, c’est peut-être ça qui me fait le plus mal. Cette certitude que j’avais alors. Et que je n’aurais jamais dû avoir."
  ],

  onEnter: {
    flags: { family_branch_seen: true }
  },

  next: "ch1_f1a_contact"
},

  ch1_f1a_contact: {
  id: "ch1_f1a_contact",
  label: "Contact / proximité",
  kind: "choice",
  x: 1480,
  y: 120,
  visualFx: "homeWarm",

  text: [
    "Elle passe derrière moi. Sa main effleure mon dos. Un geste simple. Presque absent. Un de ces gestes qu’on ne remarque pas assez quand ils existent encore.",
    "Avec le recul, je crois que c’était sa façon à elle de prendre ma température.",
    "Pas celle du corps. L’autre. Celle qu’on cache même aux gens qui nous connaissent le mieux."
  ],

  choices: [
    {
      id: "contact_accept",
      label: "Me laisser toucher par ce moment",
      next: "ch1_f2_talk",
      effects: {
        playerState: {
          selfControl: 1,
          tendernessToAngela: 1
        }
      }
    },
    {
      id: "contact_withdraw",
      label: "Me refermer comme souvent",
      next: "ch1_f2_talk",
      effects: {
        playerState: {
          selfControl: 1
        }
      }
    }
  ]
},

  ch1_f2_talk: {
  id: "ch1_f2_talk",
  label: "Conversation",
  kind: "choice",
  x: 1680,
  y: 120,
  image: "./assets/image_fond/scene1/ch1_f2_talk.png",
  transition: "fade",
  visualFx: "homeWarm",

  text: [
    "On parle de presque rien. C’est souvent comme ça que commencent les conversations importantes. Par une phrase banale. Un ton un peu différent. Un silence qui reste une seconde de trop.",
    "Angela me regarde. Puis elle dit :",
    "« Tu reviens toujours fatigué d’endroits où tu prétends ne rien avoir laissé. »",
    "Je n’ai jamais oublié cette phrase. Peut-être parce qu’elle était vraie. Peut-être parce qu’à ce moment-là, je ne voulais surtout pas qu’elle le soit."
  ],

  choices: [
    {
      id: "talk_evade",
      label: "Esquiver encore",
      next: "ch1_f2a_evade",
      effects: {
        playerState: {
          selfControl: 1,
          stress: 1
        }
      }
    },
    {
      id: "talk_open",
      label: "Laisser tomber une part du masque",
      next: "ch1_f2b_open",
      effects: {
        playerState: {
          tendernessToAngela: 1,
          familyAnchor: 1
        }
      }
    }
  ]
},

    ch1_f2a_evade: {
  id: "ch1_f2a_evade",
  label: "Évitement",
  kind: "scene",
  x: 1880,
  y: 80,
  visualFx: "homeWarm",

  text: [
    "Je fais ce que je savais très bien faire. Je contourne.",
    "Un demi-sourire. Une phrase légère. Une plaisanterie assez pauvre pour changer la direction de la conversation.",
    "Sur le moment, je devais croire que je protégeais quelque chose. La paix du soir. Angela. Moi-même, peut-être.",
    "En réalité, je repoussais seulement ce que je n’avais pas le courage de regarder."
  ],

  next: "ch1_family_memory_choice",
},

    ch1_f2b_open: {
  id: "ch1_f2b_open",
  label: "Ouverture",
  kind: "scene",
  x: 1880,
  y: 160,
  visualFx: "homeWarm",

  text: [
    "Cette fois-là, je ne détourne pas complètement. Je ne dis pas tout. Je n’ai jamais su faire ça.",
    "Mais je laisse voir quelque chose. Très peu. Une fissure à peine.",
    "Angela ne répond pas tout de suite. Sa main revient se poser entre mes omoplates. Et pendant une seconde, une seconde seulement, j’ai la sensation absurde que rien ne pourra vraiment nous atteindre.",
    "C’est fou comme on peut être naïf quand on est encore aimé."
  ],

  next: "ch1_family_memory_choice"
},

ch1_family_memory_choice: {
  id: "ch1_family_memory_choice",
  label: "Souvenir familial",
  kind: "choice",
  x: 1980,
  y: 120,
  visualFx: "homeWarm",

  text: [
    "Le souvenir pourrait s’arrêter là. Ce serait plus simple.",
    "Garder Angela dans cette lumière. Garder sa main entre mes omoplates. Garder l’idée fausse d’un soir encore intact.",
    "Mais les souvenirs honnêtes ne s’arrêtent pas toujours au bon endroit."
  ],

  choices: [
    {
      id: "skip_car_argument",
      label: "Laisser ce souvenir de côté",
      next: "ch1_f3_outside"
    },
    {
      id: "remember_car_argument",
      label: "Revoir cette dispute absurde",
      next: "ch1_car_scratch_1",
      effects: {
        playerState: {
          tendernessToAngela: 1,
          stress: 1
        }
      }
    }
  ]
},

ch1_car_scratch_1: {
  id: "ch1_car_scratch_1",
  label: "La rayure",
  kind: "choice",
  x: 2140,
  y: -80,
  image: "./assets/image_fond/scene1/home_argument.png",
  transition: "fade",
  visualFx: "homeWarm",

  text: [
    "Et puis il y a eu cette histoire de voiture.",
    "Une rayure. Une putain de rayure sur une putain de voiture.",
    "Je sais à quel point ça paraît ridicule raconté depuis ici. J’en ai presque honte.",
    "Mais c’est aussi ça, une vie. On croit qu’elle est faite de grandes décisions, de serments, de courage et de catastrophes. Et puis, quand tout s’effondre, ce qui revient, c’est parfois une dispute idiote dans une cuisine trop éclairée."
  ],

  choices: [
    {
      id: "car_stubborn",
      label: "M’entêter",
      next: "ch1_car_scratch_2",
      effects: {
        playerState: {
          selfControl: 1,
          stress: 1
        }
      }
    },
    {
      id: "car_regret",
      label: "Comprendre trop tard que ça n’avait aucune importance",
      next: "ch1_car_scratch_2",
      effects: {
        playerState: {
          tendernessToAngela: 1,
          traumaLoad: 1
        }
      }
    }
  ]
},

ch1_car_scratch_2: {
  id: "ch1_car_scratch_2",
  label: "Regret",
  kind: "scene",
  x: 2340,
  y: -80,
  image: "./assets/image_fond/scene1/kitchen_back_kiss.png",
  transition: "fade",
  visualFx: "homeWarm",

  text: [
    "Si je pouvais, je reprendrais ce moment. Pas pour gagner la dispute. Pas même pour avoir raison.",
    "Je la prendrais simplement dans mes bras. Je lui dirais que ça n’avait aucune importance. Que rien de tout ça n’en avait.",
    "Mais ce soir-là, comme tant d’autres soirs, j’ai laissé une chose minuscule prendre plus de place qu’elle ne méritait.",
    "Et maintenant, sous les gravats, il me reste ça aussi. La mémoire d’une rayure. Et le poids ridicule de ce qu’on ne peut plus réparer."
  ],

  next: "ch1_f3_outside"
},

  ch1_f3_outside: {
  id: "ch1_f3_outside",
  label: "Le dehors s'invite",
  kind: "choice",
  x: 2080,
  y: 120,

  text: [
    "Puis quelque chose coupe le moment.",
    "Un son. Une vibration. Peut-être la télévision. Peut-être un téléphone.",
    "Je ne sais plus exactement. Ce dont je me souviens, en revanche, c’est de la brutalité de ce passage.",
    "Le monde venait de frapper à la porte. Et nous n’avions plus vraiment le choix que de lui ouvrir."
  ],

  choices: [
    {
      id: "outside_to_tv",
      label: "Aller voir",
      next: "ch1_after_family_bridge",
      effects: { playerState: { politicalLucidity: 1 } }
    },
    {
      id: "outside_delay",
      label: "Retarder encore un peu",
      next: "ch1_after_family_bridge",
      effects: {
        playerState: {
          familyAnchor: 1,
          stress: 1
        }
      }
    }
  ]
},

ch1_after_family_bridge: {
  id: "ch1_after_family_bridge",
  label: "Transition",
  kind: "conditional",
  x: 2240,
  y: 120,
   mapNext: ["ch1_t1_tv_alert", "ch1_home_fragile"],

  text: [
    "Le moment ne tient pas. Ces choses-là ne tiennent jamais longtemps.",
    "La maison, la chaleur, les gestes ordinaires. Tout cela paraît solide jusqu’à ce que le dehors décide de reprendre sa place."
  ],

  getNext: (scene) => {
    if (!getFlag(scene, "tv_branch_seen")) {
      return "ch1_t1_tv_alert";
    }

    return "ch1_home_fragile";
  }
},

    ch1_t1_tv_alert: {
  id: "ch1_t1_tv_alert",
  label: "Télévision / alerte",
  kind: "choice",
  x: 1280,
  y: 500,
  image: "./assets/image_fond/scene1/ch1_t1_tv_alert.png",
  transition: "fade",
  visualFx: "tvBlue",

  onEnter: {
    flags: { tv_branch_seen: true }
  },

  text: [
    "La télévision était déjà allumée. Je ne saurais plus dire depuis combien de temps.",
    "Le son était un peu trop fort, comme souvent dans ces moments où l’information cesse d’être un bruit de fond pour devenir quelque chose qu’on est censé écouter.",
    "Des images passaient en boucle. Des cartes. Des visages fermés. Des bandeaux rouges en bas de l’écran.",
    "Rien n’était encore vraiment clair. Mais quelque chose insistait déjà."
  ],

  choices: [
    {
      id: "tv_listen",
      label: "Écouter attentivement",
      next: "ch1_t2_governor",
      effects: { playerState: { politicalLucidity: 1 } }
    },
    {
      id: "tv_distance",
      label: "Minimiser, garder de la distance",
      next: "ch1_t2_governor",
      effects: { playerState: { selfControl: 1 } }
    }
  ]
},

  ch1_t2_governor: {
  id: "ch1_t2_governor",
  label: "Prise de parole officielle",
  kind: "choice",
  x: 1680,
  y: 500,
  image: "./assets/image_fond/scene1/ch1_t2_governor.png",
  transition: "fade",
  visualFx: "tvBlue",

  text: [
    "Puis le gouverneur est apparu à l’écran. L’air grave. La posture droite. Cette façon très particulière qu’ont les dirigeants de parler lentement quand ils veulent donner l’impression que tout tient encore debout.",
    "Il a parlé de devoir. D’humanité. De responsabilité.",
    "Notre État allait ouvrir ses frontières aux demandeurs d’asile de la guerre civile.",
    "Sur le moment, je me suis dit que c’était enfin autre chose que de les regarder mourir de loin. C’était naïf. Mais je crois que j’avais besoin d’y croire."
  ],

  choices: [
    {
      id: "gov_believe",
      label: "Vouloir croire que quelqu’un maîtrise encore la situation",
      next: "ch1_t3_escalation",
      effects: { setPlayerState: { beliefHelped: true } }
    },
    {
      id: "gov_doubt",
      label: "Sentir que quelque chose ne colle déjà pas",
      next: "ch1_t3_escalation",
      effects: {
        setPlayerState: { beliefHelped: false },
        playerState: { politicalLucidity: 1, stress: 1 }
      }
    }
  ]
},

  ch1_t3_escalation: {
  id: "ch1_t3_escalation",
  label: "Montée du trouble",
  kind: "choice",
  x: 2080,
  y: 500,
  image: "./assets/image_fond/scene1/ch1_t3_escalation.png",
  transition: "fade",
  visualFx: "tvBlue",

  text: [
    "Les images ont continué. Toujours les mêmes, ou presque. Des colonnes de gens. Des sacs portés à bout de bras. Des enfants trop calmes pour leur âge.",
    "Les commentateurs employaient des mots propres. Des mots qu’on peut prononcer sans rougir. Accueil. Coordination. Dispositif d’urgence.",
    "Mais je voyais bien que ces mots glissaient déjà vers autre chose. Il suffit parfois qu’une foule ait peur pour qu’un mot change de nature.",
    "Réfugié devient migrant. Migrant devient problème. Problème devient menace.",
    "Et à partir de là, tout devient possible."
  ],

  choices: [
    {
      id: "tv_keep_watching",
      label: "Continuer à regarder jusqu’au bout",
      next: "ch1_t4_break",
      effects: { playerState: { politicalLucidity: 1, stress: 1 } }
    },
    {
      id: "tv_cut",
      label: "Couper avant que ça prenne trop de place",
      next: "ch1_t4_break",
      effects: { playerState: { selfControl: 1, familyAnchor: 1 } }
    }
  ]
},

ch1_t4_break: {
  id: "ch1_t4_break",
  label: "Fêlure",
  kind: "conditional",
  x: 2280,
  y: 500,
  visualFx: "tvBlue",
  mapNext: ["ch1_f1_kitchen", "ch1_home_fragile"],

  text: [
    "À ce moment-là, rien n’était encore arrivé pour nous. Pas directement. Pas dans la maison.",
    "C’est peut-être pour ça qu’on se permettait encore d’avoir des avis. Il y a une arrogance tranquille chez ceux qui regardent les catastrophes depuis leur canapé.",
    "Je l’avais aussi. Je ne le savais pas encore."
  ],

  getNext: (scene) => {
    if (!getFlag(scene, "family_branch_seen")) {
      return "ch1_f1_kitchen";
    }

    return "ch1_home_fragile";
  }
},

    ch1_c1_false_calm: {
  id: "ch1_c1_false_calm",
  label: "Comprendre",
  kind: "scene",
  x: 2360,
  y: 300,
  image: "./assets/image_fond/scene1/ch1_p2_trigger.png",
  transition: "fade",
  visualFx: "rubble",

  text: () => {
    const lines = [
      "Je crois que c’est à partir de là que tout est devenu irréversible.",

      "Pas parce qu’un homme avait gagné. Pas seulement.",

      "Mais parce qu’un pays entier avait accepté l’idée qu’il fallait choisir des ennemis pour se sentir encore exister."
    ];

    if (playerState.tendernessToAngela >= 2 || playerState.familyAnchor >= 2) {
      lines.push(

        "À la maison, le silence avait changé de nature. On ne se taisait plus parce qu’il n’y avait rien à dire. On se taisait parce qu’on comprenait."
      );
    } else if (playerState.selfControl >= 2) {
      lines.push(

        "Moi, comme souvent, j’ai rangé ça quelque part. Assez loin pour continuer à fonctionner. Assez près pour ne jamais vraiment l’oublier."
      );
    } else if (playerState.stress >= 2) {
      lines.push(

        "Je me souviens d’une sensation très nette. Celle d’avoir raté quelque chose. Quelque chose qu’on aurait dû voir venir."
      );
    }

    if (playerState.politicalLucidity >= 2) {
      lines.push(

        "Je n’avais pas encore tous les mots. Mais je voyais déjà le mécanisme. La peur, la colère, puis l’ordre promis comme une délivrance."
      );
    } else if (playerState.beliefHelped === true) {
      lines.push(

        "Une part de moi voulait encore croire que les institutions tiendraient. Qu’un vote, même violent, restait seulement un vote.",
        "J’avais tort."
      );
    } else if (playerState.beliefHelped === false) {
      lines.push(

        "Une part de moi savait déjà que les discours avaient gagné. Pas parce qu’ils étaient vrais. Parce qu’ils avaient trouvé où frapper."
      );
    }

    lines.push(

      "Et maintenant je suis là. Sous le béton.",

      "À chercher encore où tout a vraiment commencé."
    );

    return lines;
  },

  next: "ch1_r1_rubble_return"
},

    ch1_r1_rubble_return: {
  id: "ch1_r1_rubble_return",
  label: "Retour sous les gravats",
  kind: "scene",
  x: 2580,
  y: 300,
  image: "./assets/image_fond/scene1/ch1_r1_rubble_return.png",
transition: "fade",
visualFx: "rubble",

  text: [
    "Puis tout revient.",
    "Le poids. La poussière. La douleur.",
    "Le présent ne me laisse jamais longtemps tranquille."
  ],
  next: "ch1_r2_hold_on"
},

    ch1_r2_hold_on: {
  id: "ch1_r2_hold_on",
  label: "Tenir",
  kind: "scene",
  x: 2780,
  y: 300,
  image: "./assets/image_fond/scene1/ch1_r2_hold_on.png",
  transition: "fade",
  visualFx: "rubble",
  
  text: () => [
    "Je ferme les yeux une seconde. Pas pour fuir. Pour reprendre prise.",

    getScene1MikaStateText(),

    "Je ne peux pas encore mourir.",
    "Pas avant d’avoir compris."
  ],
  next: "ch1_end"
},

/* =========================
   AJOUTS CHAPITRE 1
========================= */

ch1_home_fragile:{
  id:"ch1_home_fragile",
  label:"Le calme",
  kind:"scene",
  x:2140,
  y:120,
  image:"./assets/image_fond/scene1/home_evening.png",
  transition:"fade",
  visualFx: "homeWarm",

  text: [
    "Après ça, la maison est restée la même en apparence. Les mêmes pièces. Les mêmes lumières. Les mêmes gestes du soir.",
    "C’est ça qui est terrible, avec les moments où tout commence vraiment à changer. Ils ressemblent beaucoup trop aux autres.",
    "Les filles jouaient dans le salon. Angela lisait, ou faisait semblant. Les informations tournaient en fond.",
    "Et moi, comme beaucoup d’autres, je croyais encore que l’Histoire était quelque chose qui arrivait ailleurs."
  ],

  next:"ch1_angela_warning"
},



ch1_angela_warning:{
  id:"ch1_angela_warning",
  label:"Angela avertit",
  kind:"choice",
  x:2280,
  y:120,
  image:"./assets/image_fond/scene1/angela_warning.png",
  transition:"fade",
  visualFx: "homeWarm",

  text: [
    "Angela, elle, ne regardait pas les choses de cette manière. Elle avait cette façon de voir venir les coups avant les autres.",
    "Ça m’agaçait parfois. Pas parce qu’elle se trompait. Parce que, trop souvent, elle avait raison.",
    "Ce soir-là, elle a regardé l’écran sans parler pendant quelques secondes. Puis elle a dit simplement :",
    "« Ça va mal finir cette histoire. »"
  ],

  choices:[
    {
      id: "angela_take_seriously",
      label:"La prendre au sérieux",
      next:"ch1_far_war",
      effects:{
        playerState:{
          politicalLucidity:1,
          tendernessToAngela:1
        }
      }
    },
    {
      id: "angela_minimize",
      label:"Minimiser ses craintes",
      next:"ch1_far_war",
      effects:{
        playerState:{
          selfControl:1
        }
      }
    }
  ]
},

ch1_far_war:{
  id:"ch1_far_war",
  label:"Guerre lointaine",
  kind:"scene",
  x:2420,
  y:120,
  image:"./assets/image_fond/scene1/tv_news_v1.png",
  transition:"fade",
  visualFx: "tvBlue",

  text: [
    "Au départ, pourtant, ce n’était qu’une guerre lointaine. Une de plus. Une guerre civile dans un pays que, quelques années plus tôt, j’aurais été incapable de situer correctement sur une carte.",
    "On en voyait les images au journal. Des immeubles éventrés. Des familles sur les routes. Des chiffres de morts qui défilaient entre deux sujets plus légers.",
    "Et puis on passait à autre chose. C’est fou comme on peut s’habituer à la souffrance des autres quand elle reste à bonne distance."
  ],

  next:"ch1_border_open"
},

ch1_border_open:{
  id:"ch1_border_open",
  label:"Ouverture",
  kind:"scene",
  x:2580,
  y:220,
  image:"./assets/image_fond/scene1/migrants_arrival.png",
  transition:"fade",
  visualFx: "streetCold",

  text: [
    "Puis la distance a cessé d’exister.",
    "Quand le gouverneur a ouvert les frontières, les gens sont arrivés. Pas des masses abstraites. Pas des flux.",
    "Des familles. Des hommes épuisés. Des femmes qui tenaient encore debout uniquement parce qu’un enfant marchait à côté d’elles. Des vieux qu’on aurait juré déjà morts si leurs yeux n’avaient pas encore cherché quelque chose autour d’eux.",
    "Au début, on a appelé ça un devoir moral. Et pendant un court instant, j’ai voulu croire que nous étions capables d’être à la hauteur."
  ],

  next:"ch1_media_turn"
},

ch1_media_turn:{
  id:"ch1_media_turn",
  label:"Discours médiatique",
  kind:"scene",
  x:2740,
  y:220,
  image:"./assets/image_fond/scene1/media_discourse.png",
  transition:"fade",
  visualFx: "tvBlue",

  text: [
    "Puis les mots ont commencé à changer. Pas brutalement. Jamais brutalement. C’est comme ça que les choses prennent racine.",
    "Un soir, on parle d’accueil. Le lendemain, de gestion. Puis de crise. Puis d’invasion.",
    "Sur les plateaux, les mêmes visages revenaient en boucle. Les mêmes colères propres. Les mêmes fausses inquiétudes.",
    "On ne disait pas encore qu’il fallait haïr. On demandait simplement, avec l’air sérieux des gens raisonnables, combien de temps encore nous allions accepter de perdre notre pays."
  ],

  next:"ch1_firehouse_shift"
},

ch1_firehouse_shift:{
  id:"ch1_firehouse_shift",
  label:"Caserne",
  kind:"scene",
  x:2900,
  y:220,
  image:"./assets/image_fond/scene1/locker_room.png",
  transition:"fade",
  visualFx: "firehouseCold",

  text: [
    "Même à la caserne, quelque chose changeait. Au début, ce n’était presque rien.",
    "Des départs plus tendus. Des regards plus méfiants dans certaines rues. Des interventions où l’on sentait que notre uniforme ne suffisait plus à rassurer.",
    "Puis on nous a équipés de gilets pare-balles.",
    "Je me souviens très bien du mien. Du poids. De la gêne. Et surtout de cette impression désagréable de trahir quelque chose en l’enfilant.",
    "J’étais pompier. J’étais là pour porter secours.",
    "Je ne comprenais pas encore à quel moment un homme qui vient aider peut devenir une cible."
  ],

  next:"ch1_violence_rise"
},

ch1_violence_rise:{
  id:"ch1_violence_rise",
  label:"Montée violences",
  kind:"scene",
  x:3060,
  y:220,
  image:"./assets/image_fond/scene1/street_tensions.png",
  transition:"fade",
  visualFx: "streetCold",

  text: [
    "Les violences ont suivi. Comme si tout le monde n’attendait plus qu’une autorisation.",
    "Des insultes d’abord. Des vitres brisées. Des camps attaqués.",
    "Puis des corps.",
    "Chaque jour, dans nos ambulances, nous intervenions pour des hommes tabassés, des femmes blessées, des gamins en état de choc.",
    "On parlait d’actes isolés. Il y en avait tous les jours.",
    "À force d’être isolés ensemble, les actes finissent par dessiner un pays."
  ],

  next:"ch1_ligue_surge"
},

ch1_ligue_surge:{
  id:"ch1_ligue_surge",
  label:"Montée Ligue",
  kind:"scene",
  x:3220,
  y:220,
  image:"./assets/image_fond/scene1/ligue_rise.png",
  transition:"fade",
  visualFx: "ligueRed",

  text: [
    "La Ligue n’a pas créé tout ça à elle seule. Ce serait trop facile de le croire. Elle a fait quelque chose de bien plus efficace.",
    "Elle a donné une forme à ce que beaucoup ressentaient déjà. Une langue. Des slogans. Des ennemis.",
    "Leur dirigeant parlait avec cette assurance glaciale des hommes qui savent transformer la peur des autres en marchepied.",
    "Il ne disait presque jamais les choses frontalement. Il n’en avait pas besoin.",
    "Le pays complétait les phrases à sa place."
  ],

  next:"ch1_ligue_vote"
},

ch1_ligue_vote:{
  id:"ch1_ligue_vote",
  label:"Election",
  kind:"scene",
  x:3380,
  y:220,
  image:"./assets/image_fond/scene1/ch1_ligue_vote.png",
  transition:"fade",
  visualFx: "ligueRed",

  text: [
    "Le jour des élections, Angela et moi sommes allés voter. Les enfants nous accompagnaient. Ils ne comprenaient pas tout, bien sûr. Ils étaient surtout contents de mettre le papier dans l’enveloppe.",
    "Nous, on y tenait. À cette idée simple, presque naïve, qu’il fallait apprendre aux enfants que les choses se changent ainsi. Avec un bulletin. Avec une voix. Avec un geste calme posé au milieu du bruit.",
    "Devant le bureau de vote, les militants de la Ligue se tenaient déjà comme si tout leur appartenait. Je sentais Angela bouillir à côté de moi. Je lui ai serré la main pour lui dire de se calmer.",
    "Aujourd’hui encore, je ne sais pas si c’était de la prudence. Ou déjà de la lâcheté."
  ],

  next:"ch1_end_election"
},

ch1_end_election:{
  id:"ch1_end_election",
  label:"78%",
  kind:"scene",
  x:3540,
  y:220,
  image:"./assets/image_fond/scene1/ligue_election.png",
  transition:"fade",
  visualFx: "ligueRed",

  text: [
    "Ce fut la dernière élection qu’il y eut ici.",
    "Le soir même, les résultats apparaissaient au journal de vingt heures. Je me souviens encore des cris de joie dans la rue. Et des mines déconfites dans la maison. À l’annonce du score :",
    "78 %.",
    "Sur les 326 membres de la chambre des députés, 254 étaient passés sous les couleurs de la Ligue.",
    "Ce soir-là, notre État a dit adieu à la démocratie. Et comment lui en vouloir."
  ],

  next:"ch1_c1_false_calm"
},

    ch1_end: {
  id: "ch1_end",
  label: "Fin chapitre 1",
  kind: "end",
  x: 2980,
  y: 300,
  image: "./assets/image_fond/scene1/black_soft.png",
  transition: "fade",

  text: [
    "L’origine n’explique pas tout. Mais elle laisse une trace."
  ]
},
  },
};

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


}


export function startScene1(state = playerState, deps = {}) {
  return startChapter(chapter1Map, state, "scene1", deps, {
    onEnter: applyOnEnter,
    onChoice: applyChoiceEffects
  });
}
export function getChapter1MapData() { return chapter1Map; }
export function getChapter1Progress(state = playerState) {
  return { chapterId: chapter1Map.id, ...getSceneState(state, "scene1") };
}
export function resetScene1(state = playerState) {
  state.scene1 = null;
  return getSceneState(state, "scene1");
}

