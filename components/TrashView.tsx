
import React, { useState } from 'react';
import { ReturnItem } from '../types';
import { ReturnCard } from './ReturnCard';
import { Search, Trash2, Calendar, ChevronRight, X, AlertTriangle, RefreshCcw, RotateCcw } from 'lucide-react';

interface TrashViewProps {
  items: ReturnItem[];
  onRestore: (id: string) => void;
  onDeleteForever: (id: string) => void;
  onRestoreAll: () => void;
  onEmptyTrash: () => void;
}

export const TrashView: React.FC<TrashViewProps> = ({ items, onRestore, onDeleteForever, onRestoreAll, onEmptyTrash }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<ReturnItem | null>(null);

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleItemClick = (item: ReturnItem) => {
    setSelectedItem(item);
  };

  const handleDeleteForever = (id: string) => {
    onDeleteForever(id);
    setSelectedItem(null);
  };

  const handleRestore = (id: string) => {
    onRestore(id);
    setSelectedItem(null);
  };

  const confirmEmptyTrash = () => {
    if (window.confirm('Are you sure you want to permanently delete ALL items in the trash? This cannot be undone.')) {
      onEmptyTrash();
    }
  };

  const confirmRestoreAll = () => {
     if (window.confirm('Restore all items to Storage?')) {
      onRestoreAll();
    }
  };

  return (
    <div className="w-full animate-in fade-in duration-500">
       <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
               <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Recently Deleted</h2>
          </div>
          <p className="text-gray-400 ml-1">Restore items or permanently remove them.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
            {items.length > 0 && (
                <>
                    <button 
                        onClick={confirmRestoreAll}
                        className="flex items-center gap-2 px-4 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-green-500/20 hover:text-green-300 hover:border-green-500/30 transition-all text-sm font-medium"
                    >
                        <RotateCcw className="w-4 h-4" /> Restore All
                    </button>
                    <button 
                        onClick={confirmEmptyTrash}
                        className="flex items-center gap-2 px-4 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 transition-all text-sm font-medium"
                    >
                        <Trash2 className="w-4 h-4" /> Empty Trash
                    </button>
                </>
            )}
        </div>
      </header>

      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 glass-panel rounded-[3rem] border-dashed border-2 border-white/10">
          <div className="w-24 h-24 rounded-full bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center mb-6 shadow-inner">
            <Trash2 className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-300">Trash is empty</h3>
          <p className="text-gray-500 mt-2 max-w-md text-center">
            Deleted items will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              onClick={() => handleItemClick(item)}
              className="group w-full p-3 pr-6 rounded-2xl glass-panel border border-white/5 hover:bg-white/5 transition-all duration-300 cursor-pointer flex items-center gap-5 hover:border-red-500/30 hover:translate-x-1 opacity-80 hover:opacity-100"
            >
               {/* Thumbnail */}
               <div className="w-16 h-16 rounded-xl bg-black/30 overflow-hidden shrink-0 border border-white/10 relative grayscale">
                 <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
               </div>

               {/* Content */}
               <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-300 line-through decoration-red-500/50 truncate group-hover:text-white transition-colors">{item.title}</h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {new Date(item.timestamp).toLocaleDateString()}</span>
                    <span className="hidden sm:inline truncate max-w-[200px] opacity-60">Deleted</span>
                  </div>
               </div>

               <div className="text-gray-600 group-hover:text-white transition-colors">
                 <ChevronRight className="w-5 h-5" />
               </div>
            </div>
          ))}
        </div>
      )}

      {/* EXPANDED MODAL VIEW */}
      {selectedItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="w-full max-w-xl h-[85vh] relative animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute -top-3 -right-3 z-50 p-2 rounded-full bg-white/10 text-white border border-white/20 hover:bg-red-500/20 hover:border-red-500/40 transition-colors shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="h-full border-4 border-red-500/20 rounded-[2.2rem]">
                <ReturnCard 
                  item={selectedItem} 
                  onDelete={handleDeleteForever} 
                  onRestore={handleRestore}
                  isModal={true}
                  isTrash={true}
                />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
