# Gráfico de margen de beneficio

## Alcance y wording

El componente se titula `Profit Margin %` y describe la serie como
`Monthly profit as a percentage of total income`. El repositorio no contiene un
documento de producto separado; este wording procede de la interfaz.

## Contrato de datos

El gráfico no tiene un endpoint propio. Comparte la carga actual de
`GET /api/metrics`, sin query params, con las tarjetas KPI y el gráfico de
ingresos/egresos. El endpoint devuelve movimientos con `create_date` (fecha
ISO), `amount` (número), `operation_type` (`income` o `outcome`), `category` y
`business_type`.

Los filtros opcionales de ese endpoint son `start_date` y `end_date` (fechas
ISO, inclusivas), `category` (`suppliers`, `sales`, `operational`,
`administrative` u `others`) y `operation_type` (`income` u `outcome`). El
frontend actual no envía estos filtros.

`GET /api/metrics/summary` también está disponible, aunque no es consumido por
el gráfico. Admite `group_by` (`day`, `week`, `month`; por defecto `month`),
`start_date`, `end_date`, `category`, `operation_type` y `business_type`
(`B2B` o `B2C`). Devuelve `period`, `income`, `outcome` y `net`; no devuelve un
porcentaje de margen.

## Cálculo y presentación

El frontend agrupa movimientos por mes, calcula `profit = income - outcome` y
deriva:

```text
profitPercent = income > 0 ? (profit / income) * 100 : 0
```

Por tanto, el margen puede ser negativo si los egresos superan los ingresos y
es `0%` cuando el ingreso del periodo es cero. La línea y el tooltip presentan
el porcentaje con un decimal.

## Alineación de términos

`Profit Margin` en la UI corresponde a `profitPercent` en el tipo local
`MonthlyDataPoint`, pero ese campo es calculado por el frontend, no recibido de
la API. En el resumen del backend, `net` es equivalente a `profit` para la
fórmula de la interfaz; no equivale al porcentaje. La especificación usa
“margen de beneficio” para el resultado derivado y reserva `net` para el campo
real de resumen. No se requiere modificar la implementación ni el contrato API.

## Referencias

- Cálculo y carga: [App.tsx](../src/App.tsx), [financial-utils.ts](../src/lib/financial-utils.ts)
- Presentación: [profit-percent-chart.tsx](../src/components/dashboard/profit-percent-chart.tsx)
- Contratos: `backend/app/routes.py`, rutas `GET /api/metrics` y `GET /api/metrics/summary`