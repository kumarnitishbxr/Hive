import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { workspaceService } from '../../services/api';
import { File, Folder, Plus, Save, Trash2, ChevronRight, FileText } from 'lucide-react';

export const WorkspaceEditor: React.FC = () => {
  const auth = useSelector((state: RootState) => state.auth);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  
  const [pages, setPages] = useState<any[]>([]);
  const [activePage, setActivePage] = useState<any>(null);

  // Editor Inputs
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Add Page triggers
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [isFolder, setIsFolder] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const res = await workspaceService.getWorkspaces();
      setWorkspaces(res.data.workspaces);
      if (res.data.workspaces.length > 0) {
        setActiveWorkspaceId(res.data.workspaces[0]._id);
        fetchPages(res.data.workspaces[0]._id);
      }
    } catch (err) {
      console.error('Failed to retrieve workspaces list', err);
    }
  };

  const fetchPages = async (wId: string) => {
    try {
      const res = await workspaceService.getPages(wId);
      setPages(res.data.pages);
      // Auto select first page
      if (res.data.pages.length > 0) {
        loadPageDetails(res.data.pages[0]._id);
      } else {
        setActivePage(null);
      }
    } catch (err) {
      console.error('Failed to load subpages', err);
    }
  };

  const loadPageDetails = async (pId: string) => {
    try {
      const res = await workspaceService.getPage(pId);
      setActivePage(res.data.page);
      setTitle(res.data.page.title);
      setContent(res.data.page.content);
    } catch (err) {
      console.error('Failed to load page content details', err);
    }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId || !newPageTitle) return;

    try {
      const res = await workspaceService.createPage({
        workspaceId: activeWorkspaceId,
        title: newPageTitle,
        isFolder,
        content: isFolder ? '' : '# Getting Started\n\nWrite content here...'
      });
      setShowAddModal(false);
      setNewPageTitle('');
      fetchPages(activeWorkspaceId);
      if (!isFolder) {
        loadPageDetails(res.data.page._id);
      }
    } catch (err) {
      console.error('Failed to create page', err);
    }
  };

  const handleUpdatePage = async () => {
    if (!activePage) return;
    try {
      const res = await workspaceService.updatePage(activePage._id, { title, content });
      setActivePage(res.data.page);
      // Reload pages tree
      if (activeWorkspaceId) fetchPages(activeWorkspaceId);
    } catch (err) {
      console.error('Failed to save page modifications', err);
    }
  };

  const handleDeletePage = async (pId: string) => {
    try {
      await workspaceService.deletePage(pId);
      if (activeWorkspaceId) fetchPages(activeWorkspaceId);
    } catch (err) {
      console.error('Failed to delete page', err);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[80vh]">
      {/* Subpage Nav Drawer */}
      <div className="liquid-glass rounded-xl p-4 flex flex-col justify-between">
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
            {pages.length > 0 ? (
              pages.map((p) => (
                <div 
                  key={p._id}
                  className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition ${
                    activePage?._id === p._id 
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                      : 'text-gray-400 border border-transparent hover:bg-white/2 hover:text-gray-200'
                  }`}
                  onClick={() => loadPageDetails(p._id)}
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
      <div className="md:col-span-3 liquid-glass rounded-xl p-6 flex flex-col h-full overflow-hidden">
        {activePage ? (
          <div className="flex flex-col h-full space-y-4">
            {/* Action Bar */}
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <input
                type="text"
                className="bg-transparent text-lg font-bold text-white border-none outline-none focus:ring-0 w-3/4"
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
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-2">MARKDOWN CONTENT</span>
                <textarea
                  className="w-full glass-input text-xs font-mono flex-1 resize-none h-[40vh]"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="# Hello World&#10;&#10;Use standard markdown tags here."
                />
              </div>

              {/* Render Preview Side */}
              <div className="flex flex-col h-full border-l border-white/5 pl-4">
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-2">RENDER PREVIEW</span>
                <div className="flex-1 bg-white/2 border border-white/5 rounded-lg p-4 text-xs overflow-y-auto prose prose-invert h-[40vh] leading-relaxed">
                  {/* Basic Render helper to parse headings, bold, bullet points */}
                  {content.split('\n').map((line, idx) => {
                    if (line.startsWith('# ')) {
                      return <h1 key={idx} className="text-base font-extrabold text-white mt-3 mb-2">{line.replace('# ', '')}</h1>;
                    }
                    if (line.startsWith('## ')) {
                      return <h2 key={idx} className="text-sm font-bold text-indigo-400 mt-2 mb-1.5">{line.replace('## ', '')}</h2>;
                    }
                    if (line.startsWith('- ')) {
                      return <li key={idx} className="ml-3 list-disc text-gray-300">{line.replace('- ', '')}</li>;
                    }
                    return <p key={idx} className="text-gray-400 mt-1">{line}</p>;
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
          <form onSubmit={handleCreatePage} className="w-full max-w-sm liquid-glass p-6 rounded-xl relative z-10 space-y-4">
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
