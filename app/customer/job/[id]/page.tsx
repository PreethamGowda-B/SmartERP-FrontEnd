'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Activity, AlertCircle, Loader2,
  Receipt, Package, User, Clock, CheckCircle, XCircle,
  Calendar, Download, Info, MessageCircle, Send, Star,
} from 'lucide-react';
import { CustomerNavbar } from '@/components/customer/layout/CustomerNavbar';
import { JobStatusBadge } from '@/components/customer/ui/JobStatusBadge';
import { JobTimeline } from '@/components/customer/jobs/JobTimeline';
import { LoadingSkeleton } from '@/components/customer/ui/LoadingSkeleton';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useSSE } from '@/hooks/useSSE';
import { useJobTracking } from '@/hooks/useJobTracking';
import customerApi from '@/lib/customerApi';
import type { Job, SSEEvent, Invoice, JobMaterial, ChatMessage, JobReview } from '@/lib/customerTypes';

const TrackingMap = dynamic(() => import('@/components/customer/jobs/TrackingMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center">
      <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
    </div>
  ),
});

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  low: { label: 'Low Priority', className: 'text-gray-600 bg-gray-100' },
  medium: { label: 'Medium Priority', className: 'text-blue-700 bg-blue-50' },
  high: { label: 'High Priority', className: 'text-orange-700 bg-orange-50' },
  urgent: { label: 'Urgent', className: 'text-red-700 bg-red-50' },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.1 } }),
};

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(n || 0));
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const { isAuthenticated, isLoading: authLoading } = useCustomerAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null | undefined>(undefined);
  const [materials, setMaterials] = useState<JobMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [trackingActive, setTrackingActive] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Review state
  const [review, setReview] = useState<JobReview | null | undefined>(undefined); // undefined = not loaded
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/customer/login');
  }, [authLoading, isAuthenticated, router]);

  // FIX 4: NAVIGATION RESET
  useEffect(() => {
    setJob(null);
    setInvoice(undefined);
    setMaterials([]);
    setIsLoading(true);
    setError('');
    setTrackingActive(false);
    setMessages([]);
    setReview(undefined);
    setReviewSubmitted(false);
  }, [jobId]);

  const fetchInvoice = useCallback(async () => {
    try {
      const res = await customerApi.get<{ success: boolean; data: Invoice | null }>(
        `/api/customer/jobs/${jobId}/invoice`
      );
      setInvoice(res.data.data ?? null);
    } catch {
      setInvoice(null);
    }
  }, [jobId]);

  const fetchMaterials = useCallback(async () => {
    try {
      const res = await customerApi.get<{ success: boolean; data: JobMaterial[] }>(
        `/api/customer/jobs/${jobId}/materials`
      );
      setMaterials(res.data.data ?? []);
    } catch {
      setMaterials([]);
    }
  }, [jobId]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await customerApi.get<{ success: boolean; data: ChatMessage[] }>(
        `/api/customer/jobs/${jobId}/messages`
      );
      setMessages(res.data.data ?? []);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {
      setMessages([]);
    }
  }, [jobId]);

  const sendMessage = useCallback(async () => {
    if (!chatInput.trim()) return;
    setChatLoading(true);
    setChatError('');
    try {
      await customerApi.post(`/api/customer/jobs/${jobId}/messages`, { message: chatInput.trim() });
      setChatInput('');
      await fetchMessages();
    } catch (err: any) {
      setChatError(err?.response?.data?.error || 'Failed to send message');
    } finally {
      setChatLoading(false);
    }
  }, [jobId, chatInput, fetchMessages]);

  const fetchReview = useCallback(async () => {
    try {
      const res = await customerApi.get<{ success: boolean; data: JobReview | null }>(
        `/api/customer/jobs/${jobId}/review`
      );
      setReview(res.data.data ?? null);
      if (res.data.data) {
        setReviewRating(res.data.data.rating);
        setReviewText(res.data.data.review_text || '');
        setReviewSubmitted(true);
      }
    } catch {
      setReview(null);
    }
  }, [jobId]);

  const submitReview = useCallback(async () => {
    if (reviewRating === 0) { setReviewError('Please select a rating'); return; }
    setReviewLoading(true);
    setReviewError('');
    try {
      await customerApi.post(`/api/customer/jobs/${jobId}/review`, {
        rating: reviewRating,
        review_text: reviewText.trim() || undefined,
      });
      setReviewSubmitted(true);
      await fetchReview();
    } catch (err: any) {
      setReviewError(err?.response?.data?.error || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  }, [jobId, reviewRating, reviewText, fetchReview]);

  const fetchJob = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await customerApi.get<{ success: boolean; data: Job }>(`/api/customer/jobs/${jobId}`, { signal });
      const jobData = res.data.data ?? (res.data as any);
      setJob(jobData);
      if (jobData.employee_status === 'accepted' && jobData.status !== 'completed') {
        setTrackingActive(true);
      }
      if (jobData.status === 'completed') {
        fetchInvoice();
        fetchReview();
      }
      if (jobData.assigned_to) {
        fetchMaterials();
      }
      // Load chat history if technician has accepted
      if (jobData.employee_status === 'accepted' || jobData.employee_status === 'arrived') {
        fetchMessages();
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Job not found');
    } finally {
      setIsLoading(false);
    }
  }, [jobId, fetchInvoice, fetchMaterials, fetchMessages, fetchReview]);

  useEffect(() => {
    const controller = new AbortController();
    if (isAuthenticated) fetchJob(controller.signal);
    return () => controller.abort();
  }, [isAuthenticated, fetchJob]);

  const handleSSEEvent = useCallback((event: SSEEvent) => {
    if (event.type === 'job_approved') {
      fetchJob();
    }
    if (event.type === 'job_accepted') {
      fetchJob();
      setTrackingActive(true);
      fetchMessages();
    }
    if (event.type === 'employee_arrived') {
      fetchJob();
    }
    if (event.type === 'job_progress') {
      setJob(prev => prev ? {
        ...prev, progress: event.progress ?? prev.progress, status: event.status || prev.status,
      } : prev);
    }
    if (event.type === 'job_completed') {
      fetchJob();
      setTrackingActive(false);
      setTimeout(() => { fetchInvoice(); fetchMaterials(); fetchReview(); }, 2000);
    }
    if (event.type === 'chat_message' && event.message) {
      setMessages(prev => {
        // Deduplicate by id
        if (prev.some(m => m.id === event.message!.id)) return prev;
        const updated = [...prev, event.message!];
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        return updated;
      });
    }
  }, [fetchJob, fetchInvoice, fetchMaterials, fetchMessages, fetchReview]);

  const { isConnected: sseConnected } = useSSE({ jobId, onEvent: handleSSEEvent, enabled: isAuthenticated && !!job });
  const { tracking } = useJobTracking({ jobId, active: trackingActive, sseConnected, intervalMs: 15_000 });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerNavbar />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-4">
          <LoadingSkeleton className="h-6 w-32" />
          <LoadingSkeleton className="h-48" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-4">
              <LoadingSkeleton className="h-48" />
              <LoadingSkeleton className="h-32" />
            </div>
            <div className="space-y-4">
              <LoadingSkeleton className="h-32" />
              <LoadingSkeleton className="h-48" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerNavbar />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Request not found</h2>
            <p className="text-sm text-gray-500 mb-6">
              {error || 'This request does not exist or you do not have access.'}
            </p>
            <button
              onClick={() => router.push('/customer/dashboard')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all"
            >
              <ArrowLeft className="h-4 w-4" />Back to dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  const priority = PRIORITY_CONFIG[job.priority] || PRIORITY_CONFIG.medium;
  const isCompleted = job.status === 'completed';

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        {/* Back */}
        <button
          onClick={() => router.push('/customer/dashboard')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />Back to dashboard
        </button>

        {/* ── Header card ──────────────────────────────────────────────────── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={0}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{job.title}</h1>
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              <JobStatusBadge status={job.status} approvalStatus={job.approval_status} employeeStatus={job.employee_status} />
              {sseConnected && (
                <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Live
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${priority.className}`}>
              {priority.label}
            </span>
            {job.scheduled_at && (
              <span className="flex items-center gap-1.5 text-xs text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md font-medium">
                <Calendar className="h-3 w-3" />
                Scheduled: {formatDate(job.scheduled_at)}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              Submitted {formatDate(job.created_at)}
            </span>
          </div>

          {job.description && (
            <p className="text-gray-600 text-sm leading-relaxed mb-4">{job.description}</p>
          )}

          {/* Approval banner — amber for pending */}
          {job.approval_status === 'pending_approval' && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 mb-4">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Awaiting approval</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Your request is being reviewed. You will be notified once approved.
                </p>
              </div>
            </div>
          )}

          {/* Approval banner — red for rejected */}
          {job.approval_status === 'rejected' && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200 mb-4">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Request not approved</p>
                <p className="text-xs text-red-700 mt-0.5">
                  Please contact your service provider for more information.
                </p>
              </div>
            </div>
          )}

          {/* SLA breach warning */}
          {(job.sla_accept_breached || job.sla_completion_breached) && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200 mb-4">
              <Clock className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">SLA target missed</p>
                <p className="text-xs text-red-700 mt-0.5">
                  {job.sla_accept_breached && 'Response time exceeded. '}
                  {job.sla_completion_breached && 'Completion time exceeded.'}
                </p>
              </div>
            </div>
          )}

          {/* Progress bar */}
          {Number(job.progress || 0) > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Progress</span>
                <span className="font-semibold text-blue-600">{Number(job.progress || 0).toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Number(job.progress || 0)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Two-column layout ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left column — 2/3 width */}
          <div className="lg:col-span-2 space-y-5">
            {/* Activity Timeline */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={1}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-gray-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">Activity Timeline</h2>
              </div>
              <JobTimeline job={job} />
            </motion.div>

            {/* Technician card */}
            {job.assigned_employee_name && (
              <motion.div
                variants={fadeUp} initial="hidden" animate="visible" custom={2}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <User className="h-4 w-4 text-indigo-600" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-900">Assigned Technician</h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <span className="text-indigo-700 font-bold text-lg">
                      {job.assigned_employee_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{job.assigned_employee_name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="h-3 w-3" />Job Completed
                        </span>
                      )}
                      {!isCompleted && job.employee_status === 'accepted' && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="h-3 w-3" />Accepted
                        </span>
                      )}
                      {!isCompleted && job.employee_status === 'arrived' && (
                        <span className="inline-flex items-center gap-1 text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                          <MapPin className="h-3 w-3" />Arrived on site
                        </span>
                      )}
                      {!isCompleted && job.employee_status === 'assigned' && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          <Clock className="h-3 w-3" />Awaiting acceptance
                        </span>
                      )}
                    </div>
                    {isCompleted && job.completed_at && (
                      <p className="text-xs text-gray-400 mt-1">Completed {formatDate(job.completed_at)}</p>
                    )}
                    {!isCompleted && job.accepted_at && (
                      <p className="text-xs text-gray-400 mt-1">Accepted {formatDate(job.accepted_at)}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tracking map */}
            {trackingActive && (
              <motion.div
                id="tracking"
                variants={fadeUp} initial="hidden" animate="visible" custom={3}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Live Technician Location</h2>
                    <p className="text-xs text-gray-500">Updates every 15 seconds</p>
                  </div>
                  <span className="ml-auto flex items-center gap-1.5 text-xs text-green-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Live
                  </span>
                </div>
                {tracking ? (
                  <TrackingMap tracking={tracking} />
                ) : (
                  <div className="h-48 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Waiting for location data...</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Chat panel — only when technician has accepted */}
            {(job.employee_status === 'accepted' || job.employee_status === 'arrived') && (
              <motion.div
                variants={fadeUp} initial="hidden" animate="visible" custom={4}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Chat header */}
                <div className="flex items-center gap-2.5 p-5 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Chat with Technician</h2>
                    <p className="text-xs text-gray-500">
                      {job.assigned_employee_name ? `Chatting with ${job.assigned_employee_name}` : 'Direct message'}
                    </p>
                  </div>
                  <span className="ml-auto flex items-center gap-1.5 text-xs text-green-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />Active
                  </span>
                </div>

                {/* Message list */}
                <div className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {Array.isArray(messages) && messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageCircle className="h-8 w-8 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">No messages yet</p>
                      <p className="text-xs text-gray-400 mt-1">Start the conversation with your technician</p>
                    </div>
                  ) : (
                    Array.isArray(messages) && messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${msg.sender_type === 'customer'
                            ? 'bg-indigo-600 text-white rounded-br-sm'
                            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm'
                          }`}>
                          {msg.sender_type === 'employee' && (
                            <p className="text-xs font-semibold text-indigo-600 mb-0.5">{msg.sender_name}</p>
                          )}
                          <p className="text-sm leading-relaxed">{msg.message}</p>
                          <p className={`text-xs mt-1 ${msg.sender_type === 'customer' ? 'text-indigo-200' : 'text-gray-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-100 bg-white">
                  {chatError && (
                    <p className="text-xs text-red-600 mb-2">{chatError}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      placeholder="Type a message..."
                      disabled={chatLoading}
                      className="flex-1 px-3.5 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 bg-gray-50"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={chatLoading || !chatInput.trim()}
                      className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                      {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right column — 1/3 width */}
          <div className="space-y-5">
            {/* SLA Status card */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={1}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">SLA Status</h2>
              </div>
              <div className="space-y-3">
                <div className={`flex items-center justify-between p-3 rounded-lg border ${job.sla_accept_breached ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                  }`}>
                  <div className="flex items-center gap-2">
                    {job.sla_accept_breached
                      ? <XCircle className="h-4 w-4 text-red-600" />
                      : <CheckCircle className="h-4 w-4 text-green-600" />}
                    <span className={`text-xs font-semibold ${job.sla_accept_breached ? 'text-red-700' : 'text-green-700'}`}>
                      Response Time
                    </span>
                  </div>
                  <span className={`text-xs ${job.sla_accept_breached ? 'text-red-600' : 'text-green-600'}`}>
                    {job.sla_accept_breached ? 'Missed' : 'On time'}
                  </span>
                </div>
                <div className={`flex items-center justify-between p-3 rounded-lg border ${job.sla_completion_breached ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                  }`}>
                  <div className="flex items-center gap-2">
                    {job.sla_completion_breached
                      ? <XCircle className="h-4 w-4 text-red-600" />
                      : <CheckCircle className="h-4 w-4 text-green-600" />}
                    <span className={`text-xs font-semibold ${job.sla_completion_breached ? 'text-red-700' : 'text-green-700'}`}>
                      Completion Time
                    </span>
                  </div>
                  <span className={`text-xs ${job.sla_completion_breached ? 'text-red-600' : 'text-green-600'}`}>
                    {job.sla_completion_breached ? 'Missed' : 'On time'}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Invoice card */}
            {isCompleted && (
              <motion.div
                variants={fadeUp} initial="hidden" animate="visible" custom={2}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                    <Receipt className="h-4 w-4 text-green-600" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-900">Invoice</h2>
                </div>

                {invoice === undefined ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />Loading invoice...
                  </div>
                ) : invoice === null ? (
                  <p className="text-sm text-gray-500 py-2">Invoice is being generated. Check back shortly.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-mono">{invoice.invoice_number}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${invoice.status === 'paid' ? 'bg-green-50 text-green-700' :
                          invoice.status === 'sent' ? 'bg-blue-50 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                        }`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </div>

                    {/* Cost breakdown table */}
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Labor ({Number(invoice.labor_hours || 0).toFixed(1)}h)</span>
                        <span className="font-medium text-gray-900">{formatCurrency(invoice.labor_cost)}</span>
                      </div>
                      {invoice.materials_cost > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Materials</span>
                          <span className="font-medium text-gray-900">{formatCurrency(invoice.materials_cost)}</span>
                        </div>
                      )}
                      {invoice.service_charge > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Service charge</span>
                          <span className="font-medium text-gray-900">{formatCurrency(invoice.service_charge)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200">
                        <span>Total</span>
                        <span className="text-green-700">{formatCurrency(invoice.total_amount)}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400">Generated {formatDate(invoice.generated_at)}</p>

                    {/* Download button — disabled with tooltip */}
                    <div className="relative group/dl">
                      <button
                        disabled
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-400 bg-gray-50 cursor-not-allowed"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download Invoice
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/dl:flex items-center gap-1.5 bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg z-10">
                        <Info className="h-3 w-3" />
                        PDF export coming soon
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Materials card */}
            {materials.length > 0 && (
              <motion.div
                variants={fadeUp} initial="hidden" animate="visible" custom={3}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                    <Package className="h-4 w-4 text-orange-600" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Materials Used ({materials.length})
                  </h2>
                </div>
                <div className="space-y-0">
                  {/* Table header */}
                  <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-400 pb-2 border-b border-gray-100">
                    <span className="col-span-2">Item</span>
                    <span className="text-right">Qty</span>
                    <span className="text-right">Total</span>
                  </div>
                  {Array.isArray(materials) && materials.map((m) => (
                    <div key={m.id} className="grid grid-cols-4 gap-2 py-2 border-b border-gray-50 last:border-0">
                      <div className="col-span-2">
                        <p className="text-xs font-medium text-gray-900 truncate">{m.item_name}</p>
                        {Number(m.unit_cost || 0) > 0 && (
                          <p className="text-xs text-gray-400">{formatCurrency(m.unit_cost)}/unit</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-600 text-right self-center">{m.quantity_used}</span>
                      <span className="text-xs font-medium text-gray-900 text-right self-center">
                        {Number(m.total_cost || 0) > 0 ? formatCurrency(m.total_cost) : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Review card — only after completion ──────────────────────── */}
            {isCompleted && (
              <motion.div
                variants={fadeUp} initial="hidden" animate="visible" custom={4}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
                    <Star className="h-4 w-4 text-yellow-500" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    {reviewSubmitted ? 'Your Review' : 'Rate this Service'}
                  </h2>
                </div>

                {reviewSubmitted ? (
                  /* Submitted state */
                  <div className="space-y-3">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={s}
                          className={`h-5 w-5 ${s <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`}
                        />
                      ))}
                      <span className="ml-2 text-sm font-semibold text-gray-700">{reviewRating}/5</span>
                    </div>
                    {reviewText && (
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed">{reviewText}</p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-green-600">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Review submitted — thank you!
                    </div>
                  </div>
                ) : (
                  /* Input state */
                  <div className="space-y-4">
                    {/* Star selector */}
                    <div>
                      <p className="text-xs text-gray-500 mb-2">How would you rate this service?</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setReviewRating(s)}
                            onMouseEnter={() => setReviewHover(s)}
                            onMouseLeave={() => setReviewHover(0)}
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              className={`h-7 w-7 transition-colors ${s <= (reviewHover || reviewRating)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-200 fill-gray-200'
                                }`}
                            />
                          </button>
                        ))}
                        {reviewRating > 0 && (
                          <span className="ml-2 text-sm text-gray-500">
                            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewRating]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Text input */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Leave a comment (optional)</p>
                      <textarea
                        value={reviewText}
                        onChange={e => setReviewText(e.target.value)}
                        placeholder="Tell us about your experience..."
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none bg-gray-50"
                      />
                    </div>

                    {reviewError && (
                      <p className="text-xs text-red-600">{reviewError}</p>
                    )}

                    <button
                      onClick={submitReview}
                      disabled={reviewLoading || reviewRating === 0}
                      className="w-full py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {reviewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                      {reviewLoading ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
