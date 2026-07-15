import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useTeamData } from '../hooks/useReactQueries';
import { teamManagementService } from '../services/api';
import {
  Users, UserPlus, GraduationCap, Clock, CheckCircle2, AlertTriangle,
  BarChart3, Search, Filter, MoreHorizontal, Mail, Phone, Calendar,
  ChevronDown, X, Loader2, Send, Trash2, RefreshCw, Award, Globe,
  Briefcase, Eye, Shield, UserCheck, UserMinus, TrendingUp, Zap, Crown, Star
} from 'lucide-react';
import { TableSkeleton } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';

interface TeamPageProps {
  onViewMember?: (memberId: string) => void;
}

const Team: React.FC<TeamPageProps> = ({ onViewMember }) => {
  const { data: teamData, isLoading, isError, refetch } = useTeamData();
  const auth = useSelector((state: RootState) => state.auth);
  const isFounder = auth.role === 'Founder' || auth.role === 'Co-Founder';

  const rawMembers = teamData?.members || [];
  const members = rawMembers.filter((m: any) => m.role !== 'Mentor');
  const mentors = rawMembers.filter((m: any) => m.role === 'Mentor');
  const invitations = (teamData?.invitations || []).map((inv: any) => ({
    _id: inv._id,
    name: inv.name,
    email: inv.email,
    role: inv.role,
    status: inv.status,
    sentDate: inv.createdAt,
    expiresAt: inv.expiresAt,
    createdAt: inv.createdAt
  }));

  const [activeView, setActiveView] = useState<'dashboard' | 'members' | 'mentors' | 'invitations'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMentorInviteModal, setShowMentorInviteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Invite Member form state
  const [inviteForm, setInviteForm] = useState({
    fullName: '', email: '', phone: '', department: '', role: 'Team Member',
    designation: '', joiningDate: '', skills: '', employmentType: 'Full-Time'
  });

  // Invite Mentor form state
  const [mentorForm, setMentorForm] = useState({
    fullName: '', email: '', expertise: '', linkedin: '', experience: '', message: ''
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Send invite
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      const payload = {
        fullName: inviteForm.fullName,
        email: inviteForm.email,
        role: inviteForm.role,
        phone: inviteForm.phone,
        designation: inviteForm.designation,
        joiningDate: inviteForm.joiningDate,
        skills: inviteForm.skills ? inviteForm.skills.split(',').map(s => s.trim()) : [],
        employmentType: inviteForm.employmentType
      };
      await teamManagementService.inviteMember(payload);
      showToast('Invitation sent successfully!', 'success');
      setShowInviteModal(false);
      setInviteForm({ fullName: '', email: '', phone: '', department: '', role: 'Team Member', designation: '', joiningDate: '', skills: '', employmentType: 'Full-Time' });
      refetch();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to send invitation', 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  // Send mentor invite
  const handleInviteMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      const payload = {
        fullName: mentorForm.fullName,
        email: mentorForm.email,
        role: 'Mentor',
        skills: mentorForm.expertise ? mentorForm.expertise.split(',').map(s => s.trim()) : []
      };
      await teamManagementService.inviteMember(payload);
      showToast('Mentor invitation sent!', 'success');
      setShowMentorInviteModal(false);
      setMentorForm({ fullName: '', email: '', expertise: '', linkedin: '', experience: '', message: '' });
      refetch();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to invite mentor', 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  // Change role
  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      await teamManagementService.changeRole({ memberId, role: newRole });
      showToast('Role updated successfully', 'success');
      setShowRoleModal(null);
      refetch();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to change role', 'error');
    }
  };

  // Remove member
  const handleRemoveMember = async (memberId: string) => {
    try {
      await teamManagementService.removeMember(memberId);
      showToast('Member removed from workspace', 'success');
      setShowRemoveConfirm(null);
      refetch();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to remove member', 'error');
    }
  };

  // Resend invite
  const handleResendInvite = async (invitationId: string) => {
    try {
      await teamManagementService.resendInvite(invitationId);
      showToast('Invitation resent!', 'success');
      refetch();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to resend', 'error');
    }
  };


  // Filter members
  const filteredMembers = members.filter(m => {
    if (m.role === 'Mentor') return false;
    const matchSearch = m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === 'All' || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Stats
  const totalMembers = members.filter(m => m.role !== 'Mentor').length;
  const totalMentors = members.filter(m => m.role === 'Mentor').length;
  const onlineMembers = members.filter(m => m.isOnline).length;
  const pendingInvites = invitations.filter(i => i.status === 'Pending').length;
  const completedTasks = members.reduce((a, m) => a + m.completedTasks, 0);
  const assignedTasks = members.reduce((a, m) => a + m.assignedTasks, 0);
  const overdueTasks = 0;
  const avgPerformance = totalMembers > 0 ? Math.round(members.filter(m => m.role !== 'Mentor').reduce((a, m) => a + m.performanceScore, 0) / totalMembers) : 0;

  const roleColors: Record<string, string> = {
    'Founder': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    'Co-Founder': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    'Admin': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    'Team Member': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    'Mentor': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    'Investor': 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    'Guest': 'text-gray-400 bg-gray-500/10 border-gray-500/20'
  };

  const roleIcons: Record<string, React.ReactNode> = {
    'Founder': <Crown size={10} />,
    'Co-Founder': <Star size={10} />,
    'Mentor': <GraduationCap size={10} />,
    'Team Member': <UserCheck size={10} />,
  };

  // ────────────────────────────────────────────────
  // RENDER: Dashboard Cards
  // ────────────────────────────────────────────────
  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: totalMembers, icon: Users, color: 'indigo', sub: `${onlineMembers} online` },
          { label: 'Total Mentors', value: totalMentors, icon: GraduationCap, color: 'cyan', sub: 'Assigned' },
          { label: 'Pending Invites', value: pendingInvites, icon: Clock, color: 'amber', sub: 'Awaiting' },
          { label: 'Performance', value: `${avgPerformance}%`, icon: TrendingUp, color: 'emerald', sub: 'Team avg' },
          { label: 'Completed Tasks', value: completedTasks, icon: CheckCircle2, color: 'green', sub: 'All time' },
          { label: 'Active Tasks', value: assignedTasks - completedTasks, icon: Zap, color: 'blue', sub: 'In progress' },
          { label: 'Online Now', value: onlineMembers, icon: Globe, color: 'teal', sub: `of ${totalMembers}` },
          { label: 'Total Assigned', value: assignedTasks, icon: BarChart3, color: 'purple', sub: 'Tasks' }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-5 hover:border-white/10 transition group">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center`}>
                  <Icon size={18} className={`text-${stat.color}-400`} />
                </div>
                <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{stat.sub}</span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Quick Actions</h3>
        <div className={`grid ${isFounder ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'} gap-3`}>
          {isFounder && (
            <>
              <button onClick={() => setShowInviteModal(true)} className="flex items-center gap-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl px-4 py-3 transition group">
                <UserPlus size={18} className="text-indigo-400" />
                <span className="text-sm font-semibold text-indigo-300">Invite Member</span>
              </button>
              <button onClick={() => setShowMentorInviteModal(true)} className="flex items-center gap-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-xl px-4 py-3 transition group">
                <GraduationCap size={18} className="text-cyan-400" />
                <span className="text-sm font-semibold text-cyan-300">Invite Mentor</span>
              </button>
            </>
          )}
          <button onClick={() => setActiveView('members')} className="flex items-center gap-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl px-4 py-3 transition group">
            <Users size={18} className="text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-300">View Team</span>
          </button>
          {isFounder && (
            <button onClick={() => setActiveView('invitations')} className="flex items-center gap-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl px-4 py-3 transition group">
              <Mail size={18} className="text-amber-400" />
              <span className="text-sm font-semibold text-amber-300">Invitations</span>
            </button>
          )}
        </div>
      </div>

      {/* Recent Members */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Recent Team Members</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.filter(m => m.role !== 'Mentor').slice(0, 6).map(member => (
            <div key={member._id} className="bg-slate-900/50 border border-white/5 rounded-xl p-4 hover:border-white/10 transition cursor-pointer group"
              onClick={() => onViewMember?.(member.userId)}>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-300">
                      {member.fullName.charAt(0)}
                    </div>
                  )}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${member.isOnline ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white truncate">{member.fullName}</h4>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${roleColors[member.role] || roleColors['Guest']}`}>
                    {roleIcons[member.role]} {member.role}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-500">
                <span>{member.designation || 'No designation'}</span>
                <span className="flex items-center gap-1">
                  <BarChart3 size={10} />
                  {member.performanceScore}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ────────────────────────────────────────────────
  // RENDER: Members Table
  // ────────────────────────────────────────────────
  const renderMembersTable = () => (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 w-full md:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search members..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/30"
            />
          </div>
          <div className="relative">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="appearance-none bg-slate-900/60 border border-white/5 rounded-xl text-sm text-gray-300 px-4 py-2.5 pr-8 focus:outline-none focus:border-indigo-500/30"
            >
              <option value="All">All Roles</option>
              <option value="Founder">Founder</option>
              <option value="Co-Founder">Co-Founder</option>
              <option value="Team Member">Team Member</option>
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>
        {isFounder && (
          <button onClick={() => setShowInviteModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-lg shadow-indigo-500/20">
            <UserPlus size={14} /> Invite Member
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-900/40 border border-white/5 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 size={24} className="text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading team members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={32} className="text-gray-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-gray-400">No members found</h3>
            <p className="text-xs text-gray-500 mt-1">Start by inviting your first team member.</p>
            {isFounder && (
              <button onClick={() => setShowInviteModal(true)} className="mt-4 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition">
                + Invite Member
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Member</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Role</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 hidden md:table-cell">Designation</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 hidden lg:table-cell">Contact</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 hidden lg:table-cell">Status</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Tasks</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Performance</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredMembers.map(member => (
                  <tr key={member._id} className="hover:bg-white/[0.02] transition group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => onViewMember?.(member.userId)}>
                        <div className="relative">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                              {member.fullName.charAt(0)}
                            </div>
                          )}
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${member.isOnline ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-indigo-300 transition">{member.fullName}</p>
                          <p className="text-[10px] text-gray-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleColors[member.role] || roleColors['Guest']}`}>
                        {roleIcons[member.role]} {member.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400 hidden md:table-cell">{member.designation || '—'}</td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        {member.phone && <span className="flex items-center gap-1"><Phone size={9} />{member.phone}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${member.isOnline ? 'text-emerald-400' : 'text-gray-500'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${member.isOnline ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                        {member.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs">
                        <span className="text-emerald-400 font-bold">{member.completedTasks}</span>
                        <span className="text-gray-600"> / </span>
                        <span className="text-gray-400">{member.assignedTasks}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${
                            member.performanceScore >= 80 ? 'bg-emerald-500' :
                            member.performanceScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
                          }`} style={{ width: `${member.performanceScore}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">{member.performanceScore}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => onViewMember?.(member.userId)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-indigo-400 transition" title="View Profile">
                          <Eye size={14} />
                        </button>
                        {isFounder && (
                          <>
                            <button onClick={() => setShowRoleModal(member._id)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-blue-400 transition" title="Change Role">
                              <Shield size={14} />
                            </button>
                            <button onClick={() => setShowRemoveConfirm(member._id)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-red-400 transition" title="Remove">
                              <UserMinus size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Change Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowRoleModal(null)}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-white mb-4">Change Role</h3>
            <div className="space-y-2">
              {['Founder', 'Co-Founder', 'Admin', 'Team Member'].map(role => (
                <button key={role} onClick={() => handleChangeRole(showRoleModal, role)}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-white/5 hover:text-white transition border border-transparent hover:border-white/10">
                  <span className={`inline-flex items-center gap-2 text-xs font-bold px-2 py-0.5 rounded-md border ${roleColors[role]}`}>
                    {roleIcons[role]} {role}
                  </span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowRoleModal(null)} className="mt-4 w-full py-2 text-xs text-gray-500 hover:text-gray-300 transition">Cancel</button>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowRemoveConfirm(null)}>
          <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-red-400" />
            </div>
            <h3 className="text-sm font-bold text-white text-center mb-2">Remove Member</h3>
            <p className="text-xs text-gray-400 text-center mb-5">This will revoke their access to the workspace immediately. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowRemoveConfirm(null)} className="flex-1 py-2.5 text-xs font-bold text-gray-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition">Cancel</button>
              <button onClick={() => handleRemoveMember(showRemoveConfirm)} className="flex-1 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl transition shadow-lg shadow-red-500/20">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ────────────────────────────────────────────────
  // RENDER: Mentors View
  // ────────────────────────────────────────────────
  const renderMentors = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Startup Mentors</h3>
        {isFounder && (
          <button onClick={() => setShowMentorInviteModal(true)} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-lg shadow-cyan-500/20">
            <GraduationCap size={14} /> Invite Mentor
          </button>
        )}
      </div>

      {mentors.length === 0 ? (
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-12 text-center">
          <GraduationCap size={32} className="text-gray-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-400">No mentors yet</h3>
          <p className="text-xs text-gray-500 mt-1">Invite experienced mentors to guide your startup journey.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mentors.map(mentor => (
            <div key={mentor._id} className="bg-slate-900/50 border border-white/5 rounded-xl p-5 hover:border-cyan-500/20 transition group">
              <div className="flex items-center gap-3 mb-4">
                {mentor.avatarUrl ? (
                  <img src={mentor.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-cyan-500/30" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-cyan-900/30 border-2 border-cyan-500/30 flex items-center justify-center text-lg font-bold text-cyan-300">
                    {mentor.fullName.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-white">{mentor.fullName}</h4>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1"><Mail size={9} />{mentor.email}</p>
                </div>
              </div>
              {mentor.expertise && mentor.expertise.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {mentor.expertise.map((skill, i) => (
                    <span key={i} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{skill}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between text-[10px] text-gray-500 pt-3 border-t border-white/5">
                <span className="flex items-center gap-1"><Award size={10} /> {mentor.feedbackGivenCount || 0} Feedback</span>
                <span className="flex items-center gap-1"><Calendar size={10} /> {mentor.meetingsScheduledCount || 0} Meetings</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ────────────────────────────────────────────────
  // RENDER: Invitations
  // ────────────────────────────────────────────────
  const renderInvitations = () => {
    const pending = invitations.filter(i => i.status === 'Pending');
    const accepted = invitations.filter(i => i.status === 'Accepted');
    const expired = invitations.filter(i => i.status === 'Expired');
    const rejected = invitations.filter(i => i.status === 'Rejected');

    const statusColors: Record<string, string> = {
      'Pending': 'text-amber-400 bg-amber-500/10',
      'Accepted': 'text-emerald-400 bg-emerald-500/10',
      'Expired': 'text-red-400 bg-red-500/10',
      'Rejected': 'text-gray-400 bg-gray-500/10'
    };

    const renderInvList = (title: string, list: typeof invitations) => (
      <div>
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{title} ({list.length})</h4>
        {list.length === 0 ? (
          <p className="text-xs text-gray-600 pl-2">No invitations.</p>
        ) : (
          <div className="space-y-2">
            {list.map(inv => (
              <div key={inv._id} className="bg-slate-900/40 border border-white/5 rounded-xl px-5 py-3.5 flex items-center justify-between hover:border-white/10 transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-gray-400">
                    {inv.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{inv.name}</p>
                    <p className="text-[10px] text-gray-500">{inv.email} · {inv.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${statusColors[inv.status]}`}>{inv.status}</span>
                  <span className="text-[10px] text-gray-600">{new Date(inv.createdAt).toLocaleDateString()}</span>
                  {inv.status === 'Pending' && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleResendInvite(inv._id)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-indigo-400 transition" title="Resend">
                        <RefreshCw size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );

    return (
      <div className="space-y-6">
        {renderInvList('Pending Invitations', pending)}
        {renderInvList('Accepted Invitations', accepted)}
        {renderInvList('Rejected Invitations', rejected)}
        {renderInvList('Expired Invitations', expired)}
      </div>
    );
  };

  // ────────────────────────────────────────────────
  // MODALS: Invite Member / Mentor
  // ────────────────────────────────────────────────
  const renderInviteModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowInviteModal(false)}>
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <UserPlus size={18} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Invite Team Member</h3>
              <p className="text-[10px] text-gray-500">Send an invitation to join your workspace</p>
            </div>
          </div>
          <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-white/5 rounded-xl transition text-gray-500 hover:text-gray-300">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleInviteMember} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name *</label>
              <input value={inviteForm.fullName} onChange={e => setInviteForm({ ...inviteForm, fullName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/30" placeholder="John Doe" required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email *</label>
              <input value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} type="email"
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/30" placeholder="john@email.com" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Phone</label>
              <input value={inviteForm.phone} onChange={e => setInviteForm({ ...inviteForm, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/30" placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Role *</label>
              <select value={inviteForm.role} onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-indigo-500/30">
                <option value="Team Member">Team Member</option>
                <option value="Co-Founder">Co-Founder</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Designation</label>
              <input value={inviteForm.designation} onChange={e => setInviteForm({ ...inviteForm, designation: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/30" placeholder="Frontend Developer" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Joining Date</label>
              <input value={inviteForm.joiningDate} onChange={e => setInviteForm({ ...inviteForm, joiningDate: e.target.value })} type="date"
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-indigo-500/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Skills</label>
              <input value={inviteForm.skills} onChange={e => setInviteForm({ ...inviteForm, skills: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/30" placeholder="React, Node.js, Python" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Employment Type</label>
              <select value={inviteForm.employmentType} onChange={e => setInviteForm({ ...inviteForm, employmentType: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-indigo-500/30">
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contractor">Contractor</option>
                <option value="Intern">Intern</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={inviteLoading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-40 shadow-lg shadow-indigo-500/20">
            {inviteLoading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} /> Send Invitation</>}
          </button>
        </form>
      </div>
    </div>
  );

  const renderMentorInviteModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowMentorInviteModal(false)}>
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <GraduationCap size={18} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Invite Mentor</h3>
              <p className="text-[10px] text-gray-500">Add an experienced mentor to guide your team</p>
            </div>
          </div>
          <button onClick={() => setShowMentorInviteModal(false)} className="p-2 hover:bg-white/5 rounded-xl transition text-gray-500 hover:text-gray-300">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleInviteMentor} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Name *</label>
              <input value={mentorForm.fullName} onChange={e => setMentorForm({ ...mentorForm, fullName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/30" placeholder="Dr. Jane Smith" required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email *</label>
              <input value={mentorForm.email} onChange={e => setMentorForm({ ...mentorForm, email: e.target.value })} type="email"
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/30" placeholder="jane@email.com" required />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Expertise Areas</label>
            <input value={mentorForm.expertise} onChange={e => setMentorForm({ ...mentorForm, expertise: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/30" placeholder="Product Strategy, Fundraising, Growth" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">LinkedIn</label>
              <input value={mentorForm.linkedin} onChange={e => setMentorForm({ ...mentorForm, linkedin: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/30" placeholder="linkedin.com/in/username" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Experience</label>
              <input value={mentorForm.experience} onChange={e => setMentorForm({ ...mentorForm, experience: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/30" placeholder="10+ years in SaaS" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Personal Message</label>
            <textarea value={mentorForm.message} onChange={e => setMentorForm({ ...mentorForm, message: e.target.value })} rows={3}
              className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/30 resize-none" placeholder="We'd love your guidance on..." />
          </div>

          <button type="submit" disabled={inviteLoading}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-40 shadow-lg shadow-cyan-500/20">
            {inviteLoading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} /> Send Mentor Invitation</>}
          </button>
        </form>
      </div>
    </div>
  );

  // ────────────────────────────────────────────────
  // MAIN LAYOUT
  // ────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <ErrorState onRetry={refetch} message="Failed to load team workspace data." />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-white">Team Management</h1>
          <p className="text-xs text-gray-500 mt-1">Build, manage, and track your startup workforce</p>
        </div>
        {isFounder && (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowInviteModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-lg shadow-indigo-500/20">
              <UserPlus size={14} /> Invite
            </button>
          </div>
        )}
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-slate-900/50 border border-white/5 rounded-xl p-1 w-fit">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'members', label: 'Members', icon: Users },
          { id: 'mentors', label: 'Mentors', icon: GraduationCap },
          ...(isFounder ? [{ id: 'invitations', label: 'Invitations', icon: Mail }] : [])
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveView(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                activeView === tab.id
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}>
              <Icon size={14} />
              {tab.label}
              {tab.id === 'invitations' && pendingInvites > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[8px] font-extrabold bg-amber-500/20 text-amber-400 rounded-full">{pendingInvites}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeView === 'dashboard' && renderDashboard()}
      {activeView === 'members' && renderMembersTable()}
      {activeView === 'mentors' && renderMentors()}
      {activeView === 'invitations' && renderInvitations()}

      {/* Modals */}
      {showInviteModal && renderInviteModal()}
      {showMentorInviteModal && renderMentorInviteModal()}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[60] px-5 py-3 rounded-xl border text-sm font-semibold shadow-2xl backdrop-blur-xl transition-all ${
          toast.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
