#!/bin/bash
# Ejecuta la colección MediRecord con Newman y genera reporte HTML
# Uso:
#   ./run_tests.sh              # apunta a localhost:8000
#   ./run_tests.sh prod         # apunta a producción (editar URL en .postman_environment.prod.json)

set -e

COLLECTION="MediRecord.postman_collection.json"
ENV_LOCAL="MediRecord.postman_environment.json"
ENV_PROD="MediRecord.postman_environment.prod.json"
REPORT_DIR="reports"

mkdir -p "$REPORT_DIR"

if [ "$1" = "prod" ]; then
  ENV_FILE="$ENV_PROD"
  echo "==> Ejecutando contra PRODUCCIÓN"
else
  ENV_FILE="$ENV_LOCAL"
  echo "==> Ejecutando contra LOCALHOST"
fi

# Instala newman y el reporter HTML si no están instalados
if ! command -v newman &> /dev/null; then
  echo "newman no encontrado, instalando..."
  npm install -g newman newman-reporter-htmlextra
fi

newman run "$COLLECTION" \
  --environment "$ENV_FILE" \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export "$REPORT_DIR/resultado_$(date +%Y%m%d_%H%M%S).html" \
  --reporter-htmlextra-title "MediRecord API - Resultados SQA" \
  --reporter-htmlextra-browserTitle "MediRecord Tests" \
  --bail

echo ""
echo "==> Reporte guardado en $REPORT_DIR/"
