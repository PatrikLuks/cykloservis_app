# InfoCard komponenta

Komponenta `InfoCard` slouží k zobrazení informací na dashboardu v moderním stylu.

## Props
- `icon` – ikona (emoji nebo SVG)
- `title` – nadpis karty
- `value` – hlavní údaj
- `color` – barva ikony a nadpisu (výchozí: #394ff7)
- `background` – barva pozadí karty (výchozí: #fff)

## Styl
- Zaoblené rohy, stín, moderní layout
- Responzivní, vhodné pro mobilní i desktop zobrazení

## Použití
```jsx
<InfoCard icon="🚲" title="Moje kola" value="2 aktivní" background="#fff" />
```

## Testování
Testy najdete v `src/pages/__tests__/MojeKolaCard.test.js`.

## Rozšíření
Lze rozšířit o další props (např. obrázek, akce, detailní info).
