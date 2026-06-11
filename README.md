# nightfall-site

**NIGHTFALL** — holding co. Umbrella site, with **Nightstar Solutions (NSS)** as the live operating division.

## Structure

```
index.html              page markup
css/styles.css          full design system (monochrome + ascii accents)
js/globe.js             interactive ascii globe (canvas, drag to spin)
js/landmask.data.js     192x96 land bitfield (generated)
js/pi.js                pi — resident pixel critter + rocket orbit
js/stack.js             stack section (Vue 3)
tools/ascii_marks.py    brand mark generator (crescent / star -> ascii + png)
tools/landmask.py       GeoJSON -> land mask generator
assets/logo/            favicon + mark exports
```

## Stack
Hand-rolled HTML/CSS/JS core · Vue 3 (stack section) · Python (asset toolchain) · GitHub Pages.

## pi
The little guy at the bottom. Drag him around. Drop him on the rocket.
