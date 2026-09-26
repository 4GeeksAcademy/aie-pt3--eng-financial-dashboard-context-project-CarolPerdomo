import type { OperationType } from "../src/lib/financial-types";

export interface DateRangeFilter {
  /** Inclusive lower date bound; pass an ISO date in YYYY-MM-DD format. */
  start_date?: string;

  /** Inclusive upper date bound; pass an ISO date in YYYY-MM-DD format. */
  end_date?: string;
}

export interface AlertsParams extends DateRangeFilter {
  /**
   * Minimum relative increase in outcomes that triggers an alert; valid values
   * are numbers greater than or equal to 0. The API default is 0.3 (30%).
   */
  threshold?: number;
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
}
