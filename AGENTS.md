# Instructions du projet

Ces règles s'appliquent à toute personne ou tout agent travaillant sur ce dépôt.

## Priorité pédagogique

- La trace écrite fournie par l'enseignante est la référence.
- Ne jamais coder un exercice avant validation de son principe pédagogique.
- Lorsqu'un choix est validé, ne pas le modifier sans proposition préalable.
- Les pièges doivent correspondre à des erreurs réelles d'élèves.
- En cas de doute mathématique, le signaler au lieu d'inventer.

## Exercices HTML

- Produire un fichier HTML autonome, sauf dépendance explicitement prévue vers GeoLib.
- Format 16:9.
- Fond transparent.
- Responsive ordinateur et tablette.
- Le titre n'apparaît jamais dans le HTML.
- Interface sobre, moderne, lisible et principalement bleue.
- Correction pédagogique et bilan final.
- Modifier uniquement ce qui est demandé.
- Préférer un code simple et robuste.

## GeoLib

- Utiliser la version stable indiquée dans `docs/avancement.md`.
- GeoLib ne contient aucune logique pédagogique.
- GeoLib gère uniquement les objets, outils, interactions, générateurs et vérifications géométriques.
- Toute fonctionnalité réutilisable par plusieurs exercices doit être intégrée à GeoLib.
- Toute évolution de GeoLib doit être testée dans `demo.html`.
- Ne pas supprimer les anciennes versions déjà utilisées.

## Documentation

- Lire `docs/charte.md`.
- Consulter `docs/decisions.md` avant de remettre en cause un choix existant.
- Mettre à jour `docs/avancement.md` après une étape importante.
- Ajouter les évolutions notables dans `CHANGELOG.md`.
