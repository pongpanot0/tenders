'use client';

import { useState } from 'react';
import { Mail, Trash2, ChevronDown } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  lastActive: string;
  joinedDate: string;
}

const roleDescriptions: Record<string, string> = {
  owner: 'Full access, manage team and settings',
  editor: 'Can create and edit tenders and alerts',
  viewer: 'Read-only access to tenders and reports',
};

export function TeamSection() {
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'Sarah Chen',
      email: 'sarah@acmesoftware.com',
      role: 'owner',
      lastActive: '2 min ago',
      joinedDate: 'Sep 1, 2024',
    },
    {
      id: '2',
      name: 'Marcus Johnson',
      email: 'marcus@acmesoftware.com',
      role: 'editor',
      lastActive: '45 min ago',
      joinedDate: 'Sep 5, 2024',
    },
    {
      id: '3',
      name: 'Elena Rodriguez',
      email: 'elena@acmesoftware.com',
      role: 'editor',
      lastActive: '1 day ago',
      joinedDate: 'Sep 8, 2024',
    },
    {
      id: '4',
      name: 'David Kim',
      email: 'david@acmesoftware.com',
      role: 'viewer',
      lastActive: '3 days ago',
      joinedDate: 'Sep 10, 2024',
    },
    {
      id: '5',
      name: 'Priya Patel',
      email: 'priya@acmesoftware.com',
      role: 'viewer',
      lastActive: '5 days ago',
      joinedDate: 'Sep 12, 2024',
    },
  ]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'owner' | 'editor' | 'viewer'>(
    'editor'
  );
  const [roleChangeWarning, setRoleChangeWarning] = useState<{
    memberId: string;
    newRole: string;
  } | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;

    const newMember: TeamMember = {
      id: String(members.length + 1),
      name: inviteEmail.split('@')[0] || 'New Member',
      email: inviteEmail,
      role: inviteRole,
      lastActive: 'Never',
      joinedDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    setMembers([...members, newMember]);
    setInviteEmail('');
    setInviteRole('editor');
  };

  const handleRoleChange = (memberId: string, newRole: string) => {
    setRoleChangeWarning({ memberId, newRole: newRole as any });
  };

  const confirmRoleChange = () => {
    if (!roleChangeWarning) return;
    setMembers(
      members.map((m) =>
        m.id === roleChangeWarning.memberId
          ? { ...m, role: roleChangeWarning.newRole as any }
          : m
      )
    );
    setRoleChangeWarning(null);
  };

  const handleRemove = (memberId: string) => {
    setRemovingMemberId(memberId);
  };

  const confirmRemove = () => {
    if (!removingMemberId) return;
    setMembers(members.filter((m) => m.id !== removingMemberId));
    setRemovingMemberId(null);
  };

  return (
    <div className="space-y-8">
      {/* Members Table */}
      <div className="bg-surface border border-rule rounded-md overflow-hidden">
        <div className="px-6 py-4 border-b border-rule">
          <h3 className="font-display text-base font-bold text-ink">
            Team members
          </h3>
        </div>
        {members.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-sm text-ink-faint">No team members yet</div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-canvas border-b border-rule">
              <tr>
                <th className="text-left p-4 font-semibold text-ink">Name</th>
                <th className="text-left p-4 font-semibold text-ink">Email</th>
                <th className="text-left p-4 font-semibold text-ink">Role</th>
                <th className="text-left p-4 font-semibold text-ink">
                  Last active
                </th>
                <th className="text-left p-4 font-semibold text-ink">Joined</th>
                <th className="text-left p-4 font-semibold text-ink">Action</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-rule hover:bg-surface-raised last:border-b-0"
                >
                  <td className="p-4 font-semibold text-ink">{member.name}</td>
                  <td className="p-4 text-ink-muted">{member.email}</td>
                  <td className="p-4">
                    <div className="relative inline-block">
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(member.id, e.target.value)
                        }
                        className="px-3 py-1.5 bg-surface-raised border border-rule rounded-sm text-sm text-ink cursor-pointer appearance-none pr-8 hover:border-accent focus:outline-none focus:border-accent"
                      >
                        <option value="owner">Owner</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <ChevronDown
                        size={12}
                        className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none text-ink-muted"
                      />
                    </div>
                  </td>
                  <td className="p-4 text-ink-muted">{member.lastActive}</td>
                  <td className="p-4 text-ink-muted">{member.joinedDate}</td>
                  <td className="p-4">
                    <button
                      onClick={() => handleRemove(member.id)}
                      className="w-8 h-8 border border-rule bg-surface rounded-sm hover:border-danger hover:bg-danger/5 transition-all flex items-center justify-center"
                      title="Remove member"
                    >
                      <Trash2 size={16} className="text-danger" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Form */}
      <div className="bg-surface border border-rule rounded-md p-6">
        <h3 className="font-display text-base font-bold text-ink mb-4">
          Invite team member
        </h3>
        <div className="flex flex-col gap-4">
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 border border-rule rounded-md bg-surface">
              <Mail size={16} className="text-ink-faint" />
              <input
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInvite();
                }}
                className="flex-1 bg-transparent text-sm text-ink placeholder-ink-faint focus:outline-none"
              />
            </div>
            <div className="relative inline-block">
              <select
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as 'owner' | 'editor' | 'viewer')
                }
                className="px-3 py-2 bg-surface-raised border border-rule rounded-md text-sm text-ink cursor-pointer appearance-none pr-8 hover:border-accent focus:outline-none focus:border-accent"
              >
                <option value="owner">Owner</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none text-ink-muted"
              />
            </div>
            <button
              onClick={handleInvite}
              disabled={!inviteEmail.trim()}
              className="px-4 py-2 bg-accent text-accent-ink rounded-md text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Invite
            </button>
          </div>
          <p className="text-xs text-ink-faint">
            Role will be "{roleDescriptions[inviteRole]}"
          </p>
        </div>
      </div>

      {/* Role Change Warning Modal */}
      {roleChangeWarning && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-surface border border-rule rounded-md p-6 max-w-sm shadow-lg">
            <h3 className="font-display text-base font-bold text-ink mb-2">
              Confirm role change
            </h3>
            <p className="text-sm text-ink-muted mb-4">
              Changing to "{roleChangeWarning.newRole}" will affect access to
              sensitive data and settings. Are you sure you want to proceed?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRoleChangeWarning(null)}
                className="flex-1 px-4 py-2 bg-surface-raised border border-rule rounded-md text-sm font-medium text-ink hover:bg-canvas transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmRoleChange}
                className="flex-1 px-4 py-2 bg-accent text-accent-ink rounded-md text-sm font-medium hover:bg-blue-700 transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Removal Confirmation Modal */}
      {removingMemberId && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-surface border border-rule rounded-md p-6 max-w-sm shadow-lg">
            <h3 className="font-display text-base font-bold text-danger mb-2">
              Remove member
            </h3>
            <p className="text-sm text-ink-muted mb-4">
              {members.find((m) => m.id === removingMemberId)?.name} will lose
              access to all tenders and team settings. This action cannot be
              undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRemovingMemberId(null)}
                className="flex-1 px-4 py-2 bg-surface-raised border border-rule rounded-md text-sm font-medium text-ink hover:bg-canvas transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                className="flex-1 px-4 py-2 bg-danger text-white rounded-md text-sm font-medium hover:bg-red-700 transition-all"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
