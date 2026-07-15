import http from 'k6/http';
import { check } from 'k6';

// TC-SEC-002: supera el limite y espera una respuesta 429
const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:8000';
const TOKEN = __ENV.TOKEN || '4a100000-0000-0000-0000-000000000001';
const TOTAL = Number(__ENV.ITERATIONS || 61);

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ['rate==1'],
  },
};

export default function () {
  let bloqueadas = 0;
  let erroresServidor = 0;

  for (let i = 0; i < TOTAL; i += 1) {
    const res = http.get(`${BASE_URL}/api/emergency/${TOKEN}`);
    if (res.status === 429) bloqueadas += 1;
    if (res.status >= 500) erroresServidor += 1;
  }

  check({ bloqueadas, erroresServidor }, {
    'se aplico rate limiting': (d) => d.bloqueadas > 0,
    'no hubo errores de servidor': (d) => d.erroresServidor === 0,
  });
}
