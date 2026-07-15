import React, { useState, useEffect } from 'react';
import { aiService, projectService } from '../../services/api';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { ShieldAlert, TrendingUp, Users, CheckSquare, Zap, Calculator } from 'lucide-react';

export const DashboardOverview: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [burndown, setBurndown] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Runway scenarios
  const [monthlyBurn, setMonthlyBurn] = useState(12000);
  const [currentCash, setCurrentCash] = useState(150000);
  const [simulatedFunding, setSimulatedFunding] = useState(0);
  const [newHiresCost, setNewHiresCost] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const hRes = await aiService.getHealthReport();
        setHealthData(hRes.data);

        // Seed details or get sprint data
        const mockBurndown = [
          { date: 'Day 1', ideal: 100, actual: 100 },
          { date: 'Day 3', ideal: 80, actual: 85 },
          { date: 'Day 6', ideal: 60, actual: 55 },
          { date: 'Day 9', ideal: 40, actual: 30 },
          { date: 'Day 12', ideal: 20, actual: 15 },
          { date: 'Day 14', ideal: 0, actual: 0 }
        ];
        setBurndown(mockBurndown);
      } catch (err) {
        console.error('Failed to load dashboard statistics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
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
        <div className="liquid-glass p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Zap size={16} />
          </div>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">RUNWAY DEPLETION</span>
          <h3 className="text-2xl font-bold text-white mt-2">
            {baseRunwayMonths.toFixed(1)} <span className="text-xs text-gray-400 font-normal">Months</span>
          </h3>
          <p className="text-[10px] text-indigo-400 font-semibold mt-1">Based on current cash metrics</p>
        </div>

        <div className="liquid-glass p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <TrendingUp size={16} />
          </div>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">MONTHLY BURN RATE</span>
          <h3 className="text-2xl font-bold text-white mt-2">${monthlyBurn.toLocaleString()}</h3>
          <p className="text-[10px] text-emerald-400 font-semibold mt-1">Operational server/staff overhead</p>
        </div>

        <div className="liquid-glass p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Users size={16} />
          </div>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">CUSTOMER INTERVIEWS</span>
          <h3 className="text-2xl font-bold text-white mt-2">{healthData?.metricsSnapshot?.totalInterviews || 0}</h3>
          <p className="text-[10px] text-purple-400 font-semibold mt-1">Validated customer insights</p>
        </div>

        <div className="liquid-glass p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <CheckSquare size={16} />
          </div>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">TASK VELOCITY</span>
          <h3 className="text-2xl font-bold text-white mt-2">
            {healthData?.metricsSnapshot?.completedTasks || 0} / {healthData?.metricsSnapshot?.totalTasks || 0}
          </h3>
          <p className="text-[10px] text-indigo-400 font-semibold mt-1">Backlog tasks resolved</p>
        </div>
      </div>

      {/* Main Core Layout: Health Score Dial & Burndown Graph */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Health score dial (Liquid glass glowing ring) */}
        <div className="liquid-glass p-6 rounded-xl flex flex-col items-center justify-center text-center">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-6">Workspace Health Score</span>
          
          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* SVG Glowing Radial Meter */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                className="stroke-white/5"
                strokeWidth="12"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                className="stroke-indigo-500"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={440}
                strokeDashoffset={440 - (440 * (healthData?.overallScore || 70)) / 100}
                strokeLinecap="round"
                style={{
                  filter: 'drop-shadow(0px 0px 8px rgba(99, 102, 241, 0.6))',
                  transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-4xl font-extrabold text-white">{healthData?.overallScore}</span>
              <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">OUT OF 100</p>
            </div>
          </div>

          <div className="mt-6 w-full space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Risk Assessment:</span>
              <span 
                className="font-bold px-2 py-0.5 rounded text-[10px]"
                style={{ backgroundColor: `${healthData?.riskColor}20`, color: healthData?.riskColor }}
              >
                {healthData?.riskLevel} RISK
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-left text-[10px] pt-2 border-t border-white/5">
              <div>
                <span className="text-gray-500 block">VALIDATION</span>
                <span className="text-white font-bold">{healthData?.breakdown?.validation}%</span>
              </div>
              <div>
                <span className="text-gray-500 block">EXECUTION</span>
                <span className="text-white font-bold">{healthData?.breakdown?.execution}%</span>
              </div>
              <div className="mt-2">
                <span className="text-gray-500 block">ROADMAP</span>
                <span className="text-white font-bold">{healthData?.breakdown?.planning}%</span>
              </div>
              <div className="mt-2">
                <span className="text-gray-500 block">TRACTION</span>
                <span className="text-white font-bold">{healthData?.breakdown?.traction}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Burndown area graph */}
        <div className="liquid-glass p-6 rounded-xl md:col-span-2">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-4">Sprint Ideal vs Actual Burndown Curve</span>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={burndown}>
                <defs>
                  <linearGradient id="colorIdeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={9} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={9} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(3,7,18,0.9)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '8px' }}
                  labelStyle={{ fontSize: '10px', color: '#9ca3af' }}
                />
                <Area type="monotone" dataKey="ideal" name="Ideal Remaining" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorIdeal)" />
                <Area type="monotone" dataKey="actual" name="Actual Remaining" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Dynamic AI insights panels & Runway calculator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* AI Actionable Insights (Module 14) */}
        <div className="liquid-glass p-6 rounded-xl md:col-span-2 space-y-3">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <ShieldAlert size={16} className="text-amber-500 animate-pulse" />
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">AI Operational Advisories</span>
          </div>
          <div className="space-y-3">
            {healthData?.insights?.map((ins: string, idx: number) => (
              <div key={idx} className="flex gap-3 text-xs bg-white/2 border border-white/5 p-3 rounded-lg">
                <span className="text-amber-400 font-bold">⚠️</span>
                <p className="text-gray-300 leading-relaxed">{ins}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Runway Scenario Planner (Module 9 premium widget) */}
        <div className="liquid-glass p-6 rounded-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Calculator size={16} className="text-indigo-400" />
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Runway Scenario Simulator</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-gray-500 mb-1">Current Cash Buffer ($)</label>
              <input
                type="number"
                className="w-full glass-input text-xs"
                value={currentCash}
                onChange={(e) => setCurrentCash(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-gray-500 mb-1">Monthly Burn Rate ($)</label>
              <input
                type="number"
                className="w-full glass-input text-xs"
                value={monthlyBurn}
                onChange={(e) => setMonthlyBurn(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-gray-500 mb-1">Simulated Capital Injection ($)</label>
              <input
                type="number"
                placeholder="e.g. Seed investment"
                className="w-full glass-input text-xs"
                value={simulatedFunding}
                onChange={(e) => setSimulatedFunding(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-gray-500 mb-1">Simulated Hiring / Ops Cost ($/mo)</label>
              <input
                type="number"
                placeholder="e.g. New developer hires"
                className="w-full glass-input text-xs"
                value={newHiresCost}
                onChange={(e) => setNewHiresCost(Number(e.target.value))}
              />
            </div>

            <div className="pt-3 border-t border-white/5 text-center bg-indigo-500/5 p-3 rounded-lg border border-indigo-500/10">
              <span className="text-[9px] text-indigo-400 font-bold block uppercase tracking-wider mb-1">PROJECTED RUNWAY</span>
              <span className="text-lg font-black text-white">{simulatedRunwayMonths.toFixed(1)} Months</span>
              <p className="text-[9px] text-gray-500 mt-1">Based on simulated cash flow projections</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DashboardOverview;
