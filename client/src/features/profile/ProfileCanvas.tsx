import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { 
  useStartupProfile, 
  useUpdateCanvas, 
  useUpdateSwot, 
  useAddCompetitor 
} from '../../hooks/useReactQueries';
import { Plus, Edit } from 'lucide-react';
import { Skeleton } from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';

export const ProfileCanvas: React.FC = () => {
  const auth = useSelector((state: RootState) => state.auth);
  const isFounder = auth.role === 'Founder' || auth.role === 'Co-Founder';

  const [activeTab, setActiveTab] = useState<'bmc' | 'swot' | 'competitors'>('bmc');

  // Competitor Inputs
  const [compName, setCompName] = useState('');
  const [compShare, setCompShare] = useState('');
  const [compPricing, setCompPricing] = useState('');
  const [compUsp, setCompUsp] = useState('');

  // Editing structures
  const [editingField, setEditingField] = useState<{ type: 'bmc' | 'swot'; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState('');

  // React Query Hook
  const { data: profile, isLoading, isError, refetch } = useStartupProfile();

  // Mutations
  const updateCanvasMutation = useUpdateCanvas();
  const updateSwotMutation = useUpdateSwot();
  const addCompetitorMutation = useAddCompetitor();

  const handleUpdateBmc = async (field: string, values: string[]) => {
    if (!profile) return;
    try {
      const updatedCanvas = { ...profile.canvas, [field]: values };
      await updateCanvasMutation.mutateAsync(updatedCanvas);
      setEditingField(null);
    } catch (err) {
      console.error('Failed to update canvas', err);
    }
  };

  const handleUpdateSwot = async (field: string, values: string[]) => {
    if (!profile) return;
    try {
      const updatedSwot = { ...profile.swot, [field]: values };
      await updateSwotMutation.mutateAsync(updatedSwot);
      setEditingField(null);
    } catch (err) {
      console.error('Failed to update SWOT details', err);
    }
  };

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName) return;
    try {
      await addCompetitorMutation.mutateAsync({
        name: compName,
        marketShare: compShare,
        pricingModel: compPricing,
        usp: compUsp,
        strengths: [],
        weaknesses: []
      });
      setCompName('');
      setCompShare('');
      setCompPricing('');
      setCompUsp('');
    } catch (err) {
      console.error('Failed to add competitor profile', err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <ErrorState onRetry={refetch} message="Failed to load startup strategic profile canvas." />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Tab select headers */}
      <div className="flex border-b border-white/5 pb-2 gap-4">
        {['bmc', 'swot', 'competitors'].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t as any)}
            className={`text-xs font-bold tracking-wider uppercase pb-2 transition cursor-pointer ${
              activeTab === t 
                ? 'border-b-2 border-indigo-500 text-indigo-400' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t === 'bmc' ? 'Business Model Canvas' : t === 'swot' ? 'SWOT Analysis Matrix' : 'Competitor Intelligence'}
          </button>
        ))}
      </div>

      {/* Business Model Canvas Layout */}
      {activeTab === 'bmc' && profile && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Partners (1 block high) */}
          <div className="liquid-glass p-4 rounded-xl md:row-span-2 space-y-2 border border-white/5 bg-slate-950/40">
            <h4 className="text-xs font-bold text-white border-b border-white/5 pb-1">Key Partners</h4>
            <div className="space-y-1.5 min-h-40">
              {profile.canvas?.keyPartners?.map((item: string, idx: number) => (
                <div key={idx} className="text-[10px] bg-indigo-500/5 border border-indigo-500/10 p-2 rounded text-indigo-200">
                  {item}
                </div>
              ))}
            </div>
            {isFounder && (
              <button 
                onClick={() => { setEditingField({ type: 'bmc', field: 'keyPartners' }); setEditingValue(profile.canvas?.keyPartners?.join('\n') || ''); }}
                className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1 mt-3 cursor-pointer hover:underline"
              >
                <Edit size={10} /> Edit Entries
              </button>
            )}
          </div>

          {/* Key Activities & Resources Column */}
          <div className="md:col-span-1 space-y-4">
            <div className="liquid-glass p-4 rounded-xl space-y-2 border border-white/5 bg-slate-950/40">
              <h4 className="text-xs font-bold text-white border-b border-white/5 pb-1">Key Activities</h4>
              <div className="space-y-1.5 min-h-24">
                {profile.canvas?.keyActivities?.map((item: string, idx: number) => (
                  <div key={idx} className="text-[10px] bg-purple-500/5 border border-purple-500/10 p-2 rounded text-purple-200">
                    {item}
                  </div>
                ))}
              </div>
              {isFounder && (
                <button 
                  onClick={() => { setEditingField({ type: 'bmc', field: 'keyActivities' }); setEditingValue(profile.canvas?.keyActivities?.join('\n') || ''); }}
                  className="text-[10px] text-purple-400 font-semibold flex items-center gap-1 cursor-pointer hover:underline"
                >
                  <Edit size={10} /> Edit Entries
                </button>
              )}
            </div>
            <div className="liquid-glass p-4 rounded-xl space-y-2 border border-white/5 bg-slate-950/40">
              <h4 className="text-xs font-bold text-white border-b border-white/5 pb-1">Key Resources</h4>
              <div className="space-y-1.5 min-h-24">
                {profile.canvas?.keyResources?.map((item: string, idx: number) => (
                  <div key={idx} className="text-[10px] bg-emerald-500/5 border border-emerald-500/10 p-2 rounded text-emerald-200">
                    {item}
                  </div>
                ))}
              </div>
              {isFounder && (
                <button 
                  onClick={() => { setEditingField({ type: 'bmc', field: 'keyResources' }); setEditingValue(profile.canvas?.keyResources?.join('\n') || ''); }}
                  className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 cursor-pointer hover:underline"
                >
                  <Edit size={10} /> Edit Entries
                </button>
              )}
            </div>
          </div>

          {/* Value Propositions */}
          <div className="liquid-glass p-4 rounded-xl md:row-span-2 md:col-span-1 space-y-2 border border-white/5 bg-slate-950/40">
            <h4 className="text-xs font-bold text-white border-b border-white/5 pb-1">Value Propositions</h4>
            <div className="space-y-1.5 min-h-40">
              {profile.canvas?.valuePropositions?.map((item: string, idx: number) => (
                <div key={idx} className="text-[10px] bg-pink-500/5 border border-pink-500/10 p-2 rounded text-pink-200">
                  {item}
                </div>
              ))}
            </div>
            {isFounder && (
              <button 
                onClick={() => { setEditingField({ type: 'bmc', field: 'valuePropositions' }); setEditingValue(profile.canvas?.valuePropositions?.join('\n') || ''); }}
                className="text-[10px] text-pink-400 font-semibold flex items-center gap-1 mt-3 cursor-pointer hover:underline"
              >
                <Edit size={10} /> Edit Entries
              </button>
            )}
          </div>

          {/* Relationships & Channels Column */}
          <div className="md:col-span-1 space-y-4">
            <div className="liquid-glass p-4 rounded-xl space-y-2 border border-white/5 bg-slate-950/40">
              <h4 className="text-xs font-bold text-white border-b border-white/5 pb-1">Customer Relationships</h4>
              <div className="space-y-1.5 min-h-24">
                {profile.canvas?.customerRelationships?.map((item: string, idx: number) => (
                  <div key={idx} className="text-[10px] bg-blue-500/5 border border-blue-500/10 p-2 rounded text-blue-200">
                    {item}
                  </div>
                ))}
              </div>
              {isFounder && (
                <button 
                  onClick={() => { setEditingField({ type: 'bmc', field: 'customerRelationships' }); setEditingValue(profile.canvas?.customerRelationships?.join('\n') || ''); }}
                  className="text-[10px] text-blue-400 font-semibold flex items-center gap-1 cursor-pointer hover:underline"
                >
                  <Edit size={10} /> Edit Entries
                </button>
              )}
            </div>
            <div className="liquid-glass p-4 rounded-xl space-y-2 border border-white/5 bg-slate-950/40">
              <h4 className="text-xs font-bold text-white border-b border-white/5 pb-1">Channels</h4>
              <div className="space-y-1.5 min-h-24">
                {profile.canvas?.channels?.map((item: string, idx: number) => (
                  <div key={idx} className="text-[10px] bg-amber-500/5 border border-amber-500/10 p-2 rounded text-amber-200">
                    {item}
                  </div>
                ))}
              </div>
              {isFounder && (
                <button 
                  onClick={() => { setEditingField({ type: 'bmc', field: 'channels' }); setEditingValue(profile.canvas?.channels?.join('\n') || ''); }}
                  className="text-[10px] text-amber-400 font-semibold flex items-center gap-1 cursor-pointer hover:underline"
                >
                  <Edit size={10} /> Edit Entries
                </button>
              )}
            </div>
          </div>

          {/* Customer Segments */}
          <div className="liquid-glass p-4 rounded-xl md:row-span-2 space-y-2 border border-white/5 bg-slate-950/40">
            <h4 className="text-xs font-bold text-white border-b border-white/5 pb-1">Customer Segments</h4>
            <div className="space-y-1.5 min-h-40">
              {profile.canvas?.customerSegments?.map((item: string, idx: number) => (
                <div key={idx} className="text-[10px] bg-teal-500/5 border border-teal-500/10 p-2 rounded text-teal-200">
                  {item}
                </div>
              ))}
            </div>
            {isFounder && (
              <button 
                onClick={() => { setEditingField({ type: 'bmc', field: 'customerSegments' }); setEditingValue(profile.canvas?.customerSegments?.join('\n') || ''); }}
                className="text-[10px] text-teal-400 font-semibold flex items-center gap-1 mt-3 cursor-pointer hover:underline"
              >
                <Edit size={10} /> Edit Entries
              </button>
            )}
          </div>

          {/* Lower Cost Structure (2.5 width) */}
          <div className="liquid-glass p-4 rounded-xl md:col-span-2 space-y-2 border border-white/5 bg-slate-950/40">
            <h4 className="text-xs font-bold text-white border-b border-white/5 pb-1">Cost Structure</h4>
            <div className="space-y-1.5 min-h-20">
              {profile.canvas?.costStructure?.map((item: string, idx: number) => (
                <div key={idx} className="text-[10px] bg-red-500/5 border border-red-500/10 p-2 rounded text-red-200">
                  {item}
                </div>
              ))}
            </div>
            {isFounder && (
              <button 
                onClick={() => { setEditingField({ type: 'bmc', field: 'costStructure' }); setEditingValue(profile.canvas?.costStructure?.join('\n') || ''); }}
                className="text-[10px] text-red-400 font-semibold flex items-center gap-1 cursor-pointer hover:underline"
              >
                <Edit size={10} /> Edit Entries
              </button>
            )}
          </div>

          {/* Lower Revenue Streams (2.5 width) */}
          <div className="liquid-glass p-4 rounded-xl md:col-span-3 space-y-2 border border-white/5 bg-slate-950/40">
            <h4 className="text-xs font-bold text-white border-b border-white/5 pb-1">Revenue Streams</h4>
            <div className="space-y-1.5 min-h-20">
              {profile.canvas?.revenueStreams?.map((item: string, idx: number) => (
                <div key={idx} className="text-[10px] bg-cyan-500/5 border border-cyan-500/10 p-2 rounded text-cyan-200">
                  {item}
                </div>
              ))}
            </div>
            {isFounder && (
              <button 
                onClick={() => { setEditingField({ type: 'bmc', field: 'revenueStreams' }); setEditingValue(profile.canvas?.revenueStreams?.join('\n') || ''); }}
                className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1 cursor-pointer hover:underline"
              >
                <Edit size={10} /> Edit Entries
              </button>
            )}
          </div>
        </div>
      )}

      {/* SWOT Quadrant Matrix */}
      {activeTab === 'swot' && profile && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="liquid-glass p-5 rounded-xl space-y-3 border border-white/5 bg-slate-950/40">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h4 className="text-sm font-bold text-emerald-400">Strengths (Internal)</h4>
              {isFounder && (
                <button 
                  onClick={() => { setEditingField({ type: 'swot', field: 'strengths' }); setEditingValue(profile.swot?.strengths?.join('\n') || ''); }}
                  className="text-[10px] text-gray-500 hover:text-white cursor-pointer"
                >
                  Edit
                </button>
              )}
            </div>
            <ul className="list-disc pl-4 text-xs space-y-2 text-gray-300">
              {profile.swot?.strengths?.map((s: string, idx: number) => <li key={idx}>{s}</li>)}
            </ul>
          </div>

          <div className="liquid-glass p-5 rounded-xl space-y-3 border border-white/5 bg-slate-950/40">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h4 className="text-sm font-bold text-red-400">Weaknesses (Internal)</h4>
              {isFounder && (
                <button 
                  onClick={() => { setEditingField({ type: 'swot', field: 'weaknesses' }); setEditingValue(profile.swot?.weaknesses?.join('\n') || ''); }}
                  className="text-[10px] text-gray-500 hover:text-white cursor-pointer"
                >
                  Edit
                </button>
              )}
            </div>
            <ul className="list-disc pl-4 text-xs space-y-2 text-gray-300">
              {profile.swot?.weaknesses?.map((s: string, idx: number) => <li key={idx}>{s}</li>)}
            </ul>
          </div>

          <div className="liquid-glass p-5 rounded-xl space-y-3 border border-white/5 bg-slate-950/40">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h4 className="text-sm font-bold text-blue-400">Opportunities (External)</h4>
              {isFounder && (
                <button 
                  onClick={() => { setEditingField({ type: 'swot', field: 'opportunities' }); setEditingValue(profile.swot?.opportunities?.join('\n') || ''); }}
                  className="text-[10px] text-gray-500 hover:text-white cursor-pointer"
                >
                  Edit
                </button>
              )}
            </div>
            <ul className="list-disc pl-4 text-xs space-y-2 text-gray-300">
              {profile.swot?.opportunities?.map((s: string, idx: number) => <li key={idx}>{s}</li>)}
            </ul>
          </div>

          <div className="liquid-glass p-5 rounded-xl space-y-3 border border-white/5 bg-slate-950/40">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h4 className="text-sm font-bold text-amber-500">Threats (External)</h4>
              {isFounder && (
                <button 
                  onClick={() => { setEditingField({ type: 'swot', field: 'threats' }); setEditingValue(profile.swot?.threats?.join('\n') || ''); }}
                  className="text-[10px] text-gray-500 hover:text-white cursor-pointer"
                >
                  Edit
                </button>
              )}
            </div>
            <ul className="list-disc pl-4 text-xs space-y-2 text-gray-300">
              {profile.swot?.threats?.map((s: string, idx: number) => <li key={idx}>{s}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* Competitor list */}
      {activeTab === 'competitors' && profile && (
        <div className="space-y-6">
          <div className="liquid-glass p-6 rounded-xl border border-white/5 bg-slate-950/40">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Competitor Intelligence Database</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-gray-300">
                <thead>
                  <tr className="border-b border-white/5 text-gray-500">
                    <th className="pb-3">COMPETITOR</th>
                    <th className="pb-3">EST. MARKET SHARE</th>
                    <th className="pb-3">PRICING MODEL</th>
                    <th className="pb-3">UNIQUE SELLING PROPOSITION (USP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {profile.competitors?.map((c: any, idx: number) => (
                    <tr key={idx} className="hover:bg-white/2">
                      <td className="py-4 font-bold text-white">{c.name}</td>
                      <td className="py-4">{c.marketShare || 'N/A'}</td>
                      <td className="py-4">{c.pricingModel || 'N/A'}</td>
                      <td className="py-4 text-indigo-300 font-semibold">{c.usp || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Competitor inline */}
          {isFounder && (
            <form onSubmit={handleAddCompetitor} className="liquid-glass p-6 rounded-xl space-y-4 border border-white/5 bg-slate-950/40">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Log Competitor Intel</span>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-gray-400 mb-1">Competitor Name</label>
                  <input
                    type="text"
                    required
                    placeholder="FlowAgent Corp"
                    className="w-full glass-input text-xs"
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Est. Market Share (%)</label>
                  <input
                    type="text"
                    placeholder="e.g. 15%"
                    className="w-full glass-input text-xs"
                    value={compShare}
                    onChange={(e) => setCompShare(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Pricing Model Model</label>
                  <input
                    type="text"
                    placeholder="e.g. $49/mo subscription"
                    className="w-full glass-input text-xs"
                    value={compPricing}
                    onChange={(e) => setCompPricing(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">USP Summary</label>
                  <input
                    type="text"
                    placeholder="e.g. Direct integrations with Salesforce"
                    className="w-full glass-input text-xs"
                    value={compUsp}
                    onChange={(e) => setCompUsp(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Add Competitor
              </button>
            </form>
          )}
        </div>
      )}

      {/* Editing Editor Modal overlay */}
      {editingField && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="fixed inset-0" onClick={() => setEditingField(null)} />
          <div className="w-full max-w-md liquid-glass p-6 rounded-xl relative z-10 space-y-4 border border-white/10 bg-slate-950">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Edit {editingField.field.replace(/([A-Z])/g, ' $1')} entries
            </h3>
            <p className="text-[10px] text-gray-500">Provide one entry per line.</p>
            <textarea
              rows={8}
              className="w-full glass-input text-xs font-mono"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setEditingField(null)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const values = editingValue.split('\n').map(v => v.trim()).filter(Boolean);
                  if (editingField.type === 'bmc') {
                    handleUpdateBmc(editingField.field, values);
                  } else {
                    handleUpdateSwot(editingField.field, values);
                  }
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileCanvas;
