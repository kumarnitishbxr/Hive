import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateStartupContext } from '../../store/slices/authSlice';
import { startupService } from '../../services/api';

export const OnboardingForm: React.FC<{ onOnboardingComplete: (startupId: string) => void }> = ({ onOnboardingComplete }) => {
  const dispatch = useDispatch();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fields
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [stage, setStage] = useState<'Idea' | 'Validation' | 'Prototype' | 'Traction' | 'Scaling'>('Idea');
  const [idea, setIdea] = useState('');
  const [vision, setVision] = useState('');
  const [mission, setMission] = useState('');
  const [website, setWebsite] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [revenueModel, setRevenueModel] = useState('');
  const [fundingStage, setFundingStage] = useState<'Pre-Seed' | 'Seed' | 'SeriesA' | 'SeriesB' | 'Bootstrapped'>('Pre-Seed');
  const [expectedTeamSize, setExpectedTeamSize] = useState(5);
  const [businessLocation, setBusinessLocation] = useState('');

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await startupService.bootstrap({
        name,
        industry,
        stage,
        vision,
        mission,
        website,
        targetMarket,
        revenueModel,
        fundingStage,
        expectedTeamSize,
        businessLocation
      });

      const { startup } = res.data;
      dispatch(updateStartupContext({ startupId: startup._id, role: 'Founder' }));
      onOnboardingComplete(startup._id);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to complete onboarding. Try again.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const stages = ['Idea', 'Validation', 'Prototype', 'Traction', 'Scaling'];
  const fundStages = ['Pre-Seed', 'Seed', 'SeriesA', 'SeriesB', 'Bootstrapped'];

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-950 px-4 py-12 overflow-hidden">
      {/* Mesh Glow Background */}
      <div className="mesh-glow mesh-indigo" />
      <div className="mesh-glow mesh-purple" />

      <div className="w-full max-w-xl liquid-glass p-8 rounded-2xl relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Configure Workspace
            </h1>
            <p className="text-gray-400 text-xs mt-1">Bootstrapping StartupOps Tenant Container</p>
          </div>
          <span className="text-xs bg-indigo-900/50 text-indigo-300 border border-indigo-500/25 px-2.5 py-1 rounded-full font-semibold">
            STEP {step} OF 3
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">STARTUP NAME</label>
                <input
                  type="text"
                  required
                  placeholder="AlphaSpace AI"
                  className="w-full glass-input text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">INDUSTRY</label>
                  <input
                    type="text"
                    required
                    placeholder="Generative AI"
                    className="w-full glass-input text-sm"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">WEBSITE (OPTIONAL)</label>
                  <input
                    type="text"
                    placeholder="https://alphaspace.ai"
                    className="w-full glass-input text-sm"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">STARTUP STAGE</label>
                <div className="grid grid-cols-5 gap-2">
                  {stages.map(s => (
                    <button
                      key={s}
                      type="button"
                      className={`py-2 px-1 text-[10px] font-semibold rounded-lg border transition cursor-pointer text-center ${
                        stage === s 
                          ? 'bg-indigo-600 border-indigo-500 text-white' 
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                      onClick={() => setStage(s as any)}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">STARTUP CORE IDEA / PROBLEM STATEMENT</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Summarize the core problem you are solving..."
                  className="w-full glass-input text-sm resize-none"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">VISION (WHERE ARE YOU GOING?)</label>
                <input
                  type="text"
                  required
                  placeholder="Empower developers to build visually without code..."
                  className="w-full glass-input text-sm"
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">MISSION (HOW WILL YOU GET THERE?)</label>
                <input
                  type="text"
                  required
                  placeholder="Providing high-performance visual agent graph pipelines..."
                  className="w-full glass-input text-sm"
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                />
              </div>
              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-semibold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">TARGET MARKET</label>
                  <input
                    type="text"
                    required
                    placeholder="B2B Developers / Agencies"
                    className="w-full glass-input text-sm"
                    value={targetMarket}
                    onChange={(e) => setTargetMarket(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">REVENUE MODEL</label>
                  <input
                    type="text"
                    required
                    placeholder="SaaS / Usage Subscriptions"
                    className="w-full glass-input text-sm"
                    value={revenueModel}
                    onChange={(e) => setRevenueModel(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">BUSINESS LOCATION</label>
                  <input
                    type="text"
                    required
                    placeholder="San Francisco, CA"
                    className="w-full glass-input text-sm"
                    value={businessLocation}
                    onChange={(e) => setBusinessLocation(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">EXPECTED TEAM SIZE</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="w-full glass-input text-sm"
                    value={expectedTeamSize}
                    onChange={(e) => setExpectedTeamSize(Number(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">FUNDING STAGE</label>
                <div className="grid grid-cols-5 gap-2">
                  {fundStages.map(f => (
                    <button
                      key={f}
                      type="button"
                      className={`py-2 px-1 text-[9px] font-semibold rounded-lg border transition cursor-pointer text-center ${
                        fundingStage === f 
                          ? 'bg-indigo-600 border-indigo-500 text-white' 
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                      onClick={() => setFundingStage(f as any)}
                    >
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-semibold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Bootstrapping...' : 'Generate Workspace'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
export default OnboardingForm;
