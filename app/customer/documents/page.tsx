'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CustomerNavbar } from '@/components/customer/layout/CustomerNavbar';
import customerApi from '@/lib/customerApi';
import { Download, FileCheck2, FileText, Search } from 'lucide-react';

type CustomerDocument = {
  id: string;
  name?: string | null;
  title?: string | null;
  category?: string | null;
  document_type?: string | null;
  file_url?: string | null;
  created_at?: string | null;
};

export default function CustomerDocumentCenterPage() {
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await customerApi.get<{ success?: boolean; documents?: CustomerDocument[]; data?: { documents?: CustomerDocument[] }; error?: string }>('/api/customer/documents');
      if (res.data?.success === false) throw new Error(res.data.error || 'The document list could not be loaded.');
      const docs = res.data?.documents || res.data?.data?.documents || [];
      if (!Array.isArray(docs)) throw new Error('The document service returned an invalid list.');
      setDocuments(docs);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Could not load your documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchDocs(); }, [fetchDocs]);

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return documents;
    return documents.filter((doc) => [doc.name, doc.title, doc.category, doc.document_type, doc.created_at].some((value) => String(value || '').toLowerCase().includes(query)));
  }, [documents, search]);

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.11em] text-emerald-700"><FileText size={15} />Customer files</div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Documents</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Open invoices and service documents shared with your customer account.</p>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">{documents.length} {documents.length === 1 ? 'item' : 'items'}</span>
        </header>

        <label className="relative block max-w-xl">
          <span className="sr-only">Search customer documents</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, type, or date" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
        </label>

        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"><p>{error}</p><button type="button" onClick={() => void fetchDocs()} className="mt-2 font-semibold underline underline-offset-2">Try again</button></div>}

        {loading ? <div className="grid gap-3">{[1, 2, 3].map((item) => <div key={item} className="h-[76px] animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />)}</div> : filteredDocuments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"><FileText size={21} /></span>
            <h2 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">{search ? 'No matching documents' : 'No customer documents yet'}</h2>
            <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-slate-500 dark:text-slate-400">{search ? 'Try another name or document type.' : 'Documents will appear here when your service company shares an invoice or service file.'}</p>
          </div>
        ) : (
          <ul className="space-y-3">{filteredDocuments.map((doc) => {
            const name = doc.name || doc.title || 'Customer document';
            const category = doc.category || doc.document_type || 'Document';
            return <li key={`${category}-${doc.id}`} className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_18px_rgba(28,46,83,.035)] sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex min-w-0 items-center gap-3.5"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><FileCheck2 size={19} /></span><span className="min-w-0"><span className="block break-words text-sm font-bold text-slate-900 dark:text-white">{name}</span><span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"><span>{category}</span>{doc.created_at && <><span aria-hidden="true">·</span><time dateTime={doc.created_at}>{new Date(doc.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</time></>}</span></span></div>
              {doc.file_url ? <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><Download size={15} />Open document</a> : <span className="px-1 text-xs text-slate-400">File not available</span>}
            </li>;
          })}</ul>
        )}
      </main>
    </div>
  );
}
