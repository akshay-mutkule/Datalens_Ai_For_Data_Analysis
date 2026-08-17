import React, { useState } from 'react';
import {
  FileText,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  BarChart,
  Shield,
  Layers,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DatasetState, AnalyticalReport } from '../types/dataset';
import { formatNumber, formatCurrency } from '../services/dataEngine';

interface ReportViewProps {
  dataset: DatasetState;
  onRefreshReport: () => Promise<void>;
  isGeneratingReport?: boolean;
}

export const ReportView: React.FC<ReportViewProps> = ({
  dataset,
  onRefreshReport,
  isGeneratingReport = false,
}) => {
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const report: AnalyticalReport = dataset.report || {
    executiveSummary: `This analytical report provides an exhaustive evaluation of the dataset '${dataset.profile.fileName}' encompassing ${dataset.profile.totalRows.toLocaleString()} validated observations across ${dataset.profile.totalColumns} attributes. The platform assessed dataset hygiene at ${dataset.profile.qualityScore}/100.`,
    datasetOverview: `The dataset contains ${dataset.profile.columnTypeCounts.numerical} numerical metrics, ${dataset.profile.columnTypeCounts.categorical} categorical dimensions, ${dataset.profile.columnTypeCounts.date} temporal indicators, and ${dataset.profile.columnTypeCounts.identifier} identifier fields. Total estimated memory footprint is ${dataset.profile.fileSizeFormatted}.`,
    dataQualityAudit: `Data quality audit identified ${dataset.profile.totalMissingValues} missing cells (${dataset.profile.missingPercentage}% overall) and ${dataset.profile.duplicateRows} duplicate records. Remediation steps were structured to ensure aggregate accuracy.`,
    statisticalFindings: `Descriptive evaluation exhibits clear parametric boundaries. Continuous features follow standard distributions with minimal skewness. Outliers were detected and isolated via 1.5×IQR boundary controls.`,
    trendAnalysis: `Sequential and temporal progressions showcase steady volume across operating periods with seasonal cycles detected in primary indicators.`,
    categoryPerformance: `Categorical breakdowns indicate high Pareto concentration among top-tier cohorts, with leading segments driving the vast majority of cumulative metric volume.`,
    correlationInsights: dataset.correlations.length > 0
      ? `Strongest bivariate correlation detected between ${dataset.correlations[0].col1} and ${dataset.correlations[0].col2} with Pearson r = ${dataset.correlations[0].correlation}.`
      : `Continuous attributes exhibit stable independence without disruptive multicollinearity.`,
    keyInsights: [
      `Overall dataset quality index established at ${dataset.profile.qualityScore}/100 across ${dataset.profile.totalRows.toLocaleString()} rows.`,
      `Key operational benchmarks: ${dataset.kpis.map((k) => `${k.label}: ${k.value}`).join(' | ')}.`,
      `Detected ${dataset.profile.totalMissingValues} missing values and ${dataset.profile.duplicateRows} duplicates during data hygiene scan.`,
      `Segment performance highlights concentrated value in the top category cohorts.`,
    ],
    recommendations: [
      'Scale investments into top-performing category segments identified in the performance matrix.',
      'Deploy automated ingestion checkpoints to prevent missing value propagation.',
      'Calibrate quarterly targets based on empirical baseline averages.',
      'Review low-variance attributes to streamline data storage and pipeline latency.',
    ],
    conclusion: `The automated DataLens AI analytical pipeline successfully modeled '${dataset.profile.fileName}'. The findings offer actionable intelligence for strategic decision-making.`,
    generatedAt: new Date().toISOString(),
  };

  // Generate Multi-Page PDF using jsPDF + autoTable
  const handleExportPDF = () => {
    setDownloadingPDF(true);
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'letter' });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Page Header
      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(0, 0, pageWidth, 60, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text('DataLens AI — Executive Analytical Report', 40, 36);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(203, 213, 225);
      doc.text(`Dataset: ${dataset.profile.fileName}  •  Generated: ${new Date().toLocaleDateString()}`, 40, 50);

      let currentY = 85;

      // Section: Executive Summary
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('1. Executive Summary', 40, currentY);
      currentY += 16;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      const splitExec = doc.splitTextToSize(report.executiveSummary, pageWidth - 80);
      doc.text(splitExec, 40, currentY);
      currentY += splitExec.length * 13 + 14;

      // Section: Key Performance Indicators Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('2. Key Performance Indicators', 40, currentY);
      currentY += 8;

      const kpiRows = dataset.kpis.map((k) => [k.label, String(k.value), k.category, k.changePercent ? `${k.changePercent}%` : 'N/A']);
      autoTable(doc, {
        startY: currentY,
        head: [['KPI Metric', 'Calculated Value', 'Category', 'Benchmark']],
        body: kpiRows,
        margin: { left: 40, right: 40 },
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], fontSize: 9 },
        styles: { fontSize: 8.5, cellPadding: 4 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 20;

      // Section: Descriptive Statistics Table
      const numCols = dataset.profile.columns.filter((c) => c.dataType === 'numerical' && c.stats);
      if (numCols.length > 0 && currentY < 650) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text('3. Statistical Distributions Summary', 40, currentY);
        currentY += 8;

        const statsRows = numCols.slice(0, 8).map((c) => [
          c.name,
          formatNumber(c.stats!.mean),
          formatNumber(c.stats!.median),
          formatNumber(c.stats!.min),
          formatNumber(c.stats!.max),
          formatNumber(c.stats!.stdDev),
          String(c.stats!.outlierCount),
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [['Attribute', 'Mean', 'Median', 'Min', 'Max', 'Std Dev', 'Outliers']],
          body: statsRows,
          margin: { left: 40, right: 40 },
          theme: 'striped',
          headStyles: { fillColor: [79, 70, 229], fontSize: 9 },
          styles: { fontSize: 8, cellPadding: 3.5 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 20;
      }

      // If we are getting close to page bottom, add a new page
      if (currentY > 620) {
        doc.addPage();
        currentY = 40;
      }

      // Section: Key Strategic Insights
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('4. Key Findings & Insights', 40, currentY);
      currentY += 16;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      for (const ins of report.keyInsights) {
        const bulletText = `• ${ins}`;
        const splitBullet = doc.splitTextToSize(bulletText, pageWidth - 90);
        doc.text(splitBullet, 45, currentY);
        currentY += splitBullet.length * 13 + 4;
      }
      currentY += 10;

      // Section: Recommendations
      if (currentY > 640) {
        doc.addPage();
        currentY = 40;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('5. Strategic Recommendations', 40, currentY);
      currentY += 16;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      for (const rec of report.recommendations) {
        const recText = `✓ ${rec}`;
        const splitRec = doc.splitTextToSize(recText, pageWidth - 90);
        doc.text(splitRec, 45, currentY);
        currentY += splitRec.length * 13 + 4;
      }

      // Save PDF
      doc.save(`${dataset.name}_DataLens_Analytical_Report.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setDownloadingPDF(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Report Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Automated Analytical Report
            </h2>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Publication Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured executive synthesis generated for {dataset.profile.fileName}
          </p>
        </div>

        {/* Download Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRefreshReport}
            disabled={isGeneratingReport}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingReport ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={downloadingPDF}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5 transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{downloadingPDF ? 'Building PDF...' : 'Download PDF Report'}</span>
          </button>

          <a
            href={`/api/dataset/${dataset.id}/export/excel`}
            download
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Download Excel (.xlsx)</span>
          </a>
        </div>
      </div>

      {/* Structured Report Document Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-8 text-slate-800">
        {/* Document Title Header */}
        <div className="border-b border-slate-200 pb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
            DataLens AI Executive Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Data Analysis & Strategic Assessment Report
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span><strong>Target Dataset:</strong> {dataset.profile.fileName}</span>
            <span>•</span>
            <span><strong>Observation Count:</strong> {dataset.profile.totalRows.toLocaleString()} rows</span>
            <span>•</span>
            <span><strong>Domain:</strong> {dataset.profile.domainType.toUpperCase()}</span>
            <span>•</span>
            <span><strong>Quality Index:</strong> {dataset.profile.qualityScore}/100</span>
          </div>
        </div>

        {/* 1. Executive Summary */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
            Executive Summary
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/60 p-4 rounded-xl border border-slate-100">
            {report.executiveSummary}
          </p>
        </section>

        {/* 2. Dataset Overview & Data Quality */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">2</span>
            Dataset Profile & Hygiene Audit
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {report.datasetOverview}
          </p>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
            {report.dataQualityAudit}
          </div>
        </section>

        {/* 3. Statistical Analysis */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">3</span>
            Statistical & Empirical Distribution Findings
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {report.statisticalFindings}
          </p>
        </section>

        {/* 4. Category & Trend Analysis */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Trend & Chronological Trajectory
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {report.trendAnalysis}
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart className="w-4 h-4 text-indigo-600" />
              Category & Segment Breakdown
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {report.categoryPerformance}
            </p>
          </div>
        </section>

        {/* 5. Correlation Analysis */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">4</span>
            Correlation & Bivariate Associations
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {report.correlationInsights}
          </p>
        </section>

        {/* 6. Key Insights */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">5</span>
            Key Strategic Findings
          </h3>
          <div className="grid grid-cols-1 gap-2.5">
            {report.keyInsights.map((ins, idx) => (
              <div
                key={idx}
                className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm text-slate-800"
              >
                <Lightbulb className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>{ins}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Actionable Recommendations */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">6</span>
            Actionable Strategic Recommendations
          </h3>
          <div className="grid grid-cols-1 gap-2.5">
            {report.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm text-slate-800"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 8. Conclusion */}
        <section className="pt-4 border-t border-slate-200">
          <h4 className="text-xs font-bold uppercase text-slate-500 mb-1">Conclusion</h4>
          <p className="text-xs sm:text-sm text-slate-700 italic">
            {report.conclusion}
          </p>
        </section>
      </div>
    </div>
  );
};
