"use client"

import Link from "next/link"
import { Shield, FileText, Mail, Building2, ChevronRight } from "lucide-react"

export default function TermsPage() {
  const lastUpdated = "March 21, 2026"
  const companyName = "Prozync Innovations"
  const appName = "SmartERP"
  const contactEmail = "prozyncinnovations@gmail.com"
  const websiteUrl = "https://www.prozync.in"

  const sections = [
    {
      id: "acceptance",
      title: "1. Acceptance of Terms",
      content: `By accessing or using ${appName} ("the Service") provided by ${companyName} ("we," "us," or "our"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service. These Terms apply to all visitors, users, and others who access or use the Service.`
    },
    {
      id: "description",
      title: "2. Description of Service",
      content: `${appName} is a cloud-based Enterprise Resource Planning (ERP) platform designed to help businesses manage employees, jobs, attendance, payroll, inventory, and communications. We offer subscription-based plans with varying feature access levels. Features may change or be updated at any time with or without prior notice.`
    },
    {
      id: "accounts",
      title: "3. User Accounts",
      content: `You are responsible for safeguarding your account credentials and for any activities that occur under your account. You agree to notify us immediately at ${contactEmail} upon becoming aware of any breach of security or unauthorized use of your account. You may not use another person's account without permission. Each company account (Owner) may add employee sub-accounts, which are governed by the same terms.`
    },
    {
      id: "subscriptions",
      title: "4. Subscriptions & Payments",
      content: `${appName} operates on a subscription model. New accounts begin with a 30-day free trial on our Pro tier. After the trial period, continued access requires an active paid subscription. All payments are processed securely through Razorpay. Subscriptions renew automatically unless cancelled. Refunds are evaluated on a case-by-case basis — contact ${contactEmail} within 7 days of a charge for refund requests.`
    },
    {
      id: "data",
      title: "5. Data & Privacy",
      content: `We collect and process personal data as described in our Privacy Policy. By using the Service, you consent to such processing. All data is stored securely on Neon PostgreSQL with automated backups. Your company data is strictly isolated from other tenants through Row-Level Security. We do not sell your data to third parties. For data deletion requests, contact ${contactEmail}.`
    },
    {
      id: "conduct",
      title: "6. Acceptable Use",
      content: `You agree not to: (a) use the Service for any unlawful purpose or in violation of any regulations; (b) attempt to gain unauthorized access to any portion of the Service; (c) interfere with or disrupt the integrity or performance of the Service; (d) upload or transmit viruses or any other malicious code; (e) scrape, crawl, or extract data from the Service without explicit written permission.`
    },
    {
      id: "termination",
      title: "7. Termination",
      content: `We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason at our sole discretion. Upon termination, your right to use the Service will immediately cease. You may request an export of your data within 30 days of termination by contacting ${contactEmail}.`
    },
    {
      id: "liability",
      title: "8. Limitation of Liability",
      content: `To the maximum extent permitted by applicable law, ${companyName} shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, resulting from your use of or inability to use the Service. Our total liability is limited to the amount paid by you for the Service in the 3 months preceding the claim.`
    },
    {
      id: "changes",
      title: "9. Changes to Terms",
      content: `We reserve the right to modify these Terms at any time. We will notify you of significant changes via email or a prominent notice on the Service. Your continued use of the Service after changes constitutes acceptance of the modified Terms.`
    },
    {
      id: "contact",
      title: "10. Contact Us",
      content: `If you have any questions about these Terms, please contact us at: ${contactEmail} or write to us at ${companyName}, India.`
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <Building2 className="h-6 w-6" />
            {appName}
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/auth/login" className="text-primary font-medium">Sign In</Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-primary/5 dark:bg-primary/10 border-b border-primary/10 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Legal</p>
              <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
            </div>
          </div>
          <p className="text-muted-foreground mt-2">
            Last updated: <span className="font-medium text-foreground">{lastUpdated}</span>
          </p>
          <p className="text-muted-foreground mt-4 max-w-2xl">
            Please read these Terms of Service carefully before using {appName}. By using our platform, you agree to be bound by these terms.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Table of Contents */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Contents</p>
              <nav className="space-y-1">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors py-1"
                  >
                    <ChevronRight className="h-3 w-3 shrink-0" />
                    <span className="truncate">{s.title.replace(/^\d+\.\s/, '')}</span>
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-10">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                  {section.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed">{section.content}</p>
              </section>
            ))}

            {/* Contact Card */}
            <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-6 mt-8">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Questions about these terms?</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Our team is happy to clarify anything in these Terms of Service.
              </p>
              <a
                href={`mailto:${contactEmail}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <Mail className="h-4 w-4" />
                {contactEmail}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-slate-800 py-6">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {companyName}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-primary transition-colors font-medium text-primary">Terms</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href={websiteUrl} className="hover:text-primary transition-colors">Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
