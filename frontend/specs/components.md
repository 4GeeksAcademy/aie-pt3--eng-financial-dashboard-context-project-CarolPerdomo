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

**Comportamiento de los inputs:** con solo `start_date`, se omite `end_date` y
se incluyen todos los movimientos desde ese día; con solo `end_date`, se omite
`start_date` y se incluyen todos los movimientos hasta ese día. Los dos campos
vacíos equivalen a `{}` y a todos los datos disponibles. Al completar el
segundo campo, si el rango queda invertido, se muestra validación en el control
y no se solicita ese rango hasta corregirlo.

**Renderizado condicional:** mostrar el error de validación junto al input
inválido; deshabilitar la aplicación durante una consulta; no sustituir una
fecha vacía por la fecha actual ni serializarla como `null`.

### `DashboardHeader`

**Actual:** `DashboardHeaderProps` tiene `period?: string`. `App.tsx` pasa el
texto fijo `2024 - Full Year`, que no limita ni describe los datos reales.

```ts
interface DashboardHeaderProps {
  period?: string;
}
```

**Contrato objetivo:** reemplazar ese texto fijo por `dateRange: DateRangeFilter`
y derivar la etiqueta en la vista. Con ambos extremos se muestran las fechas;
con solo uno, `From YYYY-MM-DD` o `Through YYYY-MM-DD`; con rango vacío,
`All available data`. No inferir un año calendario ni afirmar `Full Year` si el
rango real no lo acredita.

```ts
interface DashboardHeaderProps {
  dateRange: DateRangeFilter;
}
```

**Renderizado condicional:** el encabezado siempre permanece visible; solo
cambia su etiqueta según haya dos fechas, una fecha o ninguna.

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

```ts
interface KPICardProps {
  label: string;
  value: string;
  helperText: string;
  icon: LucideIcon;
  variant: "income" | "outcome" | "profit" | "profitPercent";
  loading?: boolean;
}
```

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

**Renderizado condicional de `KPIRow`/`KPICard`:** `loading` muestra skeletons;
si la carga terminó correctamente y `metrics` es `null`, cada valor muestra
`—`; con `KPIMetrics`, se muestran los cuatro valores incluso si alguno es
cero. Los errores se muestran en el padre y no se presentan como KPI igual a
cero.

## Gráficos mensuales

### `IncomeOutcomeChart` y `ProfitPercentChart`

**Props actuales:** ambos reciben `data: MonthlyDataPoint[]` y `loading?`.
`MonthlyDataPoint` contiene `month`, `income`, `outcome` y `profitPercent`.
`IncomeOutcomeChart` presenta ingresos y egresos; `ProfitPercentChart` presenta
el margen mensual.

```ts
interface IncomeOutcomeChartProps {
  data: MonthlyDataPoint[];
  loading?: boolean;
}

interface ProfitPercentChartProps {
  data: MonthlyDataPoint[];
  loading?: boolean;
}
```

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

**Renderizado condicional:** ambos gráficos muestran skeletons mientras
`loading` sea verdadero. Tras una respuesta exitosa, una lista sin puntos
muestra `No data available to display`; con puntos, se renderiza el gráfico,
incluidos valores cero. Un error de petición se muestra a nivel de vista y no
se traduce en el estado vacío.

El eje mensual conserva la etiqueta localizada que genera el frontend, por
ejemplo `Jan 2025`. La forma `YYYY-MM` pertenece a claves de agregación, no al
texto presentado.

## Alertas de egresos

### `AnomaliesTable` (propuesto; no existe actualmente)

Consume `GET /api/metrics/alerts`. Sus props objetivo son:

```ts
interface AnomaliesTableProps {
  params: AlertsParams;
  items: MetricsAlert[];
  loading: boolean;
  error: string | null;
  onThresholdChange: (threshold: number) => void;
}
```

`MetricsAlert` y `MetricsAlertsResponse` están definidos en
[response-types.ts](./response-types.ts) y reflejan el esquema OpenAPI
`MetricsAlert` sin renombrar campos. Las cuatro columnas corresponden a
`period`, `outcome_total`, `baseline_average` e `increase_ratio`. El último es
una proporción (`0.3` equivale a `30%`); se multiplica por 100 solo al mostrar
el porcentaje.

`AlertsParams` refleja todos los query params de la ruta: `threshold` (número
`>= 0`, default `0.3`), `group_by` (`day | week | month`, default `month`),
`start_date`/`end_date` (fechas opcionales inclusivas) y `business_type`
(`B2B | B2C`, omitido significa ambos). El padre aplica el rango global;
`onThresholdChange` solo cambia el umbral.

**Renderizado condicional:** `loading` muestra skeletons; `error` muestra el
error, no una tabla vacía. En respuesta exitosa con `items: []`, la tabla
conserva sus encabezados y muestra una fila vacía que ocupa las cuatro columnas
con el texto `No anomalies for the selected filters.`. Con resultados,
renderiza una fila por cada `MetricsAlert`. No inventar atributos de anomalía,
severidad ni descripciones que no existen en la respuesta.

## Categorías principales

### `TopCategoriesPanel` (propuesto; no existe actualmente)

Consume `GET /api/metrics/categories/top` y usa `TopCategoriesParams`.

```ts
interface TopCategoriesPanelProps {
  params: TopCategoriesParams;
  items: TopCategoryItem[];
  loading: boolean;
  error: string | null;
}
```

`TopCategoryItem`/`TopCategoriesResponse` están en
[response-types.ts](./response-types.ts) y reflejan los campos OpenAPI
`category`, `operation_type` y `total_amount`. El endpoint acepta
`operation_type` (`income | outcome`, default `outcome`), `limit` (entero 1–20,
default 5), `start_date`/`end_date` (fechas opcionales inclusivas) y
`business_type` (`B2B | B2C`, opcional). Respeta el orden descendente por
`total_amount` devuelto por el backend.

Se renderizan dos instancias del mismo componente. Ambas solicitan el top 5 de
egresos, con el rango global si existe; el `business_type` queda fijo por
instancia:

| Instancia | Parámetros relevantes | Estado vacío tras respuesta exitosa |
| --- | --- | --- |
| B2B | `business_type: "B2B"`, `operation_type: "outcome"`, `limit: 5` | Mostrar `No top categories for B2B in the selected filters.` |
| B2C | `business_type: "B2C"`, `operation_type: "outcome"`, `limit: 5` | Mostrar `No top categories for B2C in the selected filters.` |

**Renderizado condicional:** `loading` muestra skeletons; `error` muestra el
error del panel; una respuesta exitosa vacía muestra el texto de la fila
correspondiente arriba. Con 1–4 resultados, mostrar solo los recibidos, sin
rellenar filas; con 5, mostrar los cinco. No presentar errores como listas
vacías. El panel no expone controles de `operation_type` ni `limit` en esta
fase; los tipos conservan la flexibilidad del contrato API.

## Estados y propiedad del fetch

El padre de la vista posee los parámetros, solicita los datos y deriva `KPIMetrics`
y `MonthlyDataPoint[]`. Los hijos reciben valores y estado, no llaman a la API.
Los componentes de presentación deben distinguir carga, error y resultado
vacío; un valor cero válido no equivale a falta de datos. Actualmente `App.tsx`
gestiona un único `loading` y un error genérico para `/api/metrics`; los estados
por panel indicados arriba son el contrato para las secciones propuestas.

## Referencias

- Tipos de query: [param-types.ts](./param-types.ts)
- Tipos de respuesta: [response-types.ts](./response-types.ts)
- Datos y cálculos: [financial-types.ts](../src/lib/financial-types.ts), [financial-utils.ts](../src/lib/financial-utils.ts)
- Composición y fetch actual: [App.tsx](../src/App.tsx)
- Componentes actuales: [dashboard-header.tsx](../src/components/dashboard/dashboard-header.tsx), [kpi-row.tsx](../src/components/dashboard/kpi-row.tsx), [kpi-card.tsx](../src/components/dashboard/kpi-card.tsx), [income-outcome-chart.tsx](../src/components/dashboard/income-outcome-chart.tsx), [profit-percent-chart.tsx](../src/components/dashboard/profit-percent-chart.tsx)
- Requisitos funcionales: [kpi-cards.md](./kpi-cards.md), [income-outcome-chart.md](./income-outcome-chart.md), [profit-margin-chart.md](./profit-margin-chart.md)