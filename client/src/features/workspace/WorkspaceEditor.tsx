import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { 
  useWorkspaces, 
  useWorkspacePages, 
  useWorkspacePage, 
  useCreatePage, 
  useUpdatePage, 
  useDeletePage 
} from '../../hooks/useReactQueries';
import { File, Folder, Plus, Save, Trash2, FileText } from 'lucide-react';
import { Skeleton } from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';

export const WorkspaceEditor: React.FC = () => {
  const auth = useSelector((state: RootState) => state.auth);
  
  // Workspace list (Query)
  const { data: workspaces = [], isLoading: isWorkspacesLoading } = useWorkspaces();
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    if (workspaces.length > 0 && !activeWorkspaceId) {
      setActiveWorkspaceId(workspaces[0]._id);
    }
  }, [workspaces, activeWorkspaceId]);

  // Subpages inside workspace (Query)
  const { data: pages = [], isLoading: isPagesLoading, isError: isPagesError, refetch: refetchPages } = useWorkspacePages(activeWorkspaceId);
  const [activePageId, setActivePageId] = useState<string | null>(null);

  useEffect(() => {
    if (pages.length > 0 && !activePageId) {
      setActivePageId(pages[0]._id);
    }
  }, [pages, activePageId]);

  // Active page details (Query)
  const { data: activePage, isLoading: isActivePageLoading } = useWorkspacePage(activePageId);

  // Editor Inputs
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Sync inputs with query result
  useEffect(() => {
    if (activePage) {
      setTitle(activePage.title);
      setContent(activePage.content || '');
    }
  }, [activePage]);

  // Add Page triggers
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [isFolder, setIsFolder] = useState(false);

  // Mutations
  const createPageMutation = useCreatePage();
  const updatePageMutation = useUpdatePage();
  const deletePageMutation = useDeletePage();

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId || !newPageTitle) return;

    try {
      const res = await createPageMutation.mutateAsync({
        workspaceId: activeWorkspaceId,
        title: newPageTitle,
        isFolder,
        content: isFolder ? '' : '# Getting Started\n\nWrite content here...'
      });
      setShowAddModal(false);
      setNewPageTitle('');
      if (!isFolder && res.data?.page?._id) {
        setActivePageId(res.data.page._id);
      }
    } catch (err) {
      console.error('Failed to create page', err);
    }
  };

  const handleUpdatePage = async () => {
    if (!activePageId) return;
    try {
      await updatePageMutation.mutateAsync({
        id: activePageId,
        payload: { title, content }
      });
    } catch (err) {
      console.error('Failed to save page modifications', err);
    }
  };

  const handleDeletePage = async (pId: string) => {
    if (!activeWorkspaceId) return;
    try {
      await deletePageMutation.mutateAsync({ id: pId, workspaceId: activeWorkspaceId });
      if (activePageId === pId) {
        setActivePageId(null);
      }
    } catch (err) {
      console.error('Failed to delete page', err);
    }
  };

  if (isPagesError) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <ErrorState onRetry={refetchPages} message="Failed to load workspace files and directories." />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[80vh]">
      {/* Subpage Nav Drawer */}
      <div className="liquid-glass rounded-xl p-4 flex flex-col justify-between border border-white/5 bg-slate-950/40">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">WORKSPACE PAGES</span>
            <button 
              onClick={() => setShowAddModal(true)}
              className="p-1 rounded bg-white/5 border border-white/10 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white text-gray-400 transition cursor-pointer"
            >
              <Plus size={12} />
            </button>
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[60vh]">
            {isPagesLoading ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : pages.length > 0 ? (
              pages.map((p: any) => (
                <div 
                  key={p._id}
                  className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition ${
                    activePageId === p._id 
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                      : 'text-gray-400 border border-transparent hover:bg-white/2 hover:text-gray-200'
                  }`}
                  onClick={() => setActivePageId(p._id)}
                >
                  <div className="flex items-center gap-2 truncate">
                    {p.isFolder ? <Folder size={14} className="text-amber-400 shrink-0" /> : <File size={14} className="text-gray-400 shrink-0" />}
                    <span className="truncate">{p.title}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePage(p._id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-500 hover:text-red-400 cursor-pointer transition"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center text-[10px] text-gray-500 py-6">No workspace pages found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Editor & Wiki Previewer */}
      <div className="md:col-span-3 liquid-glass rounded-xl p-6 flex flex-col h-full overflow-hidden border border-white/5 bg-slate-950/40">
        {isActivePageLoading ? (
          <div className="space-y-4 h-full">
            <Skeleton className="h-8 w-1/3" />
            <div className="grid grid-cols-2 gap-4 flex-1 h-[50vh]">
              <Skeleton className="h-full w-full" />
              <Skeleton className="h-full w-full" />
            </div>
          </div>
        ) : activePageId && activePage ? (
          <div className="flex flex-col h-full space-y-4">
            {/* Action Bar */}
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <input
                type="text"
                className="bg-transparent text-lg font-bold text-white border-none outline-none focus:ring-0 w-3/4 font-sans"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <button
                onClick={handleUpdatePage}
                className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-indigo-500/10"
              >
                <Save size={13} /> Save Wiki
              </button>
            </div>

            {/* Split Editor and Markdown Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden h-[50vh]">
              {/* Write Side */}
              <div className="flex flex-col h-full">
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-2 font-sans">MARKDOWN CONTENT</span>
                <textarea
                  className="w-full glass-input text-xs font-mono flex-1 resize-none h-[40vh]"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="# Hello World&#10;&#10;Use standard markdown tags here."
                />
              </div>

              {/* Render Preview Side */}
              <div className="flex flex-col h-full border-l border-white/5 pl-4">
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-2 font-sans">RENDER PREVIEW</span>
                <div className="flex-1 bg-white/2 border border-white/5 rounded-lg p-4 text-xs overflow-y-auto prose prose-invert h-[40vh] leading-relaxed">
                  {content.split('\n').map((line, idx) => {
                    if (line.startsWith('# ')) {
                      return <h1 key={idx} className="text-base font-extrabold text-white mt-3 mb-2 font-sans">{line.replace('# ', '')}</h1>;
                    }
                    if (line.startsWith('## ')) {
                      return <h2 key={idx} className="text-sm font-bold text-indigo-400 mt-2 mb-1.5 font-sans">{line.replace('## ', '')}</h2>;
                    }
                    if (line.startsWith('- ')) {
                      return <li key={idx} className="ml-3 list-disc text-gray-300 font-sans">{line.replace('- ', '')}</li>;
                    }
                    return <p key={idx} className="text-gray-400 mt-1 font-sans">{line}</p>;
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <FileText size={32} className="text-gray-600 mb-2" />
            <h4 className="text-xs font-semibold">No active document selected</h4>
            <p className="text-[10px] text-gray-600 mt-1">Click the + icon in the wiki column to create a new page.</p>
          </div>
        )}
      </div>

      {/* Add Page Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="fixed inset-0" onClick={() => setShowAddModal(false)} />
          <form onSubmit={handleCreatePage} className="w-full max-w-sm liquid-glass p-6 rounded-xl relative z-10 space-y-4 border border-white/10 bg-slate-950">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Create Wiki Entry</h3>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Title</label>
              <input
                type="text"
                required
                placeholder="Product Strategy Roadmap"
                className="w-full glass-input text-xs"
                value={newPageTitle}
                onChange={(e) => setNewPageTitle(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                <input
                  type="radio"
                  name="type"
                  checked={!isFolder}
                  onChange={() => setIsFolder(false)}
                  className="accent-indigo-500"
                />
                Document Page
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                <input
                  type="radio"
                  name="type"
                  checked={isFolder}
                  onChange={() => setIsFolder(true)}
                  className="accent-indigo-500"
                />
                Folder Node
              </label>
            </div>
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold cursor-pointer"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default WorkspaceEditor;
