import express from 'express';
import path from 'path';
import multer from 'multer';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  profileDataset,
  generateCleaningSuggestions,
  cleanDataset,
  generateKPIs,
  generateSmartCharts,
  generateCorrelationMatrix,
  generateAutomatedInsights,
  trainRegressionModel,
  forecastTimeSeries,
  runHypothesisTests,
  executeSQLQuery,
  computePivotTable,
} from './src/services/dataEngine';
import { SAMPLE_DATASETS } from './src/data/sampleDatasets';
import { generateAIReport, askDataAnalyst } from './server/gemini';
import { DatasetState, CleaningPipelineConfig } from './src/types/dataset';

dotenv.config();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// In-memory dataset state store
const datasetStore = new Map<string, DatasetState>();

export function processDataset(
  rawRows: Record<string, any>[],
  fileName: string,
  fileSizeBytes: number
): DatasetState {
  const profile = profileDataset(rawRows, fileName, fileSizeBytes);
  const cleaningSuggestions = generateCleaningSuggestions(profile);

  const defaultCleaningConfig: CleaningPipelineConfig = {
    imputeMissingNumerical: 'median',
    imputeMissingCategorical: 'unknown',
    removeDuplicates: true,
    handleOutliers: 'none',
    standardizeDates: true,
    dropConstantColumns: true,
    fixNegativeValues: false,
  };

  const cleanedRows = cleanDataset(rawRows, profile, defaultCleaningConfig);
  const kpis = generateKPIs(cleanedRows, profile);
  const charts = generateSmartCharts(cleanedRows, profile);
  const correlations = generateCorrelationMatrix(cleanedRows, profile);
  const insights = generateAutomatedInsights(cleanedRows, profile, kpis, correlations);

  const datasetState: DatasetState = {
    id: profile.id,
    name: fileName.replace(/\.[^/.]+$/, ''),
    uploadedAt: new Date().toISOString(),
    rawRows,
    cleanedRows,
    headers: rawRows.length > 0 ? Object.keys(rawRows[0]) : [],
    profile,
    cleaningSuggestions,
    appliedCleaning: defaultCleaningConfig,
    kpis,
    charts,
    correlations,
    insights,
  };

  datasetStore.set(datasetState.id, datasetState);
  return datasetState;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API 1: Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'DataLens AI Engine', timestamp: new Date().toISOString() });
  });

  // API 2: Upload file (CSV, XLSX, XLS)
  app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const originalName = req.file.originalname;
      const fileBuffer = req.file.buffer;
      const ext = path.extname(originalName).toLowerCase();

      let parsedRows: Record<string, any>[] = [];

      if (ext === '.csv' || ext === '.txt') {
        const csvString = fileBuffer.toString('utf-8');
        const parsed = Papa.parse<Record<string, any>>(csvString, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: 'greedy',
        });
        parsedRows = parsed.data;
      } else if (ext === '.xlsx' || ext === '.xls') {
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        parsedRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: null });
      } else {
        return res.status(400).json({ error: 'Unsupported file format. Please upload .csv, .xlsx, or .xls file.' });
      }

      if (!parsedRows || parsedRows.length === 0) {
        return res.status(400).json({ error: 'Uploaded dataset is empty or could not be parsed.' });
      }

      const dataset = processDataset(parsedRows, originalName, req.file.size);
      res.json({ success: true, dataset });
    } catch (err: any) {
      console.error('Upload processing error:', err);
      res.status(500).json({ error: err.message || 'Failed to process dataset' });
    }
  });

  // API 3: List Sample Datasets
  app.get('/api/sample-datasets', (req, res) => {
    const list = SAMPLE_DATASETS.map(s => ({
      id: s.id,
      name: s.name,
      category: s.category,
      description: s.description,
      rowsCount: s.rowsCount,
      colsCount: s.colsCount,
      fileName: s.fileName,
    }));
    res.json({ samples: list });
  });

  // API 4: Load Sample Dataset (handles both /api/sample/:id and /api/sample-datasets/:id)
  const handleLoadSampleReq = (req: express.Request, res: express.Response) => {
    try {
      const sampleId = req.params.id;
      let sample = SAMPLE_DATASETS.find(s => s.id === sampleId);
      if (!sample) {
        // Allow fuzzy matching (e.g. sales_analytics -> ecommerce_sales)
        if (sampleId.includes('sales') || sampleId.includes('ecom')) {
          sample = SAMPLE_DATASETS.find(s => s.id === 'ecommerce_sales');
        } else if (sampleId.includes('hr') || sampleId.includes('salary') || sampleId.includes('workforce')) {
          sample = SAMPLE_DATASETS.find(s => s.id === 'tech_hr');
        } else if (sampleId.includes('saas') || sampleId.includes('churn')) {
          sample = SAMPLE_DATASETS.find(s => s.id === 'saas_churn');
        } else if (sampleId.includes('health') || sampleId.includes('patient') || sampleId.includes('clinical')) {
          sample = SAMPLE_DATASETS.find(s => s.id === 'healthcare_patient');
        }
      }

      if (!sample) {
        sample = SAMPLE_DATASETS[0]; // fallback to first sample
      }

      const rawRows = sample.generator();
      const dataset = processDataset(rawRows, sample.fileName, rawRows.length * sample.colsCount * 14);
      res.json({ success: true, dataset });
    } catch (err: any) {
      console.error('Error loading sample dataset:', err);
      res.status(500).json({ error: err.message || 'Failed to load sample dataset' });
    }
  };

  app.post('/api/sample-datasets/:id', handleLoadSampleReq);
  app.post('/api/sample/:id', handleLoadSampleReq);
  app.get('/api/sample/:id', handleLoadSampleReq);

  // API 5: Get Dataset State
  app.get('/api/dataset/:id', (req, res) => {
    const dataset = datasetStore.get(req.params.id);
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    res.json({ dataset });
  });

  // API 6: Run SQL Query
  app.post('/api/dataset/:id/sql', (req, res) => {
    try {
      const dataset = datasetStore.get(req.params.id);
      if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

      const { query } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Query string is required' });
      }

      const result = executeSQLQuery(dataset.cleanedRows, query);
      res.json({ success: result.success, result });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'SQL execution failed' });
    }
  });

  // API 7: Train ML Regression / Classification Model
  app.post('/api/dataset/:id/model', (req, res) => {
    try {
      const dataset = datasetStore.get(req.params.id);
      if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

      const { targetColumn, featureColumns } = req.body;
      if (!targetColumn) return res.status(400).json({ error: 'Target column is required' });

      const features = Array.isArray(featureColumns) && featureColumns.length > 0
        ? featureColumns
        : dataset.profile.columns
            .filter(c => c.dataType === 'numerical' && c.name !== targetColumn && !c.isIdentifier)
            .map(c => c.name);

      const model = trainRegressionModel(dataset.cleanedRows, targetColumn, features);
      if (!model) return res.status(400).json({ error: 'Unable to fit model with selected parameters' });

      res.json({ success: true, model });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Model training failed' });
    }
  });

  // API 8: Time-Series Forecasting
  app.post('/api/dataset/:id/forecast', (req, res) => {
    try {
      const dataset = datasetStore.get(req.params.id);
      if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

      const { dateColumn, valueColumn, horizon } = req.body;
      const dateCol = dateColumn || dataset.profile.columns.find(c => c.dataType === 'date')?.name;
      const valCol = valueColumn || dataset.profile.columns.find(c => c.dataType === 'numerical' && !c.isIdentifier)?.name;

      if (!dateCol || !valCol) {
        return res.status(400).json({ error: 'Date column and value column are required for forecasting' });
      }

      const forecast = forecastTimeSeries(dataset.cleanedRows, dateCol, valCol, horizon || 6);
      if (!forecast) return res.status(400).json({ error: 'Insufficient temporal data to generate forecast' });

      res.json({ success: true, forecast });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Forecasting failed' });
    }
  });

  // API 9: Run Pivot Table
  app.post('/api/dataset/:id/pivot', (req, res) => {
    try {
      const dataset = datasetStore.get(req.params.id);
      if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

      const { rowField, colField, valField, aggregation } = req.body;
      const pivot = computePivotTable(dataset.cleanedRows, {
        rowField,
        colField,
        valField: valField || dataset.profile.columns.find(c => c.dataType === 'numerical')?.name || '',
        aggregation: aggregation || 'sum',
      });

      res.json({ success: true, pivot });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Pivot computation failed' });
    }
  });

  // API 10: Run Hypothesis Tests
  app.get('/api/dataset/:id/hypothesis-tests', (req, res) => {
    try {
      const dataset = datasetStore.get(req.params.id);
      if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

      const tests = runHypothesisTests(dataset.cleanedRows, dataset.profile);
      res.json({ success: true, tests });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Hypothesis testing failed' });
    }
  });

  // API 11: Add Custom Calculated Column
  app.post('/api/dataset/:id/add-column', (req, res) => {
    try {
      const dataset = datasetStore.get(req.params.id);
      if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

      const { columnName, expression, formulaType } = req.body;
      if (!columnName || !expression) {
        return res.status(400).json({ error: 'Column name and expression are required' });
      }

      // Safe evaluation of simple math operations across row keys
      const augmentedRows = dataset.cleanedRows.map(row => {
        const newRow = { ...row };
        try {
          // Replace [Column_Name] tokens with row['Column_Name']
          let evalStr = expression.replace(/\[([a-zA-Z0-9_]+)\]/g, (_: string, col: string) => {
            const val = Number(row[col]);
            return isNaN(val) ? '0' : String(val);
          });
          // Only allow safe math tokens
          if (/^[\d\s+\-*/().Math.sqrt.log.abs.pow.round]+$/.test(evalStr)) {
            // eslint-disable-next-line no-new-func
            const computed = Function(`"use strict"; return (${evalStr})`)();
            newRow[columnName] = Number(Number(computed).toFixed(2));
          } else {
            newRow[columnName] = null;
          }
        } catch {
          newRow[columnName] = null;
        }
        return newRow;
      });

      const updatedProfile = profileDataset(augmentedRows, dataset.profile.fileName, dataset.profile.fileSizeBytes);
      dataset.cleanedRows = augmentedRows;
      dataset.profile = updatedProfile;
      dataset.headers = Object.keys(augmentedRows[0] || {});
      datasetStore.set(dataset.id, dataset);

      res.json({ success: true, dataset });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to add calculated column' });
    }
  });

  // API 6: Apply Customized Cleaning Pipeline
  app.post('/api/dataset/:id/clean', (req, res) => {
    try {
      const dataset = datasetStore.get(req.params.id);
      if (!dataset) {
        return res.status(404).json({ error: 'Dataset not found' });
      }

      const config: CleaningPipelineConfig = req.body.config || dataset.appliedCleaning;
      const cleanedRows = cleanDataset(dataset.rawRows, dataset.profile, config);
      const updatedProfile = profileDataset(cleanedRows, dataset.profile.fileName, dataset.profile.fileSizeBytes);
      const kpis = generateKPIs(cleanedRows, updatedProfile);
      const charts = generateSmartCharts(cleanedRows, updatedProfile);
      const correlations = generateCorrelationMatrix(cleanedRows, updatedProfile);
      const insights = generateAutomatedInsights(cleanedRows, updatedProfile, kpis, correlations);

      dataset.cleanedRows = cleanedRows;
      dataset.appliedCleaning = config;
      dataset.kpis = kpis;
      dataset.charts = charts;
      dataset.correlations = correlations;
      dataset.insights = insights;
      datasetStore.set(dataset.id, dataset);

      res.json({ success: true, dataset });
    } catch (err: any) {
      console.error('Cleaning pipeline error:', err);
      res.status(500).json({ error: err.message || 'Failed to clean dataset' });
    }
  });

  // API 7: Generate / Refresh AI Analytical Report
  app.post('/api/dataset/:id/report', async (req, res) => {
    try {
      const dataset = datasetStore.get(req.params.id);
      if (!dataset) {
        return res.status(404).json({ error: 'Dataset not found' });
      }

      const report = await generateAIReport(
        dataset.profile,
        dataset.kpis,
        dataset.correlations,
        dataset.cleanedRows.slice(0, 10)
      );

      dataset.report = report;
      datasetStore.set(dataset.id, dataset);

      res.json({ success: true, report });
    } catch (err: any) {
      console.error('Report generation error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate report' });
    }
  });

  // API 8: Ask AI Data Analyst Chat
  app.post('/api/dataset/:id/ask', async (req, res) => {
    try {
      const dataset = datasetStore.get(req.params.id);
      if (!dataset) {
        return res.status(404).json({ error: 'Dataset not found' });
      }

      const { question } = req.body;
      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: 'Question is required' });
      }

      const answer = await askDataAnalyst(
        question,
        dataset.profile,
        dataset.kpis,
        dataset.correlations,
        dataset.cleanedRows.slice(0, 10)
      );

      res.json({ success: true, answer });
    } catch (err: any) {
      console.error('Chat endpoint error:', err);
      res.status(500).json({ error: err.message || 'Failed to answer question' });
    }
  });

  // API 9: Export Cleaned CSV
  app.get('/api/dataset/:id/export/csv', (req, res) => {
    const dataset = datasetStore.get(req.params.id);
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    const csv = Papa.unparse(dataset.cleanedRows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${dataset.name}_cleaned.csv"`);
    res.send(csv);
  });

  // API 10: Export Comprehensive Excel Workbook
  app.get('/api/dataset/:id/export/excel', (req, res) => {
    try {
      const dataset = datasetStore.get(req.params.id);
      if (!dataset) {
        return res.status(404).json({ error: 'Dataset not found' });
      }

      const wb = XLSX.utils.book_new();

      // Sheet 1: Summary & Overview
      const overviewData = [
        ['Metric', 'Value'],
        ['Dataset Name', dataset.profile.fileName],
        ['Total Observations (Rows)', dataset.profile.totalRows],
        ['Total Features (Columns)', dataset.profile.totalColumns],
        ['Data Quality Health Score', `${dataset.profile.qualityScore}/100`],
        ['Missing Values Identified', dataset.profile.totalMissingValues],
        ['Duplicate Rows Detected', dataset.profile.duplicateRows],
        ['Domain Classification', dataset.profile.domainType.toUpperCase()],
        [],
        ['Key Performance Indicators', 'Value'],
        ...dataset.kpis.map(k => [k.label, k.value]),
      ];
      const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(wb, wsOverview, 'Summary');

      // Sheet 2: Cleaned Data
      const wsCleaned = XLSX.utils.json_to_sheet(dataset.cleanedRows);
      XLSX.utils.book_append_sheet(wb, wsCleaned, 'Cleaned Data');

      // Sheet 3: Descriptive Statistics
      const numCols = dataset.profile.columns.filter(c => c.dataType === 'numerical' && c.stats);
      const statsData = [
        ['Column', 'Mean', 'Median', 'Min', 'Max', 'Std Dev', 'Q1 (25%)', 'Q3 (75%)', 'IQR', 'Skewness', 'Outlier Count'],
        ...numCols.map(c => [
          c.name,
          c.stats?.mean,
          c.stats?.median,
          c.stats?.min,
          c.stats?.max,
          c.stats?.stdDev,
          c.stats?.q1,
          c.stats?.q3,
          c.stats?.iqr,
          c.stats?.skewness,
          c.stats?.outlierCount,
        ]),
      ];
      const wsStats = XLSX.utils.aoa_to_sheet(statsData);
      XLSX.utils.book_append_sheet(wb, wsStats, 'Statistics');

      // Sheet 4: Correlations
      const corrData = [
        ['Variable 1', 'Variable 2', 'Pearson Correlation (r)', 'Strength'],
        ...dataset.correlations.map(c => [c.col1, c.col2, c.correlation, c.strength]),
      ];
      const wsCorr = XLSX.utils.aoa_to_sheet(corrData);
      XLSX.utils.book_append_sheet(wb, wsCorr, 'Correlations');

      // Sheet 5: Top Categories
      const catCols = dataset.profile.columns.filter(c => c.topCategories && c.topCategories.length > 0);
      const catRows: any[][] = [['Column', 'Category Value', 'Count', 'Percentage (%)']];
      for (const col of catCols) {
        for (const tc of col.topCategories || []) {
          catRows.push([col.name, tc.value, tc.count, tc.percentage]);
        }
      }
      const wsCats = XLSX.utils.aoa_to_sheet(catRows);
      XLSX.utils.book_append_sheet(wb, wsCats, 'Top Categories');

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${dataset.name}_analysis_report.xlsx"`);
      res.send(buf);
    } catch (err: any) {
      console.error('Excel export error:', err);
      res.status(500).json({ error: err.message || 'Failed to export Excel' });
    }
  });

  // Vite middleware for development / Static files for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DataLens AI server running at http://localhost:${PORT}`);
  });
}

startServer();
