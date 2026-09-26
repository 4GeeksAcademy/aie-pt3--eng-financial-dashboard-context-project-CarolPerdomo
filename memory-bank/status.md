# Current Status

## Funciona y esta verificado

- `docker compose up --build -d` construye y arranca los servicios definidos en
  `docker-compose.yml`.
- El backend responde en `/health`, `/docs` y `/api/metrics` cuando los
  contenedores estan activos.
- La suite backend paso con `15 passed` el 2026-09-26.
- La suite frontend paso con 1 archivo y `5 passed` el 2026-09-26.
- El frontend tiene manejo de carga y error para la llamada inicial a
  `/api/metrics` en `frontend/src/App.tsx`.

## Gaps observables

- Los datos se generan en memoria por `generate_mock_movements(seed=42)`; no
  existe una capa de persistencia en los archivos del repositorio.
- `backend/app/main.py` permite todos los origenes, metodos, headers y
  credenciales mediante CORS; esto no es una politica de produccion restringida.
- `backend/Dockerfile` activa `debugpy` y `--reload`; el repositorio no ofrece
  un perfil de produccion separado.
- `docker-compose.yml` usa `depends_on` pero no declara `healthcheck`; el
  frontend hace una unica peticion inicial.
- El periodo mostrado como `2024 - Full Year` no esta conectado al periodo
  relativo que genera el backend.
- Los importes y calculos principales usan `float` con redondeo a dos decimales.

## Prioridades derivadas de los gaps

Estas son prioridades tecnicas deducidas de los archivos anteriores, no un
roadmap de producto comprometido:

1. Alinear la etiqueta de periodo del frontend con una fuente de fecha explicita
   del backend.
2. Decidir una estrategia de readiness con `healthcheck` y/o reintentos para el
   arranque Compose.
3. Separar configuracion de desarrollo y produccion, especialmente CORS,
   `debugpy` y `--reload`.
4. Definir la precision monetaria antes de incorporar calculos financieros
   adicionales.

No hay evidencia suficiente para afirmar que el proyecto tenga autenticacion,
persistencia, despliegue productivo, usuarios finales definidos o fechas de
entrega.