import React, { useState, useEffect, useMemo } from 'react';
import { 
  useInvestors, 
  useTelemetryReport, 
  useCreateInvestor, 
  useUpdateInvestor 
} from '../../hooks/useReactQueries';
import { crmService } from '../../services/api';
import { Plus, User, BarChart3, Clock, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';

export const InvestorCRM: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'telemetry'>('pipeline');
  
  // Share link controls
  const [generatedLink, setGeneratedLink] = useState('');
  const [loadingLink, setLoadingLink] = useState(false);

  // New Lead Inputs
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadFirm, setLeadFirm] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadFunding, setLeadFunding] = useState(100000);
  const [leadNotes, setLeadNotes] = useState('');

  // Selected telemetry viewer analytics chart
  const [selectedViewer, setSelectedViewer] = useState<any>(null);

  // React Query Hooks
  const { data: investors = [], isLoading: isInvestorsLoading, isError: isInvestorsError, refetch: refetchInvestors } = useInvestors();
  const { data: telemetry = [], isLoading: isTelemetryLoading } = useTelemetryReport();

  const createInvestorMutation = useCreateInvestor();
  const updateInvestorMutation = useUpdateInvestor();

  // Set default selected viewer when telemetry loads
  useEffect(() => {
    if (telemetry.length > 0 && !selectedViewer) {
      setSelectedViewer(telemetry[0]);
    }
  }, [telemetry, selectedViewer]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadFirm || !leadEmail) return;

    try {
      await createInvestorMutation.mutateAsync({
        name: leadName,
        firm: leadFirm,
        email: leadEmail,
        expectedFunding: leadFunding,
        notes: leadNotes
      });
      setShowLeadModal(false);
      setLeadName('');
      setLeadFirm('');
      setLeadEmail('');
      setLeadNotes('');
    } catch (err) {
      console.error('Add lead failed', err);
    }
  };

  const transitionInvestorStage = async (id: string, newStage: string) => {
    try {
      await updateInvestorMutation.mutateAsync({ id, payload: { stage: newStage } });
    } catch (err) {
      console.error('Move stage failed', err);
    }
  };

  const handleGenerateShare = async () => {
    setLoadingLink(true);
    try {
      const res = await crmService.generateShareLink();
      setGeneratedLink(res.data.link);
    } catch (err) {
      console.error('Link gen failed', err);
    } finally {
      setLoadingLink(false);
    }
  };

  const stages = ['Prospect', 'Contacted', 'Pitching', 'Due Diligence', 'Commitment', 'Closed'];

  // Memoize total session duration calculation
  const totalSessionDuration = useMemo(() => {
    if (!selectedViewer || !selectedViewer.slideAnalytics) return 0;
    return selectedViewer.slideAnalytics.reduce((acc: number, s: any) => acc + s.timeSpentSec, 0);
  }, [selectedViewer]);

  // Memoize most viewed slide
  const mostViewedSlideIndex = useMemo(() => {
    if (!selectedViewer || !selectedViewer.slideAnalytics || selectedViewer.slideAnalytics.length === 0) return 0;
    const sorted = [...selectedViewer.slideAnalytics].sort((a: any, b: any) => b.timeSpentSec - a.timeSpentSec);
    return sorted[0]?.slideIndex || 0;
  }, [selectedViewer]);

  if (isInvestorsLoading || isTelemetryLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (isInvestorsError) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <ErrorState onRetry={refetchInvestors} message="Failed to load investor relations CRM records." />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Sub tabs selectors */}
      <div className="flex border-b border-white/5 pb-2 gap-4">
        {['pipeline', 'telemetry'].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t as any)}
            className={`text-xs font-bold tracking-wider uppercase pb-2 transition cursor-pointer ${
              activeTab === t 
                ? 'border-b-2 border-indigo-500 text-indigo-400' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t === 'pipeline' ? 'Investor CRM Pipeline' : 'Pitch Deck Telemetry'}
          </button>
        ))}
      </div>

      {/* Pipeline Kanban Grid */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Deals Pipelines Tracker</span>
            <button 
              onClick={() => setShowLeadModal(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus size={13} /> Add Lead Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 overflow-x-auto pb-4">
            {stages.map(stage => {
              const stageInvestors = investors.filter((i: any) => i.stage === stage);
              return (
                <div key={stage} className="board-column min-w-[200px] flex flex-col space-y-3 min-h-[50vh]">
                  <div className="flex justify-between items-center px-1 pb-1 border-b border-white/5">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{stage}</span>
                    <span className="text-[9px] bg-white/5 px-1.5 py-0.2 rounded text-gray-500">{stageInvestors.length}</span>
                  </div>

                  <div className="space-y-2 flex-1 overflow-y-auto max-h-[52vh]">
                    {stageInvestors.map((inv: any) => (
                      <div key={inv._id} className="liquid-glass p-3 rounded-lg space-y-2 relative border border-white/5 bg-slate-950/40">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[11px] font-bold text-white leading-relaxed truncate w-32 font-sans">{inv.name}</h4>
                          <span className="text-[8px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                            ${inv.expectedFunding ? (inv.expectedFunding / 1000).toFixed(0) + 'k' : 'N/A'}
                          </span>
                        </div>
                        <span className="text-[9px] text-indigo-400 block truncate font-sans">{inv.firm}</span>
                        {inv.notes && <p className="text-[9px] text-gray-500 leading-normal truncate font-sans">{inv.notes}</p>}
                        
                        {/* Selector switches */}
                        <div className="pt-2 border-t border-white/5 flex justify-end gap-1 select-none">
                          <select 
                            className="bg-transparent border-none text-[8px] text-gray-500 outline-none cursor-pointer hover:text-indigo-400 font-bold uppercase"
                            value={stage}
                            onChange={(e) => transitionInvestorStage(inv._id, e.target.value)}
                          >
                            {stages.map(s => <option key={s} value={s} className="bg-slate-900 text-white">{s.toUpperCase()}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Telemetry charts and viewer dashboard */}
      {activeTab === 'telemetry' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* List of viewing logs */}
          <div className="liquid-glass p-4 rounded-xl flex flex-col justify-between h-[65vh] border border-white/5 bg-slate-950/40">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Telemetry Reports</span>
                <button 
                  onClick={handleGenerateShare}
                  disabled={loadingLink}
                  className="p-1 rounded bg-white/5 border border-white/10 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white text-gray-400 transition cursor-pointer text-[10px] font-bold px-2 py-1 outline-none"
                >
                  {loadingLink ? 'Generating...' : 'Get Link'}
                </button>
              </div>

              {generatedLink && (
                <div className="bg-indigo-950/40 border border-indigo-500/30 p-2.5 rounded-lg text-[9px] space-y-1 select-all font-mono text-indigo-300">
                  <span className="font-bold uppercase tracking-wider text-gray-400 block font-sans">SHAREABLE LINK:</span>
                  <span className="block truncate">{generatedLink}</span>
                </div>
              )}

              <div className="space-y-1.5 overflow-y-auto max-h-[40vh] pr-1">
                {telemetry.length > 0 ? (
                  telemetry.map((t: any) => (
                    <div 
                      key={t._id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                        selectedViewer?._id === t._id 
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                          : 'text-gray-400 border border-transparent hover:bg-white/2 hover:text-gray-200'
                      }`}
                      onClick={() => setSelectedViewer(t)}
                    >
                      <User size={14} className="text-indigo-400 animate-pulse" />
                      <div className="truncate flex-1">
                        <h4 className="font-bold text-white truncate text-[11px] font-sans">{t.viewerName}</h4>
                        <span className="text-[8px] text-gray-500 font-mono">Token: {t.shareToken.substring(0, 8)}...</span>
                      </div>
                      <Eye size={12} className="text-gray-500" />
                    </div>
                  ))
                ) : (
                  <p className="text-center text-[10px] text-gray-500 py-12">No pitch viewing metrics recorded yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Telemetry charts dashboard details */}
          <div className="md:col-span-2 liquid-glass rounded-xl p-6 flex flex-col h-[65vh] border border-white/5 bg-slate-950/40">
            {selectedViewer ? (
              <div className="space-y-6 h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <div>
                      <h3 className="text-sm font-bold text-white font-sans">{selectedViewer.viewerName}</h3>
                      <span className="text-[9px] text-gray-500 mt-1 block">Viewer Session: {new Date(selectedViewer.viewedAt).toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-indigo-400 font-bold block uppercase tracking-wider">TOTAL SESSION DURATION</span>
                      <span className="text-lg font-black text-white flex items-center gap-1 mt-0.5 justify-end">
                        <Clock size={16} className="text-indigo-400" />
                        {totalSessionDuration} secs
                      </span>
                    </div>
                  </div>

                  {/* Telemetry Chart */}
                  <div className="mt-6">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-4">Duration Spent Slide-by-Slide</span>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={selectedViewer.slideAnalytics}>
                          <XAxis dataKey="slideIndex" stroke="rgba(255,255,255,0.3)" fontSize={9} tickFormatter={(v) => `Slide ${v + 1}`} />
                          <YAxis stroke="rgba(255,255,255,0.3)" fontSize={9} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(3,7,18,0.9)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '8px' }}
                            labelStyle={{ fontSize: '10px', color: '#9ca3af' }}
                          />
                          <Bar dataKey="timeSpentSec" name="Seconds Viewed" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="bg-white/2 border border-white/5 p-3 rounded-lg text-xs leading-relaxed text-gray-300">
                  <span className="font-bold text-indigo-300 block mb-1">💡 Co-Founder Assessment</span>
                  This investor spent the most time on **Slide {mostViewedSlideIndex + 1}** (Traction and Financial projections). Schedule a follow-up detailing product growth telemetry.
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <BarChart3 size={32} className="text-gray-600 mb-2" />
                <h4 className="text-xs font-semibold">No viewer telemetry loaded</h4>
                <p className="text-[10px] text-gray-600 mt-1">Generate a share link and copy-paste it to generate view logs.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showLeadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="fixed inset-0" onClick={() => setShowLeadModal(false)} />
          <form onSubmit={handleCreateLead} className="w-full max-w-sm liquid-glass p-6 rounded-xl relative z-10 space-y-4 border border-white/10 bg-slate-950">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Create Investor Lead</h3>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Investor Name</label>
              <input
                type="text"
                required
                placeholder="David Sacks"
                className="w-full glass-input text-xs"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Investment Firm</label>
              <input
                type="text"
                required
                placeholder="Craft Ventures"
                className="w-full glass-input text-xs"
                value={leadFirm}
                onChange={(e) => setLeadFirm(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Contact Email</label>
                <input
                  type="email"
                  required
                  placeholder="investor@firm.com"
                  className="w-full glass-input text-xs"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Target Funding ($)</label>
                <input
                  type="number"
                  required
                  min={1000}
                  className="w-full glass-input text-xs"
                  value={leadFunding}
                  onChange={(e) => setLeadFunding(Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Pipeline Notes (Optional)</label>
              <textarea
                rows={3}
                placeholder="Add meeting contexts..."
                className="w-full glass-input text-xs resize-none"
                value={leadNotes}
                onChange={(e) => setLeadNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowLeadModal(false)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold cursor-pointer text-xs"
              >
                Log Lead
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default InvestorCRM;
