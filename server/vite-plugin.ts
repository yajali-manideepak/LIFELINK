import type { Plugin } from 'vite';
import { LifeLinkStore } from './store';
import * as api from './api';

/**
 * LifeLink API as Vite dev-server middleware.
 *
 * The preview runs the Vite dev server, so the API must be available there
 * too. We mount the exact same store + handlers as the standalone server on
 * the /api/health and /api/lifelink routes.
 */
export function lifelinkApiPlugin(): Plugin {
  const store = new LifeLinkStore(new URL('./.data/lifelink-state.json', import.meta.url).pathname);

  const dispatchAction = (action: string, p: Record<string, unknown>): api.ApiResult => {
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
        return api.reserveInventory(store, String(p.inventoryId), String(p.requestId), Number(p.units));
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
        return api.confirmDonorArrival(store, String(p.donorId), String(p.bloodCentreId), String(p.requestId));
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
  };

  return {
    name: 'lifelink-api-middleware',
    configureServer(server) {
      server.middlewares.use('/api', (req, res, next) => {
        void next;
        const url = new URL(req.url ?? '/', 'http://localhost');
        const pathname = url.pathname; // e.g. '/lifelink' after mount

        const json = (status: number, payload: unknown) => {
          const body = JSON.stringify(payload);
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.end(body);
        };

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.end();
          return;
        }

        if (pathname === '/health' && req.method === 'GET') {
          json(200, { ok: true, service: 'lifelink-api (vite middleware)' });
          return;
        }

        if (pathname === '/lifelink' && req.method === 'GET') {
          json(200, store.getState());
          return;
        }

        if (pathname === '/lifelink' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => {
            body += chunk;
            if (body.length > 1_000_000) req.destroy();
          });
          req.on('end', () => {
            try {
              const parsed = body ? JSON.parse(body) : {};
              const action = String(parsed.action ?? '');
              if (!action) {
                json(400, { ok: false, error: 'Missing action.' });
                return;
              }
              const result = dispatchAction(action, parsed);
              json(result.ok ? 200 : 422, result);
            } catch (err) {
              json(500, { ok: false, error: err instanceof Error ? err.message : 'Internal error' });
            }
          });
          return;
        }

        json(404, { ok: false, error: 'Unknown API endpoint.' });
      });
    },
  };
}
