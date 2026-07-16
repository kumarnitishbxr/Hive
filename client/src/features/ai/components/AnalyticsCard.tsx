import React from 'react';
import { Activity, ShieldAlert, BarChart3, TrendingUp } from 'lucide-react';

interface AnalyticsCardProps {
  startupHealth: number; // 0-100
  executionScore: number;
  velocity: number;
  riskScore: number;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  startupHealth,
  executionScore,
  velocity,
  riskScore
}) => {
  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-sm border border-white/5 p-4 rounded-xl hover:border-white/10 transition space-y-4 text-xs font-sans w-full max-w-sm text-left">
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Activity size={14} className="text-indigo-400 shrink-0" />
          <h4 className="font-extrabold text-white uppercase tracking-wider text-[10px]">Telemetry Metrics Audit</h4>
        </div>
        <span className="text-[10px] text-gray-500 font-bold">Real-time</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Metric 1 */}
        <div className="p-3 bg-white/2 border border-white/5 rounded-xl space-y-1">
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Startup Health</span>
          <p className="text-xl font-black text-white flex items-baseline gap-1">
            {startupHealth}% <span className="text-[9px] text-emerald-400 font-bold">▲ 2%</span>
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-3 bg-white/2 border border-white/5 rounded-xl space-y-1">
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Execution Score</span>
          <p className="text-xl font-black text-white flex items-baseline gap-1">
            {executionScore}/100
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-3 bg-white/2 border border-white/5 rounded-xl space-y-1">
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Sprint Velocity</span>
          <p className="text-xl font-black text-white flex items-baseline gap-1">
            {velocity} <span className="text-[9px] text-gray-500 font-bold">pts</span>
          </p>
        </div>

        {/* Metric 4 */}
        <div className="p-3 bg-white/2 border border-white/5 rounded-xl space-y-1">
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Risk Index</span>
          <p className={`text-xl font-black flex items-baseline gap-1 ${getRiskColor(riskScore)}`}>
            {riskScore}%
          </p>
        </div>
      </div>
    </div>
  );
};
export default AnalyticsCard;
