# Gráfico de ingresos y egresos

## Alcance y wording

El gráfico muestra dos series mensuales, `income` y `outcome`, bajo el título
`Income vs. Outcome` y el subtítulo `Monthly revenue and expenditure evolution`.
El repositorio no contiene un documento de producto separado; se conserva aquí
el wording observable de la interfaz.

## Contratos disponibles

El frontend usa actualmente el mismo `GET /api/metrics` que las tarjetas KPI y
no pasa parámetros. La respuesta es un array de movimientos con los campos
`create_date` (fecha ISO), `amount` (número), `operation_type` (`income` o
`outcome`), `category` y `business_type`. Los filtros opcionales son:

| Parámetro | Tipo y valores | Efecto |
| --- | --- | --- |
| `start_date`, `end_date` | fecha ISO | Límites inclusivos de fecha |
| `category` | `suppliers`, `sales`, `operational`, `administrative`, `others` | Filtro de categoría |
| `operation_type` | `income`, `outcome` | Filtro de operación |

Swagger también publica `GET /api/metrics/summary`, que no consume actualmente
la interfaz. Acepta `group_by` (`day`, `week` o `month`; por defecto `month`),
`start_date`, `end_date`, `category`, `operation_type` y `business_type`
(`B2B` o `B2C`); salvo `group_by`, son opcionales. Su respuesta es un array de:

| Campo | Tipo | Significado |
| --- | --- | --- |
| `period` | string | Clave de periodo; para mes tiene forma `YYYY-MM` |
| `income` | número | Suma de ingresos del periodo |
| `outcome` | número | Suma de egresos del periodo |
| `net` | número | `income - outcome` |

## Comportamiento actual

`App.tsx` obtiene los movimientos una vez. `computeMonthlyData` agrupa en el
cliente por mes calendario y suma importes según `operation_type`; el gráfico
recibe los puntos resultantes y presenta las dos series como moneda USD.
Aunque `/api/metrics/summary?group_by=month` devuelve agregados adecuados para
estas dos series, no forma parte del flujo de fetch actual. Si se considera en
un cambio futuro, el campo `period` debe convertirse al rótulo legible que usa
el eje horizontal.

## Alineación de términos

La API denomina al egreso `outcome`; “expenditure” y “gastos” describen esa serie
en lenguaje de producto. `net` del endpoint de resumen equivale al beneficio
mostrado por la UI (`income - outcome`), pero el gráfico de este archivo no
presenta `net`. Las series se definen por `operation_type`, no por nombres de
campo `revenue` o `expenditure`.

## Referencias

- Consumo y agregación: [App.tsx](../src/App.tsx), [financial-utils.ts](../src/lib/financial-utils.ts)
- Presentación: [income-outcome-chart.tsx](../src/components/dashboard/income-outcome-chart.tsx)
- Contratos: `backend/app/routes.py`, rutas `GET /api/metrics` y `GET /api/metrics/summary`