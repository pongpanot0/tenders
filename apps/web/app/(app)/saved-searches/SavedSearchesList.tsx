'use client';

import { useState } from 'react';
import { Edit2, Trash2, Zap, Mail, Slack, Bell } from 'lucide-react';

export interface SavedSearch {
  id: string;
  name: string;
  filterSummary: string;
  alertThreshold: string;
  deliveryMode: string;
}

interface SavedSearchesListProps {
  searches: SavedSearch[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<SavedSearch>) => void;
}

function getDeliveryIcon(mode: string) {
  if (mode.toLowerCase().includes('email')) return Mail;
  if (mode.toLowerCase().includes('slack')) return Slack;
  if (mode.toLowerCase().includes('in-app')) return Bell;
  return Mail;
}

export default function SavedSearchesList({
  searches,
  onDelete,
  onUpdate,
}: SavedSearchesListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    threshold: string;
    mode: string;
  }>({ threshold: '', mode: '' });

  const handleEditClick = (search: SavedSearch) => {
    setEditingId(search.id);
    setEditForm({
      threshold: search.alertThreshold,
      mode: search.deliveryMode,
    });
  };

  const handleSaveEdit = (id: string) => {
    onUpdate(id, {
      alertThreshold: editForm.threshold,
      deliveryMode: editForm.mode,
    });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  if (searches.length === 0) {
    return (
      <div className="bg-surface border border-rule rounded-md p-12 text-center">
        <div className="text-sm text-ink-faint mb-4">No saved searches yet.</div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-rule rounded-md overflow-hidden">
      {/* Table Header */}
      <div className="grid gap-6 px-6 py-4 bg-canvas border-b border-rule text-xs font-semibold text-ink-muted uppercase tracking-wider"
        style={{ gridTemplateColumns: '2fr 1fr 1fr auto' }}>
        <div>Search Name</div>
        <div>Alert Threshold</div>
        <div>Delivery Mode</div>
        <div>Actions</div>
      </div>

      {/* Table Rows */}
      {searches.map((search) => {
        const DeliveryIcon = getDeliveryIcon(search.deliveryMode);
        const isEditing = editingId === search.id;

        return (
          <div
            key={search.id}
            className="grid gap-6 px-6 py-5 border-b border-rule last:border-b-0 hover:bg-surface-raised transition-all items-center"
            style={{ gridTemplateColumns: '2fr 1fr 1fr auto' }}
          >
            {/* Search Name & Filters */}
            <div>
              <a href="#" className="font-semibold text-accent hover:underline">
                {search.name}
              </a>
              <div className="text-xs text-ink-muted line-height-normal mt-1">
                {search.filterSummary}
              </div>
            </div>

            {/* Alert Threshold */}
            {isEditing ? (
              <select
                value={editForm.threshold}
                onChange={(e) =>
                  setEditForm({ ...editForm, threshold: e.target.value })
                }
                className="px-3 py-1 border border-rule rounded-sm text-xs text-ink bg-surface focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
              >
                <option value="">Select threshold</option>
                <option value="All matches (40+)">All matches (40+)</option>
                <option value="Worth reviewing (60+)">Worth reviewing (60+)</option>
                <option value="Strong matches (80+)">Strong matches (80+)</option>
              </select>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-sm w-fit">
                <Zap size={14} strokeWidth={2} />
                <span className="text-xs font-medium">{search.alertThreshold}</span>
              </div>
            )}

            {/* Delivery Mode */}
            {isEditing ? (
              <select
                value={editForm.mode}
                onChange={(e) =>
                  setEditForm({ ...editForm, mode: e.target.value })
                }
                className="px-3 py-1 border border-rule rounded-sm text-xs text-ink bg-surface focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
              >
                <option value="">Select mode</option>
                <option value="Email (instant)">Email (instant)</option>
                <option value="Slack (daily digest)">Slack (daily digest)</option>
                <option value="In-app (weekly)">In-app (weekly)</option>
              </select>
            ) : (
              <div className="flex items-center gap-1 text-xs text-ink-muted">
                <DeliveryIcon size={14} strokeWidth={2} />
                <span>{search.deliveryMode}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => handleSaveEdit(search.id)}
                    className="px-3 py-1 bg-accent text-white text-xs font-medium rounded-sm hover:bg-accent/90 transition-all"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 border border-rule bg-surface text-ink text-xs font-medium rounded-sm hover:border-accent hover:bg-surface-raised transition-all"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleEditClick(search)}
                    title="Edit"
                    className="w-8 h-8 flex items-center justify-center border border-rule rounded-sm hover:border-accent hover:bg-surface-raised transition-all"
                  >
                    <Edit2 size={16} strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => onDelete(search.id)}
                    title="Delete"
                    className="w-8 h-8 flex items-center justify-center border border-rule rounded-sm hover:border-danger hover:bg-surface-raised transition-all text-ink hover:text-danger"
                  >
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
