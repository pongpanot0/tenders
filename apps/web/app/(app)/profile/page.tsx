'use client';

import { useState } from 'react';
import { Edit2 } from 'lucide-react';
import ProfileEditor from './ProfileEditor';

export interface ProfileData {
  version: number;
  status: 'active' | 'inactive';
  lastUpdated: string;
  capabilities: string[];
  markets: string[];
  languages: string[];
  constraints: string[];
}

const defaultProfile: ProfileData = {
  version: 12,
  status: 'active',
  lastUpdated: '2 Sep',
  capabilities: ['Custom software', 'React, Node.js, AWS', 'Mobile development'],
  markets: ['Singapore, Australia', 'Remote, hybrid'],
  languages: ['English'],
  constraints: ['Budget: $20k-$150k', 'Min. 7 days to bid', 'ISO 27001'],
};

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);

  const handleSave = (updatedProfile: ProfileData) => {
    setProfile(updatedProfile);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <ProfileEditor
        initialProfile={profile}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl font-bold">Company profile</h1>
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-accent text-accent-ink rounded-md text-sm font-medium hover:bg-blue-700 transition-all flex items-center gap-2"
        >
          <Edit2 size={16} />
          Edit profile
        </button>
      </div>

      {/* Metadata line */}
      <div className="text-sm text-ink-muted">
        Profile version {profile.version} · {profile.status === 'active' ? 'Active' : 'Inactive'} · Updated {profile.lastUpdated}
      </div>

      {/* Three-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Capabilities */}
        <div className="bg-surface border border-rule rounded-md p-6">
          <h2 className="font-semibold text-ink mb-4">Capabilities</h2>
          <div className="flex flex-col gap-3">
            {profile.capabilities.map((cap, idx) => (
              <div key={idx} className="text-sm text-ink-muted">
                {cap}
              </div>
            ))}
          </div>
        </div>

        {/* Markets & delivery */}
        <div className="bg-surface border border-rule rounded-md p-6">
          <h2 className="font-semibold text-ink mb-4">Markets & delivery</h2>
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-1">
                Regions
              </div>
              {profile.markets.map((market, idx) => (
                <div key={idx} className="text-sm text-ink-muted">
                  {market}
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-rule">
              <div className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-1">
                Languages
              </div>
              {profile.languages.map((lang, idx) => (
                <div key={idx} className="text-sm text-ink-muted">
                  {lang}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Constraints */}
        <div className="bg-surface border border-rule rounded-md p-6">
          <h2 className="font-semibold text-ink mb-4">Constraints</h2>
          <div className="flex flex-col gap-3">
            {profile.constraints.map((constraint, idx) => (
              <div key={idx} className="text-sm text-ink-muted">
                {constraint}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How this affects matches section */}
      <div className="bg-surface border border-rule rounded-md p-6">
        <h2 className="font-semibold text-ink mb-4">How this affects matches</h2>
        <div className="flex gap-4 flex-wrap">
          <button className="px-4 py-2 bg-surface-raised border border-rule rounded-md text-sm text-ink hover:border-accent hover:bg-white transition-all">
            Preview matched tenders
          </button>
          <button className="px-4 py-2 bg-surface-raised border border-rule rounded-md text-sm text-ink hover:border-accent hover:bg-white transition-all">
            View recent profile changes
          </button>
        </div>
      </div>
    </div>
  );
}
