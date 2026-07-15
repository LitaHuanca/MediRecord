import http from 'k6/http';
import { check, sleep } from 'k6';

// TC-PERF-001: 20 usuarios concurrentes durante un minuto
const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:8000';
const TOKEN = __ENV.TOKEN || '4a100000-0000-0000-0000-000000000001';

export const options = {
  vus: 20,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<12000'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/emergency/${TOKEN}`);

  check(res, {
    'respuesta correcta': (r) => r.status === 200,
    'respuesta menor a 12 segundos': (r) => r.timings.duration < 12000,
  });

  sleep(1);
}
