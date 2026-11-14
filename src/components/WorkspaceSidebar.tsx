import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  ShieldCheck,
  X,
} from 'lucide-react';
import { STUDIO_NAV_GROUPS } from '../config/navigation';
import { DatasetState } from '../types/dataset';
import { useTheme } from '../context/ThemeContext';

interface WorkspaceSidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  dataset: DatasetState | null;
  isStreaming: boolean;
  onToggleStream: () => void;
  streamEventsCount: number;
  onOpenSecurity: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  currentTab,
  onSelectTab,
  dataset,
  isStreaming,
  onToggleStream,
  streamEventsCount,
  onOpenSecurity,
  mobileOpen,
  onCloseMobile,
  collapsed,
}) => {
  const { isDark } = useTheme();
  const [filterText, setFilterText] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (id: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredGroups = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return STUDIO_NAV_GROUPS;
    return STUDIO_NAV_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.categoryLabel.toLowerCase().includes(q)
      ),
    })).filter((g) => g.items.length > 0);
  }, [filterText]);

  const surfaceBg = isDark
    ? 'bg-slate-950 border-slate-800/90 text-slate-200'
    : 'bg-white border-slate-200 text-slate-800';

  const mutedText = isDark ? 'text-slate-400' : 'text-slate-500';

  const renderSidebarBody = (isMobileDrawer: boolean) => (
    <div className="flex flex-col h-full">
      {isMobileDrawer && (
        <div className={`flex items-center justify-between px-4 h-14 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <span className="font-bold text-sm tracking-tight">Studios</span>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg hover:bg-slate-800/40"
            aria-label="Close navigation menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Studio Filter */}
      {!collapsed && (
        <div className="p-3">
          <div className="relative">
            <Search className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${mutedText}`} />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter studios..."
              className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>
        </div>
      )}

      {/* Categorized Navigation Tree */}
      <nav className="flex-1 overflow-y-auto px-2.5 pb-4 space-y-4">
        {filteredGroups.map((group) => {
          const isGroupCollapsed = collapsedGroups[group.id] && !filterText.trim();
          return (
            <div key={group.id}>
              {!collapsed && (
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold tracking-wide ${mutedText} hover:text-blue-500 transition-colors`}
                >
                  <span>{group.label}</span>
                  {isGroupCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              )}

              {!isGroupCollapsed && (
                <div className="mt-1 space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    const hasIssueBadge =
                      item.id === 'quality' &&
                      dataset &&
                      (dataset.profile.duplicateRows > 0 || dataset.profile.totalMissingValues > 0);

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectTab(item.id);
                          if (isMobileDrawer) onCloseMobile();
                        }}
                        title={collapsed ? item.label : undefined}
                        className={`w-full flex items-center ${
                          collapsed ? 'justify-center px-2' : 'justify-between px-2.5'
                        } py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                          isActive
                            ? 'bg-blue-600 text-white font-semibold'
                            : isDark
                            ? 'text-slate-300 hover:bg-slate-900 hover:text-white'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? 'text-white' : isDark ? 'text-slate-400' : 'text-slate-500'
                            }`}
                          />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </span>
                        {!collapsed && hasIssueBadge && (
                          <span className={`text-[10px] font-mono tabular-nums ${isActive ? 'text-blue-100' : 'text-amber-500'}`}>
                            Audit
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Workspace Controls: Dataset Stream & Governance */}
      {dataset && !collapsed && (
        <div className={`p-3 border-t space-y-2.5 ${isDark ? 'border-slate-800/90 bg-slate-950' : 'border-slate-200 bg-slate-50/70'}`}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold truncate max-w-[140px]" title={dataset.profile.fileName}>
              {dataset.profile.fileName}
            </span>
            <span className={`font-mono tabular-nums text-[11px] ${mutedText}`}>
              {dataset.cleanedRows.length.toLocaleString()}r
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleStream}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap ${
                isStreaming
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : isDark
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
              }`}
            >
              {isStreaming ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 text-emerald-500" />}
              <span>{isStreaming ? `Streaming (+${streamEventsCount})` : 'Stream Sim'}</span>
            </button>

            <button
              onClick={onOpenSecurity}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 whitespace-nowrap ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800'
                  : 'bg-white hover:bg-slate-100 text-emerald-700 border border-slate-200'
              }`}
              title="Security & PII Governance Sentinel"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SOC 2</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 border-r transition-all duration-200 sticky top-14 h-[calc(100vh-3.5rem)] ${
          collapsed ? 'w-16' : 'w-64'
        } ${surfaceBg}`}
      >
        {renderSidebarBody(false)}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <aside className={`relative w-72 max-w-[85vw] h-full border-r z-10 ${surfaceBg}`}>
            {renderSidebarBody(true)}
          </aside>
        </div>
      )}
    </>
  );
};
