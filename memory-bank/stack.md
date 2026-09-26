# Technology Stack

## Aplicacion

- **Frontend:** React `^19.2.4`, React DOM `^19.2.4` y TypeScript `~6.0.2`.
  Evidencia: `frontend/package.json`.
- **Frontend build/dev:** Vite `^8.0.4`, `@vitejs/plugin-react` y
  `@tailwindcss/vite`. Evidencia: `frontend/package.json` y
  `frontend/vite.config.ts`.
- **Visualizacion e iconos:** Recharts `^3.8.1` y Lucide React `^1.8.0`.
  Evidencia: `frontend/package.json`.
- **Backend:** Python `3.13-slim`, FastAPI, Uvicorn y Pydantic transitivo.
  Evidencia: `backend/Dockerfile` y `backend/requirements.txt`.
- **Depuracion:** `debugpy`, escuchando en el puerto `5678` segun
  `backend/Dockerfile` y `docker-compose.yml`.

## Calidad y tooling

- **Frontend tests:** Vitest y `@vitest/coverage-v8`, con scripts `test`,
  `test:watch` y `test:coverage` en `frontend/package.json`.
- **Frontend lint:** ESLint 9, `typescript-eslint`, hooks de React y React
  Refresh. Evidencia: `frontend/eslint.config.js`.
- **Backend tests:** pytest, pytest-cov y httpx en `backend/requirements.txt`;
  `backend/tests/test_routes.py` usa FastAPI `TestClient`.
- **TypeScript:** alias `@/*` hacia `src/*`, `noUnusedLocals` y
  `noUnusedParameters` en `frontend/tsconfig.app.json`.

## Infraestructura local

- Docker Compose define los servicios `frontend` y `backend`.
- El frontend publica `5173`; el backend publica `8000` y `5678`.
- El proxy Vite dirige `/api` a `http://backend:8000` dentro de la red Compose.
- Los dos servicios montan sus directorios fuente para desarrollo local.
  Evidencia: `docker-compose.yml`.

## Configuracion

`frontend/.env.example` documenta `VITE_API_BASE_URL`. `.gitignore` excluye
`.env` y permite `.env.example`; no deben guardarse secretos en el repositorio.