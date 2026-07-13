# Projet Genially 6e — Cahier de développement

## Contexte

Je suis professeur de mathématiques.

Je construis, chapitre après chapitre, un Genially qui sert de support de travail à mes élèves de 6e.

Je fournis au début de chaque chapitre :

- ma trace écrite de cours, qui constitue la référence pédagogique ;
- les fonds Genially du chapitre ;
- éventuellement des captures d'écran et des images de référence.

Le Genially est construit à partir de cette trace écrite, jamais l'inverse.

## Méthode de travail

Nous travaillons progressivement.

Pour chaque notion :

1. nous analysons le contenu mathématique ;
2. nous déterminons les difficultés réelles des élèves ;
3. nous imaginons les activités les plus pertinentes ;
4. nous validons ensemble le principe de chaque exercice ;
5. seulement ensuite le fichier HTML est produit.

Ne jamais coder directement un exercice sans validation préalable de son principe.

Une meilleure idée peut être proposée lorsqu'elle est pédagogiquement plus pertinente.

Lorsqu'un choix est validé, il ne doit plus être modifié sans proposition explicite.

Lorsque je dis « go », le principe est validé et j'attends directement le fichier demandé, sans nouveau résumé du projet.

## Objectif pédagogique

Le Genially doit permettre aux élèves :

- de comprendre le cours ;
- de manipuler les notions ;
- de s'entraîner ;
- de se tromper puis de comprendre leurs erreurs ;
- de devenir progressivement autonomes.

Chaque activité doit avoir un objectif pédagogique clairement identifié.

Les exercices ne doivent jamais être du remplissage.

## Public

Les activités sont destinées à des élèves de 6e.

L'interface doit être :

- simple ;
- lisible ;
- intuitive ;
- adaptée à l'ordinateur et à la tablette.

Les éléments cliquables doivent être suffisamment grands.

Les consignes doivent être courtes, claires et sans ambiguïté.

## Rigueur mathématique

La rigueur est prioritaire.

Je ne veux :

- aucune approximation inutile ;
- aucune erreur mathématique ;
- aucune figure ambiguë ;
- aucun codage incohérent.

Si une figure peut prêter à confusion, il faut le signaler.

En cas de doute, il faut le dire plutôt que d'inventer.

## Pièges

Les pièges doivent correspondre aux erreurs réellement commises par les élèves.

Je préfère :

- peu de questions ;
- des distracteurs intelligents ;
- des erreurs réalistes.

Je ne veux jamais de pièges liés à une mauvaise ergonomie.

## Exercices interactifs

Lorsqu'un exercice est créé :

- produire un unique fichier HTML autonome, sauf dépendance explicite vers GeoLib ;
- utiliser un fond transparent ;
- respecter un format 16:9 ;
- rendre l'activité responsive ;
- fournir une correction pédagogique ;
- fournir un bilan final.

Le titre n'apparaît jamais dans le HTML : il est déjà présent sur le fond Genially.

Le système de notation par défaut est :

- 1 point au premier essai ;
- 0,5 point au deuxième essai ;
- puis correction.

Ce fonctionnement peut être adapté si l'exercice le justifie.

## Interface

Je souhaite une interface :

- moderne ;
- épurée ;
- agréable ;
- très lisible.

Les animations restent discrètes.

Les mathématiques restent toujours au centre.

## Figures

Les figures servent uniquement l'objectif pédagogique.

Elles ne doivent jamais permettre de deviner la réponse lorsqu'un raisonnement est attendu.

Les zones cliquables doivent être précises.

Les points sont représentés par des croix lorsque cela correspond aux conventions du cours.

Les couleurs ne doivent jamais permettre de reconnaître automatiquement un objet mathématique.

Si nécessaire, elles sont mélangées aléatoirement.

## Aléatoire

L'aléatoire est utilisé uniquement lorsqu'il apporte un intérêt pédagogique.

Chaque situation générée doit être mathématiquement correcte.

L'aléatoire peut être contraint afin d'obtenir une répartition voulue.

Lorsque des situations fixes sont plus sûres qu'un générateur complexe, elles sont préférées.

## Correction

La correction explique toujours le raisonnement.

Elle ne se limite jamais à :

- Bonne réponse ;
- Mauvaise réponse.

Les indices du deuxième essai orientent l'élève sans donner directement la réponse.

## Code

Je préfère un code :

- clair ;
- fiable ;
- maintenable ;
- robuste.

Je préfère un code simple plutôt qu'un générateur inutilement complexe.

Lorsque je demande une modification, modifier uniquement ce qui est demandé.

## GeoLib

Les activités de géométrie utilisent GeoLib, bibliothèque développée spécifiquement pour ce projet.

GeoLib contient uniquement :

- les objets géométriques ;
- les outils ;
- les interactions ;
- les générateurs ;
- les vérifications mathématiques.

GeoLib ne contient jamais :

- la pédagogie ;
- la notation ;
- les indices ;
- les corrections.

Les exercices restent responsables de la logique pédagogique.

Avant d'ajouter une fonctionnalité dans un exercice, nous nous demandons :

> Cette fonctionnalité sera-t-elle utile dans plusieurs exercices ?

Si oui, elle doit être développée dans GeoLib.

Chaque évolution de GeoLib doit être testée dans `demo.html` avant son utilisation dans un exercice.

Les anciennes versions restent disponibles afin de conserver la compatibilité.

## Architecture du projet

Le projet est développé comme un projet logiciel durable.

La documentation du dépôt constitue la référence officielle.

Lorsque la conversation ChatGPT devient trop longue, une nouvelle conversation peut être ouverte dans le même Projet ChatGPT.

Les documents du projet permettent alors de reprendre immédiatement le développement.

## Direction artistique

Les fonds Genially constituent la référence graphique.

Ne jamais modifier un élément existant.

Ajouter uniquement ce qui est demandé.

Conserver :

- les proportions ;
- la perspective ;
- le cadrage ;
- l'éclairage ;
- les dimensions.

Si un même objet apparaît sur plusieurs fonds, il doit être strictement identique.

## Façon de travailler

Nous échangeons beaucoup.

Une idée peut être remise en question si une meilleure solution est proposée.

En revanche, lorsqu'un choix est validé, il devient la référence jusqu'à décision contraire.

Nous privilégions toujours une architecture robuste plutôt qu'une solution rapide.

Lorsqu'une amélioration bénéficie à plusieurs activités, elle est intégrée à GeoLib plutôt que dupliquée dans chaque exercice.

## Objectif final

Construire un Genially :

- exigeant sur le plan mathématique ;
- agréable à utiliser ;
- réellement utile aux élèves ;
- facilement maintenable au fil des années.

Chaque choix d'activité, de figure, d'interaction, d'interface ou de code doit être justifié par un objectif pédagogique.
