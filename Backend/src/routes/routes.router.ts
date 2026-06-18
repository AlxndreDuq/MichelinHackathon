import { Router } from 'express';
import multer from 'multer';
import { pool } from '../db/client.js';
import type { Route, LeaderboardEntry, Review } from '../types/index.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const SELECT_ROUTE = `
  SELECT id, name, creator, tier, dist, deniv, time, stars,
         review_count AS "reviewCount", plays, hot, bike, note, dept, gpx_coordinates
  FROM routes
`;

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query<Route>(SELECT_ROUTE + 'ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/reviews', async (_req, res) => {
  try {
    const { rows } = await pool.query<Review>(
      'SELECT name, initials, stars, comment FROM reviews ORDER BY id',
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/:id/leaderboard', async (req, res) => {
  const id = req.params['id'];
  if (!id) { res.status(400).json({ error: 'Missing id' }); return; }
  try {
    const { rows } = await pool.query<LeaderboardEntry>(
      'SELECT rank, name, initials, time, you FROM route_leaderboard WHERE route_id = $1 ORDER BY rank',
      [id],
    );
    if (rows.length === 0) { res.status(404).json({ error: 'Route not found' }); return; }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/:id', async (req, res) => {
  const id = req.params['id'];
  if (!id) { res.status(400).json({ error: 'Missing id' }); return; }
  try {
    const { rows } = await pool.query<Route>(SELECT_ROUTE + 'WHERE id = $1', [id]);
    const route = rows[0];
    if (!route) { res.status(404).json({ error: 'Route not found' }); return; }
    res.json(route);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * Parse GPX file and extract route data
 */
function parseGpx(gpxContent: string): { coordinates: Array<{ lat: number; lon: number }>; stats: { distance: number; elevation: number } } {
  const coordinates: Array<{ lat: number; lon: number }> = [];
  let totalDistance = 0;
  let totalElevation = 0;

  // Extract trackpoint coordinates
  const trkptRegex = /<trkpt lat="([\d.\-]+)" lon="([\d.\-]+)">[\s\S]*?(?:<ele>([\d.\-]+)<\/ele>)?[\s\S]*?<\/trkpt>/g;
  let match;

  let prevLat: number | null = null;
  let prevLon: number | null = null;
  let prevEle: number | null = null;

  while ((match = trkptRegex.exec(gpxContent)) !== null) {
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    const ele = match[3] ? parseFloat(match[3]) : null;

    coordinates.push({ lat, lon });

    // Calculate distance using Haversine formula
    if (prevLat !== null && prevLon !== null) {
      const R = 6371; // Earth's radius in km
      const dLat = (lat - prevLat) * (Math.PI / 180);
      const dLon = (lon - prevLon) * (Math.PI / 180);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(prevLat * (Math.PI / 180)) * Math.cos(lat * (Math.PI / 180)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += R * c;
    }

    // Calculate elevation gain
    if (ele !== null && prevEle !== null && ele > prevEle) {
      totalElevation += ele - prevEle;
    }

    prevLat = lat;
    prevLon = lon;
    prevEle = ele;
  }

  return {
    coordinates,
    stats: {
      distance: Math.round(totalDistance * 10) / 10, // Round to 1 decimal
      elevation: Math.round(totalElevation)
    }
  };
}

/**
 * Upload and parse GPX file
 */
router.post('/upload-gpx', upload.single('gpx'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    if (!req.file.mimetype.includes('xml') && !req.file.originalname.endsWith('.gpx')) {
      res.status(400).json({ error: 'Invalid file type. Please upload a GPX file.' });
      return;
    }

    const gpxContent = req.file.buffer.toString('utf-8');
    const gpxData = parseGpx(gpxContent);

    if (gpxData.coordinates.length === 0) {
      res.status(400).json({ error: 'No trackpoints found in GPX file' });
      return;
    }

    // Return parsed GPX data
    res.json({
      success: true,
      data: gpxData
    });
  } catch (err) {
    console.error('GPX parsing error:', err);
    res.status(500).json({ error: 'Failed to parse GPX file' });
  }
});

/**
 * Create and publish a new route
 */
router.post('/create', async (req, res) => {
  try {
    const { name, creator, tier, bike, dept, note, gpxCoordinates, distance, elevation } = req.body;

    // Validate required fields
    if (!name || !creator || !tier || !bike || !gpxCoordinates || gpxCoordinates.length === 0) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Generate unique ID (format: route_<timestamp>_<random>)
    const id = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Fixed values for now (time is hardcoded in seed, stars = 3 for new routes)
    const time = '00:00';
    const stars = 3;

    // Insert into database
    await pool.query(
      `INSERT INTO routes (id, name, creator, tier, dist, deniv, time, stars, bike, note, dept, gpx_coordinates)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id,
        name,
        creator,
        tier,
        Math.round(distance), // Convert to integer
        Math.round(elevation), // Convert to integer
        time,
        stars,
        bike,
        note,
        dept,
        JSON.stringify(gpxCoordinates) // Store as JSON
      ]
    );

    res.json({
      success: true,
      routeId: id,
      message: 'Route published successfully'
    });
  } catch (err) {
    console.error('Error creating route:', err);
    res.status(500).json({ error: 'Failed to create route' });
  }
});

export default router;
