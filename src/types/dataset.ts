export type ColumnDataType = 'numerical' | 'categorical' | 'date' | 'boolean' | 'identifier' | 'unknown';

export interface ColumnProfile {
  name: string;
  dataType: ColumnDataType;
  inferredType: string; // e.g. 'integer', 'float', 'currency', 'datetime', 'category', 'id', 'email'
  totalCount: number;
  nullCount: number;
  nullPercentage: number;
  uniqueCount: number;
  sampleValues: any[];
  isIdentifier: boolean;
  isConstant: boolean;
  // Numerical stats if applicable
  stats?: NumericalStats;
  // Categorical stats if applicable
  topCategories?: { value: string; count: number; percentage: number }[];
  // Date stats if applicable
  dateStats?: DateStats;
}

export interface NumericalStats {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  variance: number;
  q1: number;
  q3: number;
  iqr: number;
  skewness: number;
  outlierCount: number;
  outlierIndices?: number[];
}

export interface DateStats {
  minDate: string;
  maxDate: string;
  spanDays: number;
  yearDistribution: { year: string; count: number }[];
  monthDistribution: { month: string; count: number }[];
  dayOfWeekDistribution: { day: string; count: number }[];
}

export interface DatasetProfile {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  totalRows: number;
  totalColumns: number;
  duplicateRows: number;
  duplicatePercentage: number;
  totalMissingValues: number;
  missingPercentage: number;
  columns: ColumnProfile[];
  columnTypeCounts: {
    numerical: number;
    categorical: number;
    date: number;
    boolean: number;
    identifier: number;
  };
  domainType: 'sales' | 'hr' | 'finance' | 'saas' | 'healthcare' | 'marketing' | 'general';
  qualityScore: number; // 0 to 100
}

export interface CleaningSuggestion {
  id: string;
  type: 'missing_values' | 'duplicates' | 'outliers' | 'constant_columns' | 'date_standardization' | 'negative_values';
  column?: string;
  title: string;
  description: string;
  affectedCount: number;
  severity: 'low' | 'medium' | 'high';
  recommendedAction: string;
  actionParams?: Record<string, any>;
  applied: boolean;
}

export interface CleaningPipelineConfig {
  imputeMissingNumerical: 'mean' | 'median' | 'zero' | 'drop' | 'none';
  imputeMissingCategorical: 'mode' | 'unknown' | 'drop' | 'none';
  removeDuplicates: boolean;
  handleOutliers: 'cap' | 'remove' | 'none';
  standardizeDates: boolean;
  dropConstantColumns: boolean;
  fixNegativeValues: boolean;
}

export interface KPIItem {
  id: string;
  label: string;
  value: string | number;
  rawValue: number;
  prefix?: string;
  suffix?: string;
  changePercent?: number;
  changeLabel?: string;
  isPositiveChangeGood?: boolean;
  category: string;
  description?: string;
}

export interface ChartConfig {
  id: string;
  title: string;
  description?: string;
  chartType: 'line' | 'bar' | 'area' | 'scatter' | 'pie' | 'donut' | 'composed' | 'heatmap';
  xAxisKey: string;
  yAxisKeys: string[];
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  groupByKey?: string;
  data: any[];
  colors?: string[];
  recommendationReason?: string;
}

export interface CorrelationPair {
  col1: string;
  col2: string;
  correlation: number;
  strength: 'strong_positive' | 'moderate_positive' | 'weak' | 'moderate_negative' | 'strong_negative';
}

export interface AutomatedInsight {
  id: string;
  category: 'performance' | 'growth' | 'anomaly' | 'correlation' | 'breakdown' | 'recommendation';
  title: string;
  text: string;
  importance: 'high' | 'medium' | 'info';
  metric?: string;
  relatedColumns?: string[];
}

export interface FilterState {
  [columnName: string]: string[];
}

export interface DatasetState {
  id: string;
  name: string;
  uploadedAt: string;
  rawRows: Record<string, any>[];
  cleanedRows: Record<string, any>[];
  headers: string[];
  profile: DatasetProfile;
  cleaningSuggestions: CleaningSuggestion[];
  appliedCleaning: CleaningPipelineConfig;
  kpis: KPIItem[];
  charts: ChartConfig[];
  correlations: CorrelationPair[];
  insights: AutomatedInsight[];
  report?: AnalyticalReport;
}

export interface AnalyticalReport {
  executiveSummary: string;
  datasetOverview: string;
  dataQualityAudit: string;
  statisticalFindings: string;
  trendAnalysis: string;
  categoryPerformance: string;
  correlationInsights: string;
  keyInsights: string[];
  recommendations: string[];
  conclusion: string;
  generatedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestions?: string[];
}
