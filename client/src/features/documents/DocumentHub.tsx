import React, { useState } from 'react';
import { useDocuments, useUploadDocument, useDeleteDocument } from '../../hooks/useReactQueries';
import { useDebounce } from '../../hooks/useDebounce';
import { Search, FileText, Download, Trash2, Eye, ShieldCheck, Database, FileDigit } from 'lucide-react';
import VirtualList from '../../components/VirtualList';
import { Skeleton } from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';

export const DocumentHub: React.FC = () => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [activeCategory, setActiveCategory] = useState<string>('');

  // New Document upload inputs
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState<'Legal' | 'Incorporation' | 'NDA' | 'Agreements' | 'CapTable' | 'Financials' | 'Invoices' | 'Contracts' | 'General'>('General');
  const [docUrl, setDocUrl] = useState('');
  
  // Selected OCR parsed view
  const [viewOcrDoc, setViewOcrDoc] = useState<any>(null);

  // Query variables memoization
  const queryParams = React.useMemo(() => {
    const q: any = {};
    if (activeCategory) q.category = activeCategory;
    if (debouncedSearch) q.search = debouncedSearch;
    return q;
  }, [activeCategory, debouncedSearch]);

  // React Query Hooks
  const { data: documents = [], isLoading, isError, refetch } = useDocuments(queryParams);
  const uploadDocMutation = useUploadDocument();
  const deleteDocMutation = useDeleteDocument();

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName || !docCategory || !docUrl.trim()) return;

    try {
      await uploadDocMutation.mutateAsync({
        name: docName,
        category: docCategory,
        url: docUrl.trim(),
        sizeBytes: 154000
      });

      setShowUploadModal(false);
      setDocName('');
      setDocUrl('');
    } catch (err) {
      console.error('Failed to upload document file', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocMutation.mutateAsync(id);
      if (viewOcrDoc?._id === id) setViewOcrDoc(null);
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const categories = [
    { id: '', label: 'All Filings' },
    { id: 'Legal', label: 'Legal Papers' },
    { id: 'Incorporation', label: 'Incorporation' },
    { id: 'NDA', label: 'NDA Docs' },
    { id: 'CapTable', label: 'Cap Table' },
    { id: 'Financials', label: 'Financial Reports' },
    { id: 'Contracts', label: 'Contracts' }
  ];

  if (isError) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <ErrorState onRetry={refetch} message="Failed to load document catalog archive." />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Search and Category navigation */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        {/* Category Pills */}
        <div className="flex gap-2 flex-wrap text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full border transition cursor-pointer font-semibold ${
                activeCategory === cat.id 
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/10' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Global OCR search bar */}
        <div className="flex gap-2 w-full md:w-auto text-xs">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
            <input
              type="text"
              placeholder="Search PDF content inside files..."
              className="w-full glass-input pl-9 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shrink-0 cursor-pointer"
          >
            Upload File
          </button>
        </div>
      </div>

      {/* Main split file catalog and OCR detail pane */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Filings grid list (Virtualized) */}
        <div className="md:col-span-2 border border-white/5 rounded-xl bg-slate-900/10 p-2">
          {isLoading ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <VirtualList
              items={documents}
              estimateSize={65}
              heightClass="h-[65vh]"
              emptyComponent={
                <p className="text-center text-xs text-gray-500 py-12">No files found matching catalog categories.</p>
              }
              renderItem={(doc: any) => (
                <div className="liquid-glass p-4 rounded-xl flex items-center justify-between text-xs gap-4 my-1 border border-white/5 bg-slate-950/40">
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                      <FileDigit size={16} />
                    </div>
                    <div className="truncate space-y-0.5">
                      <h4 className="font-bold text-white truncate">{doc.name}</h4>
                      <div className="flex items-center gap-2 text-[9px] text-gray-500">
                        <span className="bg-white/5 border border-white/10 px-1 py-0.2 rounded font-bold uppercase">{doc.category}</span>
                        <span>•</span>
                        <span>{(doc.sizeBytes / 1024).toFixed(0)} KB</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {doc.ocrStatus === 'Completed' ? (
                      <button 
                        onClick={() => setViewOcrDoc(doc)}
                        className="p-1.5 bg-white/5 border border-white/10 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white rounded text-gray-400 transition cursor-pointer outline-none"
                        title="Inspect OCR Content"
                      >
                        <Eye size={12} />
                      </button>
                    ) : doc.ocrStatus === 'Pending' ? (
                      <span className="text-[8px] bg-amber-500/10 text-amber-500 px-2 py-1 rounded font-bold border border-amber-500/20 animate-pulse shrink-0">
                        OCR PENDING
                      </span>
                    ) : doc.ocrStatus === 'Unavailable' ? (
                      <span className="text-[8px] bg-slate-500/10 text-slate-400 px-2 py-1 rounded font-bold border border-slate-500/20 shrink-0">
                        OCR OFF
                      </span>
                    ) : (
                      <span className="text-[8px] bg-red-500/10 text-red-500 px-2 py-1 rounded font-bold shrink-0">
                        OCR FAILED
                      </span>
                    )}
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded text-gray-400 transition cursor-pointer"
                    >
                      <Download size={12} />
                    </a>
                    <button 
                      onClick={() => handleDelete(doc._id)}
                      className="p-1.5 bg-white/5 border border-white/10 hover:bg-red-500/30 hover:bg-red-950/20 hover:text-red-400 rounded text-gray-500 transition cursor-pointer outline-none"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )}
            />
          )}
        </div>

        {/* OCR preview side pane */}
        <div className="liquid-glass rounded-xl p-5 flex flex-col h-[65vh] justify-between border border-white/5 bg-slate-950/40">
          {viewOcrDoc ? (
            <div className="space-y-4 h-full flex flex-col justify-between overflow-hidden">
              <div>
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">OCR parsed text index</span>
                </div>
                <h4 className="text-xs font-bold text-white truncate mt-3">{viewOcrDoc.name}</h4>
                <p className="text-[10px] text-gray-500 mt-1 font-mono uppercase">Category: {viewOcrDoc.category}</p>
                
                <div className="mt-4 bg-white/2 border border-white/5 rounded-lg p-3 text-[10px] leading-relaxed text-gray-300 font-mono max-h-72 overflow-y-auto whitespace-pre-wrap select-all">
                  {viewOcrDoc.ocrText}
                </div>
              </div>

              <div className="text-[9px] text-gray-500 flex items-center gap-1.5 pt-2 border-t border-white/5">
                <Database size={10} />
                <span>Text is fully searchable in query panels.</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <FileText size={32} className="text-gray-600 mb-2" />
              <h4 className="text-xs font-semibold">No OCR inspected</h4>
              <p className="text-[10px] text-gray-600 mt-1">Click the eye icon next to a completed document to view search indices.</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload document modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="fixed inset-0" onClick={() => setShowUploadModal(false)} />
          <form onSubmit={handleUpload} className="w-full max-w-sm liquid-glass p-6 rounded-xl relative z-10 space-y-4 border border-white/10 bg-slate-950">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">File Filing Upload</h3>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Document Display Title</label>
              <input
                type="text"
                required
                placeholder="Certificate of Good Standing.pdf"
                className="w-full glass-input text-xs"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Filing Category</label>
              <select 
                className="w-full glass-input text-xs bg-slate-900"
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value as any)}
              >
                <option value="Incorporation">Incorporation</option>
                <option value="Legal">Legal Agreements</option>
                <option value="NDA">NDA Agreements</option>
                <option value="CapTable">Cap Table Sheets</option>
                <option value="Financials">Financial Invoices</option>
                <option value="Contracts">Contracts</option>
                <option value="General">General Documents</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Cloud URL</label>
              <input
                type="text"
                required
                placeholder="https://..."
                className="w-full glass-input text-xs"
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
              />
              <p className="text-[10px] text-gray-500 mt-1">
                This environment stores the file reference and metadata only. OCR text must come from a real extraction pipeline.
              </p>
            </div>
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold cursor-pointer"
              >
                Start filing
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DocumentHub;
