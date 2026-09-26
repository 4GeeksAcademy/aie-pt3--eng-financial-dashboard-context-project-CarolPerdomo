# Proposed Project Conventions

Estas reglas son propuestas para futuros contribuidores y agentes. Cada regla se
apoya en un hecho concreto del repositorio; no pretende describir preferencias
genericas ni sustituir una decision de producto.

## Arquitectura

### A-001: Mantener los limites de Compose

Hecho: `docker-compose.yml` define solo `frontend` y `backend`; el frontend
publica `5173`, el backend `8000` y `5678` se usa para `debugpy`.

Regla: los cambios de ejecucion local deben conservar esos servicios y puertos,
o actualizar conjuntamente `docker-compose.yml`, los Dockerfiles y los README.
No tratar `5678` como un endpoint HTTP.

### A-002: Usar el nombre del servicio para llamadas internas

Hecho: `frontend/vite.config.ts` configura el proxy `/api` hacia
`http://backend:8000`.

Regla: el codigo que se ejecuta dentro de Compose debe usar el nombre `backend`
para comunicacion entre contenedores. `localhost:8000` solo representa el
backend desde el host, no desde el contenedor frontend.

## Contratos y naming

### C-001: Preservar los contratos tipados de la API

Hecho: `backend/app/routes.py` define `OperationType`, `Category`,
`BusinessType` y `GroupBy` con `Literal`, y las rutas declaran `response_model`
con modelos Pydantic.

Regla: toda ruta nueva debe declarar sus parametros y su `response_model` con
los tipos existentes o con un modelo Pydantic nuevo. No sustituir estos
contratos por diccionarios sin tipado.

### C-002: Mantener el prefijo y la forma de las rutas de metricas

Hecho: las rutas de dominio usan `/api/metrics`, `/api/metrics/facets`,
`/api/metrics/summary`, `/api/metrics/categories/top`, `/api/metrics/comparison`,
`/api/metrics/alerts`, `/api/metrics/b2b` y `/api/metrics/b2c`.

Regla: las ampliaciones de metricas deben conservar el prefijo `/api/metrics`
y nombres descriptivos coherentes; si se cambia un nombre, actualizar tambien
el consumidor en `frontend/src/App.tsx` y las pruebas.

## Datos y calculos

### D-001: Tratar el periodo generado como relativo, no como 2024 fijo

Hecho: `generate_mock_movements()` usa `date.today()` y
`_year_for_month()` para generar 12 meses relativos; `frontend/src/App.tsx`
muestra el texto fijo `2024 - Full Year`.

Regla: no usar ese texto de la interfaz como fuente del periodo real. Cualquier
filtro, etiqueta o prueba que dependa de fechas debe derivar el periodo del
backend o parametrizar la fecha.

### D-002: Hacer explicita la reproducibilidad de los datos mock

Hecho: las rutas llaman `generate_mock_movements(seed=42)` y la funcion usa el
generador global de `random`.

Regla: los tests que dependan de los datos mock deben fijar el seed o inyectar
una fuente de datos. Si se cambia la generacion aleatoria, actualizar las
expectativas de cantidad, orden y facets; evitar introducir aleatoriedad no
controlada en respuestas de API.

## Testing

### T-001: Probar cada contrato de endpoint junto con su implementacion

Hecho: `backend/tests/test_routes.py` usa `TestClient` y cubre health,
metricas, facets, summary, top categories, comparison, alerts, B2B y B2C.

Regla: toda ruta nueva o cambio de parametros debe incluir una prueba de
respuesta y de su filtro o validacion principal en ese archivo o en un modulo
de tests backend equivalente.

### T-002: Mantener separadas las pruebas de utilidades frontend

Hecho: `frontend/src/lib/financial-utils.test.ts` prueba
`computeKPIs`, `computeMonthlyData`, `formatCurrency` y `formatPercent`, y
`frontend/package.json` ejecuta Vitest mediante `npm test`.

Regla: la logica pura debe probarse en `src/lib`; los cambios de componentes no
deben ocultarse como pruebas de utilidades. Ejecutar `npm test` despues de
cambiar calculos o formatos.

## Documentacion y DX

### X-001: Usar Docker Compose como flujo local canonico

Hecho: `README.es.md` y `README.md` documentan `docker compose up --build`, y
los Dockerfiles arrancan Vite y Uvicorn con bind mounts definidos en Compose.

Regla: cualquier cambio que rompa ese comando debe actualizar la documentacion
en ambos README o restaurar la compatibilidad.

### X-002: Mantener sincronizados los entornos documentados

Hecho: `frontend/.env.example` documenta `VITE_API_BASE_URL`, mientras que
`.gitignore` excluye `.env` pero permite `.env.example`.

Regla: los valores de configuracion de frontend deben anadirse al archivo
`.env.example` sin incluir secretos; las instrucciones deben distinguir el
proxy por defecto de una URL backend externa.

## Runtime y seguridad

### R-001: Tratar debug y recarga como desarrollo local

Hecho: `backend/Dockerfile` arranca `debugpy` en `5678` y Uvicorn con
`--reload`; `backend/app/main.py` permite todos los origenes, metodos y headers.

Regla: no reutilizar esta configuracion como perfil de produccion. Cualquier
despliegue externo debe separar el comando de desarrollo, restringir CORS y
controlar el acceso al puerto de debug.

### R-002: No asumir disponibilidad inmediata del backend

Hecho: Compose usa `depends_on` sin `healthcheck`, y `frontend/src/App.tsx`
hace una unica llamada inicial a `/api/metrics`.

Regla: los cambios que alteren el arranque deben considerar esta ausencia de
readiness: anadir healthchecks/reintentos o mantener una gestion explicita del
estado de error en el frontend.

### R-003: Revisar precision antes de ampliar calculos monetarios

Hecho: `FinancialMovement.amount` y los calculos de
`calculate_net_value()` usan `float` y redondean a dos decimales.

Regla: cualquier nueva operacion financiera debe conservar una politica de
redondeo explicita o migrar deliberadamente a `Decimal`; no mezclar ambos
modelos sin pruebas de regresion.
