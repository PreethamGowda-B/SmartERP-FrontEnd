"use client"

import Link from "next/link"
import { Lock, FileText, Mail, Building2, ChevronRight, Eye, Database, Share2, UserCheck } from "lucide-react"

export default function PrivacyPage() {
  const lastUpdated = "March 21, 2026"
  const companyName = "Prozync Innovations"
  const appName = "SmartERP"
  const contactEmail = "prozyncinnovations@gmail.com"

  const sections = [
    {
      id: "overview",
      title: "1. Overview",
      icon: Eye,
      content: `${companyName} ("we," "us," or "our") operates ${appName} (the "Service"). This Privacy Policy explains how we collect, use, protect, and share your information when you use our platform. By using our Service, you agree to the collection and use of information in accordance with this policy.`
    },
    {
      id: "collection",
      title: "2. Information We Collect",
      icon: Database,
      content: `We collect information you provide directly: name, email address, phone number, company name, job title, and payment information. We also collect usage data such as IP addresses, browser type, pages visited, and time spent on features. For our mobile application, we may collect device identifiers and push notification tokens (FCM tokens) solely for the purpose of delivering in-app notifications to you.`
    },
    {
      id: "use",
      title: "3. How We Use Your Information",
      icon: UserCheck,
      content: `We use your information to: (a) provide, operate, and maintain the Service; (b) process transactions and manage subscriptions; (c) send transactional emails such as OTP verification codes and payroll notifications; (d) send push notifications for job assignments, attendance reminders, and important alerts; (e) analyze usage patterns to improve the Service; (f) respond to customer support inquiries; (g) comply with legal obligations. We do NOT use your data for advertising or sell it to third parties.`
    },
    {
      id: "storage",
      title: "4. Data Storage & Security",
      icon: Lock,
      content: `Your data is stored on Neon PostgreSQL (a secure managed cloud database). Your company's data is isolated from all other tenants using Row-Level Security (RLS) policies — meaning your employees can never see another company's data. All data in transit is encrypted via HTTPS/TLS. Authentication uses JWT tokens with short expiry times and rotating refresh tokens. We use Sentry for error monitoring, which may capture anonymized diagnostic information.`
    },
    {
      id: "sharing",
      title: "5. Data Sharing",
      icon: Share2,
      content: `We do not sell or rent your personal information. We may share your information with trusted third-party service providers who assist us in operating the Service: Neon (database hosting), Resend (email delivery), Razorpay (payment processing), Firebase (push notifications), Cloudinary (file/image storage), and Sentry (error tracking). Each provider is bound by strict data processing agreements and GDPR-compliant policies.`
    },
    {
      id: "retention",
      title: "6. Data Retention",
      content: `We retain your data for as long as your account is active or as needed to provide the Service. If you delete your account, we will delete or anonymize your personal data within 30 days, except where we are required to retain it for legal or tax compliance purposes. You may request a full export of your data at any time by emailing ${contactEmail}.`
    },
    {
      id: "rights",
      title: "7. Your Rights",
      content: `You have the right to: access the personal data we hold about you; correct inaccurate data; request deletion of your data ("right to be forgotten"); restrict or object to certain processing; receive your data in a portable format; withdraw consent at any time. To exercise any of these rights, contact us at ${contactEmail}. We will respond within 30 days.`
    },
    {
      id: "cookies",
      title: "8. Cookies",
      content: `We use HTTPOnly cookies to securely store authentication tokens (access and refresh tokens). These cookies are strictly necessary for the functioning of the Service and cannot be disabled. We do not use marketing cookies, tracking pixels, or third-party advertising cookies. No cookie consent banner is required as we only use essential cookies.`
    },
    {
      id: "children",
      title: "9. Children's Privacy",
      content: `The Service is not directed to individuals under the age of 16. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal information, please contact us at ${contactEmail} and we will take steps to delete such information.`
    },
    {
      id: "changes",
      title: "10. Changes to This Policy",
      content: `We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through a prominent notice in the Service. The date at the top of this page indicates when the policy was last updated. Continued use of the Service after changes constitutes acceptance.`
    },
    {
      id: "contact",
      title: "11. Contact Us",
      content: `For any privacy-related questions, data requests, or concerns, please contact our privacy team at: ${contactEmail}. We are committed to resolving any complaints about our collection or use of your personal information.`
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
            <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="/auth/login" className="text-primary font-medium">Sign In</Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border-b border-emerald-500/10 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Lock className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Legal</p>
              <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
            </div>
          </div>
          <p className="text-muted-foreground mt-2">
            Last updated: <span className="font-medium text-foreground">{lastUpdated}</span>
          </p>
          <p className="text-muted-foreground mt-4 max-w-2xl">
            Your privacy is important to us. This policy explains exactly what data we collect, how we use it, and how we protect it.
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap gap-3 mt-6">
            {["🔒 SSL Encrypted", "🚫 No Data Selling", "🔑 HTTPOnly Cookies", "🏢 Multi-Tenant Isolation"].map(badge => (
              <span key={badge} className="text-xs bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full font-medium">
                {badge}
              </span>
            ))}
          </div>
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
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-emerald-600 transition-colors py-1"
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
            <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 mt-8">
              <div className="flex items-center gap-3 mb-3">
                <Lock className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold text-foreground">Privacy concerns or data requests?</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Email us and we'll respond within 30 days. We take all privacy requests seriously.
              </p>
              <a
                href={`mailto:${contactEmail}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:underline"
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
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors font-medium text-emerald-600">Privacy</Link>
            <Link href="https://www.prozync.in" className="hover:text-primary transition-colors">Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
