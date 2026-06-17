# Handoff: Borne — Défi Vélo MICHELIN

## Overview
**Borne** is a mobile app concept for MICHELIN: a gamified cycling-route platform for a French region. It turns local bike routes into a game map (Duolingo-style path of nodes), where **ambassadeurs** create routes ("parcours"), riders play them, Strava times them onto leaderboards, and MICHELIN recommends the ideal tire for each route. Brand pillars: **Convivialité, Écologie, Aventure, Dépassement**.

The deliverable in this conversation is a single mobile-app prototype shown inside a phone frame on a branded marketing background. The app has 5 primary tabs plus a route-detail view.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes that show the intended look, layout, and interaction behavior. **They are not production code to copy directly.**

The HTML is written in a proprietary lightweight component runtime (`support.js`, `<x-dc>` templates, `<sc-for>`/`<sc-if>` control flow, a `Component extends DCLogic` class). **Do not port that runtime.** Instead, **recreate these designs in the target codebase's existing environment** (React Native, Expo, Flutter, SwiftUI, etc.) using its established patterns, navigation, and component libraries. If no codebase exists yet, choose the most appropriate mobile framework and implement there.

The single self-contained file `Borne - Défi Vélo MICHELIN (offline).html` opens in any browser with no dependencies — use it to see the design live.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, copy, and interactions are all specified. Recreate pixel-faithfully, then adapt to the target platform's idioms (native nav bar, safe areas, scroll views).

## Design language
Bold, playful, "sticker/cartoon" UI:
- Every card, chip, button, and avatar has a **thick dark outline** (`2.5–3px solid #15140F`) and a **hard offset drop shadow** (no blur), e.g. `box-shadow: 3px 3px 0 #15140F` (offsets scale 2px→6px with element importance).
- Pressed state = element translates by the shadow offset and the shadow shrinks (tactile "push" — see Interactions).
- Generous border-radius; pill shapes (`999px`) for badges/chips; `12–24px` for cards.
- Two display weights: headings in **Fredoka** (700), body/UI in **Nunito** (600–900).

---

## Design Tokens

### Colors
| Token | Hex | Use |
|---|---|---|
| Ink (outline/text) | `#15140F` | All outlines, shadows, primary text |
| MICHELIN Yellow | `#FFCB1A` | Primary accent, active states, CTAs |
| Blue | `#1F4BA0` | Secondary brand, "Sport" tier, phone bezel |
| Deep navy (bg) | `#0B1E48` | Marketing page background base |
| Sage green | `#7E9B5B` | Écologie, "Découverte" tier, ambassador badge |
| Red/terracotta | `#D4533A` | "Engagé" tier, "Tendance" flags, fire icon |
| Cream (app bg) | `#F3EAD3` | App screen background |
| Cream alt (panel text) | `#F3EAD3` / `#EFE9D8` / `#E9E2CF` | Light text on dark |
| Success green | `#5E8C3E` | Confirmation states ("C'est parti", published) |
| Star amber | `#F2A30F` (fill) / `#E8B43A` (gold) | Ratings, gold medal |
| Silver / Bronze | `#B9BBC0` / `#C8895A` | Medals |
| Muted text | `#6f6852` / `#8a8068` / `#a89e87` | Secondary/labels/inactive |
| Disabled fill | `#cfc6ad` / `#d8cfb8` | Locked nodes, empty stars |

### Difficulty tiers (color-coded throughout)
| Key | Label | Sub | Color |
|---|---|---|---|
| `vert` | Vert | Découverte | `#7E9B5B` |
| `bleu` | Bleu | Sport | `#1F4BA0` |
| `rouge` | Rouge | Engagé | `#D4533A` |
| `noir` | Noir | Légende | `#15140F` |

### Typography
- **Display:** Fredoka, weights 500/600/700. Headings, numbers, node digits, big stats.
- **Body/UI:** Nunito, weights 600/700/800/900. Everything else.
- Scale (px): hero `74`; screen titles `23–27`; section headings `17–18`; card titles `15`; body `13–19`; labels/badges `9–13` (often uppercase, `letter-spacing .04–.05em`, weight 800).
- Body line-height ~1.4–1.5; headings ~0.9–1.05.

### Spacing / radius / shadow
- Radius: pills `999px`; chips/small `9–14px`; cards `15–20px`; phone screen `38–48px`.
- Borders: `2px` (small icons/badges), `2.5px` (most), `3px` (hero CTAs, bezel, big cards).
- Shadow (hard, no blur, ink color): `1.5px/2px/2.5px/3px/4px/5px/6px` offsets, both axes equal, e.g. `3px 3px 0 #15140F`.
- Marketing-page gutters `46px 26px`; max content width `1160px`. App content padding `0 18px`.

### Keyframes / motion
- `popin`: `scale(.97)+opacity 0 → scale(1)+opacity 1`, `.25–.3s ease` — every screen swap.
- `pulse`: animated yellow glow ring on the current/active map node, `1.8s ease-in-out infinite`.
- `spin`: `360deg` rotate (defined; for loaders).
- Nav icon background transitions `all .14s`.

---

## Phone frame & chrome
- Phone: `392 × 812`, body `#1F4BA0`, `3px solid #15140F`, radius `48px`, shadow `10px 10px 0 #15140F`, padding `11px`. Inner screen radius `38px`, bg `#F3EAD3`, `overflow:hidden`, vertical flex column.
- **Status bar** (`38px`): `9:41` left; centered black notch pill `88×20`; battery glyphs right.
- **Masthead** (sticky top of screen): "MICHELIN" (Fredoka 17, blue) over "Borne · Parcours" (11, muted); right side a yellow pill badge "● Rang Or".
- **Scroll content**: `flex:1; overflow-y:auto;` scrollbars hidden.
- **Bottom nav** (see Screens → Navigation).

---

## Screens / Views

The app has 5 tabs — **Carte (accueil), Explorer, Créer (center FAB), Classement, Profil** — plus a **Route Detail** overlay reachable from several screens. Active tab + open-route are mutually exclusive (opening a route hides the tab content; closing returns to the active tab).

### 1. Carte des parcours (Home / `accueil`)
**Purpose:** The game map — pick your next route challenge from a vertical Duolingo-style path.
**Layout:** Title block ("Carte des parcours" Fredoka 21 + subtitle "{dept} · choisis ton prochain défi"). Below, a `position:relative` map area (height computed from node count) containing:
- **Scenery:** 3 faint triangles (mountains) absolutely placed, low opacity, clip-path `polygon(50% 0,100% 100%,0 100%)` in sage/blue/red.
- **Trail:** an SVG dashed path (`stroke #15140F`, `stroke-width 5`, `dasharray 1 15`, opacity .55) connecting node points with smooth cubic curves.
- **Side-quest card** (top-right, yellow, tappable): "Défi de la semaine" → "Crêtes du Vercors · +300 pts", with a "Jouer ▸" pill. Opens that route.
- **Nodes** (7): circular buttons `62×62`, `3px` outline, hard shadow, colored by tier. States:
  - *Completed:* shows tier color, star row above (★ repeated by stars earned), tappable.
  - *Current:* `pulse` glow ring + a yellow "JOUER ▸" pill below the name. Tappable.
  - *Locked:* muted `#cfc6ad`, padlock icon, `opacity .72`, not tappable.
  - *Unlocked/uncompleted:* tier color, shows its number.
  - Each node has a white pill name label below (`2px` outline, truncated).
- Node order & state (default): `lac`(✓2★), `foret`(✓1★), `cretes`(✓3★), `arzelier`(current), `plateau`/`nuit`/`mur`(locked). Node x-positions zig-zag; vertical step `132px`.

### 2. Route Detail (overlay, `showRun`)
**Purpose:** Everything about one route + leaderboard + reviews + play CTA.
**Layout (top→bottom):**
- **Hero** `206px`: route photo (`assets/nature-cycling.png`) with navy bottom-gradient. Back button top-left (white square, `38×38`, chevron-left). Bottom overlay: tier badge ("Niveau {label} · {sub}"), route name (Fredoka 26), "Créé par {creator} · Ambassadeur".
- **Rating row:** 5-star cells (filled amber / empty `#d8cfb8`) + "{stars}" + "({n} avis)"; right: play count in blue.
- **Stat trio** (3 outlined cards): Distance "{km} km", Dénivelé "{m} m D+", Record "{time}".
- **Reco du créateur** (blue card, cream text): yellow "Reco du créateur" badge; two chips "Vélo : {Route/Gravel/VTT}" and the recommended MICHELIN tire (yellow chip); a quoted creator note.
- **Classement du parcours:** per-route leaderboard, 5 rows (rank, square avatar w/ medal color for top-3, name, time). The "you" row (rank 12) is highlighted yellow with shadow.
- **Avis des riders:** review cards (avatar initials, name, star cells, comment text).
- **CTA:** before playing → big yellow "Jouer ce parcours →" button + caption "Suivi auto via Strava…". After tapping → green confirmation card "C'est parti ! / Suivi Strava actif…".

### 3. Explorer (`explorer`)
**Purpose:** Discover routes.
**Layout:** Title "Explorer" (Fredoka 24). Search field (outlined, magnifier icon, placeholder "Cherche un parcours, un créateur…"). Horizontal filter chips: **Tendances** (active yellow), Nouveaux, Près de toi, Difficulté. Section "🔥 Tendances cette semaine" (fire icon) → horizontal scroller of route cards (`214px` wide: photo top w/ "Tendance" flag + tier badge, name, creator, ★ rating, play count). Section "Tous les parcours" → vertical list rows (thumb `54×54`, name, tier badge + distance + rating, chevron). All cards open Route Detail.

### 4. Créer un parcours (`creer`, center FAB)
**Purpose:** Ambassadors author and publish a route.
**Form layout (3 numbered sections):**
1. **Le tracé** — preview card (route photo + dashed yellow SVG path overlay, "Aperçu du tracé" badge); buttons "Importer un GPX" (blue) / "Dessiner" (white).
2. **Les infos** — text inputs "Nom du parcours", "Département (ex : Isère · 38)"; **Difficulté** = 4 selectable tier chips (vert/bleu/rouge/noir; selected fills tier color, white text, lifts).
3. **Ta reco config** — 3 bike chips (Route/Gravel/VTT; selected = yellow); a blue "Suggéré" card showing the auto-mapped MICHELIN tire for the chosen bike; a textarea "Ton conseil aux riders…".
- Big yellow **"Publier le parcours"** CTA.
- **Published success state** (replaces form): green check tile, "Parcours publié !", copy "Ton niveau est en ligne dans {dept}…", two stat tiles (+500 pts créateur / 0 runs), "Créer un autre parcours" button (resets).

### 5. Classement (`classement`)
**Purpose:** Ranking leaderboards.
**Layout:** Title "Classement". Two scope toggle buttons: **Mensuel · Dépt** / **Global · France** (active = yellow + lift). Caption note. **King card** (big yellow card, floating "King of Dept"/"King de France" blue badge): rank-1 rider — square avatar, name (Fredoka 20), points, giant "1". Below: ranked rows (rank, medal-colored square avatar for top-3, name, points; "you" row highlighted yellow with a "TOI" tag). Monthly vs global show different data sets.

### 6. Profil (`profil`)
**Purpose:** Rider identity, medals, MICHELIN rewards, own routes.
**Layout:** Header (rounded-square avatar photo `66×66` + "{name} M." + green "Ambassadeur MICHELIN · Rang Or" badge). **Medals row** (3 tiles: Or ×4, Argent ×9, Bronze ×12 — colored disc + label + count). **Cagnotte MICHELIN** (blue card): "-10 % débloqué" pill, "3 450 pts" (Fredoka 34), progress bar (~69%), "Plus que 1 550 pts → statut Légende MICHELIN". **Mes parcours publiés** list (rows: thumb, name, play count + ★ rating + tier badge), tappable to Route Detail.

### Navigation (bottom bar)
Sticky, white, `2.5px` top border. 5 slots: **Carte, Explorer, [center FAB Créer], Classement, Profil**. Each tab = icon in a `40×28` rounded box (active box = yellow fill + ink outline + hard shadow; inactive transparent) above a label; active label ink+800, inactive muted. Center **FAB** = `56×56` circle, raised `-24px` above bar (overlaps), `3px` outline + shadow; yellow normally, blue when Créer is active, with a "Créer" label beneath. Icons are inline stroke SVGs (map/tent, compass, plus, trophy, person).

---

## Interactions & Behavior
- **Tab switching:** sets active tab, clears any open route. `popin` animation on the entering screen.
- **Open route:** tapping a map node (if not locked), a side-quest card, an Explorer card, or a profile route sets `openRun=id` and shows Route Detail (overlays tabs). Back button / closeRun clears it.
- **Pressed/active feedback (everywhere on tappable cards & buttons):** `transform: translate(Δx,Δy)` equal to the shadow offset, and shadow shrinks toward `1px` — element appears pushed into the page. Implement as a press/active state.
- **Play a route:** "Jouer ce parcours" sets `playing=true`, swaps CTA for the green "C'est parti!" confirmation (`popin`).
- **Publish a route:** "Publier" sets `published=true` → success state; "Créer un autre" resets to the form.
- **Classement scope:** Mensuel/Global toggle swaps the dataset, king card title, and caption.
- **Créer selections:** tier chips and bike chips are single-select; selecting a bike updates the suggested tire live (`route→Power Road`, `gravel→Power Gravel`, `vtt→Wild Trail`).
- **Locked nodes:** no-op on tap.
- Map current node continuously **pulses**.

## State Management
Single component state:
- `tab` — `"accueil" | "explorer" | "creer" | "classement" | "profil"` (default `accueil`).
- `openRun` — route id or `null` (overlays tabs when set).
- `playing` — boolean (route-detail play confirmation).
- `published` — boolean (créer success state).
- `boardScope` — `"mensuel" | "global"`.
- `cTier` — selected difficulty when creating (default `bleu`).
- `cBike` — selected bike when creating (default `gravel`).

Inputs/props (tweakable in the prototype):
- `riderName` (default "Léa") and `homeDept` (default "Isère · 38") — feed the profile, "you" leaderboard rows, and copy.

### Data model (all hardcoded sample data — replace with real API)
**Route** `{ id, name, creator(@handle), tier(vert|bleu|rouge|noir), dist(km), deniv(m), time, stars, reviews(count), plays, hot(bool), bike(route|gravel|vtt), note }`. Derived: tier object, tire mapping, formatted plays (`2.4k runs`), star cells, badges, thumbnail style.
Sample routes: Crêtes du Vercors, Tour du Lac, Col de l'Arzelier, Singletrack Forêt, Plateau Gravel, Ride Nocturne, Le Mur de Sassenage, Voie du Canal.
**Bike→Tire map:** Route→MICHELIN Power Road, Gravel→MICHELIN Power Gravel, VTT→MICHELIN Wild Trail.
**Leaderboards:** separate monthly (department) and global (France, with dept suffix) arrays; the current rider is inserted at a lower rank and flagged `you`.
**Map state:** per-node `{completed: starsEarned}` / `{current:true}` / `{locked:true}`.
**Integrations referenced (not implemented):** Strava timing/leaderboard sync; MICHELIN tire recommendation; GPX import.

## Assets
- `assets/nature-cycling.png` — single mountain-cycling photo reused for: marketing-page background, route-detail heroes, all route thumbnails, créer track preview, and the profile avatar. **Replace with real per-route imagery in production.** Source: project asset provided in this design.
- All icons are **inline stroke SVGs** (Lucide-style: chevrons, arrow-right, compass, trophy, person, map/tent, plus, lock, search, check, flame, camera). No icon font; use the codebase's icon set.
- Fonts: **Fredoka** & **Nunito** from Google Fonts.

## Files
- `Borne.dc.html` — **the canonical, current design** (all 6 views). Implement from this.
- `Borne - Défi Vélo MICHELIN (offline).html` — self-contained single-file build; open in a browser to view the design live (no setup).
- `assets/nature-cycling.png` — the shared photo asset.

(Two earlier iterations exist in the project — `Borne v1 (defi).dc.html` and `Borne-export.dc.html` — they are superseded by `Borne.dc.html` and are not part of this handoff.)
