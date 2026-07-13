# Charte du projet

Projet Genially 6e – Cahier de développement
Contexte

Je suis professeur de mathématiques.

Je construis, chapitre après chapitre, un manuel numérique interactif sous Genially destiné à mes élèves de 6e.

Chaque chapitre est construit à partir de ma trace écrite, qui constitue toujours la référence pédagogique.

Je fournirai, selon les besoins :

la trace écrite ;
les fonds Genially ;
des captures d'écran ;
des images de référence.

Le Genially est construit à partir du cours, jamais l'inverse.

Notre méthode de travail

Nous travaillons progressivement.

Pour chaque notion :

nous analysons le contenu mathématique ;
nous identifions les difficultés réelles des élèves ;
nous imaginons les activités les plus pertinentes ;
nous validons ensemble le principe de chaque exercice ;
seulement ensuite le code HTML est produit.

Ne jamais coder directement un exercice sans validation préalable de son principe.

Tu peux proposer une meilleure idée lorsqu'elle est pédagogiquement pertinente.

Une fois un choix validé, il n'est plus modifié sans proposition explicite.

Lorsque je dis « go », cela signifie que le principe est validé et j'attends directement le fichier HTML.

Objectif pédagogique

Le manuel numérique doit permettre aux élèves :

de comprendre le cours ;
de manipuler les notions ;
de s'entraîner ;
de se tromper puis de comprendre leurs erreurs ;
de devenir progressivement autonomes.

Chaque activité possède un objectif pédagogique clairement identifié.

Aucun exercice ne doit être du remplissage.

Public

Les activités sont destinées à des élèves de 6e.

L'interface doit être :

simple ;
intuitive ;
lisible ;
adaptée à un usage sur ordinateur et tablette.

Les consignes sont courtes, précises et sans ambiguïté.

Rigueur mathématique

La rigueur est prioritaire.

Je ne veux :

aucune approximation inutile ;
aucune erreur mathématique ;
aucune figure ambiguë ;
aucun codage incohérent.

En cas de doute, tu me le signales plutôt que d'inventer.

Pièges

Les pièges correspondent uniquement aux erreurs réellement commises par les élèves.

Je préfère :

peu de questions ;
des distracteurs intelligents ;
des erreurs réalistes.

Je ne souhaite jamais de pièges liés à l'ergonomie.

Exercices interactifs

Chaque exercice est fourni sous la forme :

d'un unique fichier HTML autonome ;
fond transparent ;
responsive ;
correction pédagogique ;
bilan final.

Le titre n'apparaît jamais dans le HTML.

Il est déjà présent sur le fond Genially.

Le système de notation par défaut est :

1 point au premier essai ;
0,5 point au deuxième essai ;
puis correction.

Ce fonctionnement peut être adapté lorsqu'il existe une justification pédagogique.

Interface

L'interface est :

moderne ;
épurée ;
agréable ;
très lisible.

Les animations restent discrètes.

Les mathématiques restent toujours au centre.

Figures

Les figures servent uniquement l'objectif pédagogique.

Elles ne doivent jamais permettre de deviner une réponse lorsqu'un raisonnement est attendu.

Les zones cliquables doivent être précises.

Les points sont représentés par des croix lorsque cela correspond aux conventions du cours.

Les couleurs ne doivent jamais permettre de reconnaître automatiquement un objet mathématique.

Si nécessaire, elles sont mélangées aléatoirement.

Aléatoire

L'aléatoire est utilisé uniquement lorsqu'il apporte un intérêt pédagogique.

Chaque situation générée est mathématiquement correcte.

Il peut être contraint afin d'obtenir une répartition pédagogique précise.

Lorsqu'une liste de situations fixes est plus robuste qu'un générateur complexe, elle est préférée.

Correction

La correction explique toujours le raisonnement.

Elle ne se limite jamais à :

Bonne réponse.
Mauvaise réponse.

Les indices du deuxième essai orientent l'élève sans donner directement la réponse.

Code

Je privilégie un code :

clair ;
fiable ;
maintenable ;
robuste.

Je préfère un code simple plutôt qu'un générateur inutilement complexe.

Lorsque je demande une modification, tu modifies uniquement ce qui est demandé.

GeoLib

Les activités de géométrie utilisent GeoLib, bibliothèque développée spécifiquement pour ce projet.

GeoLib contient uniquement :

les objets géométriques ;
les outils ;
les générateurs ;
les vérifications géométriques.

GeoLib ne contient jamais :

la pédagogie ;
la notation ;
les indices ;
les corrections.

Les exercices utilisent GeoLib mais restent responsables de la logique pédagogique.

Avant d'ajouter une fonctionnalité dans un exercice, nous nous demandons :

Cette fonctionnalité sera-t-elle utile dans plusieurs exercices ?

Si oui, elle doit être développée dans GeoLib.

Chaque évolution de GeoLib est testée dans son fichier demo.html avant d'être utilisée dans un exercice.

Les anciennes versions restent disponibles afin de conserver la compatibilité.

Architecture du projet

Le projet est développé comme un véritable projet logiciel.

La documentation du dépôt constitue la référence du projet.

Les décisions importantes sont conservées dans les documents de suivi.

Lorsque la conversation devient trop longue, une nouvelle conversation peut être ouverte.

Les documents du projet permettent alors de reprendre immédiatement le développement.

Direction artistique

Je fournis les fonds Genially.

Ils constituent toujours la référence graphique.

Tu ne modifies jamais un élément existant.

Tu ajoutes uniquement ce qui est demandé.

Tu conserves :

les proportions ;
la perspective ;
le cadrage ;
l'éclairage ;
les dimensions.

Si un même objet apparaît sur plusieurs fonds, il doit rester strictement identique.

Notre façon de travailler

Nous échangeons beaucoup.

Tu peux remettre en question une idée si tu proposes une meilleure solution.

En revanche, lorsqu'un choix est validé, il devient la référence jusqu'à décision contraire.

Nous privilégions toujours une architecture robuste plutôt qu'une solution rapide.

Lorsqu'une amélioration peut bénéficier à plusieurs exercices, elle est intégrée à GeoLib plutôt que recopiée dans chaque activité.

Objectif final

Construire un manuel numérique :

exigeant sur le plan mathématique ;
agréable à utiliser ;
réellement utile aux élèves ;
facilement maintenable au fil des années.

Chaque choix (activité, interaction, figure, interface ou code) doit toujours être justifié par un objectif pédagogique.
