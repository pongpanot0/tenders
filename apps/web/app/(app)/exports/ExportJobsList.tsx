'use client';

import { useState, useEffect } from 'react';
import {
  Loader,
  CheckCircle,
  Download,
  Trash2,
  X,
  Info,
  Plus,
} from 'lucide-react';

type ExportJobStatus = 'processing' | 'ready' | 'expired';

interface ExportJob {
  id: string;
  title: string;
  startedAt: Date;
  status: ExportJobStatus;
  format: string;
  exportScope: string;
  requestedBy: string;
  fileSize?: string;
  estimatedTimeRemaining?: string;
  progress?: number;
  progressLabel?: string;
}

export default function ExportJobsList() {
  const [jobs, setJobs] = useState<ExportJob[]>([
    {
      id: 'job-1',
      title: 'Inbox opportunities (14 items)',
      startedAt: new Date(Date.now() - 2 * 60 * 1000),
      status: 'processing',
      format: 'CSV',
      exportScope: 'Inbox (filtered)',
      requestedBy: 'you@company.com',
      estimatedTimeRemaining: '1 min',
      progress: 65,
      progressLabel: 'Extracting tender data: 9 of 14 complete',
    },
    {
      id: 'job-2',
      title: 'Recent tenders (247 items)',
      startedAt: new Date(Date.now() - 15 * 60 * 1000),
      status: 'ready',
      format: 'XLSX (Excel)',
      exportScope: 'Explore (last 30 days)',
      requestedBy: 'you@company.com',
      fileSize: '3.2 MB',
    },
    {
      id: 'job-3',
      title: 'Pipeline opportunities (5 items)',
      startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: 'expired',
      format: 'CSV',
      exportScope: 'Pipeline',
      requestedBy: 'you@company.com',
    },
  ]);

  const handleNewExport = () => {
    const newJob: ExportJob = {
      id: `job-${Date.now()}`,
      title: 'New export',
      startedAt: new Date(),
      status: 'processing',
      format: 'CSV',
      exportScope: 'All',
      requestedBy: 'you@company.com',
      estimatedTimeRemaining: '2 min',
      progress: 15,
      progressLabel: 'Starting export process...',
    };

    setJobs([newJob, ...jobs]);

    // Simulate completion after 3 seconds for visual polish
    const timeoutId = setTimeout(() => {
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === newJob.id
            ? {
                ...job,
                status: 'ready' as ExportJobStatus,
                fileSize: '1.5 MB',
                progress: undefined,
                progressLabel: undefined,
              }
            : job
        )
      );
    }, 3000);

    return () => clearTimeout(timeoutId);
  };

  const handleDownload = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      // Simulate download
      console.log(`Downloading ${job.title}`);
    }
  };

  const handleDelete = (jobId: string) => {
    setJobs(jobs.filter((j) => j.id !== jobId));
  };

  const handleCancel = (jobId: string) => {
    setJobs(jobs.filter((j) => j.id !== jobId));
  };

  const handleReExport = (jobId: string) => {
    const expiredJob = jobs.find((j) => j.id === jobId);
    if (expiredJob) {
      const newJob: ExportJob = {
        ...expiredJob,
        id: `job-${Date.now()}`,
        startedAt: new Date(),
        status: 'processing',
        progress: 15,
        progressLabel: 'Starting export process...',
        estimatedTimeRemaining: '2 min',
      };

      setJobs([newJob, ...jobs]);

      // Simulate completion after 3 seconds
      setTimeout(() => {
        setJobs((prevJobs) =>
          prevJobs.map((job) =>
            job.id === newJob.id
              ? {
                  ...job,
                  status: 'ready' as ExportJobStatus,
                  fileSize: '1.5 MB',
                  progress: undefined,
                  progressLabel: undefined,
                }
              : job
          )
        );
      }, 3000);
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getStatusBadgeColor = (
    status: ExportJobStatus
  ): { bg: string; text: string } => {
    switch (status) {
      case 'processing':
        return { bg: 'bg-warning/10', text: 'text-warning' };
      case 'ready':
        return { bg: 'bg-success/10', text: 'text-success' };
      case 'expired':
        return { bg: 'bg-surface-raised', text: 'text-ink-muted' };
      default:
        return { bg: 'bg-surface-raised', text: 'text-ink-muted' };
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-ink mb-8">
          Export Jobs
        </h1>

        {/* Info Box */}
        <div className="bg-info/5 border border-info/20 rounded-md p-4 mb-8 flex gap-3">
          <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
          <div className="text-sm text-ink-muted leading-relaxed">
            Export jobs run asynchronously. You can close this page and we'll
            notify you when the file is ready to download. Large exports may
            take several minutes.
          </div>
        </div>

        {/* New Export Button */}
        <button
          onClick={handleNewExport}
          className="inline-flex items-center gap-2 px-4 py-3 bg-accent text-accent-ink rounded-md font-medium text-sm hover:bg-blue-600 transition-colors mb-8"
        >
          <Plus className="w-4 h-4" />
          New export
        </button>
      </div>

      {/* Jobs List */}
      <div className="space-y-6">
        {jobs.length === 0 ? (
          <div className="text-center py-12 bg-surface border border-rule rounded-md">
            <div className="text-ink-muted text-sm">No export jobs yet</div>
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className={`bg-surface border border-rule rounded-md p-6 ${
                job.status === 'expired' ? 'opacity-70' : ''
              }`}
            >
              {/* Job Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-base font-semibold font-display text-ink mb-1">
                    {job.title}
                  </h3>
                  <p className="text-xs text-ink-muted">
                    {job.status === 'processing'
                      ? `Started ${formatTimeAgo(job.startedAt)}`
                      : job.status === 'ready'
                        ? `Completed ${formatTimeAgo(job.startedAt)}`
                        : `Completed ${formatTimeAgo(job.startedAt)}`}
                  </p>
                </div>

                {/* Status Badge */}
                <div
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-medium ${
                    getStatusBadgeColor(job.status).bg
                  } ${getStatusBadgeColor(job.status).text}`}
                >
                  {job.status === 'processing' && (
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {job.status === 'ready' && (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )}
                  {job.status === 'expired' && (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {job.status === 'processing'
                      ? 'Processing'
                      : job.status === 'ready'
                        ? 'Ready'
                        : 'Expired'}
                  </span>
                </div>
              </div>

              {/* Progress Section - Only for Processing */}
              {job.status === 'processing' && (
                <div className="mb-6">
                  <p className="text-xs font-semibold text-ink-muted uppercase mb-2 tracking-wide">
                    Exporting...
                  </p>
                  <div className="h-2 bg-canvas rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-warning transition-all duration-300"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-ink-muted mt-2">
                    {job.progressLabel}
                  </p>
                </div>
              )}

              {/* Job Details */}
              <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-rule">
                <div>
                  <p className="text-xs font-semibold text-ink-faint uppercase mb-1">
                    Format
                  </p>
                  <p className="text-sm font-medium text-ink">{job.format}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-faint uppercase mb-1">
                    {job.status === 'processing'
                      ? 'Estimated time remaining'
                      : 'File size'}
                  </p>
                  <p className="text-sm font-medium text-ink">
                    {job.status === 'processing'
                      ? job.estimatedTimeRemaining
                      : job.fileSize}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-faint uppercase mb-1">
                    Export scope
                  </p>
                  <p className="text-sm font-medium text-ink">
                    {job.exportScope}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-faint uppercase mb-1">
                    Requested by
                  </p>
                  <p className="text-sm font-medium text-ink">
                    {job.requestedBy}
                  </p>
                </div>
              </div>

              {/* Job Actions */}
              <div className="flex gap-3">
                {job.status === 'processing' && (
                  <button
                    onClick={() => handleCancel(job.id)}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-surface-raised text-ink rounded-md font-medium text-sm hover:bg-canvas transition-colors border border-transparent hover:border-rule"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                )}
                {job.status === 'ready' && (
                  <>
                    <button
                      onClick={() => handleDownload(job.id)}
                      className="inline-flex items-center gap-2 px-4 py-3 bg-accent text-accent-ink rounded-md font-medium text-sm hover:bg-blue-600 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download File
                    </button>
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="inline-flex items-center gap-2 px-4 py-3 bg-surface-raised text-ink rounded-md font-medium text-sm hover:bg-canvas transition-colors border border-transparent hover:border-rule"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </>
                )}
                {job.status === 'expired' && (
                  <button
                    onClick={() => handleReExport(job.id)}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-accent text-accent-ink rounded-md font-medium text-sm hover:bg-blue-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Re-export
                  </button>
                )}
              </div>

              {/* Expired State Message */}
              {job.status === 'expired' && (
                <p className="text-xs text-ink-muted mt-4">
                  File automatically deleted after 7 days.{' '}
                  <button
                    onClick={() => handleReExport(job.id)}
                    className="text-accent hover:underline"
                  >
                    Create new export
                  </button>
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
