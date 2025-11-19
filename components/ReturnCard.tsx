
import React, { useRef, useState, useEffect } from 'react';
import { Trash2, Download, MoreVertical, Calendar, Edit2, Check, X, RotateCcw } from 'lucide-react';
import { ReturnItem } from '../types';
import * as htmlToImage from 'html-to-image';

interface ReturnCardProps {
  item: ReturnItem;
  onDelete: (id: string) => void;
  onUpdate?: (item: ReturnItem) => void;
  onRestore?: (id: string) => void;
  isModal?: boolean;
  isTrash?: boolean;
}

export const ReturnCard: React.FC<ReturnCardProps> = ({ item, onDelete, onUpdate, onRestore, isModal = false, isTrash = false }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editDesc, setEditDesc] = useState(item.description);

  useEffect(() => {
    if (!isEditing) {
      setEditTitle(item.title);
      setEditDesc(item.description);
    }
  }, [item, isEditing]);

  const handleDownload = async () => {
    if (!exportRef.current) return;
    setIsDownloading(true);
    setShowDropdown(false);
    try {
      const dataUrl = await htmlToImage.toPng(exportRef.current, { 
        quality: 1.0,
        backgroundColor: '#0f172a'
      });
      const link = document.createElement('a');
      link.download = `return-${item.title.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download card', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = () => {
    setShowDropdown(false);
    const message = isTrash 
      ? "Are you sure you want to permanently delete this item? This cannot be undone."
      : "Are you sure you want to move this item to Recently Deleted?";
      
    if (window.confirm(message)) {
      onDelete(item.id);
    }
  };

  const handleRestore = () => {
    setShowDropdown(false);
    if (onRestore) {
      if (window.confirm("Restore this item to Storage?")) {
        onRestore(item.id);
      }
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowDropdown(false);
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate({
        ...item,
        title: editTitle,
        description: editDesc
      });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(item.title);
    setEditDesc(item.description);
    setIsEditing(false);
  };

  return (
    <div className="relative group h-full">
      {/* Card UI */}
      <div 
        ref={cardRef}
        className={`
          glass-panel rounded-[2rem] overflow-hidden flex flex-col h-full border border-white/5 bg-[#131c2e]/80
          ${!isModal && !isEditing ? 'transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)]' : ''}
          ${isEditing ? 'ring-2 ring-white/10 bg-[#1a2436]' : ''}
          ${isTrash ? 'opacity-90 grayscale-[20%]' : ''}
        `}
      >
        {/* Image Section */}
        <div className="relative h-64 overflow-hidden p-2 shrink-0">
          <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative bg-black/40">
             <img 
               src={item.imageUrl} 
               alt={item.title} 
               className={`w-full h-full object-contain transition-transform duration-700 ${!isModal ? 'group-hover:scale-110' : ''}`}
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
             
             <div className="absolute bottom-3 left-4">
               <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-white/10 shadow-lg bg-white/10 text-white">
                 <Calendar className="w-3 h-3" />
                 {new Date(item.timestamp).toLocaleString('default', { month: 'long' }).toUpperCase()} {new Date(item.timestamp).getFullYear()}
               </span>
             </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-8 pb-8 pt-4 flex-1 flex flex-col">
          
          {/* Header / Edit Mode Header */}
          <div className="flex justify-between items-start mb-4">
             {isEditing ? (
               <div className="w-full mr-10">
                 <input 
                   type="text"
                   value={editTitle}
                   onChange={(e) => setEditTitle(e.target.value)}
                   className="w-full glass-input text-xl font-bold rounded-lg px-3 py-2 bg-black/30 border border-white/20 focus:border-white/40"
                   placeholder="Enter title"
                 />
               </div>
             ) : (
               <h3 className="text-2xl font-bold text-white tracking-tight leading-snug pr-10">{item.title}</h3>
             )}
          </div>
          
          {/* Description / Edit Mode Description */}
          {isEditing ? (
             <textarea 
               value={editDesc}
               onChange={(e) => setEditDesc(e.target.value)}
               className="w-full flex-1 glass-input text-sm rounded-lg px-3 py-2 bg-black/30 border border-white/20 focus:border-white/40 resize-none mb-4"
               rows={5}
               placeholder="Enter description"
             />
          ) : (
             <p className="text-gray-400 mb-6 flex-1 leading-relaxed text-sm overflow-y-auto max-h-[200px] scrollbar-thin">
               {item.description}
             </p>
          )}

          {/* Action Buttons for Edit Mode */}
          {isEditing && (
            <div className="flex gap-3 mb-4 animate-in fade-in slide-in-from-bottom-2">
              <button 
                onClick={handleSave}
                className="flex-1 bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 py-2 rounded-full flex items-center justify-center gap-2 font-medium transition-colors"
              >
                <Check className="w-4 h-4" /> Save
              </button>
              <button 
                onClick={handleCancelEdit}
                className="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 py-2 rounded-full flex items-center justify-center gap-2 font-medium transition-colors"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          )}

          {/* Footer Meta */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-medium text-gray-500 mt-auto">
             <div className="flex items-center gap-2">
               <Calendar className="w-4 h-4 text-gray-600" />
               {new Date(item.timestamp).toLocaleDateString()}
             </div>
             <span className="font-mono opacity-50">ID: #{item.id.slice(0,6)}</span>
          </div>
        </div>
      </div>

      {/* Dropdown Menu - Hidden during Edit */}
      {!isEditing && (
        <div className="absolute top-5 right-5 z-20">
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
              className="p-2.5 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all shadow-lg"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-3 w-44 glass-panel rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right z-50 border border-white/10 bg-[#1e293b]">
                
                {/* Actions for Normal Storage Item */}
                {!isTrash && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleEdit(); }}
                    className="w-full px-5 py-3 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-3 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                )}

                {/* Actions for Trash Item */}
                {isTrash && onRestore && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleRestore(); }}
                    className="w-full px-5 py-3 text-left text-sm text-green-400 hover:bg-green-500/10 hover:text-green-300 flex items-center gap-3 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restore
                  </button>
                )}

                {/* Common Actions */}
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                  disabled={isDownloading}
                  className="w-full px-5 py-3 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-3 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Save Card
                </button>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                  className="w-full px-5 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-3 transition-colors border-t border-white/5"
                >
                  <Trash2 className="w-4 h-4" />
                  {isTrash ? 'Delete Forever' : 'Delete'}
                </button>
              </div>
            )}
          </div>
          {/* Click-away backdrop */}
          {showDropdown && (
            <div className="fixed inset-0 z-0" onClick={(e) => { e.stopPropagation(); setShowDropdown(false); }} />
          )}
        </div>
      )}

      {/* HIDDEN EXPORT VIEW */}
      <div className="fixed -left-[9999px] top-0">
          <div 
            ref={exportRef}
            className="w-[600px] bg-[#0f172a] text-white rounded-none overflow-hidden flex flex-col"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <div className="bg-[#1e293b] p-6 flex justify-between items-center border-b border-gray-700">
                <h1 className="text-xl font-bold text-gray-200 tracking-wider">RETURN RECEIPT</h1>
                <div className="text-right">
                    <p className="text-xs text-gray-500">GENERATED ON</p>
                    <p className="text-sm font-mono">{new Date().toLocaleDateString()}</p>
                </div>
            </div>
            <div className="relative w-full bg-black p-4 flex items-center justify-center">
                <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full h-auto max-h-[800px] object-contain rounded-lg border border-gray-800" 
                />
            </div>
            <div className="p-8 bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">ITEM NAME</p>
                        <h2 className="text-2xl font-bold text-white">{item.title}</h2>
                    </div>
                    <div className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-gray-300">
                        <span className="text-sm font-bold tracking-wider uppercase">
                          {new Date(item.timestamp).toLocaleString('default', { month: 'long' })} {new Date(item.timestamp).getFullYear()}
                        </span>
                    </div>
                </div>
                <div className="mb-8">
                     <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">CONDITION / DESCRIPTION</p>
                     <p className="text-gray-300 leading-relaxed text-lg">{item.description}</p>
                </div>
                <div className="border-t border-gray-700 pt-6 flex justify-between items-end">
                    <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">RETURN ID</p>
                        <p className="font-mono text-gray-400">#{item.id}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">ORIGINAL UPLOAD DATE</p>
                        <p className="font-mono text-gray-400 text-right">{new Date(item.timestamp).toLocaleString()}</p>
                    </div>
                </div>
                <div className="mt-8 flex items-center gap-2 opacity-30">
                   <div className="w-6 h-6 bg-white rounded-md"></div>
                   <span className="font-bold text-lg tracking-tighter">ReturnOS</span>
                </div>
            </div>
          </div>
      </div>

    </div>
  );
};
