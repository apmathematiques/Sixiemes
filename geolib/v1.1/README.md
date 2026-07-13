# GeoLib v1.1

GeoLib v1.1 ajoute la sélection interactive du bord de l’équerre.

## Nouveauté principale

L’exercice peut demander à l’élève de choisir lui-même le bord sur lequel tracer :

```javascript
const choix = await equerre.trace({
  className: "geolib-line-correct"
});

console.log(choix.edge); // "horizontal" ou "vertical"
console.log(choix.line); // objet GeoLib.Line
```

Pour sélectionner un bord sans tracer immédiatement :

```javascript
const choix = await equerre.selectEdge();
```

## Installation conseillée

Ne remplace pas le dossier `v1`.

Ajoute un nouveau dossier :

```text
Sixiemes/
└── geolib/
    ├── v1/
    │   ├── geolib.js
    │   ├── geolib.css
    │   └── demo.html
    └── v1.1/
        ├── geolib.js
        ├── geolib.css
        ├── demo.html
        └── README.md
```

Les nouvelles adresses seront :

```text
https://apmathematiques.github.io/Sixiemes/geolib/v1.1/geolib.js
https://apmathematiques.github.io/Sixiemes/geolib/v1.1/geolib.css
https://apmathematiques.github.io/Sixiemes/geolib/v1.1/demo.html
```

## Dans un nouvel exercice

Dans `<head>` :

```html
<link rel="stylesheet"
      href="https://apmathematiques.github.io/Sixiemes/geolib/v1.1/geolib.css">
```

Avant le code de l’exercice :

```html
<script src="https://apmathematiques.github.io/Sixiemes/geolib/v1.1/geolib.js"></script>
```

## Test

Après le dépôt des fichiers, ouvre :

```text
https://apmathematiques.github.io/Sixiemes/geolib/v1.1/demo.html
```

Teste les deux orientations de l’équerre et les deux bords.