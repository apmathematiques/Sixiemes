GeoLib 1.5 — Rapporteur

Fichiers à copier dans le dépôt :
- geolib/v1.5/protractor.js
- geolib/v1.5/protractor.css
- geolib/v1.5/demo-protractor.html

La démo utilise :
- geolib/v1.3/geolib.js
- geolib/v1.3/geolib.css

Test local :
1. Depuis la racine du dépôt :
   py -m http.server 8000
2. Ouvrir :
   http://localhost:8000/geolib/v1.5/demo-protractor.html

Pensé en priorité pour tablette :
- glisser à un doigt sur le corps pour déplacer ;
- grosse poignée tactile pour tourner ;
- aucun comportement important dépendant du survol ;
- cibles tactiles larges ;
- aimantation centre/base activable ou désactivable.
