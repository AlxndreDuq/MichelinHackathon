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

// ─── seed logic ──────────────────────────────────────────────────────────────

async function insertAll(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Clear all tables (child tables first to respect FK constraints)
    await client.query(`
      TRUNCATE profile_routes, medals, route_completions, profile, users,
               route_leaderboard, board_players, reviews, routes
      RESTART IDENTITY
    `);

    // ── routes (8) ──────────────────────────────────────────────────────────
    for (const r of ROUTES) {
      await client.query(
        `INSERT INTO routes (id, name, creator, tier, dist, deniv, time, stars, review_count, plays, hot, bike, note, department)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [r.id, r.name, r.creator, r.tier, r.dist, r.deniv, r.time, r.stars, r.reviewCount, r.plays, r.hot, r.bike, r.note, r.dept],
      );
    }
    console.log(`  ✓ ${ROUTES.length} routes`);

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
