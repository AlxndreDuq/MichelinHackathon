import express from 'express';
import cors from 'cors';
import routesRouter  from './routes/routes.router.js';
import boardRouter   from './routes/board.router.js';
import profileRouter from './routes/profile.router.js';
import { ensureSchema } from './db/schema.js';
import { seedIfEmpty } from './seed.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/routes',      routesRouter);
app.use('/api/leaderboard', boardRouter);
app.use('/api/profile',     profileRouter);

app.get('/', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

ensureSchema()
  .then(() => seedIfEmpty())
  .then(() => {
    app.listen(3000, () => console.log('Server running on http://localhost:3000'));
  })
  .catch(err => {
    console.error('Startup failed:', err);
    process.exit(1);
  });
