# Tarjetas KPI

## Alcance y wording

La fila presenta `Total Income`, `Total Outcome`, `Profit` y `Profit Margin`.
El repositorio no contiene un documento de producto separado; estos nombres y
descripciones corresponden al copy visible en la interfaz.

## Contrato de datos

La carga actual usa `GET /api/metrics` sin parámetros de query. Swagger está en
`http://localhost:8000/docs`; el esquema OpenAPI define una respuesta como un
array de movimientos:

| Campo | Tipo | Significado |
| --- | --- | --- |
| `create_date` | fecha ISO (`YYYY-MM-DD`) | Fecha del movimiento |
| `amount` | número | Importe del movimiento |
| `operation_type` | `income` \| `outcome` | Tipo de operación |
| `category` | `suppliers` \| `sales` \| `operational` \| `administrative` \| `others` | Categoría |
| `business_type` | `B2B` \| `B2C` | Tipo de negocio |

Parámetros opcionales de `GET /api/metrics`:

| Parámetro | Tipo y valores | Efecto |
| --- | --- | --- |
| `start_date` | fecha ISO | Incluye movimientos desde esta fecha |
| `end_date` | fecha ISO | Incluye movimientos hasta esta fecha |
| `category` | `suppliers`, `sales`, `operational`, `administrative`, `others` | Filtra por categoría |
| `operation_type` | `income`, `outcome` | Filtra por tipo de operación |

Todos son opcionales, sin valor por defecto explícito; si se omiten, no se
aplica ese filtro. El fetch actual no envía ninguno.

## Cálculos y presentación

El frontend deriva las cuatro cantidades a partir de los movimientos:

- `Total Income`: suma de `amount` donde `operation_type` es `income`.
- `Total Outcome`: suma de `amount` donde `operation_type` es `outcome`.
- `Profit`: `Total Income - Total Outcome`.
- `Profit Margin`: `Profit / Total Income * 100`; si el ingreso total es cero,
  muestra `0%`.

Los importes se presentan como USD sin decimales y el porcentaje con un decimal.
Ninguna de estas cuatro métricas es un campo del objeto `FinancialMovement`.

## Alineación de términos

`outcome` es el valor literal de API; “expenditure” es wording de presentación,
no un campo ni un valor alternativo. `profit` no se devuelve por separado: es
el neto calculado como ingresos menos egresos. `Profit Margin` es un porcentaje
derivado, no una propiedad `profit_margin` de la API. Mantener estas distinciones
en documentación y tipos de presentación; no renombrar el contrato del backend.

La etiqueta de periodo `2024 - Full Year` del encabezado no se envía a la API y
no limita los movimientos devueltos. No debe interpretarse como periodo del
contrato.

## Referencias

- Consumo: [App.tsx](../src/App.tsx), [financial-utils.ts](../src/lib/financial-utils.ts)
- Presentación: [kpi-row.tsx](../src/components/dashboard/kpi-row.tsx)
- Contrato: `backend/app/routes.py`, ruta `GET /api/metrics`