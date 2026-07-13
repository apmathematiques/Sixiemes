# GeoLib v1.2

GeoLib v1.2 ajoute des générateurs de points adaptés à la taille des outils.

## Installation

Conserve les anciennes versions et ajoute :

```text
Sixiemes/
└── geolib/
    ├── v1/
    ├── v1.1/
    └── v1.2/
        ├── geolib.js
        ├── geolib.css
        ├── demo.html
        └── README.md
```

## Adresses publiques

```text
https://apmathematiques.github.io/Sixiemes/geolib/v1.2/geolib.js
https://apmathematiques.github.io/Sixiemes/geolib/v1.2/geolib.css
https://apmathematiques.github.io/Sixiemes/geolib/v1.2/demo.html
```

## Nouveautés

### Point atteignable par l’équerre

```javascript
const point = GeoLib.Random.pointForTool(equerre, {
  width: 900,
  height: 330
});
```

### Plusieurs points éloignés les uns des autres

```javascript
const points = GeoLib.Random.points(4, {
  tool: equerre,
  width: 900,
  height: 330,
  minDistance: 80,
  names: ["A","B","C","D"]
});
```

### Point situé sur une droite

```javascript
const point = GeoLib.Random.pointOnLine(droite, {
  tool: equerre,
  width: 900,
  height: 330
});
```

### Point éloigné d’une droite

```javascript
const point = GeoLib.Random.pointAwayFromLine(droite, {
  tool: equerre,
  width: 900,
  height: 330,
  minLineDistance: 55
});
```

### Vérification d’une construction perpendiculaire

```javascript
const resultat = GeoLib.Check.perpendicularConstruction({
  baseLine: droiteDonnee,
  point: pointDemande,
  drawnLine: droiteTracee,
  pointTolerance: 10,
  angleTolerance: 2
});
```

Le résultat contient :

```javascript
{
  success: true ou false,
  passPoint: true ou false,
  perpendicular: true ou false,
  pointDistance: ...,
  angleDifference: ...
}
```

## Test

Ouvre :

```text
https://apmathematiques.github.io/Sixiemes/geolib/v1.2/demo.html
```