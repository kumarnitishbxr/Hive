import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useAiHealthReport, useProjects, useSprints, useSprintBurndown } from '../../hooks/useReactQueries';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { ShieldAlert, TrendingUp, Users, CheckSquare, Zap, Calculator } from 'lucide-react';
import { Skeleton, CardSkeleton } from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';

export const DashboardOverview: React.FC = () => {
  const role = useSelector((state: RootState) => state.auth.role);
  const startupId = useSelector((state: RootState) => state.auth.startupId);
  const activeWorkspaceId = useSelector((state: RootState) => state.workspace.activeWorkspaceId);
  const canLoadHealth = Boolean(startupId && (role === 'Founder' || role === 'Co-Founder'));
  const { data: healthData, isLoading, isError, refetch } = useAiHealthReport(canLoadHealth);
  const { data: projects = [] } = useProjects(activeWorkspaceId);
  const primaryProjectId = projects[0]?._id || null;
  const { data: sprints = [] } = useSprints(primaryProjectId);
  const activeSprintId = sprints[0]?._id || null;
  const { data: burndown = [] } = useSprintBurndown(activeSprintId);

  // Runway scenarios
  const [monthlyBurn, setMonthlyBurn] = useState(12000);
  const [currentCash, setCurrentCash] = useState(150000);
  const [simulatedFunding, setSimulatedFunding] = useState(0);
  const [newHiresCost, setNewHiresCost] = useState(0);

  // Intersection Observer for Charts
  const [chartRef, isChartVisible] = useIntersectionObserver({ threshold: 0.05, triggerOnce: true });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="liquid-glass p-6 rounded-xl flex flex-col items-center justify-center text-center h-64">
            <Skeleton className="h-28 w-28 rounded-full" />
          </div>
          <div className="liquid-glass p-6 rounded-xl md:col-span-2 h-64">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <ErrorState onRetry={refetch} message="Failed to load dashboard health metrics." />
      </div>
    );
  }

  // Scenario computation
  const baseRunwayMonths = monthlyBurn > 0 ? (currentCash / monthlyBurn) : 0;
  const simulatedBurn = monthlyBurn + newHiresCost;
  const simulatedRunwayMonths = simulatedBurn > 0 ? ((currentCash + simulatedFunding) / simulatedBurn) : 0;

  return (
    <div className="space-y-6">
      {/* Upper Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="liquid-glass p-6 relative overflow-hidden">
          <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Zap size={16} />
          </div>
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">RUNWAY DEPLETION</span>
          <h3 className="text-2xl font-bold text-foreground mt-2">
            {baseRunwayMonths.toFixed(1)} <span className="text-xs text-muted-foreground font-normal">Months</span>
          </h3>
          <p className="text-[10px] text-blue-500 font-semibold mt-1">Based on current cash metrics</p>
        </div>

        <div className="liquid-glass p-6 relative overflow-hidden">
          <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <TrendingUp size={16} />
          </div>
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">MONTHLY BURN RATE</span>
          <h3 className="text-2xl font-bold text-foreground mt-2">${monthlyBurn.toLocaleString()}</h3>
          <p className="text-[10px] text-emerald-500 dark:text-emerald-400 font-semibold mt-1">Operational server/staff overhead</p>
        </div>

        <div className="liquid-glass p-6 relative overflow-hidden">
          <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
            <Users size={16} />
          </div>
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">CUSTOMER INTERVIEWS</span>
          <h3 className="text-2xl font-bold text-foreground mt-2">{healthData?.metricsSnapshot?.totalInterviews || 0}</h3>
          <p className="text-[10px] text-purple-500 dark:text-purple-400 font-semibold mt-1">Validated customer insights</p>
        </div>

        <div className="liquid-glass p-6 relative overflow-hidden">
          <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
            <CheckSquare size={16} />
          </div>
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">TASK VELOCITY</span>
          <h3 className="text-2xl font-bold text-foreground mt-2">
            {healthData?.metricsSnapshot?.completedTasks || 0} / {healthData?.metricsSnapshot?.totalTasks || 0}
          </h3>
          <p className="text-[10px] text-blue-500 font-semibold mt-1">Backlog tasks resolved</p>
        </div>
      </div>

      {/* Main Core Layout: Health Score Dial & Burndown Graph */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Health score dial (glowing ring) */}
        <div className="liquid-glass p-6 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-6">Workspace Health Score</span>
          
          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* SVG Glowing Radial Meter */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                className="stroke-gray-100 dark:stroke-white/5"
                strokeWidth="12"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                className="stroke-blue-500"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={440}
                strokeDashoffset={440 - (440 * (healthData?.overallScore || 70)) / 100}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-4xl font-extrabold text-foreground">{healthData?.overallScore}</span>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5">OUT OF 100</p>
            </div>
          </div>

          <div className="mt-6 w-full space-y-2 font-sans">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Risk Assessment:</span>
              <span 
                className="font-bold px-2 py-0.5 rounded text-[10px]"
                style={{ backgroundColor: `${healthData?.riskColor}20`, color: healthData?.riskColor }}
              >
                {healthData?.riskLevel} RISK
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-left text-[10px] pt-2 border-t border-border">
              <div>
                <span className="text-muted-foreground block">VALIDATION</span>
                <span className="text-foreground font-bold">{healthData?.breakdown?.validation}%</span>
              </div>
              <div>
                <span className="text-muted-foreground block">EXECUTION</span>
                <span className="text-foreground font-bold">{healthData?.breakdown?.execution}%</span>
              </div>
              <div className="mt-2">
                <span className="text-muted-foreground block">ROADMAP</span>
                <span className="text-foreground font-bold">{healthData?.breakdown?.planning}%</span>
              </div>
              <div className="mt-2">
                <span className="text-muted-foreground block">TRACTION</span>
                <span className="text-foreground font-bold">{healthData?.breakdown?.traction}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Burndown area graph */}
        <div ref={chartRef as any} className="liquid-glass p-6 md:col-span-2">
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-4">Sprint Ideal vs Actual Burndown Curve</span>
          <div className="h-56">
            {isChartVisible ? (
              burndown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={burndown}>
                    <defs>
                      <linearGradient id="colorIdeal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={9} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={9} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                      labelStyle={{ fontSize: '10px', color: 'var(--muted-foreground)' }}
                    />
                    <Area type="monotone" dataKey="ideal" name="Ideal Remaining" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorIdeal)" />
                    <Area type="monotone" dataKey="actual" name="Actual Remaining" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full rounded-xl border border-dashed border-border bg-muted/35 flex items-center justify-center px-6 text-center">
                  <p className="text-xs text-muted-foreground">
                    No sprint burndown data is available yet. Create a sprint with estimated task hours to render this chart.
                  </p>
                </div>
              )
            ) : (
              <Skeleton className="h-full w-full" />
            )}
          </div>
        </div>
      </div>

      {/* Dynamic AI insights panels & Runway calculator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* AI Actionable Insights (Module 14) */}
        <div className="liquid-glass p-6 md:col-span-2 space-y-3">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <ShieldAlert size={16} className="text-amber-500 animate-pulse" />
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">AI Operational Advisories</span>
          </div>
          <div className="space-y-3">
            {healthData?.insights?.map((ins: string, idx: number) => (
              <div key={idx} className="flex gap-3 text-xs bg-muted border border-border p-3 rounded-lg">
                <span className="text-amber-400 font-bold">⚠️</span>
                <p className="text-foreground/90 leading-relaxed font-sans">{ins}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Runway Scenario Planner (Module 9 premium widget) */}
        <div className="liquid-glass p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Calculator size={16} className="text-blue-500" />
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Runway Scenario Simulator</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-muted-foreground mb-1">Current Cash Buffer ($)</label>
              <input
                type="number"
                className="w-full glass-input text-xs"
                value={currentCash}
                onChange={(e) => setCurrentCash(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-muted-foreground mb-1">Monthly Burn Rate ($)</label>
              <input
                type="number"
                className="w-full glass-input text-xs"
                value={monthlyBurn}
                onChange={(e) => setMonthlyBurn(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-muted-foreground mb-1">Simulated Capital Injection ($)</label>
              <input
                type="number"
                placeholder="e.g. Seed investment"
                className="w-full glass-input text-xs"
                value={simulatedFunding}
                onChange={(e) => setSimulatedFunding(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-muted-foreground mb-1">Simulated Hiring / Ops Cost ($/mo)</label>
              <input
                type="number"
                placeholder="e.g. New developer hires"
                className="w-full glass-input text-xs"
                value={newHiresCost}
                onChange={(e) => setNewHiresCost(Number(e.target.value))}
              />
            </div>

            <div className="pt-3 border-t border-border text-center bg-blue-500/5 p-3 rounded-lg border border-blue-500/10">
              <span className="text-[9px] text-blue-500 font-bold block uppercase tracking-wider mb-1">PROJECTED RUNWAY</span>
              <span className="text-lg font-black text-foreground">{simulatedRunwayMonths.toFixed(1)} Months</span>
              <p className="text-[9px] text-muted-foreground mt-1">Based on simulated cash flow projections</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
