import { pool } from './client.js';

export async function ensureSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS routes (
      id           VARCHAR(50)  PRIMARY KEY,
      name         VARCHAR(100) NOT NULL,
      creator      VARCHAR(50)  NOT NULL,
      tier         VARCHAR(10)  NOT NULL CHECK (tier IN ('vert', 'bleu', 'rouge', 'noir')),
      dist         INTEGER      NOT NULL,
      deniv        INTEGER      NOT NULL,
      time         VARCHAR(10)  NOT NULL,
      stars        INTEGER      NOT NULL CHECK (stars BETWEEN 1 AND 5),
      review_count INTEGER      NOT NULL DEFAULT 0,
      plays        INTEGER      NOT NULL DEFAULT 0,
      hot          BOOLEAN      NOT NULL DEFAULT false,
      bike         VARCHAR(10)  NOT NULL CHECK (bike IN ('route', 'gravel', 'vtt')),
      note         TEXT         NOT NULL,
      dept         VARCHAR(50),
      gpx_coordinates JSONB
    );

    ALTER TABLE routes ADD COLUMN IF NOT EXISTS dept VARCHAR(50) NOT NULL DEFAULT 'Isère';

    CREATE TABLE IF NOT EXISTS reviews (
      id       SERIAL       PRIMARY KEY,
      name     VARCHAR(100) NOT NULL,
      initials VARCHAR(5)   NOT NULL,
      stars    INTEGER      NOT NULL CHECK (stars BETWEEN 1 AND 5),
      comment  TEXT         NOT NULL
    );

    CREATE TABLE IF NOT EXISTS board_players (
      id       SERIAL       PRIMARY KEY,
      scope    VARCHAR(10)  NOT NULL CHECK (scope IN ('mensuel', 'global')),
      rank     INTEGER      NOT NULL,
      name     VARCHAR(100) NOT NULL,
      initials VARCHAR(5)   NOT NULL,
      dept     VARCHAR(50),
      points   INTEGER      NOT NULL,
      you      BOOLEAN      NOT NULL DEFAULT false
    );

    CREATE TABLE IF NOT EXISTS route_leaderboard (
      id       SERIAL       PRIMARY KEY,
      route_id VARCHAR(50)  NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
      rank     INTEGER      NOT NULL,
      name     VARCHAR(100) NOT NULL,
      initials VARCHAR(5)   NOT NULL,
      time     VARCHAR(10)  NOT NULL,
      you      BOOLEAN      NOT NULL DEFAULT false
    );

    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL       PRIMARY KEY,
      email         VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at    TIMESTAMP    NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS profile (
      id      SERIAL       PRIMARY KEY,
      user_id INTEGER      REFERENCES users(id) ON DELETE CASCADE,
      name    VARCHAR(100) NOT NULL,
      rank    VARCHAR(20)  NOT NULL,
      points  INTEGER      NOT NULL,
      target  INTEGER      NOT NULL
    );

    ALTER TABLE profile ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
    CREATE UNIQUE INDEX IF NOT EXISTS profile_user_id_idx ON profile (user_id);

    CREATE TABLE IF NOT EXISTS medals (
      id         SERIAL      PRIMARY KEY,
      profile_id INTEGER     NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
      label      VARCHAR(20) NOT NULL,
      color      VARCHAR(10) NOT NULL,
      count      INTEGER     NOT NULL,
      sort_order INTEGER     NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS profile_routes (
      profile_id INTEGER     NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
      route_id   VARCHAR(50) NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
      sort_order INTEGER     NOT NULL DEFAULT 0,
      PRIMARY KEY (profile_id, route_id)
    );

    CREATE TABLE IF NOT EXISTS route_completions (
      profile_id   INTEGER     NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
      route_id     VARCHAR(50) NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
      completed_at TIMESTAMP   NOT NULL DEFAULT now(),
      PRIMARY KEY (profile_id, route_id)
    );
  `);
  console.log('✓ Schema ready');
}
