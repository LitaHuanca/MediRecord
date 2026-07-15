/**
 * TC-PERF-001 — Carga concurrente sobre el endpoint de emergencia
 * Herramienta : k6
 * Escenario   : 20 VUs durante 1 minuto contra GET /emergency/{uuid}
 *
 * Uso:
 *   STAGING_API_URL=https://staging.medirecord.example.com \
 *   TEST_EMERGENCY_UUID=<uuid-de-prueba> \
 *   k6 run tests/performance/emergency-load.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.STAGING_API_URL || 'http://localhost:8000';
const EMERGENCY_UUID = __ENV.TEST_EMERGENCY_UUID || 'TEST-UUID-PLACEHOLDER';

export const options = {
  vus: 20,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95 % de requests < 2 s
    http_req_failed: ['rate<0.01'],     // tasa de error < 1 %
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/emergency/${EMERGENCY_UUID}`);

  check(res, {
    'status es 200': (r) => r.status === 200,
    'respuesta < 2s': (r) => r.timings.duration < 2000,
  });

  sleep(1);
}
