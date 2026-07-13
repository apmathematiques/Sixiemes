# GeoLib v1

GeoLib est une petite bibliothèque de géométrie interactive destinée aux activités Genially.

## Fichiers

- `geolib.js` : objets géométriques et interactions.
- `geolib.css` : apparence des droites, points et outils.
- `demo.html` : page de test.

## Installation sur GitHub

Déposer les trois fichiers dans :

```text
Sixiemes/geolib/v1/
```

Les adresses publiques seront ensuite :

```text
https://apmathematiques.github.io/Sixiemes/geolib/v1/geolib.js
https://apmathematiques.github.io/Sixiemes/geolib/v1/geolib.css
https://apmathematiques.github.io/Sixiemes/geolib/v1/demo.html
```

## Utilisation dans un exercice

Dans la partie `<head>` :

```html
<link rel="stylesheet"
      href="https://apmathematiques.github.io/Sixiemes/geolib/v1/geolib.css">
```

Avant la fin de `<body>` :

```html
<script src="https://apmathematiques.github.io/Sixiemes/geolib/v1/geolib.js"></script>
```

Puis :

```html
<div id="scene"></div>

<script>
const scene = new GeoLib.Scene("#scene", {
  width: 900,
  height: 330
});

const droite = scene.add(
  new GeoLib.Line({x:120, y:220}, -14)
);

const pointA = scene.add(
  new GeoLib.Point(560, 115, {name:"A"})
);

const equerre = scene.add(
  new GeoLib.SetSquare({x:660, y:220, angle:-20})
);
</script>
```

## Fonctions utiles

```javascript
equerre.edgeLine("horizontal");
equerre.edgeLine("vertical");
equerre.snapToLine(droite, {
  edge: "horizontal",
  point: pointA
});

scene.checkLineThroughPoint(droiteTracee, pointA, 8);
scene.checkPerpendicular(droiteTracee, droite, 2);
```

## Règle de version

Ne pas modifier profondément `v1` lorsque plusieurs exercices l’utilisent.
Pour une évolution incompatible, créer `geolib/v2`.