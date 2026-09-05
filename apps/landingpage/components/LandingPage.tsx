'use client';

import { useEffect, useRef, useState } from 'react';

// This app is deliberately standalone (apps/landingpage) — it does not import
// from apps/web, since the two are separate deployments. The sample tender
// below mirrors the shape of the real product's mock data without depending
// on it.
const featuredTender = {
  title: 'Cloud case management',
  buyerName: 'Ministry of Health',
  country: 'Singapore',
  deadline: '2026-09-28',
  score: 91,
  fitTags: ['React', 'AWS'],
};

// Where the actual product lives — set NEXT_PUBLIC_APP_URL in production to
// the deployed apps/web origin (e.g. https://app.tender-intelligence.com).
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function daysUntil(isoDate: string): number {
  const target = new Date(isoDate + 'T00:00:00Z').getTime();
  const now = Date.now();
  return Math.max(0, Math.round((target - now) / (1000 * 60 * 60 * 24)));
}

const WORKFLOW_STAGES = [
  {
    title: 'Find',
    desc: 'Collect from approved public APIs, feeds and permitted sources.',
  },
  {
    title: 'Understand',
    desc: 'Normalize the notice, documents and amendments into a consistent record.',
  },
  {
    title: 'Match',
    desc: 'Compare skills, budget, geography, delivery model and eligibility constraints.',
  },
  {
    title: 'Act',
    desc: 'Send the right opportunity to a person who can decide what happens next.',
  },
] as const;

const FAQS = [
  {
    q: 'Does the product submit bids for us?',
    a: 'No. It helps your team discover and evaluate opportunities. You still decide whether to bid and complete any buyer-portal process yourself.',
  },
  {
    q: 'Where does tender data come from?',
    a: 'The product prioritizes official procurement APIs, open-data releases and public feeds. Each connector has its own coverage and handling policy.',
  },
  {
    q: 'How does matching work?',
    a: 'A tender is compared with the capabilities, technology, markets, budget and constraints in your company profile. Results show factors, risks and source evidence where available.',
  },
  {
    q: 'Does a high score mean we are eligible?',
    a: 'No. A high score means the available information appears to fit your profile. Eligibility requirements can be incomplete or require your team’s verification.',
  },
  {
    q: 'Can we choose which markets to monitor?',
    a: 'Yes. Your profile and saved searches control the markets and opportunity types you prioritize, subject to available source coverage.',
  },
  {
    q: 'What happens when a tender changes?',
    a: 'Material updates such as deadline changes, amendments or cancellation can update the tender record and trigger an alert based on your notification settings.',
  },
  {
    q: 'Can our team collaborate on an opportunity?',
    a: 'You can save an opportunity, assign an owner and track its internal pursuit state. Deeper CRM and proposal integrations can be added as your workflow matures.',
  },
] as const;

const SOURCES = [
  {
    region: 'European Union',
    source: 'EU TED',
    access: 'Official API',
    treatment: 'Notices + permitted amendments',
    state: 'available' as const,
  },
  {
    region: 'United Kingdom',
    source: 'Find a Tender',
    access: 'Official route',
    treatment: 'Notices + amendments',
    state: 'available' as const,
  },
  {
    region: 'United States',
    source: 'SAM.gov',
    access: 'Official API',
    treatment: 'Opportunities + status, metadata only',
    state: 'limited' as const,
  },
  {
    region: 'Southeast Asia',
    source: 'govtender.sg / tenders.gov.my / e-bidding.go.th',
    access: 'Official portals',
    treatment: 'Notices, per-portal coverage',
    state: 'limited' as const,
  },
];

const SOURCE_STATE_STYLE: Record<string, string> = {
  available: 'text-success',
  limited: 'text-warning',
  planned: 'text-ink-faint',
};

const SOURCE_STATE_LABEL: Record<string, string> = {
  available: 'Available',
  limited: 'Limited coverage',
  planned: 'Planned',
};

function FactorBar({
  label,
  pct,
  valueLabel,
  negative = false,
}: {
  label: string;
  pct: number;
  valueLabel: string;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 py-2">
      <span className="w-40 shrink-0 text-sm text-ink-muted">{label}</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-rule">
        <span
          className={`ffill block h-full w-full origin-left ${negative ? 'bg-warning' : 'bg-accent'}`}
          data-pct={pct}
          style={{ transform: `scaleX(${pct / 100})` }}
        />
      </span>
      <span className="w-12 shrink-0 text-right font-mono text-sm">{valueLabel}</span>
    </div>
  );
}

export function LandingPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const workflowSectionRef = useRef<HTMLElement>(null);
  const faqSectionRef = useRef<HTMLElement>(null);

  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [workflowActive, setWorkflowActive] = useState(0);
  const [faqActive, setFaqActive] = useState(0);

  const tenderDays = daysUntil(featuredTender.deadline);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    function updateHeader() {
      setHeaderScrolled((container?.scrollTop ?? 0) > 4);
    }

    function makeTopicUpdater(
      sectionEl: HTMLElement | null,
      count: number,
      setActive: (i: number) => void
    ) {
      let current = -1;
      return () => {
        if (!sectionEl || !container) return;
        const rect = sectionEl.getBoundingClientRect();
        const scrollable = rect.height - container.clientHeight;
        if (scrollable <= 0) return;
        const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
        const idx = Math.min(count - 1, Math.floor(progress * count));
        if (idx !== current) {
          current = idx;
          setActive(idx);
        }
      };
    }

    const updateWorkflow = makeTopicUpdater(workflowSectionRef.current, WORKFLOW_STAGES.length, setWorkflowActive);
    const updateFaq = makeTopicUpdater(faqSectionRef.current, FAQS.length, setFaqActive);

    let queued = false;
    function onScroll() {
      updateHeader();
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        updateWorkflow();
        updateFaq();
      });
    }

    container.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    return () => {
      container.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let cleanup = () => {};

    if (reduceMotion) {
      container.querySelectorAll<HTMLElement>('.reveal, .hero-el').forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      gsap.registerPlugin(ScrollTrigger);
      const scroller = container;
      document.documentElement.classList.add('js');

      gsap.timeline({ defaults: { ease: 'power2.out' } })
        .to('.hero-el', { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.09 })
        .from('.score-badge', { scale: 0.6, duration: 0.5, ease: 'back.out(2)' }, '-=0.45');

      container.querySelectorAll<HTMLElement>('[data-count-to]').forEach((el) => {
        const target = parseInt(el.getAttribute('data-count-to') || '0', 10);
        const counter = { val: 0 };
        gsap.to(counter, {
          val: target,
          duration: 1.1,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = String(Math.round(counter.val));
          },
          scrollTrigger: { trigger: el, scroller, start: 'top 85%', once: true },
        });
      });

      ScrollTrigger.batch('.reveal', {
        scroller,
        start: 'top 85%',
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out', stagger: 0.08, overwrite: true });
        },
      });

      container.querySelectorAll<HTMLElement>('.ffill[data-pct]').forEach((bar) => {
        bar.style.transform = 'scaleX(0)';
      });

      const anatomyPanel = container.querySelector('.anatomy-panel');
      if (anatomyPanel) {
        anatomyPanel.querySelectorAll<HTMLElement>('.ffill').forEach((bar) => {
          const pct = Number(bar.getAttribute('data-pct') || 0) / 100;
          gsap.fromTo(
            bar,
            { scaleX: 0 },
            {
              scaleX: pct,
              duration: 1,
              ease: 'power2.out',
              scrollTrigger: { trigger: anatomyPanel, scroller, start: 'top 75%', end: 'top 35%', scrub: 0.6 },
            }
          );
        });
      }

      const priceCalc = container.querySelector('.price-calc');
      if (priceCalc) {
        priceCalc.querySelectorAll<HTMLElement>('.ffill').forEach((bar) => {
          const pct = Number(bar.getAttribute('data-pct') || 0) / 100;
          gsap.fromTo(
            bar,
            { scaleX: 0 },
            {
              scaleX: pct,
              duration: 1,
              ease: 'power2.out',
              scrollTrigger: { trigger: priceCalc, scroller, start: 'top 80%', end: 'top 45%', scrub: 0.6 },
            }
          );
        });
      }

      const detachers: Array<() => void> = [];
      container.querySelectorAll<HTMLElement>('.btn-magnetic').forEach((btn) => {
        const toX = gsap.quickTo(btn, 'x', { duration: 0.35, ease: 'power3.out' });
        const toY = gsap.quickTo(btn, 'y', { duration: 0.35, ease: 'power3.out' });
        const onMove = (e: MouseEvent) => {
          const r = btn.getBoundingClientRect();
          toX((e.clientX - r.left - r.width / 2) * 0.18);
          toY((e.clientY - r.top - r.height / 2) * 0.3);
        };
        const onLeave = () => {
          toX(0);
          toY(0);
        };
        btn.addEventListener('mousemove', onMove);
        btn.addEventListener('mouseleave', onLeave);
        detachers.push(() => {
          btn.removeEventListener('mousemove', onMove);
          btn.removeEventListener('mouseleave', onLeave);
        });
      });

      cleanup = () => {
        detachers.forEach((fn) => fn());
        ScrollTrigger.getAll().forEach((st) => st.kill());
      };
    })();

    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={scrollRef} className="h-screen snap-y snap-proximity overflow-y-scroll overflow-x-clip">
      <header
        className={`sticky top-0 z-50 border-b transition-colors ${
          headerScrolled ? 'border-rule bg-surface' : 'border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-[68px] max-w-[74rem] items-center justify-between gap-6 px-6 sm:px-10">
          <a href="#top" className="flex items-center gap-2 font-display text-[1.02rem] font-bold tracking-tight">
            <span className="h-2 w-2 shrink-0 rounded-[1px] bg-accent" />
            Tender Intelligence
          </a>
          <ul className="hidden items-center gap-7 md:flex">
            <li><a href="#workflow" className="text-sm text-ink-muted hover:text-accent">Product</a></li>
            <li><a href="#sources" className="text-sm text-ink-muted hover:text-accent">Sources</a></li>
            <li><a href="#security" className="text-sm text-ink-muted hover:text-accent">Security</a></li>
            <li><a href="#pricing" className="text-sm text-ink-muted hover:text-accent">Pricing</a></li>
          </ul>
          <div className="flex items-center gap-4">
            <a href={`${APP_URL}/sign-in`} className="hidden text-sm text-ink-muted hover:text-accent md:inline-block">
              Sign in
            </a>
            <a
              href={`${APP_URL}/onboarding`}
              className="btn-magnetic hidden h-10 items-center rounded-sm bg-accent px-4 text-sm font-semibold text-accent-ink hover:opacity-90 md:inline-flex"
            >
              Create company profile
            </a>
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-rule-strong md:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 5H16M2 9H16M2 13H16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[60] flex flex-col gap-8 bg-surface p-6 transition-transform duration-200 md:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-display font-bold">
            <span className="h-2 w-2 rounded-[1px] bg-accent" /> Tender Intelligence
          </span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-rule-strong"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-col gap-1">
          {[
            ['Product', '#workflow'],
            ['Sources', '#sources'],
            ['Security', '#security'],
            ['Pricing', '#pricing'],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="flex min-h-[44px] items-center border-b border-rule py-3 font-display text-[1.05rem]"
            >
              {label}
            </a>
          ))}
          <a
            href={`${APP_URL}/sign-in`}
            onClick={() => setMobileOpen(false)}
            className="flex min-h-[44px] items-center border-b border-rule py-3 font-display text-[1.05rem]"
          >
            Sign in
          </a>
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          <a href={`${APP_URL}/onboarding`} className="flex h-11 items-center justify-center rounded-sm bg-accent text-sm font-semibold text-accent-ink">
            Create profile
          </a>
          <a href="#contact" onClick={() => setMobileOpen(false)} className="flex h-11 items-center justify-center rounded-sm border border-rule-strong text-sm font-semibold">
            Book a demo
          </a>
        </div>
      </div>

      <main id="top">
        <section className="snap-start flex min-h-screen items-center px-6 py-12 sm:px-10">
          <div className="mx-auto grid w-full max-w-[74rem] gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <span className="hero-el inline-flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.09em] text-accent">
                <span className="h-1.5 w-1.5 rounded-[1px] bg-accent" />
                Tender intelligence for software companies
              </span>
              <h1 className="hero-el mt-4 font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
                Find tenders worth your team&rsquo;s attention.
              </h1>
              <p className="hero-el mt-5 max-w-[34rem] text-base text-ink-muted sm:text-lg">
                Tender Intelligence finds public procurement opportunities, compares them with your company&rsquo;s capabilities and constraints, then shows the evidence, risks and next questions before you decide to bid.
              </p>
              <div className="hero-el mt-7 flex flex-wrap gap-3">
                <a
                  href={`${APP_URL}/onboarding`}
                  className="btn-magnetic inline-flex h-11 min-w-[12rem] items-center justify-center rounded-sm bg-accent px-5 text-sm font-semibold text-accent-ink hover:opacity-90"
                >
                  Create company profile
                </a>
                <a
                  href="#contact"
                  className="inline-flex h-11 items-center justify-center rounded-sm border border-rule-strong px-5 text-sm font-semibold hover:border-accent hover:text-accent"
                >
                  Book a demo
                </a>
              </div>
              <p className="hero-el mt-4 text-sm text-ink-faint">
                Start with your target markets, services and delivery constraints.
              </p>
            </div>

            <div className="hero-el lg:col-span-7">
              <div className="rounded-sm border border-rule bg-surface shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)]">
                <div className="flex items-center justify-between border-b border-rule px-4 py-2 font-mono text-[0.7rem] uppercase tracking-[0.06em] text-ink-faint">
                  <span>Opportunities</span>
                  <span>Product preview</span>
                </div>
                <div className="p-5">
                  <div className="mb-4 flex items-start gap-4 border-b border-rule pb-4">
                    <div className="score-badge flex h-[3.1rem] w-[3.1rem] shrink-0 flex-col items-center justify-center rounded-sm border border-accent/25 bg-accent/10">
                      <span className="font-mono text-lg font-semibold text-accent" data-count-to={featuredTender.score}>
                        {featuredTender.score}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[0.82rem] font-semibold">Strong match</span>
                        <span className="whitespace-nowrap font-mono text-[0.76rem] text-ink-faint">Deadline: {tenderDays} days</span>
                      </div>
                      <div className="mt-1 text-[1rem] font-semibold">{featuredTender.title}</div>
                      <div className="mt-0.5 text-[0.86rem] text-ink-muted">{featuredTender.buyerName} · {featuredTender.country}</div>
                      <div className="mt-1.5 font-mono text-[0.78rem] text-accent">{featuredTender.fitTags.join(' · ')}</div>
                    </div>
                  </div>
                  <div className="mb-2.5 font-mono text-[0.72rem] uppercase tracking-[0.06em] text-ink-faint">Why this fits</div>
                  <ul className="flex flex-col gap-2.5">
                    <li className="flex items-start gap-2.5 text-sm">
                      <span className="mt-0.5 flex h-[1.1rem] w-[1.1rem] shrink-0 items-center justify-center rounded-[3px] bg-success/10 text-[0.72rem] font-bold text-success">✓</span>
                      Required delivery stack aligns
                    </li>
                    <li className="flex items-start gap-2.5 text-sm">
                      <span className="mt-0.5 flex h-[1.1rem] w-[1.1rem] shrink-0 items-center justify-center rounded-[3px] bg-success/10 text-[0.72rem] font-bold text-success">✓</span>
                      Estimated value within target range
                    </li>
                    <li className="flex items-start gap-2.5 text-sm">
                      <span className="mt-0.5 flex h-[1.1rem] w-[1.1rem] shrink-0 items-center justify-center rounded-[3px] bg-warning/10 text-[0.72rem] font-bold text-warning">!</span>
                      Verify local registration requirement
                    </li>
                  </ul>
                  <button type="button" className="mt-4 text-sm font-medium text-ink-muted hover:text-accent hover:underline">
                    View decision details →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="snap-start flex min-h-screen items-center border-t border-rule px-6 py-16 sm:px-10">
          <div className="mx-auto w-full max-w-[74rem]">
            <h2 className="max-w-[40rem] font-display text-2xl font-bold tracking-tight sm:text-[1.7rem]">
              The work is not finding a link. It is deciding where to spend bid effort.
            </h2>
            <p className="mt-4 max-w-[40rem] text-ink-muted">
              Tender notices are spread across procurement systems, written in different structures, and often contain the eligibility detail that determines whether a bid is realistic. The product turns that reading work into a reviewable decision surface.
            </p>

            <div className="mt-10 grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
              <div className="reveal rounded-sm border border-rule bg-surface p-6">
                <h3 className="text-[0.95rem] font-semibold text-ink-faint">Without intelligence</h3>
                <ul className="mt-4 flex flex-col">
                  {['Many portals', 'Long notices and attachments', 'Unclear eligibility', 'Manual spreadsheets'].map((t) => (
                    <li key={t} className="border-t border-rule py-2.5 text-sm text-ink-muted first:border-t-0">{t}</li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center justify-center font-mono text-ink-faint">
                <span className="rotate-90 md:rotate-0">→</span>
              </div>
              <div className="reveal rounded-sm border border-accent/25 bg-accent/5 p-6">
                <h3 className="text-[0.95rem] font-semibold text-accent">With Tender Intelligence</h3>
                <ul className="mt-4 flex flex-col">
                  {['Approved data sources', 'Structured requirements', 'Fit, risks and evidence', 'A ranked decision inbox'].map((t) => (
                    <li key={t} className="border-t border-accent/15 py-2.5 text-sm first:border-t-0">{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section ref={workflowSectionRef} id="workflow" className="relative border-t border-rule" style={{ height: '280vh' }}>
          <div className="sticky top-0 flex min-h-screen flex-col justify-center px-6 py-16 sm:px-10">
            <div className="mx-auto w-full max-w-[74rem]">
              <div className="reveal max-w-[38rem]">
                <span className="inline-flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.09em] text-accent">
                  <span className="h-1.5 w-1.5 rounded-[1px] bg-accent" /> How it works
                </span>
                <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">A four-stage system, not a black box.</h2>
                <p className="mt-3 text-ink-muted">Each stage does one distinct job — collecting, reading, comparing, then routing the result to a person.</p>
              </div>

              <div className="mt-10 grid overflow-hidden rounded-sm border border-rule md:grid-cols-[0.85fr_1.15fr]">
                <div role="tablist" aria-label="Product workflow stages" className="flex flex-col">
                  {WORKFLOW_STAGES.map((stage, i) => (
                    <button
                      key={stage.title}
                      role="tab"
                      aria-selected={workflowActive === i}
                      onClick={() => setWorkflowActive(i)}
                      className={`flex items-start gap-3.5 border-b border-rule px-6 py-5 text-left last:border-b-0 md:last:border-b ${
                        workflowActive === i ? 'bg-accent/5' : 'bg-surface'
                      }`}
                    >
                      <span className={`font-mono text-[0.78rem] ${workflowActive === i ? 'text-accent' : 'text-ink-faint'}`}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span>
                        <h3 className="text-[1rem] font-semibold">{stage.title}</h3>
                        <p className="mt-1 text-[0.88rem] text-ink-muted">{stage.desc}</p>
                      </span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-rule bg-canvas p-6 md:border-l md:border-t-0">
                  {workflowActive === 0 && (
                    <div>
                      <div className="mb-3.5 font-mono text-[0.7rem] uppercase tracking-[0.06em] text-ink-faint">Source health</div>
                      {[
                        ['EU TED', 'Available'],
                        ['Find a Tender (UK)', 'Available'],
                        ['SAM.gov (US)', 'Limited coverage'],
                      ].map(([label, status]) => (
                        <div key={label} className="flex items-center justify-between border-t py-2.5 text-sm first:border-t-0">
                          <span>{label}</span>
                          <span className={`rounded-[3px] px-2 py-0.5 font-mono text-[0.72rem] ${status === 'Available' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                            {status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {workflowActive === 1 && (
                    <div>
                      <div className="mb-3.5 font-mono text-[0.7rem] uppercase tracking-[0.06em] text-ink-faint">Requirement rows</div>
                      {[
                        ['Delivery model: on-site + remote', 'RFP.pdf · p.2'],
                        ['Contract length: 24 months', 'RFP.pdf · p.3'],
                        ['Local registration required', 'RFP.pdf · p.4'],
                      ].map(([label, ref]) => (
                        <div key={label} className="flex items-center justify-between border-t py-2.5 text-sm first:border-t-0">
                          <span>{label}</span>
                          <span className="font-mono text-[0.78rem] text-ink-faint">{ref}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {workflowActive === 2 && (
                    <div>
                      <div className="mb-3.5 font-mono text-[0.7rem] uppercase tracking-[0.06em] text-ink-faint">Factor score</div>
                      <FactorBar label="Capability fit" pct={94} valueLabel="94" />
                      <FactorBar label="Technology fit" pct={90} valueLabel="90" />
                      <FactorBar label="Budget fit" pct={80} valueLabel="80" />
                    </div>
                  )}
                  {workflowActive === 3 && (
                    <div>
                      <div className="mb-3.5 font-mono text-[0.7rem] uppercase tracking-[0.06em] text-ink-faint">Save / pursue / alert</div>
                      {[
                        ['Save to pipeline', '1 click'],
                        ['Assign owner', 'Team member'],
                      ].map(([label, ref]) => (
                        <div key={label} className="flex items-center justify-between border-t py-2.5 text-sm first:border-t-0">
                          <span>{label}</span>
                          <span className="font-mono text-[0.78rem] text-ink-faint">{ref}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between border-t py-2.5 text-sm">
                        <span>Alert on deadline change</span>
                        <span className="rounded-[3px] bg-success/10 px-2 py-0.5 font-mono text-[0.72rem] text-success">On</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="snap-start flex min-h-screen items-center border-t border-rule px-6 py-16 sm:px-10">
          <div className="mx-auto grid w-full max-w-[74rem] gap-8 md:grid-cols-2">
            <div className="anatomy-panel reveal rounded-sm border border-rule bg-surface p-6">
              <div className="mb-4 flex items-center gap-3.5 border-b border-rule pb-4">
                <span className="font-mono text-[2.1rem] font-semibold text-accent" data-count-to={featuredTender.score}>
                  {featuredTender.score}
                </span>
                <span className="font-semibold">
                  Strong match
                  <small className="block font-mono text-[0.8rem] font-normal text-ink-faint">{featuredTender.title}</small>
                </span>
              </div>
              <FactorBar label="Capability fit" pct={94} valueLabel="94" />
              <FactorBar label="Technology fit" pct={90} valueLabel="90" />
              <FactorBar label="Budget fit" pct={80} valueLabel="80" />
              <FactorBar label="Risk adjustment" pct={8} valueLabel="−8" negative />
              <div className="mt-5 border-t border-rule pt-4">
                <span className="inline-flex items-center gap-1.5 rounded-[3px] bg-warning/10 px-2 py-1 font-mono text-[0.72rem] text-warning">
                  Needs verification
                </span>
                <div className="mt-2.5 text-[0.94rem] font-semibold">Local registration requirement</div>
                <div className="mt-1 font-mono text-[0.8rem] text-ink-faint">
                  <a href="#" className="text-accent hover:underline">RFP.pdf · page 4 ↗</a>
                </div>
              </div>
            </div>
            <div className="reveal">
              <h3 className="text-[1.35rem] font-display font-bold">A score is not a verdict.</h3>
              <p className="mb-6 mt-2 text-[0.95rem] text-ink-muted">
                Use the score to decide what to inspect first. Then see the factors behind it, the requirement evidence, and the points your team still needs to verify.
              </p>
              <ol className="flex flex-col">
                {[
                  ['Capability fit', 'Required services and technology.'],
                  ['Constraints', 'Geography, budget and delivery model.'],
                  ['Evidence', 'Link each significant claim to the notice.'],
                  ['Uncertainty', 'Unknown is shown as unknown.'],
                ].map(([title, desc], i) => (
                  <li key={title} className="flex gap-4 border-t border-rule py-4 first:border-t-0 first:pt-0">
                    <span className="w-6 shrink-0 font-mono text-[0.85rem] text-ink-faint">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <h4 className="text-[0.95rem] font-semibold">{title}</h4>
                      <p className="text-[0.88rem] text-ink-muted">{desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="sources" className="snap-start flex min-h-screen items-center border-t border-rule px-6 py-16 sm:px-10">
          <div className="mx-auto w-full max-w-[74rem]">
            <div className="reveal max-w-[38rem]">
              <span className="inline-flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.09em] text-accent">
                <span className="h-1.5 w-1.5 rounded-[1px] bg-accent" /> Source coverage
              </span>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">Data sources, with a policy behind each connector.</h2>
              <p className="mt-3 text-ink-muted">
                We prioritize official APIs, open-data releases and public feeds. Each source is reviewed for access terms, licensing, rate limits and permitted document handling before it is enabled.
              </p>
            </div>

            <div className="reveal mt-10 hidden overflow-hidden rounded-sm border border-rule bg-surface sm:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse">
                  <thead>
                    <tr>
                      {['Region', 'Source', 'Access route', 'Product treatment', 'State'].map((h) => (
                        <th key={h} className="border-b border-rule bg-canvas px-5 py-3 text-left font-mono text-[0.7rem] uppercase tracking-[0.06em] text-ink-faint">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SOURCES.map((s) => (
                      <tr key={s.source}>
                        <td className="border-b border-rule px-5 py-3.5 text-sm">{s.region}</td>
                        <td className="border-b border-rule px-5 py-3.5 text-sm">{s.source}</td>
                        <td className="border-b border-rule px-5 py-3.5 text-sm">{s.access}</td>
                        <td className="border-b border-rule px-5 py-3.5 text-sm">{s.treatment}</td>
                        <td className="border-b border-rule px-5 py-3.5 text-sm">
                          <span className={`inline-flex items-center gap-1.5 font-mono text-[0.76rem] ${SOURCE_STATE_STYLE[s.state]}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${s.state === 'available' ? 'bg-success' : s.state === 'limited' ? 'bg-warning' : 'bg-ink-faint'}`} />
                            {SOURCE_STATE_LABEL[s.state]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3.5 sm:hidden">
              {SOURCES.map((s) => (
                <div key={s.source} className="rounded-sm border border-rule bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <strong className="text-sm">{s.source}</strong>
                    <span className={`inline-flex items-center gap-1.5 font-mono text-[0.76rem] ${SOURCE_STATE_STYLE[s.state]}`}>
                      {SOURCE_STATE_LABEL[s.state]}
                    </span>
                  </div>
                  <dl className="mt-2.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[0.85rem]">
                    <dt className="text-ink-faint">Region</dt><dd className="text-ink-muted">{s.region}</dd>
                    <dt className="text-ink-faint">Access</dt><dd className="text-ink-muted">{s.access}</dd>
                    <dt className="text-ink-faint">Treatment</dt><dd className="text-ink-muted">{s.treatment}</dd>
                  </dl>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-6">
              <a href="#sources" className="text-sm font-medium text-ink-muted hover:text-accent">See source coverage →</a>
              <a href="#" className="text-sm font-medium text-ink-muted hover:text-accent">Read data-source policy →</a>
            </div>
          </div>
        </section>

        <section className="snap-start flex min-h-screen items-center border-t border-rule px-6 py-16 sm:px-10">
          <div className="mx-auto w-full max-w-[74rem]">
            <div className="reveal max-w-[38rem]">
              <span className="inline-flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.09em] text-accent">
                <span className="h-1.5 w-1.5 rounded-[1px] bg-accent" /> Team workflow
              </span>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">From opportunity inbox to a clear next action.</h2>
              <p className="mt-3 text-ink-muted">
                Save the opportunities worth reviewing, assign an owner, record the next action, and stay aware of deadline or source changes. The system is designed to support a bid decision, not replace it.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-start">
              <div className="reveal rounded-sm border border-rule bg-surface p-5">
                <h3 className="mb-3.5 font-mono text-[0.72rem] uppercase tracking-[0.05em] text-ink-faint">Inbox</h3>
                {[
                  { id: 't1', score: 91, title: 'Cloud case management' },
                  { id: 't2', score: 84, title: 'Mobile service platform' },
                  { id: 't3', score: 73, title: 'Data integration support' },
                ].map((t) => (
                  <div key={t.id} className="flex items-center gap-3 border-t py-2.5 text-sm first:border-t-0">
                    <span className="w-7 font-mono font-semibold text-accent">{t.score}</span>
                    <span>{t.title}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center font-mono text-ink-faint md:pt-10">→</div>
              <div className="reveal rounded-sm border border-rule bg-surface p-5">
                <h3 className="mb-3.5 font-mono text-[0.72rem] uppercase tracking-[0.05em] text-ink-faint">Tender decision</h3>
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-[3px] bg-warning/10 px-2 py-1 font-mono text-[0.72rem] text-warning">Needs verification</span>
                <p className="mb-3.5 text-[0.88rem] text-ink-muted">Verify local registration requirement before pursuing.</p>
                <button type="button" className="flex h-11 w-full items-center justify-center rounded-sm border border-rule-strong text-sm font-semibold hover:border-accent hover:text-accent">
                  Mark pursuing
                </button>
              </div>
              <div className="flex items-center justify-center font-mono text-ink-faint md:pt-10">→</div>
              <div className="reveal rounded-sm border border-rule bg-surface p-5">
                <h3 className="mb-3.5 font-mono text-[0.72rem] uppercase tracking-[0.05em] text-ink-faint">Pursuit pipeline</h3>
                <div className="border-t pt-2.5 first:border-t-0 first:pt-0">
                  <span className="mb-1 inline-block rounded-[3px] bg-success/10 px-2 py-0.5 font-mono text-[0.72rem] text-success">Reviewing</span>
                  <p className="text-[0.85rem] text-ink-muted">Owner: B. Attapon · Next: confirm registration path</p>
                </div>
              </div>
            </div>
            <p className="mt-5 text-[0.8rem] text-ink-faint">Product workflow preview — illustrative composition, not live customer data.</p>
          </div>
        </section>

        <section id="security" className="snap-start flex min-h-screen items-center border-t border-rule px-6 py-16 sm:px-10">
          <div className="mx-auto w-full max-w-[74rem]">
            <div className="reveal max-w-[38rem]">
              <span className="inline-flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.09em] text-accent">
                <span className="h-1.5 w-1.5 rounded-[1px] bg-accent" /> Security &amp; handling
              </span>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">Designed for evidence, access control and review.</h2>
              <p className="mt-3 text-ink-muted">
                The product preserves source context, separates company data by organization, and presents automated analysis as reviewable output. Source and document handling remains subject to the policy attached to each connector.
              </p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-3">
              {[
                { title: 'Data provenance', desc: 'Original source links, tender version history and evidence references.', link: 'How provenance works' },
                { title: 'Company boundaries', desc: 'Organization-scoped access, roles and audit history.', link: 'Security overview' },
                { title: 'AI handling', desc: 'Structured extraction, visible uncertainty and policy-aware document handling.', link: 'AI processing policy' },
              ].map((c) => (
                <div key={c.title} className="reveal rounded-b-sm border-x border-b border-rule border-t-2 border-t-accent bg-surface p-6">
                  <h3 className="text-[1.02rem] font-semibold">{c.title}</h3>
                  <p className="mt-2.5 text-[0.9rem] text-ink-muted">{c.desc}</p>
                  <a href="#" className="mt-3.5 inline-block text-[0.86rem] font-medium text-accent hover:underline">{c.link} →</a>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="snap-start flex min-h-screen items-center border-t border-rule px-6 py-16 sm:px-10">
          <div className="mx-auto w-full max-w-[74rem]">
            <div className="reveal max-w-[38rem]">
              <span className="inline-flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.09em] text-accent">
                <span className="h-1.5 w-1.5 rounded-[1px] bg-accent" /> Pricing
              </span>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">Priced by scope, not by guesswork.</h2>
              <p className="mt-3 text-ink-muted">
                Each plan scales with the same three factors that shape a match: how many markets you monitor, how deep the source coverage goes, and how many people need to act on what&rsquo;s found.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3 md:items-start">
              <div className="reveal flex flex-col rounded-sm border border-rule bg-surface p-7">
                <span className="font-mono text-[0.75rem] uppercase tracking-[0.06em] text-ink-faint">Starter</span>
                <div className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="font-mono text-[2.3rem] font-semibold">$149</span>
                  <span className="text-[0.88rem] text-ink-faint">/ month</span>
                </div>
                <p className="mt-2 min-h-[2.6em] text-[0.85rem] text-ink-muted">For one team watching a couple of markets before committing further.</p>
                <ul className="mt-5 flex flex-1 flex-col gap-2.5 border-t border-rule pt-5">
                  {['Up to 3 seats', '2 monitored markets', 'Core sources (EU TED, Find a Tender)', 'Match score, factors and evidence', 'Daily digest alerts', 'Email support'].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[0.88rem]">
                      <span className="mt-0.5 flex h-[1.1rem] w-[1.1rem] shrink-0 items-center justify-center rounded-[3px] bg-success/10 text-[0.7rem] font-bold text-success">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href={`${APP_URL}/onboarding`} className="mt-6 flex h-11 w-full items-center justify-center rounded-sm border border-rule-strong text-sm font-semibold hover:border-accent hover:text-accent">
                  Create company profile
                </a>
              </div>

              <div className="reveal relative flex flex-col rounded-sm border border-accent bg-surface p-7 shadow-[0_0_0_1px_theme(colors.accent)]">
                <span className="absolute -top-3 left-7 rounded-[3px] bg-accent px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-[0.06em] text-accent-ink">
                  Most teams pick this
                </span>
                <span className="font-mono text-[0.75rem] uppercase tracking-[0.06em] text-ink-faint">Team</span>
                <div className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="font-mono text-[2.3rem] font-semibold">$449</span>
                  <span className="text-[0.88rem] text-ink-faint">/ month</span>
                </div>
                <p className="mt-2 min-h-[2.6em] text-[0.85rem] text-ink-muted">For teams monitoring several markets and running a shared pursuit pipeline.</p>
                <ul className="mt-5 flex flex-1 flex-col gap-2.5 border-t border-rule pt-5">
                  {['Up to 10 seats', 'Unlimited monitored markets', 'All available sources, incl. limited-coverage', 'Full evidence audit trail', 'Real-time deadline & amendment alerts', 'Team inbox, owners and pursuit pipeline', 'Priority email + chat support'].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[0.88rem]">
                      <span className="mt-0.5 flex h-[1.1rem] w-[1.1rem] shrink-0 items-center justify-center rounded-[3px] bg-success/10 text-[0.7rem] font-bold text-success">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href={`${APP_URL}/onboarding`} className="btn-magnetic mt-6 flex h-11 w-full items-center justify-center rounded-sm bg-accent text-sm font-semibold text-accent-ink hover:opacity-90">
                  Create company profile
                </a>
              </div>

              <div className="reveal flex flex-col rounded-sm border border-rule bg-surface p-7">
                <span className="font-mono text-[0.75rem] uppercase tracking-[0.06em] text-ink-faint">Enterprise</span>
                <div className="mt-2.5 font-mono text-[2.3rem] font-semibold">Talk to us</div>
                <p className="mt-2 min-h-[2.6em] text-[0.85rem] text-ink-muted">For organizations that need custom sources, seats or data handling.</p>
                <ul className="mt-5 flex flex-1 flex-col gap-2.5 border-t border-rule pt-5">
                  {['Unlimited seats', 'Custom source onboarding', 'SSO and custom roles', 'Dedicated data boundary & retention policy', 'Real-time alerts + webhook / API access', 'Dedicated success manager'].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[0.88rem]">
                      <span className="mt-0.5 flex h-[1.1rem] w-[1.1rem] shrink-0 items-center justify-center rounded-[3px] bg-success/10 text-[0.7rem] font-bold text-success">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="#contact" className="mt-6 flex h-11 w-full items-center justify-center rounded-sm border border-rule-strong text-sm font-semibold hover:border-accent hover:text-accent">
                  Book a demo
                </a>
              </div>
            </div>

            <div className="price-calc reveal mt-10 rounded-sm border border-rule bg-surface p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h4 className="text-[0.95rem] font-semibold">How the Team price is built</h4>
                <span className="font-mono font-semibold text-accent">$449 / mo</span>
              </div>
              <div className="mt-2">
                <FactorBar label="Seats (10 × $18 base)" pct={40} valueLabel="$180" />
                <FactorBar label="Market breadth (unlimited)" pct={27} valueLabel="$120" />
                <FactorBar label="Source depth (incl. limited-coverage)" pct={20} valueLabel="$90" />
                <FactorBar label="Real-time alerts + audit trail" pct={13} valueLabel="$59" />
              </div>
              <p className="mt-5 text-[0.8rem] text-ink-faint">
                Illustrative model: price = seat base + market-breadth weight + source-depth weight + alert/audit tier. Draft pricing — not yet commercially approved; final rates depend on confirmed hosting, data-licensing and support costs.
              </p>
            </div>
          </div>
        </section>

        <section className="snap-start flex min-h-screen items-center border-t border-rule px-6 py-16 sm:px-10">
          <div className="mx-auto w-full max-w-[74rem]">
            <div className="reveal max-w-[38rem]">
              <span className="inline-flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.09em] text-accent">
                <span className="h-1.5 w-1.5 rounded-[1px] bg-accent" /> Is this for you
              </span>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">Built for teams evaluating bid effort, not every workflow.</h2>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              <div className="reveal rounded-sm border border-accent/25 bg-accent/5 p-6">
                <h3 className="font-semibold text-accent">A good fit when</h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {['You sell custom software, integration, cloud or digital delivery services', 'Your team monitors more than one public procurement source', 'You need to explain bid/no-bid decisions to a team', 'You want to tune opportunity fit around your own capabilities'].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-0.5 flex h-[1.1rem] w-[1.1rem] shrink-0 items-center justify-center rounded-[3px] bg-success/10 text-[0.7rem] font-bold text-success">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="reveal rounded-sm border border-rule p-6">
                <h3 className="font-semibold text-ink-faint">May not be the right tool when</h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {['You need a system to submit bids directly into every buyer portal', 'You only pursue one known buyer and already receive all notices directly', 'You need legal eligibility advice rather than structured source information', 'You need guaranteed coverage of sources not yet enabled'].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-0.5 flex h-[1.1rem] w-[1.1rem] shrink-0 items-center justify-center rounded-[3px] bg-rule text-[0.7rem] font-bold text-ink-faint">–</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-8 text-center">
              <a href="#sources" className="text-sm font-medium text-ink-muted hover:text-accent">See whether your market is covered →</a>
            </div>
          </div>
        </section>

        <section ref={faqSectionRef} className="relative border-t border-rule" style={{ height: '350vh' }}>
          <div className="sticky top-0 flex min-h-screen flex-col justify-center px-6 py-16 sm:px-10">
            <div className="mx-auto w-full max-w-[74rem]">
              <div className="reveal max-w-[38rem]">
                <span className="inline-flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.09em] text-accent">
                  <span className="h-1.5 w-1.5 rounded-[1px] bg-accent" /> FAQ
                </span>
                <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">Questions worth answering before you sign up.</h2>
              </div>

              <div role="tablist" aria-label="Frequently asked questions" className="mt-10 grid overflow-hidden rounded-sm border border-rule md:grid-cols-[0.85fr_1.15fr]">
                <div className="flex flex-col">
                  {FAQS.map((item, i) => (
                    <button
                      key={item.q}
                      role="tab"
                      aria-selected={faqActive === i}
                      onClick={() => setFaqActive(i)}
                      className={`border-b border-rule px-6 py-4 text-left last:border-b-0 md:last:border-b ${faqActive === i ? 'bg-accent/5' : 'bg-surface'}`}
                    >
                      <h3 className="text-[0.95rem] font-medium leading-snug">{item.q}</h3>
                    </button>
                  ))}
                </div>
                <div className="border-t border-rule bg-canvas p-6 md:border-l md:border-t-0">
                  <div className="mb-3.5 font-mono text-[0.7rem] uppercase tracking-[0.06em] text-ink-faint">Answer</div>
                  <p className="text-[0.95rem] text-ink-muted">{FAQS[faqActive].a}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-1.5" aria-hidden="true">
                {FAQS.map((_, i) => (
                  <span key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-rule">
                    <span className={`block h-full bg-accent transition-[width] duration-200 ${i <= faqActive ? 'w-full' : 'w-0'}`} />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="snap-start flex min-h-screen items-center border-y border-accent/20 bg-accent/5 px-6 py-16 text-center sm:px-10">
          <div className="mx-auto w-full max-w-[74rem]">
            <h2 className="reveal mx-auto max-w-[34rem] font-display text-2xl font-bold tracking-tight">
              Make your first tender review more deliberate.
            </h2>
            <p className="reveal mx-auto mt-4 max-w-[30rem] text-ink-muted">
              Start with what your company can deliver, where you can operate and what you need to avoid.
            </p>
            <div className="reveal mt-7">
              <a
                href={`${APP_URL}/onboarding`}
                className="btn-magnetic inline-flex h-11 items-center justify-center rounded-sm bg-accent px-6 text-sm font-semibold text-accent-ink hover:opacity-90"
              >
                Create company profile
              </a>
            </div>
            <p className="reveal mt-4 text-[0.86rem] text-ink-faint">
              Already have an account?{' '}
              <a href={`${APP_URL}/sign-in`} className="text-accent hover:underline">Sign in.</a>
            </p>
          </div>
        </section>
      </main>

      <footer className="snap-start px-6 py-12 sm:px-10">
        <div className="mx-auto flex w-full max-w-[74rem] flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[24rem] font-display text-[1.05rem]">
            Spend your team&rsquo;s attention on opportunities you can actually pursue.
          </p>
          <ul className="flex flex-wrap gap-5">
            {[
              ['Product', '#workflow'],
              ['Sources', '#sources'],
              ['Security', '#security'],
              ['Data-source policy', '#'],
              ['Privacy', '#'],
              ['Terms', '#'],
              ['Contact', '#contact'],
            ].map(([label, href]) => (
              <li key={label}><a href={href} className="text-[0.85rem] text-ink-muted hover:text-accent">{label}</a></li>
            ))}
          </ul>
        </div>
        <div className="mx-auto mt-6 w-full max-w-[74rem] border-t border-rule pt-6 text-[0.8rem] text-ink-faint">
          &copy; {new Date().getFullYear()} Tender Intelligence
        </div>
      </footer>
    </div>
  );
}
