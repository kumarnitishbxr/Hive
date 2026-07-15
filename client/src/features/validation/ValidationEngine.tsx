import React, { useState } from 'react';
import { 
  useIdeaScore, 
  useInterviews, 
  useFeedbacks, 
  useSurveys,
  useLogInterview,
  useCreateSurvey
} from '../../hooks/useReactQueries';
import { Plus, MessageSquare, AlertTriangle } from 'lucide-react';
import { Skeleton } from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import VirtualList from '../../components/VirtualList';

export const ValidationEngine: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'score' | 'interviews' | 'feedback' | 'surveys'>('score');

  // New Interview Form
  const [custName, setCustName] = useState('');
  const [custRole, setCustRole] = useState('');
  const [feedText, setFeedText] = useState('');
  const [painPoints, setPainPoints] = useState('');

  // New Survey parameters
  const [surveyTitle, setSurveyTitle] = useState('');
  const [surveyDesc, setSurveyDesc] = useState('');

  // React Query Hooks
  const { data: ideaScore, isLoading: isScoreLoading, isError: isScoreError, refetch: refetchScore } = useIdeaScore();
  const { data: interviews = [], isLoading: isInterviewsLoading } = useInterviews();
  const { data: feedbacks = [], isLoading: isFeedbacksLoading } = useFeedbacks();
  const { data: surveys = [], isLoading: isSurveysLoading } = useSurveys();

  const logInterviewMutation = useLogInterview();
  const createSurveyMutation = useCreateSurvey();

  const handleLogInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !feedText) return;

    try {
      const painTags = painPoints.split(',').map(p => p.trim()).filter(Boolean);
      await logInterviewMutation.mutateAsync({
        customerName: custName,
        roleOrIndustry: custRole,
        feedbackText: feedText,
        painPoints: painTags
      });

      setCustName('');
      setCustRole('');
      setFeedText('');
      setPainPoints('');
    } catch (err) {
      console.error('Log interview failed', err);
    }
  };

  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyTitle) return;

    try {
      await createSurveyMutation.mutateAsync({
        title: surveyTitle,
        description: surveyDesc,
        questions: [
          { id: 'q1', question: 'Rate the intensity of this problem (1-5)', type: 'rating' },
          { id: 'q2', question: 'How do you currently resolve this task?', type: 'text' }
        ]
      });

      setSurveyTitle('');
      setSurveyDesc('');
    } catch (err) {
      console.error('Create survey failed', err);
    }
  };

  if (isScoreLoading || isInterviewsLoading || isFeedbacksLoading || isSurveysLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48 md:col-span-2" />
        </div>
      </div>
    );
  }

  if (isScoreError) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <ErrorState onRetry={refetchScore} message="Failed to load market validation scoring metrics." />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Sub tabs selectors */}
      <div className="flex border-b border-white/5 pb-2 gap-4">
        {['score', 'interviews', 'feedback', 'surveys'].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t as any)}
            className={`text-xs font-bold tracking-wider uppercase pb-2 transition cursor-pointer ${
              activeTab === t 
                ? 'border-b-2 border-indigo-500 text-indigo-400' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t === 'score' ? 'Idea Validation Score' : t === 'interviews' ? 'Customer Interviews' : t === 'feedback' ? '360 Feedback' : 'Surveys Builder'}
          </button>
        ))}
      </div>

      {/* Idea Validation Score Overview */}
      {activeTab === 'score' && ideaScore && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="liquid-glass p-6 rounded-xl flex flex-col items-center justify-center text-center border border-white/5 bg-slate-950/40">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-4">Market Validation Index</span>
            <div className="relative w-36 h-36 flex items-center justify-center bg-indigo-500/5 rounded-full border border-indigo-500/10 shadow-[0_0_24px_rgba(99,102,241,0.15)]">
              <span className="text-4xl font-black text-white">{ideaScore.score || 50}</span>
              <span className="absolute bottom-4 text-[9px] text-indigo-400 font-bold uppercase">Idea Score</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-4 leading-relaxed">
              Calculated based on positive sentiment ratios from customer interviews and average scores from feedback matrices.
            </p>
          </div>

          <div className="md:col-span-2 liquid-glass p-6 rounded-xl space-y-4 border border-white/5 bg-slate-950/40">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 pb-2">Analysis Breakdown</h3>
            
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-gray-300">Customer Interviews (Weight: 40%)</span>
                  <span className="text-indigo-400">{ideaScore.breakdown?.interviews?.score || 50}%</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${ideaScore.breakdown?.interviews?.score || 50}%` }} />
                </div>
                <span className="text-[10px] text-gray-500 mt-1 block">
                  {ideaScore.breakdown?.interviews?.count || 0} interviews logged, {ideaScore.breakdown?.interviews?.positive || 0} positive sentiment indications.
                </span>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-gray-300">Stakeholder Rating Feedback (Weight: 40%)</span>
                  <span className="text-purple-400">{ideaScore.breakdown?.feedbacks?.score || 50}%</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: `${ideaScore.breakdown?.feedbacks?.score || 50}%` }} />
                </div>
                <span className="text-[10px] text-gray-500 mt-1 block">
                  Average rating rating: {ideaScore.breakdown?.feedbacks?.averageRating || 0} / 5 stars from {ideaScore.breakdown?.feedbacks?.count || 0} stakeholders.
                </span>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-gray-300">Campaign Surveys (Weight: 20%)</span>
                  <span className="text-emerald-400">{ideaScore.breakdown?.surveys?.score || 30}%</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${ideaScore.breakdown?.surveys?.score || 30}%` }} />
                </div>
                <span className="text-[10px] text-gray-500 mt-1 block">
                  {ideaScore.breakdown?.surveys?.count || 0} active feedback campaigns configured.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Interviews Log */}
      {activeTab === 'interviews' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* List of interviews */}
          <div className="md:col-span-2 border border-white/5 bg-slate-900/10 rounded-xl p-2">
            <VirtualList
              items={interviews}
              estimateSize={110}
              heightClass="h-[65vh]"
              emptyComponent={
                <p className="text-center text-xs text-gray-500 py-12">No customer interviews logged yet.</p>
              }
              renderItem={(i: any) => (
                <div key={i._id} className="liquid-glass p-4 rounded-xl space-y-3 border-l-4 my-1 border border-white/5 bg-slate-950/40" style={{ borderLeftColor: i.sentimentLabel === 'Positive' ? '#10b981' : i.sentimentLabel === 'Negative' ? '#ef4444' : '#f59e0b' }}>
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase">
                        {i.customerName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{i.customerName}</h4>
                        <span className="text-[9px] text-gray-500">{i.roleOrIndustry || 'Prospect Target'}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      i.sentimentLabel === 'Positive' ? 'bg-emerald-950 text-emerald-400' :
                      i.sentimentLabel === 'Negative' ? 'bg-red-950 text-red-400' :
                      'bg-amber-950 text-amber-400'
                    }`}>
                      {i.sentimentLabel} SENTIMENT ({Math.round((i.sentimentScore || 0) * 100)}%)
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed font-serif italic">"{i.feedbackText}"</p>
                  
                  {i.painPoints && i.painPoints.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap pt-1 border-t border-white/5">
                      {i.painPoints.map((tag: string, idx: number) => (
                        <span key={idx} className="bg-white/5 text-gray-400 px-2 py-0.5 rounded text-[8px] font-semibold border border-white/10">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            />
          </div>

          {/* Add Interview Log Form */}
          <form onSubmit={handleLogInterview} className="liquid-glass p-5 rounded-xl space-y-4 h-fit border border-white/5 bg-slate-950/40">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block border-b border-white/5 pb-2">Log Interview Report</span>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Customer / Lead Name</label>
                <input
                  type="text"
                  required
                  placeholder="Sarah Jenkins"
                  className="w-full glass-input text-xs"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Role / Industry Segment</label>
                <input
                  type="text"
                  placeholder="e.g. Enterprise Architect"
                  className="w-full glass-input text-xs"
                  value={custRole}
                  onChange={(e) => setCustRole(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Interview Transcript Feedback</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Paste details of their pain points and feedback on the product..."
                  className="w-full glass-input text-xs resize-none"
                  value={feedText}
                  onChange={(e) => setFeedText(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Pain Points (Comma separated)</label>
                <input
                  type="text"
                  placeholder="complexity, cost, integration latency"
                  className="w-full glass-input text-xs"
                  value={painPoints}
                  onChange={(e) => setPainPoints(e.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus size={14} /> Log Transcript
            </button>
          </form>
        </div>
      )}

      {/* Stakeholder 360 Feedback */}
      {activeTab === 'feedback' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feedback list */}
          <div className="md:col-span-2 border border-white/5 bg-slate-900/10 rounded-xl p-2">
            <VirtualList
              items={feedbacks}
              estimateSize={95}
              heightClass="h-[65vh]"
              emptyComponent={
                <p className="text-center text-xs text-gray-500 py-12">No stakeholder feedbacks recorded.</p>
              }
              renderItem={(f: any) => (
                <div key={f._id} className="liquid-glass p-4 rounded-xl space-y-2 relative my-1 border border-white/5 bg-slate-950/40">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="text-indigo-400" size={14} />
                      <h4 className="font-bold text-white">{f.authorName}</h4>
                      <span className="text-[10px] text-gray-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded uppercase">{f.source}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-yellow-500">★</span>
                      <span className="text-white font-bold text-xs">{f.rating} / 5</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-serif italic">"{f.content}"</p>
                  {f.suggestions && (
                    <div className="text-[10px] text-gray-400 bg-white/2 border border-dashed border-white/5 p-2 rounded mt-2">
                      <span className="font-bold text-indigo-300 block mb-0.5 font-sans">SUGGESTED ACTION</span>
                      {f.suggestions}
                    </div>
                  )}
                </div>
              )}
            />
          </div>

          {/* Link configuration panel */}
          <div className="liquid-glass p-5 rounded-xl text-xs space-y-3 h-fit border border-white/5 bg-slate-950/40">
            <h4 className="font-bold text-white border-b border-white/5 pb-2 uppercase tracking-wide">360 feedback link</h4>
            <p className="text-gray-400 leading-relaxed">
              Integrate this public feedback link into your prototype, email signatures, or slide decks:
            </p>
            <div className="bg-white/2 border border-white/5 p-2 rounded text-indigo-400 font-mono select-all text-center">
              https://startupops.co/f/my-startup
            </div>
            <p className="text-[10px] text-gray-500">
              Anyone can leave feedback, ratings, and recommendations. Pushed directly to this dashboard.
            </p>
          </div>
        </div>
      )}

      {/* Surveys Campaign list */}
      {activeTab === 'surveys' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* List of campaigns */}
          <div className="md:col-span-2 border border-white/5 bg-slate-900/10 rounded-xl p-2">
            <VirtualList
              items={surveys}
              estimateSize={75}
              heightClass="h-[65vh]"
              emptyComponent={
                <p className="text-center text-xs text-gray-500 py-12">No active feedback campaigns created.</p>
              }
              renderItem={(s: any) => (
                <div key={s._id} className="liquid-glass p-4 rounded-xl flex items-center justify-between text-xs my-1 border border-white/5 bg-slate-950/40">
                  <div className="space-y-1">
                    <h4 className="font-bold text-white">{s.title}</h4>
                    <p className="text-gray-500">{s.description || 'Feedback survey'}</p>
                    <span className="text-[9px] text-gray-500 block">{s.questions?.length || 0} questions setup</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    s.status === 'Active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-gray-500'
                  }`}>
                    {(s.status || 'inactive').toUpperCase()}
                  </span>
                </div>
              )}
            />
          </div>

          {/* Create Survey inline */}
          <form onSubmit={handleCreateSurvey} className="liquid-glass p-5 rounded-xl space-y-4 h-fit border border-white/5 bg-slate-950/40">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block border-b border-white/5 pb-2">Launch feedback survey</span>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  placeholder="Market Interest Check"
                  className="w-full glass-input text-xs"
                  value={surveyTitle}
                  onChange={(e) => setSurveyTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Gather willingness to pay data"
                  className="w-full glass-input text-xs"
                  value={surveyDesc}
                  onChange={(e) => setSurveyDesc(e.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus size={14} /> Launch Survey
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ValidationEngine;
