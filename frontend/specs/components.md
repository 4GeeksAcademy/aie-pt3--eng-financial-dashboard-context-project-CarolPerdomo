# Especificación de componentes

## Alcance y fuente

No se encontró un brief de PM separado en el repositorio. Este documento fija
las decisiones de producto para las siguientes implementaciones a partir del
copy visible, los contratos API y los tipos de query de Fase 2. Distingue el
comportamiento actual de los contratos objetivo; no describe funcionalidades
como si ya estuvieran implementadas.

Los tipos de query canónicos son [param-types.ts](./param-types.ts):
`DateRangeFilter`, `AlertsParams` y `TopCategoriesParams`. Los componentes de
visualización reciben datos de presentación, no construyen query strings.
Un componente padre controla los filtros y los combina con los parámetros
específicos de cada endpoint.

## Rango de fechas compartido

### `DateRangeControl` (propuesto)

Controla un rango opcional para toda la vista financiera.

| Prop | Tipo | Contrato |
| --- | --- | --- |
| `value` | `DateRangeFilter` | Rango seleccionado; cada extremo puede omitirse. |
| `onChange` | `(next: DateRangeFilter) => void` | Emite el nuevo rango; limpiar equivale a `{}`. |
| `disabled` | `boolean` | Deshabilita la edición mientras se aplica una consulta; opcional, default `false`. |

Cada fecha usa `YYYY-MM-DD`. Si se informan ambas, `start_date` debe ser menor
o igual que `end_date`; no se envía una consulta con un rango invertido. Los
extremos enviados a la API son inclusivos. El padre conserva un único rango y
lo aplica a KPI, gráficos, alertas y categorías; no hay filtros de fecha
independientes por tarjeta o gráfico.

### `DashboardHeader`

**Actual:** `DashboardHeaderProps` tiene `period?: string`. `App.tsx` pasa el
texto fijo `2024 - Full Year`, que no limita ni describe los datos reales.

**Contrato objetivo:** reemplazar ese texto fijo por `dateRange: DateRangeFilter`
y derivar la etiqueta en la vista. Con ambos extremos se muestran las fechas;
con solo uno, `From YYYY-MM-DD` o `Through YYYY-MM-DD`; con rango vacío,
`All available data`. No inferir un año calendario ni afirmar `Full Year` si el
rango real no lo acredita.

## Indicadores KPI

### `KPIRow` y `KPICard`

**Props actuales de `KPIRow`:**

```ts
interface KPIRowProps {
  metrics: KPIMetrics | null;
  loading?: boolean;
}
```

`metrics` usa `KPIMetrics` de `src/lib/financial-types.ts`:
`totalIncome`, `totalOutcome`, `profit` y `profitPercent`, todos `number`.
`KPICard` sigue siendo un componente de presentación con `label`, `value`,
`helperText`, `icon`, `variant` (`income | outcome | profit | profitPercent`)
y `loading?`; no recibe parámetros API ni maneja el rango.

El padre consulta `GET /api/metrics` con el rango global y calcula los KPI sobre
los movimientos filtrados. `KPIRow` recibe el resultado calculado y `loading`;
el estado de error permanece en el padre y se muestra a nivel de vista.

### Decisiones de términos y cálculo

- Mantener `Total Outcome` como etiqueta de la interfaz. `outcome` es el valor
  de API; `expenditure` es solo wording auxiliar, no otro tipo de operación.
- `Profit` es `totalIncome - totalOutcome`; no es un campo directo de la API.
- El KPI `Profit Margin` se calcula como
  `(totalIncome - totalOutcome) / totalIncome * 100` para el rango completo,
  no como promedio de los márgenes mensuales.
- Si `totalIncome` es cero, el margen mostrado es `0%`. El cero es un resultado
  definido por esta especificación, no una señal de carga o error.

## Gráficos mensuales

### `IncomeOutcomeChart` y `ProfitPercentChart`

**Props actuales:** ambos reciben `data: MonthlyDataPoint[]` y `loading?`.
`MonthlyDataPoint` contiene `month`, `income`, `outcome` y `profitPercent`.
`IncomeOutcomeChart` presenta ingresos y egresos; `ProfitPercentChart` presenta
el margen mensual.

**Contrato objetivo:** conservar esas props de presentación. El padre aplica el
rango global al obtener movimientos con `GET /api/metrics`, y deriva puntos
mensuales en el cliente. Mantener agrupación mensual fija; no añadir selector de
día/semana en esta fase. `GET /api/metrics/summary` existe, pero queda fuera de
este contrato para no cambiar la fuente de datos de los gráficos.

`profitPercent` se calcula por mes como
`income > 0 ? ((income - outcome) / income) * 100 : 0`. El margen mensual puede
ser negativo. Un mes sin ingresos produce `0%`; no es un dato nulo. La vista
vacía se reserva para una lista `data` sin puntos, no para puntos cuyo valor
sea cero. Esto resuelve el caso en el que una serie válida de ceros se confunde
con ausencia de datos.

El eje mensual conserva la etiqueta localizada que genera el frontend, por
ejemplo `Jan 2025`. La forma `YYYY-MM` pertenece a claves de agregación, no al
texto presentado.

## Alertas de egresos

### `AlertsPanel` (propuesto; no existe actualmente)

Consume `GET /api/metrics/alerts`. El modelo de query del componente debe usar
`AlertsParams` y mantener sus nombres API: `start_date`, `end_date` y
`threshold`.

| Prop objetivo | Tipo | Contrato |
| --- | --- | --- |
| `params` | `AlertsParams` | Parámetros efectivos, incluido el rango global y el umbral actual. |
| `items` | `AlertItem[]` | Resultados recibidos del endpoint. |
| `loading` | `boolean` | Estado de carga del panel. |
| `error` | `string \| null` | Error de la consulta, si existe. |
| `onThresholdChange` | `(threshold: number) => void` | Actualiza solo el umbral; el rango lo controla `DateRangeControl`. |

La respuesta tiene campos `period: string`, `outcome_total: number`,
`baseline_average: number` e `increase_ratio: number`. `threshold` es una
proporción relativa (`0.3` equivale a `30%`), admite cualquier número mayor o
igual a cero y por defecto vale `0.3`. La lista se muestra vacía cuando el
endpoint no encuentra alertas; eso no es un error.

El endpoint también acepta `group_by` y `business_type`, pero no están incluidos
en `AlertsParams` de Fase 2: esta interfaz no los presenta ni los envía. Se
mantiene el default API `group_by=month`; añadir controles para esos parámetros
requiere ampliar primero el tipo y esta especificación.

## Categorías principales

### `TopCategoriesPanel` (propuesto; no existe actualmente)

Consume `GET /api/metrics/categories/top` y usa `TopCategoriesParams`.

| Prop objetivo | Tipo | Contrato |
| --- | --- | --- |
| `params` | `TopCategoriesParams` | Parámetros efectivos, incluido el rango global. |
| `items` | `TopCategoryItem[]` | Resultados recibidos del endpoint. |
| `loading` | `boolean` | Estado de carga del panel. |
| `error` | `string \| null` | Error de la consulta, si existe. |
| `onOperationTypeChange` | `(value: OperationType) => void` | Selecciona `income` o `outcome`. |
| `onLimitChange` | `(value: number) => void` | Selecciona un entero de 1 a 20. |

El control `operation_type` admite `income` o `outcome` y por defecto es
`outcome`; `limit` es entero entre 1 y 20 y por defecto es 5. La respuesta
contiene `category`, `operation_type` y `total_amount`. Ordenar por
`total_amount` descendente es responsabilidad del endpoint; la vista respeta el
orden recibido.

El endpoint acepta además `business_type`, pero `TopCategoriesParams` no lo
modela. No ofrecer un filtro B2B/B2C hasta ampliar el tipo. Una respuesta vacía
se presenta como estado sin resultados, separado de error y carga.

## Estados y propiedad del fetch

El padre de la vista posee los parámetros, solicita los datos y deriva `KPIMetrics`
y `MonthlyDataPoint[]`. Los hijos reciben valores y estado, no llaman a la API.
Los componentes de presentación deben distinguir carga, error y resultado
vacío; un valor cero válido no equivale a falta de datos. Actualmente `App.tsx`
gestiona un único `loading` y un error genérico para `/api/metrics`; los estados
por panel indicados arriba son el contrato para las secciones propuestas.

## Referencias

- Tipos de query: [param-types.ts](./param-types.ts)
- Datos y cálculos: [financial-types.ts](../src/lib/financial-types.ts), [financial-utils.ts](../src/lib/financial-utils.ts)
- Composición y fetch actual: [App.tsx](../src/App.tsx)
- Componentes actuales: [dashboard-header.tsx](../src/components/dashboard/dashboard-header.tsx), [kpi-row.tsx](../src/components/dashboard/kpi-row.tsx), [kpi-card.tsx](../src/components/dashboard/kpi-card.tsx), [income-outcome-chart.tsx](../src/components/dashboard/income-outcome-chart.tsx), [profit-percent-chart.tsx](../src/components/dashboard/profit-percent-chart.tsx)
- Requisitos funcionales: [kpi-cards.md](./kpi-cards.md), [income-outcome-chart.md](./income-outcome-chart.md), [profit-margin-chart.md](./profit-margin-chart.md)