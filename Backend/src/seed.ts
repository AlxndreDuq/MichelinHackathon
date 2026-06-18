import bcrypt from 'bcryptjs';
import { pool } from './db/client.js';

// ─── helpers ─────────────────────────────────────────────────────────────────

export function addMin(base: string, add: number): string {
  const [h, m] = base.split('h').map(Number);
  const total  = (h ?? 0) * 60 + (m ?? 0) + add;
  return `${Math.floor(total / 60)}h${String(total % 60).padStart(2, '0')}`;
}

// ─── routes ──────────────────────────────────────────────────────────────────

const ROUTES = [
  { id: 'lac',      name: 'Tour du Lac',         creator: '@thomas_velo',  tier: 'vert',  dist: 18, deniv: 320,  time: '0h48', stars: 4, reviewCount: 64,  plays: 3200, hot: true,  bike: 'route',  note: 'Parfait pour un dimanche matin. La vue sur le lac au km 12 vaut le détour !', dept: 'Isère' },
  { id: 'foret',    name: 'Singletrack Forêt',   creator: '@julie_gravel', tier: 'bleu',  dist: 15, deniv: 450,  time: '1h05', stars: 4, reviewCount: 38,  plays: 960,  hot: false, bike: 'vtt',    note: 'Les racines en descente sont techniques. Prends ton temps sur la section nord.', dept: 'Savoie' },
  { id: 'cretes',   name: 'Crêtes du Vercors',   creator: '@marc_alpin',   tier: 'rouge', dist: 42, deniv: 1200, time: '2h15', stars: 5, reviewCount: 128, plays: 2400, hot: true,  bike: 'route',  note: 'Le spot ultime en Isère. Pars tôt pour éviter la chaleur sur le col principal.', dept: 'Drôme' },
  { id: 'arzelier', name: "Col de l'Arzelier",   creator: '@pierrot38',    tier: 'bleu',  dist: 28, deniv: 780,  time: '1h22', stars: 4, reviewCount: 52,  plays: 1800, hot: false, bike: 'gravel', note: 'Montée progressive avec un final raide. Les graviers du col sont bien praticables.', dept: 'Isère' },
  { id: 'plateau',  name: 'Plateau Gravel',       creator: '@emma_trek',    tier: 'vert',  dist: 22, deniv: 280,  time: '1h10', stars: 4, reviewCount: 29,  plays: 740,  hot: false, bike: 'gravel', note: 'Idéal pour débuter le gravel. Vue panoramique exceptionnelle au sommet.', dept: 'Ain' },
  { id: 'nuit',     name: 'Ride Nocturne',        creator: '@night_rider',  tier: 'bleu',  dist: 25, deniv: 520,  time: '1h30', stars: 5, reviewCount: 41,  plays: 580,  hot: true,  bike: 'route',  note: "L'expérience unique de Grenoble by night. Lampes frontales obligatoires !", dept: 'Isère' },
  { id: 'mur',      name: 'Le Mur de Sassenage', creator: '@climber_pro',  tier: 'noir',  dist: 8,  deniv: 680,  time: '0h38', stars: 5, reviewCount: 87,  plays: 320,  hot: false, bike: 'route',  note: "Pente max 22%. Si tu passes ce mur, tu mérites le titre de Légende.", dept: 'Isère' },
  { id: 'canal',    name: 'Voie du Canal',        creator: '@casual_rider', tier: 'vert',  dist: 35, deniv: 80,   time: '1h45', stars: 4, reviewCount: 103, plays: 2100, hot: false, bike: 'route',  note: 'La balade familiale par excellence. Plat, sécurisé, idéal pour tous niveaux.', dept: 'Rhône' },
];

// ─── reviews ─────────────────────────────────────────────────────────────────

const REVIEWS = [
  { name: 'Julien K.',       initials: 'JK', stars: 5, comment: 'Superbe parcours ! La vue au sommet vaut tous les efforts. Je reviens chaque saison.' },
  { name: 'Emma V.',         initials: 'EV', stars: 4, comment: 'Bien tracé mais la section finale est vraiment engagée. Prévoir de bonnes jambes.' },
  { name: 'Nicolas P.',      initials: 'NP', stars: 5, comment: "Une expérience inoubliable. Le dénivelé est intense mais chaque mètre en vaut la peine !" },
  { name: 'Marie-Claire L.', initials: 'ML', stars: 4, comment: 'Belle découverte de la région. Quelques passages techniques mais bien balisés.' },
  { name: 'Antoine D.',      initials: 'AD', stars: 3, comment: 'Parcours sympa mais un peu surcoté. La section centrale manque un peu de relief. Revenez au printemps.' },
  { name: 'Sonia B.',        initials: 'SB', stars: 5, comment: 'Absolument magnifique ! Le meilleur circuit que j\'ai fait en Isère. Incontournable.' },
];

// ─── board players ───────────────────────────────────────────────────────────

const BOARD_MENSUEL = [
  { rank: 1, name: 'Marc D.',    initials: 'MD', points: 4850, you: false },
  { rank: 2, name: 'Sophie R.',  initials: 'SR', points: 4210, you: false },
  { rank: 3, name: 'Pierre M.',  initials: 'PM', points: 3980, you: false },
  { rank: 4, name: 'Alice B.',   initials: 'AB', points: 3740, you: false },
  { rank: 5, name: 'Thomas L.',  initials: 'TL', points: 3210, you: false },
  { rank: 6, name: 'Camille D.', initials: 'CD', points: 3120, you: false },
  { rank: 7, name: 'Romain V.',  initials: 'RV', points: 2930, you: false },
  { rank: 8, name: 'Léa M.',     initials: 'L',  points: 2890, you: true  },
];

const BOARD_GLOBAL = [
  { rank: 1,  name: 'Antoine V.', initials: 'AV', dept: 'Savoie', points: 9840, you: false },
  { rank: 2,  name: 'Claire M.',  initials: 'CM', dept: 'Rhône',  points: 8650, you: false },
  { rank: 3,  name: 'Bastian K.', initials: 'BK', dept: 'Isère',  points: 7920, you: false },
  { rank: 4,  name: 'Marc D.',    initials: 'MD', dept: 'Isère',  points: 6740, you: false },
  { rank: 5,  name: 'Sophie R.',  initials: 'SR', dept: 'Isère',  points: 5980, you: false },
  { rank: 6,  name: 'Lucas F.',   initials: 'LF', dept: 'Savoie', points: 5420, you: false },
  { rank: 7,  name: 'Julie D.',   initials: 'JD', dept: 'Ain',    points: 4980, you: false },
  { rank: 8,  name: 'Pierre L.',  initials: 'PL', dept: 'Isère',  points: 4230, you: false },
  { rank: 9,  name: 'Noémie C.',  initials: 'NC', dept: 'Drôme',  points: 3870, you: false },
  { rank: 42, name: 'Léa M.',     initials: 'L',  dept: 'Isère',  points: 2890, you: true  },
];

// ─── route leaderboard (6 entries per route) ─────────────────────────────────

const TOP_RIDERS = [
  { name: 'Marc D.',   initials: 'MD' },
  { name: 'Sophie R.', initials: 'SR' },
  { name: 'Pierre M.', initials: 'PM' },
  { name: 'Alice B.',  initials: 'AB' },
  { name: 'Thomas L.', initials: 'TL' },
];
const OFFSETS  = [0, 6, 12, 20, 31];
const YOU_OFFSET = 49;

// ─── profile ─────────────────────────────────────────────────────────────────

const DEMO_USER = { email: 'lea@michelin.com', password: 'michelin2026' };

// rank/target are legacy columns kept for the NOT NULL constraint — the API
// now computes rank from points (see Backend/src/services/gamification.ts)
// and no longer reads either column.
const PROFILE = { name: 'Léa M.', rank: 'Or', points: 1650, target: 0 };

const PUBLISHED_ROUTE_IDS = ['cretes', 'arzelier', 'nuit'];

// 6 of the 8 seeded routes, summing to exactly PROFILE.points at their tier
// values (100+200+350+200+200+600=1650) — leaves 'plateau'/'canal' undone so
// the demo account shows believable partial progress.
const COMPLETED_ROUTE_IDS = ['lac', 'foret', 'cretes', 'arzelier', 'nuit', 'mur'];

// ─── products (Michelin tire catalog) ─────────────────────────────────────────
// Derived from "2W Bicycle Product Catalog v4 - 2026 - ACTIVE PRODUCTS.csv":
// 441 raw rows → 389 TYRE rows → deduped by tire model (Web Range Name,
// picking the standard label/sidewall colorway over cosmetic variants) and by
// display name within the same bike type (some models only differed by an
// invisible internal segment tier) → 65 reliable, distinct products.
// The CSV has no per-product URL, so every card links to Michelin's real
// site rather than a guessed/fabricated deep link.
const MICHELIN_URL = 'https://www.michelin.fr/bicycle';

const PRODUCTS = [
  { id: 'tire-michelin-country-a-t-access-line', name: 'Country A.T.', bike: 'vtt', tagline: 'MTB Leisure', ean: '3528700574395', url: MICHELIN_URL },
  { id: 'tire-michelin-country-cross-access-line', name: 'Country Cross', bike: 'vtt', tagline: 'MTB Leisure', ean: '3528701314044', url: MICHELIN_URL },
  { id: 'tire-michelin-country-dry2-access-line', name: 'Country DRY2', bike: 'vtt', tagline: 'MTB Leisure', ean: '3528701198316', url: MICHELIN_URL },
  { id: 'tire-michelin-country-grip-r-access-line', name: "Country Grip'R", bike: 'vtt', tagline: 'MTB Leisure', ean: '3528705197971', url: MICHELIN_URL },
  { id: 'tire-michelin-country-grip-r-access-line-foldable-bead', name: "Country Grip'R (Foldable Bead)", bike: 'vtt', tagline: 'MTB Leisure', ean: '3528705688134', url: MICHELIN_URL },
  { id: 'tire-michelin-country-race-r-access-line', name: "Country Race'R", bike: 'vtt', tagline: 'MTB Leisure', ean: '3528705373597', url: MICHELIN_URL },
  { id: 'tire-michelin-country-trail-access-line', name: 'Country Trail', bike: 'vtt', tagline: 'MTB Leisure', ean: '3528707103536', url: MICHELIN_URL },
  { id: 'tire-michelin-dh-mud-racing-line', name: 'DH Mud', bike: 'vtt', tagline: 'Downhill', ean: '3528705705398', url: MICHELIN_URL },
  { id: 'tire-michelin-dh16-racing-line', name: 'DH16', bike: 'vtt', tagline: 'Downhill', ean: '3528703728399', url: MICHELIN_URL },
  { id: 'tire-michelin-dh22-racing-line', name: 'DH22', bike: 'vtt', tagline: 'Downhill', ean: '3528706239885', url: MICHELIN_URL },
  { id: 'tire-michelin-dh22-racing-line-foldable-bead', name: 'DH22 (Foldable Bead)', bike: 'vtt', tagline: 'Downhill', ean: '3528705125080', url: MICHELIN_URL },
  { id: 'tire-michelin-dh34-bike-park-performance-line', name: 'DH34 Bike Park', bike: 'vtt', tagline: 'Downhill', ean: '3528705721053', url: MICHELIN_URL },
  { id: 'tire-michelin-dh34-racing-line', name: 'DH34', bike: 'vtt', tagline: 'Downhill', ean: '3528708973046', url: MICHELIN_URL },
  { id: 'tire-michelin-dynamic-classic-access-line', name: 'Dynamic Classic', bike: 'route', tagline: 'Leisure', ean: '3528709841573', url: MICHELIN_URL },
  { id: 'tire-michelin-dynamic-sport-access-line', name: 'Dynamic Sport', bike: 'route', tagline: 'Leisure', ean: '3528700028959', url: MICHELIN_URL },
  { id: 'tire-michelin-e-wild-front-competition-line', name: 'E-Wild Front', bike: 'vtt', tagline: 'E-Enduro', ean: '3528704150656', url: MICHELIN_URL },
  { id: 'tire-michelin-e-wild-rear-competition-line', name: 'E-Wild Rear', bike: 'vtt', tagline: 'E-Enduro', ean: '3528707410702', url: MICHELIN_URL },
  { id: 'tire-michelin-force-access-line', name: 'Force', bike: 'vtt', tagline: 'MTB Leisure', ean: '3528709796330', url: MICHELIN_URL },
  { id: 'tire-michelin-force-am-competition-line', name: 'Force AM', bike: 'vtt', tagline: 'All Mountain/Trail', ean: '3528700856125', url: MICHELIN_URL },
  { id: 'tire-michelin-force-am2-competition-line', name: 'Force AM2', bike: 'vtt', tagline: 'All Mountain/Trail', ean: '3528706408830', url: MICHELIN_URL },
  { id: 'tire-michelin-force-dc-racing-line', name: 'Force DC', bike: 'vtt', tagline: 'Down Country', ean: '3528706369230', url: MICHELIN_URL },
  { id: 'tire-michelin-force-xc-performance-line', name: 'Force XC', bike: 'vtt', tagline: 'Cross Country', ean: '3528701492322', url: MICHELIN_URL },
  { id: 'tire-michelin-force-xc2-performance-line', name: 'Force XC2', bike: 'vtt', tagline: 'Cross Country', ean: '3528707629715', url: MICHELIN_URL },
  { id: 'tire-michelin-force-xc3-performance-line', name: 'Force XC3', bike: 'vtt', tagline: 'Cross Country', ean: '3528700259865', url: MICHELIN_URL },
  { id: 'tire-michelin-jet-access-line', name: 'Jet', bike: 'vtt', tagline: 'MTB Leisure', ean: '3528707334824', url: MICHELIN_URL },
  { id: 'tire-michelin-jet-xc2-racing-line', name: 'Jet XC2', bike: 'vtt', tagline: 'Cross Country', ean: '3528709010344', url: MICHELIN_URL },
  { id: 'tire-michelin-jet-xc3-performance-line', name: 'Jet XC3', bike: 'vtt', tagline: 'Cross Country', ean: '3528707960269', url: MICHELIN_URL },
  { id: 'tire-michelin-lithion-2-performance-line', name: 'Lithion 2', bike: 'route', tagline: 'Endurance', ean: '3528700056198', url: MICHELIN_URL },
  { id: 'tire-michelin-lithion-4-performance-line', name: 'Lithion 4', bike: 'route', tagline: 'Endurance', ean: '3528703037217', url: MICHELIN_URL },
  { id: 'tire-michelin-mud-enduro-competition-line', name: 'Mud Enduro', bike: 'vtt', tagline: 'Enduro', ean: '3528705690366', url: MICHELIN_URL },
  { id: 'tire-michelin-pilot-freestyle-racing-line', name: 'Pilot Freestyle', bike: 'vtt', tagline: 'BMX Freestyle', ean: '3528709591539', url: MICHELIN_URL },
  { id: 'tire-michelin-pilot-pump-competition-line', name: 'Pilot Pump', bike: 'vtt', tagline: 'Freestyle', ean: '3528702401583', url: MICHELIN_URL },
  { id: 'tire-michelin-pilot-slope-competition-line', name: 'Pilot Slope', bike: 'vtt', tagline: 'Freestyle', ean: '3528701838793', url: MICHELIN_URL },
  { id: 'tire-michelin-pilot-sx-racing-line', name: 'Pilot Sx', bike: 'vtt', tagline: 'BMX Racing', ean: '3528707644282', url: MICHELIN_URL },
  { id: 'tire-michelin-pilot-sx-racing-line-foldable-bead', name: 'Pilot Sx (Foldable Bead)', bike: 'vtt', tagline: 'BMX Racing', ean: '3528702402719', url: MICHELIN_URL },
  { id: 'tire-michelin-pilot-sx-slick-racing-line', name: 'Pilot Sx Slick', bike: 'vtt', tagline: 'BMX Racing', ean: '3528704906314', url: MICHELIN_URL },
  { id: 'tire-michelin-power-adventure-competition-line', name: 'Power Adventure', bike: 'gravel', tagline: 'Speed', ean: '3528703428442', url: MICHELIN_URL },
  { id: 'tire-michelin-power-all-season-competition-line', name: 'Power All Season', bike: 'route', tagline: 'All Road', ean: '3528701464046', url: MICHELIN_URL },
  { id: 'tire-michelin-power-cup-competition-line', name: 'Power Cup', bike: 'route', tagline: 'Racing', ean: '3528706688546', url: MICHELIN_URL },
  { id: 'tire-michelin-power-cup-s-racing-line', name: 'Power Cup S', bike: 'route', tagline: 'Racing', ean: '3528705318383', url: MICHELIN_URL },
  { id: 'tire-michelin-power-cup-tlr-competition-line', name: 'Power Cup TLR', bike: 'route', tagline: 'Racing', ean: '3528701764214', url: MICHELIN_URL },
  { id: 'tire-michelin-power-cyclocross-jet-competition-line', name: 'Power Cyclocross Jet', bike: 'route', tagline: 'Cyclocross', ean: '3528707623225', url: MICHELIN_URL },
  { id: 'tire-michelin-power-cyclocross-mud-competition-line', name: 'Power Cyclocross Mud', bike: 'route', tagline: 'Cyclocross', ean: '3528708182851', url: MICHELIN_URL },
  { id: 'tire-michelin-power-gravel-competition-line', name: 'Power Gravel', bike: 'gravel', tagline: 'Versatile', ean: '3528705708443', url: MICHELIN_URL },
  { id: 'tire-michelin-power-gravel-extreme-competition-line', name: 'Power Gravel Extreme', bike: 'gravel', tagline: 'Trail', ean: '3528702167724', url: MICHELIN_URL },
  { id: 'tire-michelin-power-gravel-rs-racing-line', name: 'Power Gravel RS', bike: 'gravel', tagline: 'Racing', ean: '3528705648480', url: MICHELIN_URL },
  { id: 'tire-michelin-power-protection-tlr-competition-line', name: 'Power Protection TLR', bike: 'route', tagline: 'Endurance', ean: '3528700749601', url: MICHELIN_URL },
  { id: 'tire-michelin-power-road-competition-line', name: 'Power Road', bike: 'route', tagline: 'Racing', ean: '3528700176056', url: MICHELIN_URL },
  { id: 'tire-michelin-power-road-tlr-competition-line', name: 'Power Road TLR', bike: 'route', tagline: 'Racing', ean: '3528708761728', url: MICHELIN_URL },
  { id: 'tire-michelin-power-time-trial-racing-line', name: 'Power Time Trial', bike: 'route', tagline: 'Racing', ean: '3528706641435', url: MICHELIN_URL },
  { id: 'tire-michelin-pro5-competition-line', name: 'PRO5', bike: 'route', tagline: 'Endurance', ean: '3528704782369', url: MICHELIN_URL },
  { id: 'tire-michelin-pro5-tlr-competition-line', name: 'PRO5 TLR', bike: 'route', tagline: 'Endurance', ean: '3528701399010', url: MICHELIN_URL },
  { id: 'tire-michelin-wild-access-line', name: 'Wild', bike: 'vtt', tagline: 'MTB Leisure', ean: '3528703130055', url: MICHELIN_URL },
  { id: 'tire-michelin-wild-am-competition-line', name: 'Wild AM', bike: 'vtt', tagline: 'All Mountain/Trail', ean: '3528704971398', url: MICHELIN_URL },
  { id: 'tire-michelin-wild-am2-competition-line', name: 'Wild AM2', bike: 'vtt', tagline: 'All Mountain/Trail', ean: '3528704905140', url: MICHELIN_URL },
  { id: 'tire-michelin-wild-dc-racing-line', name: 'Wild DC', bike: 'vtt', tagline: 'Down Country', ean: '3528709078948', url: MICHELIN_URL },
  { id: 'tire-michelin-wild-enduro-front-gum-x-competition-line', name: 'Wild Enduro Front GUM-X', bike: 'vtt', tagline: 'Enduro', ean: '3528705797102', url: MICHELIN_URL },
  { id: 'tire-michelin-wild-enduro-front-magi-x-competition-line', name: 'Wild Enduro Front MAGI-X', bike: 'vtt', tagline: 'Enduro', ean: '3528702615980', url: MICHELIN_URL },
  { id: 'tire-michelin-wild-enduro-front-racing-line', name: 'Wild Enduro Front', bike: 'vtt', tagline: 'Enduro', ean: '3528704757411', url: MICHELIN_URL },
  { id: 'tire-michelin-wild-enduro-mh-performance-line', name: 'Wild Enduro MH', bike: 'vtt', tagline: 'Enduro', ean: '3528708223486', url: MICHELIN_URL },
  { id: 'tire-michelin-wild-enduro-ms-performance-line', name: 'Wild Enduro MS', bike: 'vtt', tagline: 'Enduro', ean: '3528705342388', url: MICHELIN_URL },
  { id: 'tire-michelin-wild-enduro-rear-competition-line', name: 'Wild Enduro Rear', bike: 'vtt', tagline: 'Enduro', ean: '3528706327391', url: MICHELIN_URL },
  { id: 'tire-michelin-wild-mud-advanced-competition-line', name: 'Wild Mud Advanced', bike: 'vtt', tagline: 'Cross Country', ean: '3528700864472', url: MICHELIN_URL },
  { id: 'tire-michelin-wild-rock-r-performance-line', name: "Wild Rock'R", bike: 'vtt', tagline: 'Cross Country', ean: '3528706961151', url: MICHELIN_URL },
  { id: 'tire-michelin-wild-xc-performance-line', name: 'Wild XC', bike: 'vtt', tagline: 'Cross Country', ean: '3528709221436', url: MICHELIN_URL },
];

// ─── seed logic ──────────────────────────────────────────────────────────────

async function insertAll(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Clear all tables (child tables first to respect FK constraints)
    await client.query(`
      TRUNCATE profile_routes, medals, route_completions, profile, users,
               route_leaderboard, board_players, reviews, routes, products
      RESTART IDENTITY
    `);

    // ── routes (8) ──────────────────────────────────────────────────────────
    for (const r of ROUTES) {
      await client.query(
        `INSERT INTO routes (id, name, creator, tier, dist, deniv, time, stars, review_count, plays, hot, bike, note, dept)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [r.id, r.name, r.creator, r.tier, r.dist, r.deniv, r.time, r.stars, r.reviewCount, r.plays, r.hot, r.bike, r.note, r.dept],
      );
    }
    console.log(`  ✓ ${ROUTES.length} routes`);

    // ── products (Michelin tire catalog) ────────────────────────────────────
    for (const p of PRODUCTS) {
      await client.query(
        `INSERT INTO products (id, name, bike, tagline, ean_code, url)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [p.id, p.name, p.bike, p.tagline, p.ean, p.url],
      );
    }
    console.log(`  ✓ ${PRODUCTS.length} products`);

    // ── reviews (6) ─────────────────────────────────────────────────────────
    for (const r of REVIEWS) {
      await client.query(
        'INSERT INTO reviews (name, initials, stars, comment) VALUES ($1,$2,$3,$4)',
        [r.name, r.initials, r.stars, r.comment],
      );
    }
    console.log(`  ✓ ${REVIEWS.length} reviews`);

    // ── board players mensuel (8) + global (10) ──────────────────────────────
    for (const p of BOARD_MENSUEL) {
      await client.query(
        `INSERT INTO board_players (scope, rank, name, initials, dept, points, you)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        ['mensuel', p.rank, p.name, p.initials, null, p.points, p.you],
      );
    }
    for (const p of BOARD_GLOBAL) {
      await client.query(
        `INSERT INTO board_players (scope, rank, name, initials, dept, points, you)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        ['global', p.rank, p.name, p.initials, 'dept' in p ? p.dept : null, p.points, p.you],
      );
    }
    console.log(`  ✓ ${BOARD_MENSUEL.length + BOARD_GLOBAL.length} board players`);

    // ── route leaderboard (6 entries × 8 routes = 48) ───────────────────────
    let lbCount = 0;
    for (const route of ROUTES) {
      for (let i = 0; i < TOP_RIDERS.length; i++) {
        const rider = TOP_RIDERS[i]!;
        await client.query(
          `INSERT INTO route_leaderboard (route_id, rank, name, initials, time, you)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [route.id, i + 1, rider.name, rider.initials, addMin(route.time, OFFSETS[i] ?? 0), false],
        );
        lbCount++;
      }
      await client.query(
        `INSERT INTO route_leaderboard (route_id, rank, name, initials, time, you)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [route.id, 12, 'Léa M.', 'L', addMin(route.time, YOU_OFFSET), true],
      );
      lbCount++;
    }
    console.log(`  ✓ ${lbCount} leaderboard entries`);

    // ── demo user + profile (1) + completions (6) + published routes (3) ────
    const passwordHash = await bcrypt.hash(DEMO_USER.password, 10);
    const userRes = await client.query<{ id: number }>(
      'INSERT INTO users (email, password_hash) VALUES ($1,$2) RETURNING id',
      [DEMO_USER.email, passwordHash],
    );
    const userId = userRes.rows[0]!.id;
    console.log(`  ✓ 1 demo user (${DEMO_USER.email})`);

    const profileRes = await client.query<{ id: number }>(
      'INSERT INTO profile (user_id, name, rank, points, target) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [userId, PROFILE.name, PROFILE.rank, PROFILE.points, PROFILE.target],
    );
    const profileId = profileRes.rows[0]!.id;

    for (const routeId of COMPLETED_ROUTE_IDS) {
      await client.query(
        'INSERT INTO route_completions (profile_id, route_id) VALUES ($1,$2)',
        [profileId, routeId],
      );
    }

    for (let i = 0; i < PUBLISHED_ROUTE_IDS.length; i++) {
      await client.query(
        'INSERT INTO profile_routes (profile_id, route_id, sort_order) VALUES ($1,$2,$3)',
        [profileId, PUBLISHED_ROUTE_IDS[i], i],
      );
    }
    console.log(`  ✓ 1 profile · ${COMPLETED_ROUTE_IDS.length} completions · ${PUBLISHED_ROUTE_IDS.length} published routes`);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Seeds the database only when both routes and profile tables are populated. */
export async function seedIfEmpty(): Promise<void> {
  interface Row { count: string }
  const [{ rows: rr }, { rows: pr }] = await Promise.all([
    pool.query<Row>('SELECT COUNT(*)::text AS count FROM routes'),
    pool.query<Row>('SELECT COUNT(*)::text AS count FROM profile'),
  ]);
  if (parseInt(rr[0]?.count ?? '0', 10) > 0 && parseInt(pr[0]?.count ?? '0', 10) > 0) {
    console.log('✓ Database already populated, skipping seed');
    return;
  }
  console.log('Seeding database…');
  await insertAll();
  console.log('✓ Database seeded');
}

// Allow direct run: `npm run seed`
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  insertAll()
    .then(() => { console.log('✓ Done'); return pool.end(); })
    .catch(err => { console.error('Seed failed:', err); process.exit(1); });
}
