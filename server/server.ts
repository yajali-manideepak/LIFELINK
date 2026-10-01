import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LifeLinkStore } from './store';
import * as api from './api';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '.data', 'lifelink-state.json');
const DIST_DIR = path.join(__dirname, '..', 'dist');

const store = new LifeLinkStore(DATA_FILE);
const startedAt = Date.now();

// ---------------------------------------------------------------------------
// Minimal JSON body parsing + CORS (the preview origin differs from the API)
// ---------------------------------------------------------------------------

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1_000_000) reject(new Error('Payload too large'));
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, status: number, payload: unknown) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

// ---------------------------------------------------------------------------
// Static file serving (production: serve the built SPA from dist/)
// ---------------------------------------------------------------------------

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
};

function tryServeStatic(pathname: string, res: http.ServerResponse): boolean {
  if (!fs.existsSync(DIST_DIR)) return false;
  let rel = pathname === '/' ? '/index.html' : pathname;
  const resolved = path.normalize(path.join(DIST_DIR, rel));
  if (!resolved.startsWith(DIST_DIR)) return false;
  if (!fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
    rel = '/index.html'; // SPA fallback
    const fallback = path.join(DIST_DIR, 'index.html');
    if (!fs.existsSync(fallback)) return false;
    res.writeHead(200, { 'Content-Type': MIME['.html'] });
    fs.createReadStream(fallback).pipe(res);
    return true;
  }
  const ext = path.extname(resolved).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
  fs.createReadStream(resolved).pipe(res);
  return true;
}

// ---------------------------------------------------------------------------
// Action dispatch table
// ---------------------------------------------------------------------------

interface ParsedRequest {
  action?: string;
  [key: string]: unknown;
}

function dispatchAction(action: string, p: ParsedRequest): api.ApiResult {
  switch (action) {
    case 'createEmergencyRequest':
      return api.createEmergencyRequest(store, {
        blood_group: p.blood_group as never,
        component_type: p.component_type as never,
        units_required: Number(p.units_required),
        urgency: p.urgency as never,
        hospital_department: String(p.hospital_department ?? ''),
        reason_category: String(p.reason_category ?? ''),
        contact_person: String(p.contact_person ?? ''),
        contact_phone: String(p.contact_phone ?? ''),
        clinical_notes: p.clinical_notes ? String(p.clinical_notes) : undefined,
        required_by: String(p.required_by ?? ''),
      });

    case 'cancelRequest':
      return api.cancelRequest(store, String(p.requestId), String(p.reason ?? ''));

    case 'reserveInventory':
      return api.reserveInventory(
        store,
        String(p.inventoryId),
        String(p.requestId),
        Number(p.units),
      );

    case 'toggleDonorAvailability':
      return api.toggleDonorAvailability(store, String(p.donorId));

    case 'respondToDonorRequest':
      return api.respondToDonorRequest(
        store,
        String(p.notificationId),
        p.response === 'DECLINE' ? 'DECLINE' : 'ACCEPT',
        Number(p.expectedArrivalMins ?? 20),
      );

    case 'confirmDonorArrival':
      return api.confirmDonorArrival(
        store,
        String(p.donorId),
        String(p.bloodCentreId),
        String(p.requestId),
      );

    case 'recordDonorScreening':
      return api.recordDonorScreening(
        store,
        String(p.donorId),
        String(p.bloodCentreId),
        String(p.requestId),
        (p.outcome === 'DEFERRED' ? 'DEFERRED' : p.outcome === 'REJECTED' ? 'REJECTED' : 'PASSED') as never,
        p.vitals ? String(p.vitals) : undefined,
        p.reason ? String(p.reason) : undefined,
      );

    case 'recordDonationCollection':
      return api.recordDonationCollection(
        store,
        String(p.donationEventId),
        Number(p.volumeMl ?? 450),
        (p.donationType as 'WHOLE_BLOOD' | 'APHERESIS_PLATELETS' | 'PLASMA') ?? 'WHOLE_BLOOD',
      );

    case 'recordDonationCollectionByDonor':
      return api.recordDonationCollectionByDonor(
        store,
        String(p.donorId),
        String(p.bloodCentreId),
        String(p.requestId),
        Number(p.volumeMl ?? 450),
        (p.donationType as 'WHOLE_BLOOD' | 'APHERESIS_PLATELETS' | 'PLASMA') ?? 'WHOLE_BLOOD',
      );

    case 'processTestingAndInventory':
      return api.processTestingAndInventory(
        store,
        String(p.donationEventId),
        p.testResult === 'REACTIVE' ? 'REACTIVE' : 'CLEARED',
        p.componentCreated as never,
        Number(p.unitsCreated ?? 1),
        p.donorBloodGroup as never,
      );

    case 'updateInventoryStatus':
      return api.updateInventoryStatus(
        store,
        String(p.inventoryId),
        p.status as never,
        p.notes ? String(p.notes) : undefined,
      );

    case 'fulfilEmergencyUnits':
      return api.fulfilEmergencyUnits(store, String(p.requestId), Number(p.units));

    case 'runSimulationStep':
      return api.runSimulationStep(store, Number(p.step));

    case 'resetToSeed':
      return api.resetToSeed(store);

    default:
      return { ok: false, error: `Unknown action: ${action}` };
  }
}

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // Health probe (used by the preview readiness check and uptime dashboards)
  if (pathname === '/api/health') {
    sendJson(res, 200, {
      ok: true,
      service: 'lifelink-api',
      uptimeSec: Math.round((Date.now() - startedAt) / 1000),
      counts: {
        requests: store.getState().requests.length,
        inventory: store.getState().inventory.length,
        donors: store.getState().donors.length,
      },
    });
    return;
  }

  // Full state snapshot
  if (pathname === '/api/lifelink' && req.method === 'GET') {
    sendJson(res, 200, store.getState());
    return;
  }

  // Action endpoint
  if (pathname === '/api/lifelink' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      let parsed: ParsedRequest = {};
      try {
        parsed = body ? JSON.parse(body) : {};
      } catch {
        sendJson(res, 400, { ok: false, error: 'Invalid JSON body.' });
        return;
      }
      const action = String(parsed.action ?? '');
      if (!action) {
        sendJson(res, 400, { ok: false, error: 'Missing action.' });
        return;
      }
      const result = dispatchAction(action, parsed);
      sendJson(res, result.ok ? 200 : 422, result);
    } catch (err) {
      sendJson(res, 500, { ok: false, error: err instanceof Error ? err.message : 'Internal error' });
    }
    return;
  }

  // API 404
  if (pathname.startsWith('/api/')) {
    sendJson(res, 404, { ok: false, error: 'Unknown API endpoint.' });
    return;
  }

  // Static SPA (production)
  if (tryServeStatic(pathname, res)) return;

  sendJson(res, 404, { ok: false, error: 'Not found.' });
});

const PORT = Number(process.env.PORT || 8787);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[lifelink] API server listening on http://0.0.0.0:${PORT}`);
  console.log(`[lifelink] state file: ${DATA_FILE}`);
});
