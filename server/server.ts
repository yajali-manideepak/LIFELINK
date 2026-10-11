import http from 'node:http';
import { parse as parseUrl } from 'node:url';
import { store, nowIso } from './store';
import type { BloodComponent, BloodGroup, UrgencyLevel, ResponseStatus } from '../src/types/lifelink';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

function sendJson(res: http.ServerResponse, status: number, data: unknown) {
  const json = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(json);
}

function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  const { pathname, query } = parseUrl(req.url || '/', true);

  try {
    // GET /api/health
    if (req.method === 'GET' && pathname === '/api/health') {
      return sendJson(res, 200, {
        status: 'UP',
        service: 'LifeLink Core Coordination Service',
        timestamp: nowIso(),
        environment: 'demo-mode',
        stats: {
          organizations: store.organizations.size,
          inventoryBatches: store.inventoryBatches.size,
          requests: store.bloodRequests.size,
          activeReservations: Array.from(store.inventoryReservations.values()).filter(r => r.status === 'ACTIVE').length,
        },
      });
    }

    // GET /api/organizations
    if (req.method === 'GET' && pathname === '/api/organizations') {
      const orgs = Array.from(store.organizations.values()).map(o => ({
        id: o.id,
        name: o.name,
        type: o.type,
        status: o.status,
        state: o.state,
        district: o.district,
        city: o.city,
        phone: o.phone,
        email: o.email,
        licenseNumber: o.licenseNumber,
        verifiedAt: o.verifiedAt,
      }));
      return sendJson(res, 200, { organizations: orgs });
    }

    // GET /api/inventory
    if (req.method === 'GET' && pathname === '/api/inventory') {
      const district = query.district as string | undefined;
      const component = query.component as BloodComponent | undefined;
      const bloodGroup = query.bloodGroup as BloodGroup | undefined;

      const batches = Array.from(store.inventoryBatches.values())
        .filter(b => {
          if (component && b.bloodComponent !== component) return false;
          if (bloodGroup && b.bloodGroup !== bloodGroup) return false;
          const org = store.organizations.get(b.bloodBankId);
          if (!org || org.status !== 'VERIFIED') return false;
          if (district && org.district !== district) return false;
          return true;
        })
        .map(b => {
          const org = store.organizations.get(b.bloodBankId);
          return {
            ...b,
            bloodBankName: org?.name,
            district: org?.district,
            city: org?.city,
            availableUnitsNet: Math.max(0, b.availableUnits - b.reservedUnits),
          };
        });

      return sendJson(res, 200, { inventory: batches });
    }

    // GET /api/requests
    if (req.method === 'GET' && pathname === '/api/requests') {
      const requests = Array.from(store.bloodRequests.values()).map(r => {
        const hosp = store.organizations.get(r.hospitalId);
        return {
          id: r.id,
          referenceNumber: r.referenceNumber,
          hospitalName: hosp?.name,
          hospitalDistrict: hosp?.district,
          bloodComponent: r.bloodComponent,
          bloodGroup: r.bloodGroup,
          quantityUnits: r.quantityUnits,
          urgency: r.urgency,
          status: r.status,
          requiredBy: r.requiredBy,
          trackingCode: r.trackingCode,
          createdAt: r.createdAt,
        };
      });
      return sendJson(res, 200, { requests });
    }

    // GET /api/track/:code
    if (req.method === 'GET' && pathname?.startsWith('/api/track/')) {
      const code = pathname.replace('/api/track/', '').trim();
      const reqFound = store.searchRequests(code);
      if (!reqFound) {
        return sendJson(res, 404, { error: 'Request not found with this tracking code.' });
      }

      const hosp = store.organizations.get(reqFound.hospitalId);
      const responses = store.getResponsesForRequest(reqFound.id);
      const history = store.requestStatusHistory.filter(h => h.requestId === reqFound.id);

      // Return sanitized public tracking information (no patient PII)
      return sendJson(res, 200, {
        referenceNumber: reqFound.referenceNumber,
        hospitalName: hosp?.name,
        hospitalDistrict: hosp?.district,
        bloodComponent: reqFound.bloodComponent,
        bloodGroup: reqFound.bloodGroup,
        quantityUnits: reqFound.quantityUnits,
        urgency: reqFound.urgency,
        status: reqFound.status,
        requiredBy: reqFound.requiredBy,
        createdAt: reqFound.createdAt,
        responsesCount: responses.length,
        statusTimeline: history.map(h => ({
          status: h.newStatus,
          timestamp: h.changedAt,
          notes: h.reason,
        })),
      });
    }

    // POST /api/requests
    if (req.method === 'POST' && pathname === '/api/requests') {
      const body = await parseBody(req);
      const { hospitalId, requestedBy, department, clinicianContact, bloodComponent, bloodGroup, quantityUnits, urgency, requiredBy, collectionLocation, additionalRequirements } = body;

      if (!hospitalId || !bloodComponent || !quantityUnits || !requiredBy) {
        return sendJson(res, 400, { error: 'Missing mandatory request fields.' });
      }

      const ref = `LL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const reqId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const newReq = {
        id: reqId,
        referenceNumber: ref,
        hospitalId,
        requestedBy: requestedBy || 'clinician',
        department: department || 'Emergency Trauma Care',
        clinicianContact: clinicianContact || 'Emergency Duty Medical Officer',
        bloodComponent: bloodComponent as BloodComponent,
        bloodGroup: bloodGroup as BloodGroup | undefined,
        quantityUnits: parseInt(quantityUnits),
        urgency: urgency as UrgencyLevel || 'URGENT',
        status: 'AWAITING_RESPONSES' as const,
        requiredBy,
        collectionLocation: collectionLocation || 'Hospital Blood Storage Unit',
        additionalRequirements,
        trackingCode: code,
        isDemo: true,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };

      store.bloodRequests.set(reqId, newReq);
      store.audit(requestedBy || 'clinician', 'REQUEST_CREATED', 'blood_request', reqId, { referenceNumber: ref, units: quantityUnits });

      return sendJson(res, 201, { ok: true, request: newReq });
    }

    // POST /api/reservations
    if (req.method === 'POST' && pathname === '/api/reservations') {
      const body = await parseBody(req);
      const { requestId, bloodBankId, inventoryBatchId, units, reservedBy } = body;

      if (!requestId || !bloodBankId || !inventoryBatchId || !units) {
        return sendJson(res, 400, { error: 'Missing reservation parameters.' });
      }

      const result = store.reserveUnits({
        requestId,
        bloodBankId,
        inventoryBatchId,
        units: parseInt(units),
        reservedBy: reservedBy || 'bb_staff',
      });

      if (!result.ok) {
        return sendJson(res, 400, { error: result.error });
      }

      return sendJson(res, 200, { ok: true, reservationId: result.reservationId });
    }

    // 404 Not Found
    return sendJson(res, 404, { error: 'Endpoint not found.' });
  } catch (err: any) {
    console.error('API Error:', err);
    return sendJson(res, 500, { error: 'Internal Server Error', message: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`LifeLink API Server running at http://localhost:${PORT}`);
  console.log(`- Health Check: http://localhost:${PORT}/api/health`);
  console.log(`- Organizations: http://localhost:${PORT}/api/organizations`);
  console.log(`- Inventory: http://localhost:${PORT}/api/inventory`);
});
