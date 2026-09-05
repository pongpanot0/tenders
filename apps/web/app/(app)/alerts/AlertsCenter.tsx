'use client';

import { useState } from 'react';
import {
  Target,
  Calendar,
  Star,
  RefreshCw,
  Search,
  Mail,
  Bell,
  Zap,
  Settings,
  ArrowRight,
} from 'lucide-react';

interface AlertItem {
  id: string;
  reason: 'New strong match' | 'Deadline changed' | 'Worth reviewing' | 'Tender updated' | 'Saved search match';
  title: string;
  organization: string;
  timeAgo: string;
  channels: Array<'email' | 'inapp' | 'slack'>;
  read: boolean;
}

const iconMap: Record<AlertItem['reason'], React.ReactNode> = {
  'New strong match': <Target size={16} />,
  'Deadline changed': <Calendar size={16} />,
  'Worth reviewing': <Star size={16} />,
  'Tender updated': <RefreshCw size={16} />,
  'Saved search match': <Search size={16} />,
};

const initialAlerts: AlertItem[] = [
  {
    id: 'alert-001',
    reason: 'New strong match',
    title: 'Cloud case management',
    organization: 'Ministry of Health',
    timeAgo: '30 sec ago',
    channels: ['email', 'inapp'],
    read: false,
  },
  {
    id: 'alert-002',
    reason: 'Deadline changed',
    title: 'Mobile service platform: Deadline moved to 05 Oct',
    organization: 'State Bank',
    timeAgo: '3h ago',
    channels: ['email'],
    read: true,
  },
  {
    id: 'alert-003',
    reason: 'Worth reviewing',
    title: 'Data integration support',
    organization: 'Transportation Authority',
    timeAgo: '1d ago',
    channels: ['inapp'],
    read: true,
  },
  {
    id: 'alert-004',
    reason: 'Tender updated',
    title: 'Government portal upgrade phase 2: Requirements clarified',
    organization: 'Ministry of Communications',
    timeAgo: '2d ago',
    channels: ['email'],
    read: true,
  },
  {
    id: 'alert-005',
    reason: 'Saved search match',
    title: 'New tender: "React cloud platform" (Your saved search)',
    organization: 'State & Ministry sources',
    timeAgo: '3d ago',
    channels: ['inapp'],
    read: true,
  },
  {
    id: 'alert-006',
    reason: 'New strong match',
    title: 'Mobile banking security audit',
    organization: 'Central Bank Philippines',
    timeAgo: '5d ago',
    channels: ['email', 'inapp'],
    read: true,
  },
];

interface SlackConfig {
  connected: boolean;
  workspace?: string;
  channel?: string;
  detailLevel?: 'summary' | 'full';
  emojiReactions?: boolean;
}

interface Settings {
  emailEnabled: boolean;
  inappEnabled: boolean;
  slackConnected: boolean;
  slack: SlackConfig;
  instantThreshold: number;
  digestDays: string[];
  digestTime: string;
  digestMinScore: number;
  digestMaxItems: number;
  deadlineReminders: {
    sevenDay: boolean;
    threeDay: boolean;
    oneDay: boolean;
  };
}

export function AlertsCenter() {
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [settings, setSettings] = useState<Settings>({
    emailEnabled: true,
    inappEnabled: true,
    slackConnected: false,
    slack: {
      connected: false,
    },
    instantThreshold: 80,
    digestDays: ['Mon', 'Wed', 'Fri'],
    digestTime: '09:00',
    digestMinScore: 60,
    digestMaxItems: 10,
    deadlineReminders: {
      sevenDay: true,
      threeDay: true,
      oneDay: false,
    },
  });

  const toggleReadStatus = (alertId: string) => {
    setAlerts((prevAlerts) =>
      prevAlerts.map((alert) =>
        alert.id === alertId ? { ...alert, read: !alert.read } : alert
      )
    );
  };

  const updateSettings = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const unreadCount = alerts.filter((a) => !a.read).length;

  const renderPreviewText = () => {
    const threshold = settings.instantThreshold;
    const channels: string[] = [];
    if (settings.emailEnabled) channels.push('emailed');
    if (settings.inappEnabled) channels.push('shown in-app');

    const channelText = channels.length > 0 ? `will be ${channels.join(' and ')}` : 'will be stored';

    return `A tender scoring ${threshold}, published today, ${channelText} immediately.`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
      {/* Main Feed */}
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold font-display mb-6 text-ink">
          Alerts Center
        </h1>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-6 pb-4 border-b border-rule flex-wrap">
          <button className="px-4 py-3 text-sm font-medium text-accent border-b-2 border-accent transition-all">
            All
          </button>
          <button className="px-4 py-3 text-sm font-medium text-ink-muted hover:text-ink border-b-2 border-transparent transition-all">
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button className="px-4 py-3 text-sm font-medium text-ink-muted hover:text-ink border-b-2 border-transparent transition-all">
            New matches
          </button>
          <button className="px-4 py-3 text-sm font-medium text-ink-muted hover:text-ink border-b-2 border-transparent transition-all">
            Changes
          </button>
        </div>

        {/* Alert Items */}
        <div className="flex flex-col gap-4">
          {alerts.length === 0 ? (
            <div className="text-center py-12 bg-surface border border-rule rounded-md text-ink-faint">
              <Bell size={32} className="mx-auto mb-4 opacity-50" />
              <p className="text-sm">No alerts yet. New matches will appear here.</p>
              <button className="mt-4 px-4 py-2 bg-accent text-white rounded-sm text-xs font-medium hover:bg-blue-700">
                Review how alerts work
              </button>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-surface border rounded-md p-5 transition-all cursor-pointer ${
                  alert.read
                    ? 'border-rule hover:border-accent hover:bg-blue-50/50'
                    : 'border-accent bg-blue-50 relative'
                }`}
                onClick={() => toggleReadStatus(alert.id)}
              >
                {/* Unread indicator bar */}
                {!alert.read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-l-md" />
                )}

                <div className="ml-4 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
                  <div className="flex flex-col gap-3">
                    {/* Alert Type with Icon */}
                    <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wide">
                      {iconMap[alert.reason]}
                      {alert.reason}
                    </div>

                    {/* Alert Title */}
                    <div className="text-sm font-semibold text-ink line-clamp-2">
                      {alert.title}
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-ink-muted">
                      <span>{alert.timeAgo}</span>
                      <span>·</span>
                      <span>{alert.organization}</span>

                      {/* Channel Badges */}
                      <div className="flex gap-2 mt-2 sm:mt-0">
                        {alert.channels.map((channel) => (
                          <div
                            key={channel}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-medium ${
                              channel === 'email'
                                ? 'bg-blue-50 text-accent'
                                : channel === 'inapp'
                                  ? 'bg-green-50 text-success'
                                  : 'bg-canvas text-ink-muted'
                            }`}
                          >
                            {channel === 'email' && <Mail size={12} />}
                            {channel === 'inapp' && <Bell size={12} />}
                            {channel === 'slack' && <Zap size={12} />}
                            {channel === 'email' && 'Email'}
                            {channel === 'inapp' && 'In-app'}
                            {channel === 'slack' && 'Slack'}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-col gap-3 items-start lg:items-end">
                    <div className="text-xs text-ink-muted whitespace-nowrap">
                      {alert.timeAgo}
                    </div>
                    <button
                      onClick={() => toggleReadStatus(alert.id)}
                      className="px-4 py-2 bg-accent text-white rounded-sm text-xs font-medium hover:bg-blue-700 transition-all"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Settings Panel */}
      <div className="bg-surface border border-rule rounded-md p-6 h-fit lg:sticky lg:top-8">
        <h2 className="text-sm font-bold font-display mb-4 text-ink">Alert settings</h2>

        <div className="space-y-6">
          {/* Email Notifications */}
          <div className="pb-4 border-b border-rule">
            <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
              Email notifications
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateSettings('emailEnabled', !settings.emailEnabled)}
                className={`w-10 h-6 rounded-full transition-all flex items-center ${
                  settings.emailEnabled ? 'bg-success' : 'bg-ink-faint'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-all transform ${
                    settings.emailEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <span className="text-xs text-ink">
                {settings.emailEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          {/* In-app Notifications */}
          <div className="pb-4 border-b border-rule">
            <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
              In-app notifications
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateSettings('inappEnabled', !settings.inappEnabled)}
                className={`w-10 h-6 rounded-full transition-all flex items-center ${
                  settings.inappEnabled ? 'bg-success' : 'bg-ink-faint'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-all transform ${
                    settings.inappEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <span className="text-xs text-ink">
                {settings.inappEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          {/* Slack */}
          <div className="pb-4 border-b border-rule">
            <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">
              Slack notifications
            </div>
            {!settings.slack.connected ? (
              <button
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    slack: {
                      connected: true,
                      workspace: 'Acme Software',
                      channel: '#tenders',
                      detailLevel: 'summary',
                      emojiReactions: true,
                    },
                  }))
                }
                className="inline-flex items-center gap-2 px-3 py-2 bg-accent text-white rounded-sm text-xs font-medium hover:bg-blue-700 transition-all"
              >
                <Zap size={14} />
                Connect Slack workspace
              </button>
            ) : (
              <div className="space-y-3">
                {/* Workspace Display */}
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">
                    Connected workspace
                  </label>
                  <div className="text-xs text-ink-muted">{settings.slack.workspace}</div>
                </div>

                {/* Channel Select */}
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">
                    Primary channel
                  </label>
                  <select
                    value={settings.slack.channel}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        slack: { ...prev.slack, channel: e.target.value },
                      }))
                    }
                    className="w-full px-2 py-1 border border-rule rounded-sm text-xs text-ink bg-surface-raised focus:outline-none focus:border-accent"
                  >
                    <option>#tenders</option>
                    <option>#opportunities</option>
                    <option>#alerts</option>
                    <option>Direct message</option>
                  </select>
                </div>

                {/* Detail Level */}
                <div>
                  <label className="block text-xs font-medium text-ink mb-2">
                    Message detail
                  </label>
                  <select
                    value={settings.slack.detailLevel}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        slack: { ...prev.slack, detailLevel: e.target.value as 'summary' | 'full' },
                      }))
                    }
                    className="w-full px-2 py-1 border border-rule rounded-sm text-xs text-ink bg-surface-raised focus:outline-none focus:border-accent"
                  >
                    <option value="summary">Summary</option>
                    <option value="full">Full detail</option>
                  </select>
                </div>

                {/* Emoji Reactions Toggle */}
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="slack-emoji"
                    checked={settings.slack.emojiReactions}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        slack: { ...prev.slack, emojiReactions: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded-sm border-rule accent-accent mt-0.5"
                  />
                  <label htmlFor="slack-emoji" className="cursor-pointer">
                    <div className="text-xs font-medium text-ink">Quick actions</div>
                    <div className="text-xs text-ink-muted">React with emojis to save/dismiss</div>
                  </label>
                </div>

                {/* Disconnect Button */}
                <button
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      slack: { connected: false },
                    }))
                  }
                  className="w-full px-3 py-2 bg-surface-raised text-ink rounded-sm text-xs font-medium hover:bg-canvas transition-all"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>

          {/* Instant Alert Threshold */}
          <div className="pb-4 border-b border-rule">
            <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">
              Instant alert score
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={settings.instantThreshold}
                onChange={(e) =>
                  updateSettings('instantThreshold', Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))
                }
                className="px-3 py-2 border border-rule rounded-sm text-sm text-ink bg-surface-raised focus:outline-none focus:border-accent"
              />
              <span className="text-xs text-ink-muted">Minimum score: {settings.instantThreshold}+</span>
            </div>
          </div>

          {/* Digest Settings */}
          <div className="pb-4 border-b border-rule">
            <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">
              Digest settings
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-ink-muted mb-2">Days:</label>
                <div className="flex flex-wrap gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <label key={day} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.digestDays.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateSettings('digestDays', [...settings.digestDays, day]);
                          } else {
                            updateSettings('digestDays', settings.digestDays.filter((d) => d !== day));
                          }
                        }}
                        className="w-4 h-4 rounded-sm border-rule accent-accent"
                      />
                      <span className="text-ink-muted">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-ink-muted mb-2">Time:</label>
                <input
                  type="time"
                  value={settings.digestTime}
                  onChange={(e) => updateSettings('digestTime', e.target.value)}
                  className="w-full px-3 py-2 border border-rule rounded-sm text-sm text-ink bg-surface-raised focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-ink-muted mb-1">Min score:</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.digestMinScore}
                    onChange={(e) =>
                      updateSettings('digestMinScore', Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))
                    }
                    className="w-full px-2 py-1 border border-rule rounded-sm text-xs text-ink bg-surface-raised focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-ink-muted mb-1">Max items:</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settings.digestMaxItems}
                    onChange={(e) =>
                      updateSettings('digestMaxItems', Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-full px-2 py-1 border border-rule rounded-sm text-xs text-ink bg-surface-raised focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Deadline Reminders */}
          <div className="pb-4 border-b border-rule">
            <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">
              Deadline reminders
            </div>
            <div className="space-y-2 text-xs">
              {[
                { key: 'sevenDay', label: '7 days before' },
                { key: 'threeDay', label: '3 days before' },
                { key: 'oneDay', label: '1 day before' },
              ].map((reminder) => (
                <label key={reminder.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.deadlineReminders[reminder.key as keyof typeof settings.deadlineReminders]}
                    onChange={(e) => {
                      updateSettings('deadlineReminders', {
                        ...settings.deadlineReminders,
                        [reminder.key]: e.target.checked,
                      });
                    }}
                    className="w-4 h-4 rounded-sm border-rule accent-accent"
                  />
                  <span className="text-ink-muted">{reminder.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Preview Text */}
          <div className="pb-4 border-b border-rule">
            <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
              Example notification
            </div>
            <p className="text-xs text-ink-muted italic leading-relaxed">
              "{renderPreviewText()}"
            </p>
          </div>

          {/* View All Settings Link */}
          <a
            href="#"
            className="inline-flex items-center gap-2 text-xs font-medium text-accent hover:underline"
          >
            <Settings size={16} />
            View all settings
          </a>
        </div>
      </div>
    </div>
  );
}
