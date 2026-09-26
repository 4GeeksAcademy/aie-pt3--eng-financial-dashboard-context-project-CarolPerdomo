import type {
  Category,
  FinancialMovement,
  OperationType,
} from "../src/lib/financial-types";

export type MetricsResponse = FinancialMovement[];

/** Mirrors the MetricsAlert schema returned by GET /api/metrics/alerts. */
export interface MetricsAlert {
  /** Aggregation key for the alert period. */
  period: string;

  /** Total outcome amount in the period. */
  outcome_total: number;

  /** Average outcome amount across preceding periods. */
  baseline_average: number;

  /** Relative increase over baseline, represented as a ratio (0.3 means 30%). */
  increase_ratio: number;
}

export type MetricsAlertsResponse = MetricsAlert[];

/** Mirrors the TopCategoryItem schema returned by GET /api/metrics/categories/top. */
export interface TopCategoryItem {
  /** API category enum value. */
  category: Category;

  /** API operation enum value. */
  operation_type: OperationType;

  /** Sum of amounts for this category and operation. */
  total_amount: number;
}

export type TopCategoriesResponse = TopCategoryItem[];