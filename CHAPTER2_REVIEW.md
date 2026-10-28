# Version de travail — sauvegarde et chapitre 2

Cette branche prépare une version jouable des deux chapitres. Les illustrations
du chapitre 2 sont provisoires : elles réutilisent des images du chapitre 1.
Le fichier `chapter2-visuals.json` associe chaque scène à son illustration
temporaire et au fichier définitif prévu.

## Comportement attendu

- Invité : reprise après rechargement dans le même onglet. Fermer l’onglet peut
  supprimer cette progression ; un compte est nécessaire pour changer d’appareil.
- Compte : point de reprise, caractéristiques de Mika, scènes visitées, choix et
  bonus dans la colonne existante `saves.player_state`. `scene_text` contient
  le point de reprise. Chaque compte possède aussi son propre cache local.
- Chaque scène déclenche une sauvegarde locale immédiate et une synchronisation
  distante regroupée et ordonnée. Le message de sauvegarde indique un échec.
  La dernière progression reste locale tant que la synchronisation n’a pas réussi.
- Si le chargement distant échoue à la connexion, la synchronisation reste
  suspendue pour éviter d’écraser une sauvegarde distante non lue.
- Les anciennes sauvegardes sont reconnues. Une ancienne position non enregistrée
  ne peut pas être reconstituée ; un ancien `chapter1_end` récupère la fin du
  chapitre et son bonus.
- Nouvelle partie : les deux parcours et les caractéristiques sont réinitialisés.
  Le roman déjà gagné reste disponible.
- La carte du chapitre 1 donne accès à une fin de chapitre, puis au chapitre 2.
  Le chapitre 2 dispose de sa propre carte et d’une fin, sans accès fictif au chapitre 3.
- Les textes et choix conditionnels du chapitre 2 sont évalués lors de la lecture,
  avec les caractéristiques actuelles de Mika.

## Validation effectuée

`npm test` utilise uniquement Node, sans dépendance à installer. Les tests couvrent
les deux parcours, la reprise, l’isolation des comptes, la migration des anciennes
sauvegardes, les effets appliqués une seule fois, l’annulation de la lecture,
les choix conditionnels, l’ordre des écritures et les erreurs de synchronisation.
La connexion et Supabase sont simulés dans les tests d’intégration.

Le navigateur de contrôle ne permet pas d’ouvrir l’aperçu local. Le rendu visuel
du nouveau parcours et des règles de défilement n’a donc pas été validé.

## Vérifications restantes avant publication

1. Tester avec un vrai compte : avancer, recharger, se reconnecter sur un autre
   navigateur, vérifier les choix de Mika et le bonus.
2. Vérifier que deux comptes différents ne peuvent ni lire ni modifier leurs
   sauvegardes respectives. Les droits Supabase ne sont pas visibles dans ce dépôt.
3. Tester une coupure réseau, puis se reconnecter et reprendre la synchronisation.
4. Relire les 31 scènes du chapitre 2 et valider leurs illustrations définitives.
5. Vérifier la lecture et l’accès aux choix sur ordinateur, téléphone et paysage.

Aucune migration SQL n’est incluse : le code réutilise les colonnes déjà
employées par le jeu. Si `player_state` refuse le nouvel objet JSON ou si une
politique Supabase bloque les écritures, relever le message avant de modifier
la base. Ne pas désactiver ses protections.

La synchronisation ordonne les écritures d’une session ; elle ne fusionne pas
deux parties jouées simultanément sur deux appareils. Utiliser un seul appareil
actif par compte pendant cette phase de test.
