'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, BriefcaseBusiness, FileText, MessageCircle, ShieldCheck } from 'lucide-react';

type CustomerAuthShellProps = {
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
  eyebrow: string;
  children: ReactNode;
};

const portalBenefits = [
  { icon: BriefcaseBusiness, label: 'Service requests and job progress' },
  { icon: MessageCircle, label: 'Job conversations and updates' },
  { icon: FileText, label: 'Documents and invoices' },
];

export function CustomerAuthShell({ title, description, backHref, backLabel, eyebrow, children }: CustomerAuthShellProps) {
  return (
    <div className="customer-auth min-h-screen">
      <header className="customer-auth-header">
        <Link href="/customer/landing" className="customer-auth-brand" aria-label="Prozync customer portal home">
          <span className="customer-auth-brand-mark">P</span>
          <span>Prozync<span className="customer-auth-brand-subtitle">Customer portal</span></span>
        </Link>
        <Link href={backHref} className="customer-auth-back"><ArrowLeft size={16} />{backLabel}</Link>
      </header>

      <main className="customer-auth-main">
        <section className="customer-auth-story" aria-label="Customer portal overview">
          <div className="customer-auth-story-topline"><span className="customer-auth-status-dot" />Customer workspace</div>
          <div className="customer-auth-story-copy">
            <p className="customer-auth-eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="customer-auth-story-description">{description}</p>
          </div>

          <div className="customer-auth-preview" aria-hidden="true">
            <div className="customer-auth-preview-head">
              <span className="customer-auth-preview-icon"><BriefcaseBusiness size={18} /></span>
              <span><strong>Service workspace</strong><small>Your requests, together</small></span>
              <ArrowUpRight size={17} className="customer-auth-preview-arrow" />
            </div>
            <div className="customer-auth-preview-line"><span /><span /><span /></div>
            <div className="customer-auth-preview-row"><span className="customer-auth-preview-avatar">P</span><span className="customer-auth-preview-bar" /><i /></div>
            <div className="customer-auth-preview-row"><span className="customer-auth-preview-avatar customer-auth-preview-avatar-alt"><MessageCircle size={13} /></span><span className="customer-auth-preview-bar short" /><i /></div>
          </div>

          <ul className="customer-auth-benefits">
            {portalBenefits.map(({ icon: Icon, label }) => (
              <li key={label}><span><Icon size={15} /></span>{label}</li>
            ))}
          </ul>
          <div className="customer-auth-security"><ShieldCheck size={16} />Your account and service data stay in your customer workspace.</div>
        </section>

        <section className="customer-auth-form-area" aria-label={title}>
          <div className="customer-auth-mobile-title">
            <p className="customer-auth-eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="customer-auth-card">{children}</div>
          <p className="customer-auth-footer">Prozync customer portal</p>
        </section>
      </main>
    </div>
  );
}
