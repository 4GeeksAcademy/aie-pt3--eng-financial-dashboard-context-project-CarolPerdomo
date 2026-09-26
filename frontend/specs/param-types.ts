import type {
  BusinessType,
  Category,
  OperationType,
} from "../src/lib/financial-types";

export type GroupBy = "day" | "week" | "month";

export interface DateRangeFilter {
  /** Inclusive lower date bound; pass an ISO date in YYYY-MM-DD format. */
  start_date?: string;

  /** Inclusive upper date bound; pass an ISO date in YYYY-MM-DD format. */
  end_date?: string;
}

export interface MetricsParams extends DateRangeFilter {
  /** Category filter; valid values are suppliers, sales, operational, administrative, or others. */
  category?: Category;

  /** Operation filter; valid values are "income" or "outcome". */
  operation_type?: OperationType;
}

export interface AlertsParams extends DateRangeFilter {
  /**
   * Minimum relative increase in outcomes that triggers an alert; valid values
   * are numbers greater than or equal to 0. The API default is 0.3 (30%).
   */
  threshold?: number;

  /** Alert aggregation period; valid values are "day", "week", or "month". The API default is "month". */
  group_by?: GroupBy;

  /** Business segment filter; valid values are "B2B" or "B2C". Omit for both segments. */
  business_type?: BusinessType;
}

export interface TopCategoriesParams extends DateRangeFilter {
  /**
   * Operation to rank; valid values are "income" or "outcome".
   * The API default is "outcome".
   */
  operation_type?: OperationType;

  /**
   * Number of categories to return; valid integers are 1 through 20.
   * The API default is 5.
   */
  limit?: number;

  /** Business segment filter; valid values are "B2B" or "B2C". Omit for both segments. */
  business_type?: BusinessType;
}
