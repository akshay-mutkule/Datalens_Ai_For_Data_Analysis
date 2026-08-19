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
  generatedSQL?: string;
  generatedCode?: { language: 'python' | 'r' | 'sql'; code: string };
}

// Machine Learning & What-If Types
export interface MLFeatureImportance {
  feature: string;
  importance: number; // 0 to 1
  coefficient: number;
  correlation: number;
}

export interface MLModelResult {
  targetColumn: string;
  modelType: 'linear_regression' | 'logistic_classification';
  rSquared: number;
  rmse: number;
  mae: number;
  accuracy?: number;
  f1Score?: number;
  featureImportance: MLFeatureImportance[];
  coefficients: Record<string, number>;
  intercept: number;
  residualSummary: {
    meanResidual: number;
    stdResidual: number;
  };
  samplePredictions: {
    actual: number;
    predicted: number;
    residual: number;
  }[];
}

export interface WhatIfVariableConfig {
  name: string;
  min: number;
  max: number;
  step: number;
  baseline: number;
  current: number;
  unit?: string;
}

// Time-Series Forecasting Types
export interface ForecastPoint {
  date: string;
  actual?: number | null;
  forecast?: number | null;
  confidenceLower?: number | null;
  confidenceUpper?: number | null;
  isProjected: boolean;
}

export interface ForecastResult {
  dateColumn: string;
  valueColumn: string;
  horizon: number;
  growthRatePercent: number;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  seasonalDetected: boolean;
  historyAndForecast: ForecastPoint[];
  summary: {
    historicalAverage: number;
    forecastAverage: number;
    projectedChangePercent: number;
  };
}

// Hypothesis Testing Types
export interface HypothesisTestResult {
  testType: 'two_sample_t_test' | 'anova' | 'chi_square' | 'normality';
  title: string;
  nullHypothesis: string;
  alternativeHypothesis: string;
  pValue: number;
  testStatisticName: string;
  testStatisticValue: number;
  isSignificant: boolean; // p < 0.05
  conclusion: string;
  details?: Record<string, any>;
}

// SQL Query Execution Types
export interface SQLQueryResult {
  query: string;
  success: boolean;
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  executionTimeMs: number;
  error?: string;
}

// Pivot Table Types
export interface PivotTableConfig {
  rowField: string;
  colField: string;
  valField: string;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface PivotTableData {
  rows: string[];
  cols: string[];
  matrix: (number | null)[][];
  rowTotals: number[];
  colTotals: number[];
  grandTotal: number;
}

// ----------------------------------------------------
// Advanced Machine Learning & Clustering (K-Means / PCA)
// ----------------------------------------------------
export interface ClusterProfile {
  id: number;
  name: string;
  size: number;
  percentage: number;
  color: string;
  centroid: Record<string, number>;
  keyCharacteristics: string[];
  summary: string;
}

export interface ClusteredPoint {
  id: number;
  pcaX: number;
  pcaY: number;
  clusterId: number;
  clusterName: string;
  clusterColor: string;
  attributes: Record<string, any>;
}

export interface ClusterModelResult {
  k: number;
  inertia: number;
  silhouetteScore: number;
  featuresUsed: string[];
  clusters: ClusterProfile[];
  points: ClusteredPoint[];
  optimalKSuggestion: number;
}

// ----------------------------------------------------
// Multi-Variate Anomaly Isolation Engine
// ----------------------------------------------------
export interface AnomalousFieldDetail {
  field: string;
  observedValue: any;
  meanValue: number;
  zScore: number;
  deviationDirection: 'high' | 'low';
  impactDescription: string;
}

export interface AnomalyRecord {
  id: number;
  rowIndex: number;
  anomalyScore: number; // 0 to 100
  severity: 'critical' | 'moderate' | 'mild';
  primaryFactor: string;
  flaggedFields: AnomalousFieldDetail[];
  rowData: Record<string, any>;
  explanation: string;
}

export interface AnomalyDetectionResult {
  totalAnalyzed: number;
  totalAnomalies: number;
  anomalyRatePercent: number;
  anomalies: AnomalyRecord[];
  topDistortedAttributes: { attribute: string; anomalyContributionCount: number }[];
  summary: string;
}

// ----------------------------------------------------
// Cohort & Retention Analysis
// ----------------------------------------------------
export interface CohortPeriodData {
  periodIndex: number;
  periodLabel: string;
  activeCount: number;
  retentionRatePercent: number;
  totalValue: number;
}

export interface CohortRow {
  cohortLabel: string;
  initialSize: number;
  periods: CohortPeriodData[];
}

export interface CohortAnalysisResult {
  hasCohortData: boolean;
  dateColumn: string;
  cohortRows: CohortRow[];
  maxPeriods: number;
  overallRetentionCurve: { periodIndex: number; averageRetentionPercent: number }[];
  keyCohortTakeaway: string;
}

// ----------------------------------------------------
// Data Science Notebook & Code Generator
// ----------------------------------------------------
export interface DataScienceCodePackage {
  pythonPandasEDA: string;
  pythonScikitLearnML: string;
  rTidyverseScript: string;
  jupyterNotebookJson: string;
}


