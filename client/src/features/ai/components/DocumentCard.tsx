import React from 'react';
import { FileText, ExternalLink, Sparkles } from 'lucide-react';

interface DocumentCardProps {
  documentName: string;
  similarityScore: number; // 0 to 100
  onViewSource?: () => void;
  onOpenDocument?: () => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  documentName,
  similarityScore,
  onViewSource,
  onOpenDocument
}) => {
  return (
    <div className="bg-slate-900/60 backdrop-blur-sm border border-white/5 p-4 rounded-xl hover:border-white/10 transition space-y-3 text-xs font-sans w-full max-w-sm text-left">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
          <FileText size={15} />
        </div>
        <div className="truncate flex-1">
          <h4 className="font-extrabold text-white truncate leading-tight">{documentName}</h4>
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block mt-0.5">RAG Retrieved Source</span>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white/2 border border-white/5 p-2 rounded-lg text-[10px] select-none">
        <span className="text-gray-400 font-semibold flex items-center gap-1">
          <Sparkles size={10} className="text-indigo-400" /> AI Semantic Fit
        </span>
        <span className="text-indigo-400 font-black">{similarityScore}% Match</span>
      </div>

      <div className="flex justify-end gap-1.5 pt-1.5 border-t border-white/5">
        {onViewSource && (
          <button onClick={onViewSource} className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded font-bold transition cursor-pointer text-[9px] uppercase tracking-wider flex items-center gap-1 border border-white/5">
            Source <ExternalLink size={8} />
          </button>
        )}
        {onOpenDocument && (
          <button onClick={onOpenDocument} className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold transition cursor-pointer text-[9px] uppercase tracking-wider">
            Open File
          </button>
        )}
      </div>
    </div>
  );
};
export default DocumentCard;
