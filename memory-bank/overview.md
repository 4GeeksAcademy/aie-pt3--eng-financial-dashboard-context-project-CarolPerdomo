# Product Overview

## Evidencia del producto

- `README.md` y `README.es.md` describen el proyecto como un dashboard de
  metricas financieras con frontend React + TypeScript y backend FastAPI.
- `frontend/src/App.tsx` carga movimientos desde `/api/metrics`, calcula KPIs
  con `computeKPIs` y datos mensuales con `computeMonthlyData`.
- La interfaz compone `DashboardHeader`, `KPIRow`, `IncomeOutcomeChart` y
  `ProfitPercentChart`.
- `backend/app/routes.py` expone movimientos financieros, facets, resumen por
  periodo, categorias principales, comparacion, alertas y vistas B2B/B2C.

## Alcance confirmado

El producto implementado es una vista de metricas financieras basada en datos
mock. El backend devuelve movimientos con fecha, importe, tipo de operacion,
categoria y tipo de negocio. No hay evidencia en el repositorio de persistencia
de datos, autenticacion, usuarios, roles, integraciones externas o un flujo de
edicion de movimientos.

## Limites de interpretacion

- El texto `2024 - Full Year` de `frontend/src/App.tsx` no demuestra que los
  datos pertenezcan al ano 2024: `generate_mock_movements()` usa `date.today()`
  y genera 12 meses relativos.
- Las menciones a estudiantes, contribuyentes y programas formativos en los
  README son contexto del repositorio, no funcionalidades del producto.
- No se registra aqui ningun roadmap o compromiso de producto que no aparezca
  en el codigo o en la documentacion existente.