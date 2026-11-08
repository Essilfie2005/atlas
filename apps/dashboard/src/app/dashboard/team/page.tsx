'use client';
import { useState, useEffect } from 'react';
import { Users, Plus, Mail, Trash2, Crown, Shield, Code2, Eye, MoreHorizontal, X, Loader2 } from 'lucide-react';
import { useToast } from '@/components/toast';

const ROLES = [
  { value: 'OWNER',     label: 'Owner',     icon: <Crown className="w-3.5 h-3.5" />,   color: 'text-amber-600 bg-amber-50 border-amber-200',  desc: 'Full access. Cannot be removed.' },
  { value: 'ADMIN',     label: 'Admin',     icon: <Shield className="w-3.5 h-3.5" />,   color: 'text-purple-600 bg-purple-50 border-purple-200', desc: 'Manage everything except billing.' },
  { value: 'DEVELOPER', label: 'Developer', icon: <Code2 className="w-3.5 h-3.5" />,   color: 'text-blue-600 bg-blue-50 border-blue-200',     desc: 'Access API keys and webhooks.' },
  { value: 'VIEWER',    label: 'Viewer',    icon: <Eye className="w-3.5 h-3.5" />,    color: 'text-slate-600 bg-slate-50 border-slate-200',  desc: 'Read-only access.' },
] as const;

type Role = (typeof ROLES)[number]['value'];

interface Member {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: 'ACTIVE' | 'PENDING';
  joinedAt: string;
}

function RoleBadge({ role }: { role: Role }) {
  const r = ROLES.find(r => r.value === role)!;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${r.color}`}>
      {r.icon} {r.label}
    </span>
  );
}

function avatarInitials(name: string, email: string) {
  if (name) return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-emerald-500 to-emerald-600',
  'from-amber-500 to-amber-600',
  'from-rose-500 to-rose-600',
];

export default function TeamPage() {
  const { success, error: toastError } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('DEVELOPER');
  const [inviteName, setInviteName] = useState('');
  const [inviting, setInviting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('atlas_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/v1/team`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setMembers(json.data ?? []);
      }
    } catch {
      // silently fail – API endpoint might not exist yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const token = sessionStorage.getItem('atlas_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/v1/team/invite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), name: inviteName.trim(), role: inviteRole }),
      });
      if (res.ok) {
        const json = await res.json();
        setMembers(prev => [...prev, json.data]);
        setShowInvite(false);
        setInviteEmail(''); setInviteName(''); setInviteRole('DEVELOPER');
        success('Invite sent!', `${inviteEmail} has been invited as ${inviteRole}.`);
      } else {
        const err = await res.json().catch(() => ({}));
        toastError('Invite failed', (err as any)?.error?.message ?? 'Something went wrong');
      }
    } catch {
      toastError('Invite failed', 'Could not reach server');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (member: Member) => {
    if (member.role === 'OWNER') return;
    setDeletingId(member.id);
    try {
      const token = sessionStorage.getItem('atlas_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/v1/team/${member.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok || res.status === 204) {
        setMembers(prev => prev.filter(m => m.id !== member.id));
        success('Member removed', `${member.email} has been removed from the team.`);
      } else {
        toastError('Remove failed', 'Could not remove member');
      }
    } catch {
      toastError('Remove failed', 'Could not reach server');
    } finally {
      setDeletingId(null);
      setOpenMenuId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage who has access to your ATLAS account.</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Invite Member
        </button>
      </div>

      {/* Role reference */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ROLES.map(r => (
          <div key={r.value} className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${r.color} mb-2`}>
              {r.icon} {r.label}
            </span>
            <p className="text-xs text-slate-400 leading-snug">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Members table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-900">{members.length} member{members.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
          </div>
        ) : members.length === 0 ? (
          <div className="py-16 flex flex-col items-center text-center">
            <Users className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-slate-500 font-semibold text-sm">No team members yet</p>
            <p className="text-slate-400 text-xs mt-1">Invite your first team member to collaborate</p>
            <button onClick={() => setShowInvite(true)} className="mt-4 px-4 py-2 text-sm text-blue-600 font-semibold hover:bg-blue-50 rounded-xl transition-colors">
              + Invite someone
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {members.map((member, i) => (
              <div key={member.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors group">
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {avatarInitials(member.name, member.email)}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 truncate">{member.name || member.email}</p>
                    {member.status === 'PENDING' && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full">Pending</span>
                    )}
                  </div>
                  {member.name && <p className="text-xs text-slate-400 truncate">{member.email}</p>}
                </div>
                {/* Role */}
                <RoleBadge role={member.role} />
                {/* Actions */}
                <div className="relative flex-shrink-0">
                  {member.role !== 'OWNER' && (
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {openMenuId === member.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl border border-slate-100 shadow-xl z-10 overflow-hidden">
                          <button
                            onClick={() => handleRemove(member)}
                            disabled={deletingId === member.id}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            {deletingId === member.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            Remove member
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-brand" />
                <h2 className="text-lg font-bold text-slate-900">Invite Team Member</h2>
              </div>
              <button onClick={() => setShowInvite(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                <input
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.filter(r => r.value !== 'OWNER').map(r => (
                    <button
                      key={r.value}
                      onClick={() => setInviteRole(r.value)}
                      className={`flex items-start gap-2 p-3 rounded-xl border-2 text-left transition-colors ${inviteRole === r.value ? 'border-brand bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <span className={`mt-0.5 ${inviteRole === r.value ? 'text-brand' : 'text-slate-400'}`}>{r.icon}</span>
                      <div>
                        <p className={`text-xs font-bold ${inviteRole === r.value ? 'text-brand' : 'text-slate-700'}`}>{r.label}</p>
                        <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{r.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowInvite(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={!inviteEmail.trim() || inviting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand/90 disabled:opacity-50 transition-colors"
              >
                {inviting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...</> : <><Mail className="w-3.5 h-3.5" /> Send Invite</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
