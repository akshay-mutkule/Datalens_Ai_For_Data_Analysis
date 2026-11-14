import {
  BarChart3,
  Radio,
  Flame,
  Scale,
  Sliders,
  Compass,
  FileText,
  SlidersHorizontal,
  Trophy,
  Target,
  Bot,
  Brain,
  GitMerge,
  Users,
  ShieldAlert,
  Calendar,
  Sparkles,
  Share2,
  Globe,
  LineChart,
  PieChart,
  FileSpreadsheet,
  Grid,
  Activity,
  Lock,
  Workflow,
  BellRing,
  Wand2,
  GitFork,
  Terminal,
  Code,
  ShieldCheck,
} from 'lucide-react';

export interface StudioNavItem {
  id: string;
  label: string;
  icon: any;
  category: 'exec' | 'ml' | 'bi' | 'dev';
  categoryLabel: string;
  keywords?: string;
}

export interface StudioNavGroup {
  id: 'exec' | 'ml' | 'bi' | 'dev';
  label: string;
  items: StudioNavItem[];
}

export const STUDIO_NAV_GROUPS: StudioNavGroup[] = [
  {
    id: 'exec',
    label: 'Executive & Risk',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3, category: 'exec', categoryLabel: 'Executive & Risk' },
      { id: 'warroom', label: 'War Room HUD', icon: Radio, category: 'exec', categoryLabel: 'Executive & Risk' },
      { id: 'risk', label: 'Stress Test & Risk', icon: Flame, category: 'exec', categoryLabel: 'Executive & Risk' },
      { id: 'causal', label: 'Causal Inference', icon: Scale, category: 'exec', categoryLabel: 'Executive & Risk' },
      { id: 'simulation', label: 'What-If Simulation', icon: Sliders, category: 'exec', categoryLabel: 'Executive & Risk' },
      { id: 'rca', label: 'Root Cause & Drivers', icon: Compass, category: 'exec', categoryLabel: 'Executive & Risk' },
      { id: 'report', label: 'Executive Report', icon: FileText, category: 'exec', categoryLabel: 'Executive & Risk' },
    ],
  },
  {
    id: 'ml',
    label: 'ML & Optimization',
    items: [
      { id: 'optimizer', label: 'Pareto Optimizer', icon: SlidersHorizontal, category: 'ml', categoryLabel: 'ML & Optimization' },
      { id: 'arena', label: 'Model Arena', icon: Trophy, category: 'ml', categoryLabel: 'ML & Optimization' },
      { id: 'xai', label: 'Explainable AI', icon: Target, category: 'ml', categoryLabel: 'ML & Optimization' },
      { id: 'swarm', label: 'Agent Swarm', icon: Bot, category: 'ml', categoryLabel: 'ML & Optimization' },
      { id: 'ml', label: 'Predictive & ML', icon: Brain, category: 'ml', categoryLabel: 'ML & Optimization' },
      { id: 'blending', label: 'Data Blending', icon: GitMerge, category: 'ml', categoryLabel: 'ML & Optimization' },
      { id: 'clustering', label: 'Clusters & PCA', icon: Users, category: 'ml', categoryLabel: 'ML & Optimization' },
      { id: 'anomalies', label: 'Anomaly Sentinel', icon: ShieldAlert, category: 'ml', categoryLabel: 'ML & Optimization' },
      { id: 'cohorts', label: 'Cohort Retention', icon: Calendar, category: 'ml', categoryLabel: 'ML & Optimization' },
      { id: 'chat', label: 'AI Analyst', icon: Sparkles, category: 'ml', categoryLabel: 'ML & Optimization' },
    ],
  },
  {
    id: 'bi',
    label: 'BI & Topology',
    items: [
      { id: 'graph', label: 'Knowledge Graph', icon: Share2, category: 'bi', categoryLabel: 'BI & Topology' },
      { id: 'geospatial', label: 'GeoSpatial Matrix', icon: Globe, category: 'bi', categoryLabel: 'BI & Topology' },
      { id: 'eda', label: 'Statistical EDA', icon: LineChart, category: 'bi', categoryLabel: 'BI & Topology' },
      { id: 'studio', label: 'Chart Studio', icon: PieChart, category: 'bi', categoryLabel: 'BI & Topology' },
      { id: 'data', label: 'Data Explorer', icon: FileSpreadsheet, category: 'bi', categoryLabel: 'BI & Topology' },
      { id: 'pivot', label: 'Pivot Matrix', icon: Grid, category: 'bi', categoryLabel: 'BI & Topology' },
    ],
  },
  {
    id: 'dev',
    label: 'Data Engineering',
    items: [
      { id: 'streaming', label: 'Live Stream Telemetry', icon: Activity, category: 'dev', categoryLabel: 'Data Engineering' },
      { id: 'twin', label: 'Synthetic Twin', icon: Lock, category: 'dev', categoryLabel: 'Data Engineering' },
      { id: 'workflows', label: 'Decision Logic', icon: Workflow, category: 'dev', categoryLabel: 'Data Engineering' },
      { id: 'alerts', label: 'Sentinel Alerts', icon: BellRing, category: 'dev', categoryLabel: 'Data Engineering' },
      { id: 'features', label: 'Feature Store', icon: Wand2, category: 'dev', categoryLabel: 'Data Engineering' },
      { id: 'pipeline', label: 'Pipeline DAG', icon: GitFork, category: 'dev', categoryLabel: 'Data Engineering' },
      { id: 'sql', label: 'SQL Studio', icon: Terminal, category: 'dev', categoryLabel: 'Data Engineering' },
      { id: 'notebook', label: 'Python & R Code', icon: Code, category: 'dev', categoryLabel: 'Data Engineering' },
      { id: 'quality', label: 'Data Cleaning', icon: ShieldCheck, category: 'dev', categoryLabel: 'Data Engineering' },
    ],
  },
];

export const ALL_STUDIOS: StudioNavItem[] = STUDIO_NAV_GROUPS.flatMap((g) => g.items);

export function getStudioMeta(id: string): StudioNavItem {
  return ALL_STUDIOS.find((item) => item.id === id) || ALL_STUDIOS[0];
}
