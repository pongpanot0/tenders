'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';

type Step = 'company' | 'capabilities' | 'markets' | 'constraints' | 'alerts';

interface FormData {
  company: {
    name: string;
    website: string;
    country: string;
  };
  capabilities: {
    services: string[];
    technologies: string;
    industries: string;
  };
  markets: {
    countries: string;
    deliveryMode: string;
    languages: string;
  };
  constraints: {
    budget: string;
    minBidDays: string;
    certifications: string;
    exclusions: string;
  };
  alerts: {
    threshold: string;
    frequency: string;
    timezone: string;
  };
}

const STEPS: { id: Step; label: string; title: string; description: string }[] = [
  {
    id: 'company',
    label: 'Company',
    title: 'About your company',
    description: 'Help us understand who you are and where you operate.',
  },
  {
    id: 'capabilities',
    label: 'Capabilities',
    title: 'What can your team build?',
    description:
      'Tell us your core services and key technologies. You can add custom services or learn from available matches.',
  },
  {
    id: 'markets',
    label: 'Markets',
    title: 'Where do you want to work?',
    description:
      'Select target countries, delivery modes, and languages. Note that buyer eligibility may still differ.',
  },
  {
    id: 'constraints',
    label: 'Constraints',
    title: 'Any limits we should know?',
    description:
      'Set your budget range, minimum bid time, certifications, and any exclusions. Unknown fields can be left blank.',
  },
  {
    id: 'alerts',
    label: 'Alerts',
    title: 'How should we notify you?',
    description: 'Set your match threshold, notification style, and timezone.',
  },
];

const SERVICE_OPTIONS = [
  'Custom software',
  'Mobile development',
  'Cloud infrastructure',
  'Data engineering',
  'QA & testing',
];

export default function OnboardingWizard() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    company: { name: '', website: '', country: '' },
    capabilities: { services: [], technologies: '', industries: '' },
    markets: { countries: '', deliveryMode: '', languages: '' },
    constraints: { budget: '', minBidDays: '', certifications: '', exclusions: '' },
    alerts: { threshold: '70', frequency: 'digest', timezone: 'UTC' },
  });
  const [completed, setCompleted] = useState(false);

  const currentStep = STEPS[currentStepIndex];

  const handleInputChange = (stepId: Step, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [stepId]: { ...prev[stepId], [field]: value },
    }));
  };

  const handleServiceToggle = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      capabilities: {
        ...prev.capabilities,
        services: prev.capabilities.services.includes(service)
          ? prev.capabilities.services.filter((s) => s !== service)
          : [...prev.capabilities.services, service],
      },
    }));
  };

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleFinish = () => {
    setCompleted(true);
  };

  const getPreviewData = () => {
    const parts: string[] = [];

    if (formData.company.name) {
      parts.push(`Company: ${formData.company.name}`);
      if (formData.company.country) {
        parts.push(`Location: ${formData.company.country}`);
      }
    }

    if (formData.capabilities.services.length > 0) {
      parts.push(`Delivers: ${formData.capabilities.services.join(', ')}`);
    }
    if (formData.capabilities.technologies) {
      parts.push(`Tech: ${formData.capabilities.technologies}`);
    }
    if (formData.capabilities.industries) {
      parts.push(`Industries: ${formData.capabilities.industries}`);
    }

    if (formData.markets.countries) {
      parts.push(`Markets: ${formData.markets.countries}`);
    }
    if (formData.markets.deliveryMode) {
      parts.push(`Delivery: ${formData.markets.deliveryMode}`);
    }
    if (formData.markets.languages) {
      parts.push(`Languages: ${formData.markets.languages}`);
    }

    if (formData.constraints.budget) {
      parts.push(`Budget: ${formData.constraints.budget}`);
    }
    if (formData.constraints.minBidDays) {
      parts.push(`Min bid days: ${formData.constraints.minBidDays}`);
    }
    if (formData.constraints.certifications) {
      parts.push(`Certifications: ${formData.constraints.certifications}`);
    }

    return parts;
  };

  const previewData = getPreviewData();
  const isProfileComplete =
    formData.company.name &&
    formData.capabilities.services.length > 0 &&
    formData.markets.countries &&
    formData.constraints.budget;

  if (completed) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col">
        {/* Header */}
        <header className="bg-surface border-b border-rule">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                <span className="font-display text-base font-bold text-accent">
                  Tender Intelligence
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Completion Message */}
        <main className="flex-1 flex items-center justify-center px-8">
          <div className="bg-surface border border-rule rounded-md p-8 max-w-640px text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                <Check className="w-6 h-6 text-success" />
              </div>
            </div>
            <h2 className="font-display text-2xl font-bold text-ink mb-3">
              Profile complete!
            </h2>
            <p className="text-ink-muted mb-6">
              We are now matching current and new tenders against your profile. Check your
              inbox shortly for recommended opportunities.
            </p>
            <p className="text-sm text-ink-faint">
              You can update your profile settings at any time from the app.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Header with progress rail */}
      <header className="bg-surface border-b border-rule sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <span className="font-display text-base font-bold text-accent">
                Tender Intelligence
              </span>
            </div>

            {/* Progress rail */}
            <div className="flex gap-2 items-center">
              {STEPS.map((step, idx) => (
                <div key={step.id} className="flex items-center gap-2">
                  <div
                    className={`text-xs font-medium transition-colors ${
                      idx === currentStepIndex
                        ? 'text-accent font-semibold'
                        : idx < currentStepIndex
                          ? 'text-ink-muted'
                          : 'text-ink-faint'
                    }`}
                  >
                    {step.label}
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className="w-3 h-px bg-rule" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 px-8 py-8">
          {/* Form panel */}
          <div className="lg:col-span-3">
            <div className="bg-surface border border-rule rounded-md p-8 max-w-2xl">
              <h2 className="font-display text-2xl font-bold text-ink mb-2">
                {currentStep.title}
              </h2>
              <p className="text-sm text-ink-muted mb-8">{currentStep.description}</p>

              {/* Company step */}
              {currentStep.id === 'company' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Company name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Acme Software"
                      value={formData.company.name}
                      onChange={(e) =>
                        handleInputChange('company', 'name', e.target.value)
                      }
                      className="w-full px-4 py-3 border border-rule rounded-md text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Website (optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://acme.com"
                      value={formData.company.website}
                      onChange={(e) =>
                        handleInputChange('company', 'website', e.target.value)
                      }
                      className="w-full px-4 py-3 border border-rule rounded-md text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Headquarters country
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Singapore"
                      value={formData.company.country}
                      onChange={(e) =>
                        handleInputChange('company', 'country', e.target.value)
                      }
                      className="w-full px-4 py-3 border border-rule rounded-md text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Capabilities step */}
              {currentStep.id === 'capabilities' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-3">
                      Services
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {SERVICE_OPTIONS.map((service) => (
                        <button
                          key={service}
                          onClick={() => handleServiceToggle(service)}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border ${
                            formData.capabilities.services.includes(service)
                              ? 'bg-accent text-accent-ink border-accent'
                              : 'bg-surface-raised text-ink border-rule hover:border-accent hover:bg-accent/5'
                          }`}
                        >
                          {service}
                          {formData.capabilities.services.includes(service) && (
                            <Check className="w-4 h-4 inline ml-1" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Primary technologies
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., React, Node.js, AWS"
                      value={formData.capabilities.technologies}
                      onChange={(e) =>
                        handleInputChange('capabilities', 'technologies', e.target.value)
                      }
                      className="w-full px-4 py-3 border border-rule rounded-md text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Industries (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., FinTech, SaaS, Healthcare"
                      value={formData.capabilities.industries}
                      onChange={(e) =>
                        handleInputChange('capabilities', 'industries', e.target.value)
                      }
                      className="w-full px-4 py-3 border border-rule rounded-md text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Markets step */}
              {currentStep.id === 'markets' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Target countries
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Singapore, Australia, Thailand"
                      value={formData.markets.countries}
                      onChange={(e) =>
                        handleInputChange('markets', 'countries', e.target.value)
                      }
                      className="w-full px-4 py-3 border border-rule rounded-md text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Delivery mode
                    </label>
                    <select
                      value={formData.markets.deliveryMode}
                      onChange={(e) =>
                        handleInputChange('markets', 'deliveryMode', e.target.value)
                      }
                      className="w-full px-4 py-3 border border-rule rounded-md text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors"
                    >
                      <option value="">Select delivery mode</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Languages
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., English, Mandarin"
                      value={formData.markets.languages}
                      onChange={(e) =>
                        handleInputChange('markets', 'languages', e.target.value)
                      }
                      className="w-full px-4 py-3 border border-rule rounded-md text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Constraints step */}
              {currentStep.id === 'constraints' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Budget range
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., $20k–$150k"
                      value={formData.constraints.budget}
                      onChange={(e) =>
                        handleInputChange('constraints', 'budget', e.target.value)
                      }
                      className="w-full px-4 py-3 border border-rule rounded-md text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Minimum days to bid
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 7"
                      value={formData.constraints.minBidDays}
                      onChange={(e) =>
                        handleInputChange('constraints', 'minBidDays', e.target.value)
                      }
                      className="w-full px-4 py-3 border border-rule rounded-md text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Required certifications (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., ISO 27001"
                      value={formData.constraints.certifications}
                      onChange={(e) =>
                        handleInputChange('constraints', 'certifications', e.target.value)
                      }
                      className="w-full px-4 py-3 border border-rule rounded-md text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Exclusions (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Military, gambling"
                      value={formData.constraints.exclusions}
                      onChange={(e) =>
                        handleInputChange('constraints', 'exclusions', e.target.value)
                      }
                      className="w-full px-4 py-3 border border-rule rounded-md text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Alerts step */}
              {currentStep.id === 'alerts' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Match threshold
                    </label>
                    <select
                      value={formData.alerts.threshold}
                      onChange={(e) =>
                        handleInputChange('alerts', 'threshold', e.target.value)
                      }
                      className="w-full px-4 py-3 border border-rule rounded-md text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors"
                    >
                      <option value="80">80+ (Strong match only)</option>
                      <option value="70">70+ (Worth reviewing)</option>
                      <option value="60">60+ (Include all matches)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Notification frequency
                    </label>
                    <select
                      value={formData.alerts.frequency}
                      onChange={(e) =>
                        handleInputChange('alerts', 'frequency', e.target.value)
                      }
                      className="w-full px-4 py-3 border border-rule rounded-md text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors"
                    >
                      <option value="instant">Instant (as they match)</option>
                      <option value="digest">Digest (daily)</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Timezone
                    </label>
                    <select
                      value={formData.alerts.timezone}
                      onChange={(e) =>
                        handleInputChange('alerts', 'timezone', e.target.value)
                      }
                      className="w-full px-4 py-3 border border-rule rounded-md text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors"
                    >
                      <option value="UTC">UTC</option>
                      <option value="Singapore">Singapore (UTC+8)</option>
                      <option value="Bangkok">Bangkok (UTC+7)</option>
                      <option value="Sydney">Sydney (UTC+10)</option>
                    </select>
                  </div>
                  <div className="bg-surface-raised border border-rule rounded-md p-4">
                    <p className="text-xs font-semibold text-ink-faint uppercase tracking-wide mb-2">
                      Sample notification
                    </p>
                    <p className="text-sm text-ink font-medium">
                      "Cloud case management" by Acme Inc.
                    </p>
                    <p className="text-sm text-ink-muted mt-1">
                      Strong match (87) · Deadline: 28 Sep
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 mt-8 pt-6 border-t border-rule">
                <button
                  onClick={() => {}}
                  className="px-6 py-2 text-sm font-medium text-ink bg-surface border border-rule rounded-md hover:bg-surface-raised transition-colors"
                >
                  Save and finish later
                </button>
                <div className="flex gap-2 ml-auto">
                  {currentStepIndex > 0 && (
                    <button
                      onClick={handleBack}
                      className="px-6 py-2 text-sm font-medium text-ink bg-surface border border-rule rounded-md hover:bg-surface-raised transition-colors flex items-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>
                  )}
                  {currentStepIndex < STEPS.length - 1 ? (
                    <button
                      onClick={handleNext}
                      className="px-6 py-2 text-sm font-medium text-accent-ink bg-accent border border-accent rounded-md hover:bg-accent/90 transition-colors flex items-center gap-2"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleFinish}
                      className="px-6 py-2 text-sm font-medium text-accent-ink bg-accent border border-accent rounded-md hover:bg-accent/90 transition-colors flex items-center gap-2"
                    >
                      Finish
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile preview panel */}
          <div className="lg:col-span-1">
            <div className="bg-surface border border-rule rounded-md p-6 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
              <h3 className="font-display text-sm font-bold text-ink mb-4">
                Your profile so far
              </h3>

              {previewData.length === 0 ? (
                <p className="text-sm text-ink-faint italic">
                  Start filling out your profile to see a preview here.
                </p>
              ) : (
                <div className="space-y-4">
                  {previewData.map((line, idx) => (
                    <div key={idx} className="pb-4 border-b border-rule last:border-b-0 last:pb-0">
                      <p className="text-sm text-ink leading-relaxed">{line}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-rule">
                <div
                  className={`inline-block px-3 py-1 rounded-sm text-xs font-semibold ${
                    isProfileComplete
                      ? 'bg-success/10 text-success'
                      : 'bg-warning/10 text-warning'
                  }`}
                >
                  {isProfileComplete ? 'Profile ready to match' : 'Incomplete profile'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
