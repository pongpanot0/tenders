'use client';

import { useState } from 'react';
import { ChevronLeft, Save, X } from 'lucide-react';
import type { ProfileData } from './page';

interface ProfileEditorProps {
  initialProfile: ProfileData;
  onSave: (profile: ProfileData) => void;
  onCancel: () => void;
}

export default function ProfileEditor({
  initialProfile,
  onSave,
  onCancel,
}: ProfileEditorProps) {
  const [showApplyChoice, setShowApplyChoice] = useState(false);
  const [selectedApplyMode, setSelectedApplyMode] = useState<'new-only' | 'recalculate' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileData>(initialProfile);

  const handleSaveClick = async () => {
    setIsSaving(true);
    // Simulate save delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSaving(false);
    setShowApplyChoice(true);
  };

  const handleApplyChoice = (mode: 'new-only' | 'recalculate') => {
    setSelectedApplyMode(mode);
    // Update the version for the save
    const updatedProfile = {
      ...formData,
      version: formData.version + 1,
      lastUpdated: 'Today',
    };
    onSave(updatedProfile);
  };

  const handleCapabilityChange = (index: number, value: string) => {
    const newCapabilities = [...formData.capabilities];
    newCapabilities[index] = value;
    setFormData({ ...formData, capabilities: newCapabilities });
  };

  const handleMarketChange = (index: number, value: string) => {
    const newMarkets = [...formData.markets];
    newMarkets[index] = value;
    setFormData({ ...formData, markets: newMarkets });
  };

  const handleLanguageChange = (index: number, value: string) => {
    const newLanguages = [...formData.languages];
    newLanguages[index] = value;
    setFormData({ ...formData, languages: newLanguages });
  };

  const handleConstraintChange = (index: number, value: string) => {
    const newConstraints = [...formData.constraints];
    newConstraints[index] = value;
    setFormData({ ...formData, constraints: newConstraints });
  };

  const addCapability = () => {
    setFormData({
      ...formData,
      capabilities: [...formData.capabilities, ''],
    });
  };

  const removeCapability = (index: number) => {
    setFormData({
      ...formData,
      capabilities: formData.capabilities.filter((_, i) => i !== index),
    });
  };

  const addMarket = () => {
    setFormData({
      ...formData,
      markets: [...formData.markets, ''],
    });
  };

  const removeMarket = (index: number) => {
    setFormData({
      ...formData,
      markets: formData.markets.filter((_, i) => i !== index),
    });
  };

  const addLanguage = () => {
    setFormData({
      ...formData,
      languages: [...formData.languages, ''],
    });
  };

  const removeLanguage = (index: number) => {
    setFormData({
      ...formData,
      languages: formData.languages.filter((_, i) => i !== index),
    });
  };

  const addConstraint = () => {
    setFormData({
      ...formData,
      constraints: [...formData.constraints, ''],
    });
  };

  const removeConstraint = (index: number) => {
    setFormData({
      ...formData,
      constraints: formData.constraints.filter((_, i) => i !== index),
    });
  };

  // Apply choice dialog
  if (showApplyChoice) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="text-ink-muted hover:text-ink transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-display text-4xl font-bold">Apply changes</h1>
        </div>

        <div className="bg-surface border border-rule rounded-md p-6">
          <h2 className="font-semibold text-ink mb-4">How should we apply this profile update?</h2>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => handleApplyChoice('new-only')}
              disabled={selectedApplyMode === 'new-only' && isSaving}
              className={`p-4 border rounded-md text-left transition-all ${
                selectedApplyMode === 'new-only'
                  ? 'border-accent bg-accent/5'
                  : 'border-rule hover:border-accent'
              }`}
            >
              <div className="font-semibold text-ink mb-1">Apply to new tenders only</div>
              <div className="text-sm text-ink-muted">
                Faster option: new tenders will be matched against this profile version
              </div>
            </button>

            <button
              onClick={() => handleApplyChoice('recalculate')}
              disabled={selectedApplyMode === 'recalculate' && isSaving}
              className={`p-4 border rounded-md text-left transition-all ${
                selectedApplyMode === 'recalculate'
                  ? 'border-accent bg-accent/5'
                  : 'border-rule hover:border-accent'
              }`}
            >
              <div className="font-semibold text-ink mb-1">Recalculate recent matches</div>
              <div className="text-sm text-ink-muted">
                Re-run analysis on recently seen tenders with the new profile
              </div>
            </button>

            {selectedApplyMode && (
              <div className="mt-4 pt-4 border-t border-rule">
                <div className="text-sm text-ink">
                  Selected: <span className="font-semibold">
                    {selectedApplyMode === 'new-only'
                      ? 'Apply to new tenders only'
                      : 'Recalculate recent matches'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-24">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onCancel}
          className="text-ink-muted hover:text-ink transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-display text-4xl font-bold">Edit company profile</h1>
      </div>

      {/* Three-column layout for editing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Capabilities */}
        <div className="bg-surface border border-rule rounded-md p-6">
          <h2 className="font-semibold text-ink mb-4">Capabilities</h2>
          <div className="flex flex-col gap-3">
            {formData.capabilities.map((cap, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <input
                  type="text"
                  value={cap}
                  onChange={(e) => handleCapabilityChange(idx, e.target.value)}
                  className="flex-1 px-3 py-2 border border-rule rounded-md text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-accent"
                  placeholder="e.g., Custom software"
                />
                <button
                  onClick={() => removeCapability(idx)}
                  className="p-2 text-ink-muted hover:text-danger transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              onClick={addCapability}
              className="mt-2 px-3 py-2 text-sm text-accent hover:bg-accent/5 rounded-md border border-accent/20 transition-all"
            >
              + Add capability
            </button>
          </div>
        </div>

        {/* Markets & delivery */}
        <div className="bg-surface border border-rule rounded-md p-6">
          <h2 className="font-semibold text-ink mb-4">Markets & delivery</h2>
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-2">
                Regions
              </div>
              {formData.markets.map((market, idx) => (
                <div key={idx} className="flex gap-2 items-start mb-2">
                  <input
                    type="text"
                    value={market}
                    onChange={(e) => handleMarketChange(idx, e.target.value)}
                    className="flex-1 px-3 py-2 border border-rule rounded-md text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-accent"
                    placeholder="e.g., Singapore"
                  />
                  <button
                    onClick={() => removeMarket(idx)}
                    className="p-2 text-ink-muted hover:text-danger transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={addMarket}
                className="mt-2 px-3 py-2 text-sm text-accent hover:bg-accent/5 rounded-md border border-accent/20 transition-all"
              >
                + Add region
              </button>
            </div>

            <div className="pt-4 border-t border-rule">
              <div className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-2">
                Languages
              </div>
              {formData.languages.map((lang, idx) => (
                <div key={idx} className="flex gap-2 items-start mb-2">
                  <input
                    type="text"
                    value={lang}
                    onChange={(e) => handleLanguageChange(idx, e.target.value)}
                    className="flex-1 px-3 py-2 border border-rule rounded-md text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-accent"
                    placeholder="e.g., English"
                  />
                  <button
                    onClick={() => removeLanguage(idx)}
                    className="p-2 text-ink-muted hover:text-danger transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={addLanguage}
                className="mt-2 px-3 py-2 text-sm text-accent hover:bg-accent/5 rounded-md border border-accent/20 transition-all"
              >
                + Add language
              </button>
            </div>
          </div>
        </div>

        {/* Constraints */}
        <div className="bg-surface border border-rule rounded-md p-6">
          <h2 className="font-semibold text-ink mb-4">Constraints</h2>
          <div className="flex flex-col gap-3">
            {formData.constraints.map((constraint, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <input
                  type="text"
                  value={constraint}
                  onChange={(e) => handleConstraintChange(idx, e.target.value)}
                  className="flex-1 px-3 py-2 border border-rule rounded-md text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-accent"
                  placeholder="e.g., Budget: $20k-$150k"
                />
                <button
                  onClick={() => removeConstraint(idx)}
                  className="p-2 text-ink-muted hover:text-danger transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              onClick={addConstraint}
              className="mt-2 px-3 py-2 text-sm text-accent hover:bg-accent/5 rounded-md border border-accent/20 transition-all"
            >
              + Add constraint
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Save/Cancel Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-rule px-8 py-4 shadow-md flex gap-4 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-surface-raised border border-rule rounded-md text-sm text-ink hover:border-accent hover:bg-white transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveClick}
          disabled={isSaving}
          className="px-4 py-2 bg-accent text-accent-ink rounded-md text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          <Save size={16} />
          {isSaving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
