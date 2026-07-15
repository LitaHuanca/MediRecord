import { check } from 'k6';

// TC-SEC-001: valida que QR y NFC usen el mismo UUID
const UUID = __ENV.TOKEN || '4a100000-0000-0000-0000-000000000001';
const BASE_URL = __ENV.FRONTEND_URL || 'http://127.0.0.1:5173';
const QR_PAYLOAD = __ENV.QR_PAYLOAD || `${BASE_URL}/emergency/${UUID}`;
const NFC_PAYLOAD = __ENV.NFC_PAYLOAD || `${BASE_URL}/emergency/${UUID}`;

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ['rate==1'],
  },
};

function obtenerUuid(payload) {
  return payload.split('/').filter(Boolean).pop();
}

export default function () {
  const qrUuid = obtenerUuid(QR_PAYLOAD);
  const nfcUuid = obtenerUuid(NFC_PAYLOAD);

  check({ qrUuid, nfcUuid }, {
    'QR contiene el UUID esperado': (d) => d.qrUuid === UUID,
    'NFC contiene el UUID esperado': (d) => d.nfcUuid === UUID,
    'QR y NFC usan el mismo UUID': (d) => d.qrUuid === d.nfcUuid,
  });
}
