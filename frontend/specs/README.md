# Contrato de datos del dashboard

Guía de entrada para una sesión nueva del agent que trabaje en la capa
frontend. Define los contratos y el comportamiento esperado; **no implementa**
componentes React, controles ni llamadas HTTP.

Las tres funcionalidades comparten una sola carga de movimientos: `App.tsx`
solicita `GET /api/metrics` una vez y deriva los datos de KPI y de ambos
gráficos en el frontend. No existe un endpoint independiente consumido por
cada visualización.

## Petición compartida

**Ruta verificada en OpenAPI/Swagger:** `GET /api/metrics` (`/docs`). La petición
no lleva body. La implementación actual no envía query params; el contrato de
frontend admite los filtros opcionales siguientes:

| Parámetro | Tipo TypeScript | Valores/formato y restricciones | Default/efecto |
| --- | --- | --- | --- |
| `start_date` | `string` | Fecha de calendario `YYYY-MM-DD`; inclusiva. | Omitida: sin límite inferior. |
| `end_date` | `string` | Fecha de calendario `YYYY-MM-DD`; inclusiva. | Omitida: sin límite superior. |
| `category` | `Category` | `suppliers`, `sales`, `operational`, `administrative`, `others`. | Omitida: todas las categorías. |
| `operation_type` | `OperationType` | `income` o `outcome`. | Omitida: ambos tipos. |

El tipo de petición es `MetricsParams` en [param-types.ts](./param-types.ts).
Los cuatro parámetros son opcionales y no tienen default explícito en esta
ruta. Si un valor opcional no se usa, omítelo: no serialices `null` ni las
cadenas `"undefined"` o `"null"`. Los esquemas OpenAPI presentan fechas y enums
como nullable, pero la consulta debe enviar una fecha válida o un valor válido,
o no enviar ese parámetro.

Si se especifican ambas fechas, la UI debe validar `start_date <= end_date`
antes de enviar la petición. El backend no declara una validación cruzada de
ese rango; un rango invertido puede producir una lista vacía. Fechas inválidas,
categorías fuera del enum y tipos de operación desconocidos no son valores
válidos para FastAPI (respuesta de validación `422`). `business_type` no es un
parámetro de `GET /api/metrics`, aunque cada movimiento sí incluye ese campo en
la respuesta.

**Comportamiento con una sola fecha:** si solo hay `start_date`, omitir
`end_date` y pedir desde esa fecha hasta el final de los datos disponibles; si
solo hay `end_date`, omitir `start_date` y pedir desde el comienzo hasta esa
fecha. Con ambos inputs vacíos, enviar ningún filtro de fecha. Las fechas son
inclusivas; no completar el extremo omitido con la fecha de hoy.

## Respuesta HTTP compartida

La respuesta `200` es directamente un array `FinancialMovement[]`, sin objeto
envolvente ni campos de agregación:

| Campo requerido | Tipo TypeScript | Contrato OpenAPI |
| --- | --- | --- |
| `create_date` | `string` | Fecha `YYYY-MM-DD`. |
| `amount` | `number` | Importe del movimiento. |
| `operation_type` | `OperationType` | `income` o `outcome`. |
| `category` | `Category` | `suppliers`, `sales`, `operational`, `administrative` u `others`. |
| `business_type` | `BusinessType` | `B2B` o `B2C`. |

El tipo compartido está declarado en
[financial-types.ts](../src/lib/financial-types.ts); todos los campos de cada
movimiento son requeridos. El backend genera datos mock para doce meses
relativos a la fecha actual; no prometas que el periodo sea 2024 ni fijes en UI
una cantidad de movimientos o un año que la API no devuelve.

**Trazabilidad verificada el 2026-09-26:** `/docs` publica el `200` de
`GET /api/metrics` como array cuyo item referencia `FinancialMovement`. El
esquema en vivo declara exactamente los cinco campos de la tabla y los enum
indicados; no hay campos `profit`, `profitPercent` ni `month` en ese response.
`MetricsResponse` en [response-types.ts](./response-types.ts) nombra el mismo
array. `KPIMetrics` y `MonthlyDataPoint` son modelos derivados locales, no
interfaces del response OpenAPI.

`KPIMetrics` y `MonthlyDataPoint` también están en `financial-types.ts`, pero
**no son respuestas HTTP**: son modelos derivados por `financial-utils.ts`.
`GET /api/metrics/summary` existe en el backend, pero ninguna de las tres
funcionalidades actuales lo consume; no cambies a ese endpoint dentro de esta
especificación.

## 1. Tarjetas KPI

**Endpoint:** `GET /api/metrics` con `MetricsParams` opcionales descritos arriba.
Las tarjetas y los gráficos comparten la misma petición y el mismo
`FinancialMovement[]`.

**Respuesta HTTP:** `FinancialMovement[]`. La vista deriva un `KPIMetrics`:

| Propiedad derivada | Cálculo |
| --- | --- |
| `totalIncome` | Suma de `amount` para `operation_type === "income"`. |
| `totalOutcome` | Suma de `amount` para `operation_type === "outcome"`. |
| `profit` | `totalIncome - totalOutcome`. |
| `profitPercent` | Si `totalIncome > 0`, `profit / totalIncome * 100`; en otro caso, `0`. |

Los importes se muestran como USD sin decimales; el porcentaje usa un decimal.
`profit` y `profitPercent` no existen en los objetos de respuesta. Mantén
`outcome` como valor de dominio; “expenditure” en el texto auxiliar es un
sinónimo de presentación, no un valor de API.

**Casos límite y UI esperada:**

| Caso | Comportamiento esperado |
| --- | --- |
| La petición responde `200` con `[]`. | No es error ni carga: mostrar los cuatro resultados calculados como `$0`, `$0`, `$0` y `0.0%`. |
| No hay ingresos, pero sí egresos. | Mostrar `profit` negativo y `Profit Margin` como `0.0%`, según el fallback de cálculo; no dividir por cero ni sustituir el valor por error. |
| Ingresos y egresos son iguales. | Mostrar `Profit` igual a `$0` y margen `0.0%`; el cero es un valor válido. |
| La petición falla (red o respuesta no-2xx). | Mostrar el error de la vista; no presentar ceros calculados ni el estado de éxito vacío. Mientras no haya datos, mantener los placeholders `—` de las tarjetas. |

## 2. Gráfico de ingresos y egresos

**Endpoint y petición:** los mismos `GET /api/metrics` y `MetricsParams` de la
sección compartida; no se hace una segunda petición por el gráfico.

**Respuesta HTTP:** `FinancialMovement[]`. La vista deriva
`MonthlyDataPoint[]`: agrupa por mes calendario, suma `amount` por
`operation_type` y produce `month`, `income`, `outcome` y `profitPercent`.
`income` y `outcome` son totales del mes; no son campos de un movimiento.
`month` es una etiqueta de presentación (por ejemplo `Jan 2025`), no el campo
`period` de `/api/metrics/summary`. El gráfico presenta las dos series como
USD sin decimales.

**Casos límite y UI esperada:**

| Caso | Comportamiento esperado |
| --- | --- |
| La petición responde `200` con `[]` o el filtro válido no encuentra movimientos. | Mostrar `No data available to display`; no tratarlo como error HTTP. Los KPI pueden mostrar cero aunque el gráfico no tenga puntos. |
| Solo existe una operación dentro del rango, por ejemplo `operation_type=income`. | Mostrar la serie de ingresos y la serie de egresos en cero; cero en una serie no significa ausencia de datos. |
| El rango seleccionado cubre solo parte de un mes. | Agregar solo movimientos dentro de los límites inclusivos. Etiquetar el punto con el mes y mostrar el rango exacto en el encabezado para no implicar que se incluyó el mes completo. No rellenar meses sin movimientos. |
| La petición falla. | Mostrar el error compartido de la vista; no mostrar el mensaje de “sin datos” como si la respuesta hubiese sido exitosa. |

La granularidad se mantiene mensual en esta especificación; no se expone
selector día/semana. Si `start_date` o `end_date` no está presente, el endpoint
deja abierto ese extremo y el gráfico incluye todos los movimientos disponibles
en ese lado del rango.

## 3. Gráfico de margen de beneficio

**Endpoint y petición:** los mismos `GET /api/metrics` y `MetricsParams` de la
sección compartida. El gráfico comparte fetch y agregación mensual con
`IncomeOutcomeChart`.

**Respuesta HTTP:** `FinancialMovement[]`. La UI recibe los puntos derivados
como `MonthlyDataPoint[]` y usa `profitPercent`; ese campo no viene de la API.
Para cada mes:

```text
profitPercent = income > 0 ? ((income - outcome) / income) * 100 : 0
```

El KPI de margen usa la misma fórmula sobre el total del rango; **no** es el
promedio de los márgenes mensuales. El eje admite valores negativos y el tooltip
muestra un decimal seguido de `%`.

**Casos límite y UI esperada:**

| Caso | Comportamiento esperado |
| --- | --- |
| No hay movimientos y `MonthlyDataPoint[]` está vacío. | Mostrar `No data available to display`. |
| Un mes tiene `income === 0`. | Representar el margen de ese mes como `0.0%`; un punto válido de cero no equivale a ausencia de datos. Mostrar el estado vacío solo si la lista no contiene puntos. |
| Los egresos superan a los ingresos. | Mostrar y graficar el margen negativo; conservar el eje Y de escala automática, sin limitar el porcentaje a `0..100`. |
| La petición falla. | Mostrar el error compartido; no confundir el fallo con lista vacía ni renderizar el empty state de éxito. |

Nota para quien implemente: el código actual decide `hasData` comprobando que
algún `profitPercent` sea distinto de cero; eso puede ocultar una serie válida
compuesta por ceros. El contrato de esta spec es el descrito arriba: usar lista
vacía, no el valor del porcentaje, para determinar ausencia de puntos.

## Comportamiento transversal

- Un único propietario de estado/fetch aplica `MetricsParams` y comparte
  movimientos, carga y error entre las tres funcionalidades. Los componentes
  de visualización no llaman a la API.
- El periodo global se deriva del filtro real: con rango vacío, usar
  `All available data`; no mostrar `2024 - Full Year` como si fuera un filtro
  aplicado.
- `loading`, error y respuesta exitosa vacía son estados distintos. Una
  respuesta vacía `200` puede producir KPI cero y gráficos sin puntos; un error
  nunca debe presentarse como resultado vacío.
- Los parámetros `threshold`/`AlertsParams` y `TopCategoriesParams` no
  pertenecen a endpoints/paneles distintos y no deben añadirse a
  `GET /api/metrics`. Sus contratos para la tabla de anomalías y los paneles
  B2B/B2C están al final de esta guía.

## Contratos auxiliares de Fase 2

Estos endpoints no son necesarios para las tres funcionalidades principales de
KPI y gráficos; se documentan aquí porque la spec de componentes incluye una
tabla de anomalías y dos paneles top-categories. Sus nombres de parámetros y
schemas se verificaron en `/docs` y `/openapi.json` el 2026-09-26.

### Tabla de anomalías: `GET /api/metrics/alerts`

La petición usa `AlertsParams`, que extiende `DateRangeFilter`:

| Parámetro | Tipo | Valores/restricción | Default |
| --- | --- | --- | --- |
| `start_date`, `end_date` | `string` | `YYYY-MM-DD`, límites inclusivos; cada uno opcional. | Omitido: extremo abierto. |
| `threshold` | `number` | Mayor o igual que `0`; es un ratio relativo. | `0.3` (30%). |
| `group_by` | `GroupBy` | `day`, `week`, `month`. | `month`. |
| `business_type` | `BusinessType` | `B2B` o `B2C`. | Omitido: ambos segmentos. |

`200` responde `MetricsAlertsResponse` (`MetricsAlert[]`), cuyos campos
requeridos y exactos son `period: string`, `outcome_total: number`,
`baseline_average: number` e `increase_ratio: number`. No se renombra
`increase_ratio` a “severity” ni a “percentage” en el contrato. La tabla puede
presentarlo multiplicado por 100 con símbolo `%`.

### Paneles top-5: `GET /api/metrics/categories/top`

Ambos paneles usan `TopCategoriesParams`, que extiende `DateRangeFilter`:

| Parámetro | Tipo | Valores/restricción | Default |
| --- | --- | --- | --- |
| `start_date`, `end_date` | `string` | `YYYY-MM-DD`, límites inclusivos; cada uno opcional. | Omitido: extremo abierto. |
| `operation_type` | `OperationType` | `income` o `outcome`. | `outcome`. |
| `limit` | `number` | Entero entre `1` y `20`, ambos incluidos. | `5`. |
| `business_type` | `BusinessType` | `B2B` o `B2C`. | Omitido: ambos segmentos. |

`200` responde `TopCategoriesResponse` (`TopCategoryItem[]`), con campos
requeridos exactos `category: Category`, `operation_type: OperationType` y
`total_amount: number`. El panel B2B envía `business_type=B2B`; el B2C envía
`business_type=B2C`. Para los paneles top-5, ambos fijan
`operation_type=outcome` y `limit=5`; si el array contiene entre uno y cuatro
elementos, renderizan solo los recibidos, sin filas inventadas. Un array vacío
es un estado sin resultados, no un error.

Las interfaces de respuesta API están en
[response-types.ts](./response-types.ts). `FinancialMovement` se reutiliza de
`src/lib/financial-types.ts`; `MetricsAlert` y `TopCategoryItem` reflejan los
schemas homónimos de OpenAPI. Los endpoints B2B/B2C de movimientos no son la
fuente de los paneles top-categories: el filtro del endpoint de categorías es
`business_type`.

## Referencias

- [Tipos de parámetros](./param-types.ts)
- [Tipos de movimiento y vistas](../src/lib/financial-types.ts)
- [Cálculos y formato actuales](../src/lib/financial-utils.ts)
- [Consumo actual](../src/App.tsx)
- [Spec de componentes](./components.md)
- [Spec KPI](./kpi-cards.md), [spec de ingresos/egresos](./income-outcome-chart.md), [spec de margen](./profit-margin-chart.md)