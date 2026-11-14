import React, { useState, useMemo, useEffect } from 'react';
import {
  Share2,
  GitBranch,
  Search,
  SlidersHorizontal,
  ArrowRight,
  Compass,
  Layers,
  Download,
  RefreshCw,
} from 'lucide-react';
import { DatasetState } from '../types/dataset';
import { useTheme } from '../context/ThemeContext';

interface GraphKnowledgeViewProps {
  dataset: DatasetState;
}

interface GraphNode {
  id: string;
  label: string;
  group: string;
  kind: 'numerical' | 'categorical' | 'entity';
  weight: number;
  pageRank: number;
  degree: number;
  community: number;
  x: number;
  y: number;
  meta: string;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight: number; // 0 to 1
  signedWeight: number; // -1 to 1
  label: string;
}

// Compute Pearson correlation between two numeric arrays
function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return 0;
  let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
  for (let i = 0; i < n; i++) {
    const x = xs[i];
    const y = ys[i];
    sx += x;
    sy += y;
    sxx += x * x;
    syy += y * y;
    sxy += x * y;
  }
  const num = n * sxy - sx * sy;
  const den = Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
  return den === 0 ? 0 : num / den;
}

// Compute Eta-Squared (categorical -> numerical variance explained)
function etaSquared(cats: string[], nums: number[]): number {
  const n = Math.min(cats.length, nums.length);
  if (n < 4) return 0;
  const grandMean = nums.reduce((a, b) => a + b, 0) / n;
  const ssTotal = nums.reduce((s, v) => s + (v - grandMean) ** 2, 0);
  if (ssTotal === 0) return 0;

  const groups = new Map<string, number[]>();
  for (let i = 0; i < n; i++) {
    const k = cats[i] || 'Unknown';
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(nums[i]);
  }
  if (groups.size < 2 || groups.size > 40) return 0;

  let ssBetween = 0;
  groups.forEach((vals) => {
    const m = vals.reduce((a, b) => a + b, 0) / vals.length;
    ssBetween += vals.length * (m - grandMean) ** 2;
  });

  return Math.sqrt(Math.max(0, Math.min(1, ssBetween / ssTotal)));
}

export const GraphKnowledgeView: React.FC<GraphKnowledgeViewProps> = ({ dataset }) => {
  const { isDark } = useTheme();
  const [graphMode, setGraphMode] = useState<'features' | 'entities'>('features');
  const [minEdgeStrength, setMinEdgeStrength] = useState<number>(0.18);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [pathStart, setPathStart] = useState<string>('');
  const [pathEnd, setPathEnd] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [layoutSeed, setLayoutSeed] = useState<number>(1);

  const communityPalette = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
  ];

  // Build graph nodes & edges from live cleanedRows
  const { nodes, edges, communitiesCount } = useMemo(() => {
    const rows = dataset.cleanedRows || [];
    const cols = dataset.profile.columns.filter((c) => !c.isConstant);
    const numCols = cols.filter((c) => c.dataType === 'numerical');
    const catCols = cols.filter((c) => c.dataType === 'categorical' && c.uniqueCount >= 2 && c.uniqueCount <= 25);

    const rawNodes: Omit<GraphNode, 'pageRank' | 'degree' | 'community' | 'x' | 'y'>[] = [];
    const rawEdges: GraphEdge[] = [];

    if (graphMode === 'features') {
      // Feature-level topological graph: numerical + categorical columns
      numCols.forEach((c) => {
        rawNodes.push({
          id: c.name,
          label: c.name,
          group: 'Numerical Metric',
          kind: 'numerical',
          weight: c.stats ? Math.min(1, Math.log10(Math.abs(c.stats.stdDev) + 10) / 5) : 0.6,
          meta: c.stats ? `Mean ${c.stats.mean.toLocaleString(undefined, { maximumFractionDigits: 1 })} · σ ${c.stats.stdDev.toLocaleString(undefined, { maximumFractionDigits: 1 })}` : 'Numerical feature',
        });
      });

      catCols.slice(0, 8).forEach((c) => {
        rawNodes.push({
          id: c.name,
          label: c.name,
          group: 'Categorical Dimension',
          kind: 'categorical',
          weight: 0.55,
          meta: `${c.uniqueCount} distinct segments`,
        });
      });

      // Extract paired vectors
      const numVectors = new Map<string, number[]>();
      numCols.forEach((c) => {
        numVectors.set(
          c.name,
          rows.map((r) => Number(r[c.name])).map((v) => (isFinite(v) ? v : 0))
        );
      });

      // Numerical <-> Numerical Pearson edges
      for (let i = 0; i < numCols.length; i++) {
        for (let j = i + 1; j < numCols.length; j++) {
          const c1 = numCols[i].name;
          const c2 = numCols[j].name;
          const r = pearson(numVectors.get(c1)!, numVectors.get(c2)!);
          const absR = Math.abs(r);
          if (absR >= minEdgeStrength) {
            rawEdges.push({
              id: `${c1}__${c2}`,
              source: c1,
              target: c2,
              weight: absR,
              signedWeight: r,
              label: `r = ${r >= 0 ? '+' : ''}${r.toFixed(2)}`,
            });
          }
        }
      }

      // Categorical <-> Numerical Eta association edges
      catCols.slice(0, 8).forEach((cat) => {
        const catVec = rows.map((r) => String(r[cat.name] ?? 'Unknown'));
        numCols.forEach((num) => {
          const eta = etaSquared(catVec, numVectors.get(num.name)!);
          if (eta >= minEdgeStrength) {
            rawEdges.push({
              id: `${cat.name}__${num.name}`,
              source: cat.name,
              target: num.name,
              weight: eta,
              signedWeight: eta,
              label: `η = ${eta.toFixed(2)}`,
            });
          }
        });
      });
    } else {
      // Entity Co-Occurrence Graph across top categorical values & primary target KPI
      const primaryNum = numCols[0];
      const entityCols = catCols.slice(0, 3);

      entityCols.forEach((col) => {
        const topVals = (col.topCategories || []).slice(0, 6);
        topVals.forEach((item) => {
          const nodeId = `${col.name}:${item.value}`;
          rawNodes.push({
            id: nodeId,
            label: item.value,
            group: col.name,
            kind: 'entity',
            weight: Math.max(0.3, Math.min(1, item.percentage / 40)),
            meta: `${col.name} · ${item.count} rows (${item.percentage.toFixed(1)}%)`,
          });
        });
      });

      if (primaryNum) {
        rawNodes.push({
          id: `KPI:${primaryNum.name}`,
          label: primaryNum.name,
          group: 'Target KPI',
          kind: 'numerical',
          weight: 1,
          meta: `Target metric · Mean ${primaryNum.stats?.mean.toLocaleString(undefined, { maximumFractionDigits: 1 }) ?? 0}`,
        });
      }

      // Co-occurrence lift between entities from different columns
      for (let i = 0; i < rawNodes.length; i++) {
        for (let j = i + 1; j < rawNodes.length; j++) {
          const nA = rawNodes[i];
          const nB = rawNodes[j];
          if (nA.kind === 'entity' && nB.kind === 'entity' && nA.group !== nB.group) {
            const valA = nA.id.split(':').slice(1).join(':');
            const valB = nB.id.split(':').slice(1).join(':');
            let countA = 0, countB = 0, countAB = 0;
            rows.forEach((r) => {
              const a = String(r[nA.group]) === valA;
              const b = String(r[nB.group]) === valB;
              if (a) countA++;
              if (b) countB++;
              if (a && b) countAB++;
            });
            const n = rows.length || 1;
            const pA = countA / n;
            const pB = countB / n;
            const pAB = countAB / n;
            const lift = pA > 0 && pB > 0 ? pAB / (pA * pB) : 0;
            const normalizedStrength = Math.min(1, Math.max(0, (lift - 0.8) / 1.8));
            if (countAB >= 2 && normalizedStrength >= minEdgeStrength) {
              rawEdges.push({
                id: `${nA.id}__${nB.id}`,
                source: nA.id,
                target: nB.id,
                weight: normalizedStrength,
                signedWeight: normalizedStrength,
                label: `Lift ${lift.toFixed(2)}x (${countAB})`,
              });
            }
          } else if (primaryNum && nA.kind === 'entity' && nB.id === `KPI:${primaryNum.name}`) {
            const valA = nA.id.split(':').slice(1).join(':');
            const sub = rows.filter((r) => String(r[nA.group]) === valA).map((r) => Number(r[primaryNum.name])).filter(isFinite);
            const gMean = primaryNum.stats?.mean || 1;
            const sMean = sub.length > 0 ? sub.reduce((a, b) => a + b, 0) / sub.length : gMean;
            const ratio = gMean !== 0 ? (sMean - gMean) / Math.abs(gMean) : 0;
            const w = Math.min(1, Math.abs(ratio) * 1.4);
            if (w >= minEdgeStrength * 0.7) {
              rawEdges.push({
                id: `${nA.id}__${nB.id}`,
                source: nA.id,
                target: nB.id,
                weight: w,
                signedWeight: ratio,
                label: `${ratio >= 0 ? '+' : ''}${(ratio * 100).toFixed(0)}% vs avg`,
              });
            }
          }
        }
      }
    }

    // Build adjacency map for PageRank & Community Detection
    const adj = new Map<string, { to: string; weight: number }[]>();
    rawNodes.forEach((n) => adj.set(n.id, []));
    rawEdges.forEach((e) => {
      adj.get(e.source)?.push({ to: e.target, weight: e.weight });
      adj.get(e.target)?.push({ to: e.source, weight: e.weight });
    });

    // Power-iteration PageRank (d = 0.85, 18 iterations)
    const N = rawNodes.length || 1;
    let pr = new Map<string, number>();
    rawNodes.forEach((n) => pr.set(n.id, 1 / N));
    for (let iter = 0; iter < 18; iter++) {
      const nextPr = new Map<string, number>();
      rawNodes.forEach((n) => nextPr.set(n.id, 0.15 / N));
      rawNodes.forEach((u) => {
        const neighbors = adj.get(u.id) || [];
        const totalW = neighbors.reduce((s, nb) => s + nb.weight, 0);
        const uRank = pr.get(u.id) || 0;
        if (totalW > 0) {
          neighbors.forEach((nb) => {
            nextPr.set(nb.to, (nextPr.get(nb.to) || 0) + 0.85 * uRank * (nb.weight / totalW));
          });
        } else {
          rawNodes.forEach((v) => {
            nextPr.set(v.id, (nextPr.get(v.id) || 0) + (0.85 * uRank) / N);
          });
        }
      });
      pr = nextPr;
    }

    // Label Propagation Community Detection (8 sweeps)
    const comm = new Map<string, number>();
    rawNodes.forEach((n, idx) => comm.set(n.id, idx % 6));
    for (let sweep = 0; sweep < 8; sweep++) {
      rawNodes.forEach((u) => {
        const neighbors = adj.get(u.id) || [];
        if (neighbors.length === 0) return;
        const scores = new Map<number, number>();
        neighbors.forEach((nb) => {
          const c = comm.get(nb.to) ?? 0;
          scores.set(c, (scores.get(c) || 0) + nb.weight);
        });
        let bestC = comm.get(u.id) ?? 0;
        let bestS = -1;
        scores.forEach((s, c) => {
          if (s > bestS) {
            bestS = s;
            bestC = c;
          }
        });
        comm.set(u.id, bestC);
      });
    }

    // Compact community IDs to 0..k-1
    const uniqueComms = Array.from(new Set(Array.from(comm.values())));
    const commRemap = new Map<number, number>();
    uniqueComms.forEach((c, idx) => commRemap.set(c, idx));

    // Deterministic Force-Directed Simulation (Fruchterman-Reingold style)
    const W = 820;
    const H = 460;
    const pos = new Map<string, { x: number; y: number }>();
    rawNodes.forEach((n, i) => {
      const angle = (i / Math.max(1, rawNodes.length)) * Math.PI * 2 + layoutSeed * 0.4;
      const radius = 140 + ((i % 3) * 32);
      pos.set(n.id, {
        x: W / 2 + Math.cos(angle) * radius,
        y: H / 2 + Math.sin(angle) * radius * 0.78,
      });
    });

    const kIdeal = Math.sqrt((W * H) / Math.max(2, rawNodes.length)) * 0.75;
    for (let step = 0; step < 90; step++) {
      const disp = new Map<string, { dx: number; dy: number }>();
      rawNodes.forEach((n) => disp.set(n.id, { dx: 0, dy: 0 }));
      const temp = 28 * (1 - step / 95);

      // Repulsion
      for (let i = 0; i < rawNodes.length; i++) {
        for (let j = i + 1; j < rawNodes.length; j++) {
          const u = rawNodes[i].id;
          const v = rawNodes[j].id;
          const pu = pos.get(u)!;
          const pv = pos.get(v)!;
          const dx = pu.x - pv.x;
          const dy = pu.y - pv.y;
          const dist = Math.max(14, Math.hypot(dx, dy));
          const force = (kIdeal * kIdeal) / dist;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          disp.get(u)!.dx += fx;
          disp.get(u)!.dy += fy;
          disp.get(v)!.dx -= fx;
          disp.get(v)!.dy -= fy;
        }
      }

      // Edge attraction
      rawEdges.forEach((e) => {
        const pu = pos.get(e.source);
        const pv = pos.get(e.target);
        if (!pu || !pv) return;
        const dx = pu.x - pv.x;
        const dy = pu.y - pv.y;
        const dist = Math.max(12, Math.hypot(dx, dy));
        const force = ((dist * dist) / kIdeal) * (0.4 + e.weight);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        disp.get(e.source)!.dx -= fx;
        disp.get(e.source)!.dy -= fy;
        disp.get(e.target)!.dx += fx;
        disp.get(e.target)!.dy += fy;
      });

      // Gentle gravity toward center + apply clamped displacement
      rawNodes.forEach((n) => {
        const p = pos.get(n.id)!;
        const d = disp.get(n.id)!;
        d.dx += (W / 2 - p.x) * 0.08;
        d.dy += (H / 2 - p.y) * 0.08;
        const dLen = Math.max(0.01, Math.hypot(d.dx, d.dy));
        p.x = Math.max(58, Math.min(W - 58, p.x + (d.dx / dLen) * Math.min(dLen, temp)));
        p.y = Math.max(48, Math.min(H - 48, p.y + (d.dy / dLen) * Math.min(dLen, temp)));
      });
    }

    const finalNodes: GraphNode[] = rawNodes.map((n) => {
      const p = pos.get(n.id)!;
      return {
        ...n,
        pageRank: pr.get(n.id) || 0,
        degree: (adj.get(n.id) || []).length,
        community: commRemap.get(comm.get(n.id) ?? 0) ?? 0,
        x: p.x,
        y: p.y,
      };
    });

    finalNodes.sort((a, b) => b.pageRank - a.pageRank);

    return {
      nodes: finalNodes,
      edges: rawEdges,
      communitiesCount: uniqueComms.length,
    };
  }, [dataset.cleanedRows, dataset.profile.columns, graphMode, minEdgeStrength, layoutSeed]);

  // Synchronize default selected node and path endpoints when nodes change
  useEffect(() => {
    if (nodes.length > 0) {
      if (!selectedNodeId || !nodes.some((n) => n.id === selectedNodeId)) {
        setSelectedNodeId(nodes[0].id);
      }
      if (!pathStart || !nodes.some((n) => n.id === pathStart)) {
        setPathStart(nodes[0].id);
      }
      if (!pathEnd || !nodes.some((n) => n.id === pathEnd)) {
        setPathEnd(nodes[Math.min(1, nodes.length - 1)].id);
      }
    } else {
      setSelectedNodeId(null);
    }
  }, [nodes]);

  // Dijkstra Shortest Weighted Influence Path
  const shortestPathResult = useMemo(() => {
    if (!pathStart || !pathEnd || pathStart === pathEnd || nodes.length === 0) {
      return { pathNodes: [] as string[], pathEdges: new Set<string>(), totalCost: 0 };
    }

    const adj = new Map<string, { to: string; edgeId: string; cost: number }[]>();
    nodes.forEach((n) => adj.set(n.id, []));
    edges.forEach((e) => {
      const cost = -Math.log(Math.max(0.05, Math.min(0.99, e.weight)));
      adj.get(e.source)?.push({ to: e.target, edgeId: e.id, cost });
      adj.get(e.target)?.push({ to: e.source, edgeId: e.id, cost });
    });

    const dist = new Map<string, number>();
    const prev = new Map<string, { node: string; edgeId: string } | null>();
    const visited = new Set<string>();
    nodes.forEach((n) => {
      dist.set(n.id, Infinity);
      prev.set(n.id, null);
    });
    dist.set(pathStart, 0);

    for (let i = 0; i < nodes.length; i++) {
      let u: string | null = null;
      let bestD = Infinity;
      nodes.forEach((n) => {
        if (!visited.has(n.id) && (dist.get(n.id) ?? Infinity) < bestD) {
          bestD = dist.get(n.id)!;
          u = n.id;
        }
      });
      if (!u || u === pathEnd) break;
      visited.add(u);

      (adj.get(u) || []).forEach((nb) => {
        const alt = bestD + nb.cost;
        if (alt < (dist.get(nb.to) ?? Infinity)) {
          dist.set(nb.to, alt);
          prev.set(nb.to, { node: u!, edgeId: nb.edgeId });
        }
      });
    }

    const pathNodes: string[] = [];
    const pathEdges = new Set<string>();
    let curr: string | null = pathEnd;
    if ((dist.get(pathEnd) ?? Infinity) < Infinity) {
      while (curr) {
        pathNodes.unshift(curr);
        const p = prev.get(curr);
        if (p) {
          pathEdges.add(p.edgeId);
          curr = p.node;
        } else {
          curr = null;
        }
      }
    }

    return {
      pathNodes,
      pathEdges,
      totalCost: dist.get(pathEnd) ?? Infinity,
    };
  }, [nodes, edges, pathStart, pathEnd]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const egoEdges = useMemo(() => {
    if (!selectedNodeId) return [];
    return edges
      .filter((e) => e.source === selectedNodeId || e.target === selectedNodeId)
      .sort((a, b) => b.weight - a.weight);
  }, [edges, selectedNodeId]);

  const filteredTableNodes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return nodes;
    return nodes.filter((n) => n.label.toLowerCase().includes(q) || n.group.toLowerCase().includes(q));
  }, [nodes, searchQuery]);

  const handleExportGraphJSON = () => {
    const payload = {
      dataset: dataset.name,
      mode: graphMode,
      minEdgeStrength,
      generatedAt: new Date().toISOString(),
      nodes: nodes.map(({ id, label, group, pageRank, degree, community }) => ({
        id,
        label,
        group,
        pageRank: Number(pageRank.toFixed(4)),
        degree,
        community,
      })),
      edges: edges.map(({ source, target, weight, signedWeight, label }) => ({
        source,
        target,
        weight: Number(weight.toFixed(4)),
        signedWeight: Number(signedWeight.toFixed(4)),
        label,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `datalens_knowledge_graph_${graphMode}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cardBg = isDark
    ? 'bg-slate-900 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900';

  const mutedText = isDark ? 'text-slate-400' : 'text-slate-500';
  const subSurface = isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200';

  return (
    <div className="space-y-6 pb-12">
      {/* Header Section */}
      <div className={`rounded-2xl border p-6 ${cardBg}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className={`flex flex-wrap items-center gap-2 text-xs font-medium ${mutedText}`}>
              <span className="text-blue-500 font-semibold">Topological Intelligence</span>
              <span aria-hidden="true">·</span>
              <span>PageRank Centrality</span>
              <span aria-hidden="true">·</span>
              <span>Dijkstra Influence Paths</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Knowledge Graph &amp; Entity Network
            </h1>
            <p className={`text-sm max-w-2xl ${mutedText}`}>
              Force-directed topology derived directly from Pearson correlation, categorical Eta-squared variance, and entity co-occurrence lift across {dataset.profile.totalRows.toLocaleString()} records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className={`flex items-center p-1 rounded-xl border ${subSurface}`}>
              <button
                onClick={() => setGraphMode('features')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  graphMode === 'features'
                    ? 'bg-blue-600 text-white'
                    : `${mutedText} hover:text-slate-200`
                }`}
              >
                Feature Topology
              </button>
              <button
                onClick={() => setGraphMode('entities')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  graphMode === 'entities'
                    ? 'bg-blue-600 text-white'
                    : `${mutedText} hover:text-slate-200`
                }`}
              >
                Entity Co-Occurrence
              </button>
            </div>

            <button
              onClick={() => setLayoutSeed((s) => s + 1)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-settle Layout
            </button>

            <button
              onClick={handleExportGraphJSON}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Export Graph JSON
            </button>
          </div>
        </div>

        {/* Filter & Shortest Path Controls */}
        <div className="mt-5 pt-5 border-t border-slate-800/40 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className={`font-medium flex items-center gap-1.5 ${mutedText}`}>
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Minimum Edge Strength (|r| / Lift)
              </span>
              <span className="font-mono tabular-nums font-semibold text-blue-500">
                {minEdgeStrength.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.75"
              step="0.05"
              value={minEdgeStrength}
              onChange={(e) => setMinEdgeStrength(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer h-1.5 rounded-lg"
            />
          </div>

          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`text-xs font-medium block mb-1 ${mutedText}`}>
                Influence Path Origin
              </label>
              <select
                value={pathStart}
                onChange={(e) => setPathStart(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${subSurface}`}
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label} ({n.group})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`text-xs font-medium block mb-1 ${mutedText}`}>
                Influence Path Target
              </label>
              <select
                value={pathEnd}
                onChange={(e) => setPathEnd(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${subSurface}`}
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label} ({n.group})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`rounded-2xl border p-4 ${cardBg}`}>
          <div className={`text-xs font-medium ${mutedText}`}>Graph Vertices</div>
          <div className="text-2xl font-bold font-mono tabular-nums mt-1">{nodes.length}</div>
          <div className={`text-xs mt-1 ${mutedText}`}>{graphMode === 'features' ? 'Features & dimensions' : 'Top entity hubs'}</div>
        </div>
        <div className={`rounded-2xl border p-4 ${cardBg}`}>
          <div className={`text-xs font-medium ${mutedText}`}>Active Relationships</div>
          <div className="text-2xl font-bold font-mono tabular-nums mt-1 text-blue-500">{edges.length}</div>
          <div className={`text-xs mt-1 ${mutedText}`}>Threshold ≥ {minEdgeStrength.toFixed(2)}</div>
        </div>
        <div className={`rounded-2xl border p-4 ${cardBg}`}>
          <div className={`text-xs font-medium ${mutedText}`}>Modularity Communities</div>
          <div className="text-2xl font-bold font-mono tabular-nums mt-1 text-emerald-500">{communitiesCount}</div>
          <div className={`text-xs mt-1 ${mutedText}`}>Label propagation clusters</div>
        </div>
        <div className={`rounded-2xl border p-4 ${cardBg}`}>
          <div className={`text-xs font-medium ${mutedText}`}>Primary Hub (PageRank)</div>
          <div className="text-lg font-bold truncate mt-1" title={nodes[0]?.label || 'None'}>
            {nodes[0]?.label || 'None'}
          </div>
          <div className={`text-xs font-mono tabular-nums mt-1 ${mutedText}`}>
            PR {nodes[0] ? (nodes[0].pageRank * 100).toFixed(1) : '0.0'}% · deg {nodes[0]?.degree ?? 0}
          </div>
        </div>
      </div>

      {/* Main Split: Force-Directed Network Canvas + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Interactive Topology SVG Canvas */}
        <div className={`lg:col-span-8 rounded-2xl border p-5 flex flex-col ${cardBg}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-base font-bold">Topological Force-Directed Network</h2>
              <p className={`text-xs ${mutedText}`}>
                Click any vertex to inspect its ego-network. Amber edges trace the weighted Dijkstra shortest path.
              </p>
            </div>
            {shortestPathResult.pathNodes.length >= 2 && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-amber-500 font-semibold">
                <Compass className="w-3.5 h-3.5" />
                <span>
                  {shortestPathResult.pathNodes
                    .map((id) => nodes.find((n) => n.id === id)?.label || id)
                    .join(' → ')}
                </span>
              </div>
            )}
          </div>

          <div className={`relative flex-1 min-h-[430px] rounded-xl border overflow-hidden ${subSurface}`}>
            {nodes.length === 0 ? (
              <div className="h-full min-h-[430px] flex flex-col items-center justify-center p-6 text-center">
                <Share2 className={`w-10 h-10 mb-3 ${mutedText}`} />
                <p className="text-sm font-semibold">No vertices available for this mode</p>
                <p className={`text-xs mt-1 max-w-sm ${mutedText}`}>
                  Lower the minimum edge strength slider or switch between Feature Topology and Entity Co-Occurrence.
                </p>
              </div>
            ) : (
              <svg viewBox="0 0 820 460" className="w-full h-full min-h-[430px] select-none">
                {/* Edges */}
                {edges.map((e) => {
                  const s = nodes.find((n) => n.id === e.source);
                  const t = nodes.find((n) => n.id === e.target);
                  if (!s || !t) return null;

                  const isOnPath = shortestPathResult.pathEdges.has(e.id);
                  const isConnectedToSelected =
                    selectedNodeId && (e.source === selectedNodeId || e.target === selectedNodeId);
                  const dimmed =
                    selectedNodeId && !isConnectedToSelected && !isOnPath;

                  const strokeColor = isOnPath
                    ? '#f59e0b'
                    : e.signedWeight < 0
                    ? '#f43f5e'
                    : '#3b82f6';

                  const midX = (s.x + t.x) / 2;
                  const midY = (s.y + t.y) / 2;

                  return (
                    <g key={e.id} opacity={dimmed ? 0.14 : isOnPath || isConnectedToSelected ? 0.95 : 0.45}>
                      <line
                        x1={s.x}
                        y1={s.y}
                        x2={t.x}
                        y2={t.y}
                        stroke={strokeColor}
                        strokeWidth={isOnPath ? 3.2 : 1 + e.weight * 3}
                        strokeDasharray={e.signedWeight < 0 ? '5 4' : undefined}
                      />
                      {(isConnectedToSelected || isOnPath) && (
                        <g transform={`translate(${midX}, ${midY})`}>
                          <rect
                            x="-30"
                            y="-9"
                            width="60"
                            height="18"
                            rx="5"
                            fill={isDark ? '#0f172a' : '#ffffff'}
                            stroke={strokeColor}
                            strokeWidth="0.8"
                          />
                          <text
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="600"
                            fill={isDark ? '#e2e8f0' : '#0f172a'}
                          >
                            {e.label}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Nodes */}
                {nodes.map((n) => {
                  const isSelected = n.id === selectedNodeId;
                  const isNeighbor = egoEdges.some((e) => e.source === n.id || e.target === n.id);
                  const isOnPath = shortestPathResult.pathNodes.includes(n.id);
                  const dimmed = selectedNodeId && !isSelected && !isNeighbor && !isOnPath;

                  const radius = 12 + Math.min(18, n.pageRank * 140);
                  const fill = communityPalette[n.community % communityPalette.length];

                  return (
                    <g
                      key={n.id}
                      transform={`translate(${n.x}, ${n.y})`}
                      onClick={() => setSelectedNodeId(n.id)}
                      className="cursor-pointer transition-opacity duration-150"
                      opacity={dimmed ? 0.25 : 1}
                    >
                      {(isSelected || isOnPath) && (
                        <circle
                          r={radius + 6}
                          fill="none"
                          stroke={isSelected ? '#ffffff' : '#f59e0b'}
                          strokeWidth="2"
                          strokeDasharray={isOnPath && !isSelected ? '3 3' : undefined}
                        />
                      )}
                      <circle
                        r={radius}
                        fill={fill}
                        fillOpacity={0.9}
                        stroke={isDark ? '#0f172a' : '#ffffff'}
                        strokeWidth="2"
                      />
                      <text
                        y={radius + 14}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight={isSelected ? '700' : '600'}
                        fill={isDark ? '#f1f5f9' : '#0f172a'}
                      >
                        {n.label.length > 18 ? n.label.slice(0, 16) + '…' : n.label}
                      </text>
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="700"
                        fill="#ffffff"
                      >
                        {n.degree}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          <div className={`mt-3 flex flex-wrap items-center justify-between gap-3 text-xs ${mutedText}`}>
            <div className="flex flex-wrap items-center gap-4">
              <span>Node size = PageRank centrality</span>
              <span>·</span>
              <span>Color = Modularity community</span>
              <span>·</span>
              <span className="text-rose-400">Dashed line = Inverse correlation</span>
            </div>
            <span className="font-mono tabular-nums">
              {shortestPathResult.pathNodes.length >= 2
                ? `Path distance: ${shortestPathResult.totalCost.toFixed(2)} (${shortestPathResult.pathNodes.length - 1} hops)`
                : 'Select distinct origin & target for path trace'}
            </span>
          </div>
        </div>

        {/* Right: Ego-Network & Node Inspector */}
        <div className={`lg:col-span-4 rounded-2xl border p-5 flex flex-col justify-between ${cardBg}`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-blue-500" />
                Vertex Inspector
              </h2>
              {selectedNode && (
                <span className={`text-xs font-mono tabular-nums ${mutedText}`}>
                  Community {selectedNode.community + 1}
                </span>
              )}
            </div>

            {selectedNode ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border ${subSurface}`}>
                  <div className="text-xs font-medium text-blue-500">{selectedNode.group}</div>
                  <div className="text-lg font-bold mt-0.5 break-words">{selectedNode.label}</div>
                  <div className={`text-xs mt-1 ${mutedText}`}>{selectedNode.meta}</div>

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/40">
                    <div>
                      <div className={`text-[11px] ${mutedText}`}>PageRank</div>
                      <div className="text-sm font-mono font-bold tabular-nums">
                        {(selectedNode.pageRank * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className={`text-[11px] ${mutedText}`}>Degree</div>
                      <div className="text-sm font-mono font-bold tabular-nums">{selectedNode.degree}</div>
                    </div>
                    <div>
                      <div className={`text-[11px] ${mutedText}`}>Kind</div>
                      <div className="text-sm font-semibold capitalize">{selectedNode.kind}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold">Connected Neighborhood ({egoEdges.length})</span>
                    <button
                      onClick={() => setPathStart(selectedNode.id)}
                      className="text-xs font-semibold text-blue-500 hover:underline"
                    >
                      Set as path origin
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                    {egoEdges.length === 0 ? (
                      <div className={`text-xs p-4 rounded-xl border text-center ${subSurface} ${mutedText}`}>
                        No edges exceed threshold {minEdgeStrength.toFixed(2)}.
                      </div>
                    ) : (
                      egoEdges.map((edge) => {
                        const neighborId = edge.source === selectedNode.id ? edge.target : edge.source;
                        const neighbor = nodes.find((n) => n.id === neighborId);
                        if (!neighbor) return null;
                        return (
                          <button
                            key={edge.id}
                            onClick={() => setSelectedNodeId(neighbor.id)}
                            className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-colors ${subSurface} hover:border-blue-500/50`}
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-semibold truncate">{neighbor.label}</div>
                              <div className={`text-[11px] truncate ${mutedText}`}>{neighbor.group}</div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs tabular-nums">
                              <span className={edge.signedWeight < 0 ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                                {edge.label}
                              </span>
                              <ArrowRight className="w-3 h-3 opacity-60" />
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`p-6 rounded-xl border text-center text-xs ${subSurface} ${mutedText}`}>
                Select a node on the topology canvas to inspect its neighborhood and PageRank metrics.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Centrality Ranking Matrix Table */}
      <div className={`rounded-2xl border p-5 ${cardBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              Structural Centrality Leaderboard
            </h2>
            <p className={`text-xs ${mutedText}`}>
              Sorted by power-iteration PageRank centrality across active dataset relationships.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${mutedText}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter vertices..."
              className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${subSurface}`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                <th className="py-2.5 pr-4 font-semibold">Vertex</th>
                <th className="py-2.5 px-4 font-semibold">Category</th>
                <th className="py-2.5 px-4 font-semibold text-right">Community</th>
                <th className="py-2.5 px-4 font-semibold text-right">Degree</th>
                <th className="py-2.5 pl-4 font-semibold text-right">PageRank Score</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800/70' : 'divide-slate-100'}`}>
              {filteredTableNodes.map((n) => (
                <tr
                  key={n.id}
                  onClick={() => setSelectedNodeId(n.id)}
                  className={`cursor-pointer transition-colors ${
                    n.id === selectedNodeId
                      ? isDark
                        ? 'bg-blue-950/40'
                        : 'bg-blue-50'
                      : isDark
                      ? 'hover:bg-slate-800/50'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-2.5 pr-4 font-semibold">{n.label}</td>
                  <td className={`py-2.5 px-4 ${mutedText}`}>{n.group}</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                    C{n.community + 1}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums">{n.degree}</td>
                  <td className="py-2.5 pl-4 text-right font-mono tabular-nums font-semibold text-blue-500">
                    {(n.pageRank * 100).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
