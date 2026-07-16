import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  ArrowLeft, Mail, Phone, Calendar, MapPin, Briefcase, Award,
  CheckCircle2, Clock, AlertTriangle, BarChart3, FileText,
  MessageSquare, Activity, UserCheck, Star, Zap, TrendingUp
} from 'lucide-react';

interface MemberProfileProps {
  memberId: string;
  onBack: () => void;
}

const MemberProfile: React.FC<MemberProfileProps> = ({ memberId, onBack }) => {
  const members = useSelector((state: RootState) => state.team.members);
  const member = members.find(m => m.userId === memberId);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'activity'>('overview');

  if (!member) {
    return (
      <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition mb-6">
          <ArrowLeft size={14} /> Back to Team
        </button>
        <div className="text-center py-20">
          <UserCheck size={32} className="text-gray-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-400">Member not found</h3>
        </div>
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    'Founder': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    'Co-Founder': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    'Admin': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    'Team Member': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    'Mentor': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  };

  const perfColor = member.performanceScore >= 80 ? 'emerald' : member.performanceScore >= 50 ? 'amber' : 'red';

  // ─── Overview Tab ─────────────────────────
  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Bio & Details */}
      <div className="lg:col-span-2 space-y-6">
        {/* Bio */}
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">About</h3>
          <p className="text-sm text-gray-300 leading-relaxed">{member.bio || 'No bio added yet.'}</p>
        </div>

        {/* Skills */}
        {member.skills && member.skills.length > 0 && (
          <div className="bg-slate-900/40 border border-white/5 rounded-xl p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Skills & Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {member.skills.map((skill, i) => (
                <span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{skill}</span>
              ))}
            </div>
          </div>
        )}

        {/* Contact Details */}
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center"><Mail size={14} className="text-gray-400" /></div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Email</p>
                <p className="text-xs text-white">{member.email}</p>
              </div>
            </div>
            {member.phone && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center"><Phone size={14} className="text-gray-400" /></div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Phone</p>
                  <p className="text-xs text-white">{member.phone}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center"><Calendar size={14} className="text-gray-400" /></div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Joined</p>
                <p className="text-xs text-white">{member.joiningDate ? new Date(member.joiningDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center"><Briefcase size={14} className="text-gray-400" /></div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Employment</p>
                <p className="text-xs text-white">{member.employmentType || 'Full-Time'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Stats Cards */}
      <div className="space-y-4">
        {/* Performance Ring */}
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-5 text-center">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Performance Score</h3>
          <div className="relative w-28 h-28 mx-auto mb-3">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke={`var(--tw-${perfColor})`} strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${member.performanceScore}, 100`}
                className={`stroke-${perfColor}-500`} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold text-${perfColor}-400`}>{member.performanceScore}%</span>
            </div>
          </div>
          <p className={`text-[10px] font-bold uppercase tracking-wider text-${perfColor}-400`}>
            {member.performanceScore >= 80 ? 'Excellent' : member.performanceScore >= 50 ? 'Average' : 'Needs Improvement'}
          </p>
        </div>

        {/* Quick Stats */}
        {[
          { label: 'Assigned Tasks', value: member.assignedTasks, icon: FileText, color: 'indigo' },
          { label: 'Completed Tasks', value: member.completedTasks, icon: CheckCircle2, color: 'emerald' },
          { label: 'Pending Tasks', value: member.assignedTasks - member.completedTasks, icon: Clock, color: 'amber' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-slate-900/40 border border-white/5 rounded-xl p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center`}>
                <Icon size={16} className={`text-${stat.color}-400`} />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="text-[10px] text-gray-500">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ─── Tasks Tab ────────────────────────────
  const renderTasks = () => (
    <div className="bg-slate-900/40 border border-white/5 rounded-xl p-6">
      <div className="text-center py-12">
        <FileText size={32} className="text-gray-600 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-gray-400">Task Details</h3>
        <p className="text-xs text-gray-500 mt-1">View assigned and completed tasks for this member in the Workforce Tasks workspace.</p>
      </div>
    </div>
  );

  // ─── Activity Tab ─────────────────────────
  const renderActivity = () => (
    <div className="bg-slate-900/40 border border-white/5 rounded-xl p-6">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Activity Timeline</h3>
      <div className="space-y-4">
        {[
          { text: `${member.fullName} joined the workspace`, time: member.joiningDate || '', type: 'join' },
          { text: `${member.completedTasks} tasks completed`, time: '', type: 'complete' },
          { text: `Performance score: ${member.performanceScore}%`, time: '', type: 'score' },
        ].map((event, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-2 h-2 rounded-full mt-1.5 ${
                event.type === 'join' ? 'bg-indigo-500' :
                event.type === 'complete' ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
              {i < 2 && <div className="w-px flex-1 bg-white/5 mt-1" />}
            </div>
            <div className="pb-4">
              <p className="text-sm text-gray-300">{event.text}</p>
              {event.time && <p className="text-[10px] text-gray-500 mt-0.5">{new Date(event.time).toLocaleDateString()}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto">
      {/* Back Button */}
      <button onClick={onBack} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition mb-6 group">
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Team
      </button>

      {/* Profile Header */}
      <div className="bg-slate-900/40 border border-white/5 rounded-xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="relative">
            {member.avatarUrl ? (
              <img src={member.avatarUrl} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-white/10" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-linear-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-3xl font-bold text-white">
                {member.fullName.charAt(0)}
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${member.isOnline ? 'bg-emerald-500' : 'bg-gray-600'}`} />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-lg font-bold text-white">{member.fullName}</h1>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleColors[member.role] || ''}`}>
                {member.role}
              </span>
              <span className={`text-[10px] font-bold ${member.isOnline ? 'text-emerald-400' : 'text-gray-500'}`}>
                {member.isOnline ? '● Online' : '● Offline'}
              </span>
            </div>
            <p className="text-sm text-gray-400">{member.designation || 'No designation'}</p>
            <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-500">
              <span className="flex items-center gap-1"><Mail size={10} />{member.email}</span>
              {member.phone && <span className="flex items-center gap-1"><Phone size={10} />{member.phone}</span>}
              <span className="flex items-center gap-1"><Briefcase size={10} />{member.employmentType || 'Full-Time'}</span>
            </div>
          </div>

          {/* Performance Badge */}
          <div className={`text-center px-5 py-3 rounded-xl bg-${perfColor}-500/10 border border-${perfColor}-500/20`}>
            <p className={`text-2xl font-bold text-${perfColor}-400`}>{member.performanceScore}%</p>
            <p className={`text-[10px] font-bold uppercase tracking-wider text-${perfColor}-400`}>Performance</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-slate-900/50 border border-white/5 rounded-xl p-1 w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: UserCheck },
          { id: 'tasks', label: 'Assigned Tasks', icon: FileText },
          { id: 'activity', label: 'Activity', icon: Activity }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}>
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'tasks' && renderTasks()}
      {activeTab === 'activity' && renderActivity()}
    </div>
  );
};

export default MemberProfile;
