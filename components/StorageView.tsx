
import React, { useState, useMemo } from 'react';
import { ReturnItem } from '../types';
import { ReturnCard } from './ReturnCard';
import { Search, ArchiveX, Archive, Calendar, ChevronRight, X, Clock } from 'lucide-react';

interface StorageViewProps {
  items: ReturnItem[];
  onDelete: (id: string) => void;
  onUpdate?: (item: ReturnItem) => void;
}

export const StorageView: React.FC<StorageViewProps> = ({ items, onDelete, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<ReturnItem | null>(null);

  // 1. Filter Items
  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  // 2. Group Items by Month -> Week
  const groupedData = useMemo(() => {
    const groups: { [key: string]: { timestamp: number; weeks: { [key: string]: { timestamp: number; items: ReturnItem[] } } } } = {};

    filteredItems.forEach(item => {
      const date = new Date(item.timestamp);
      
      // Month Key (e.g., "March 2024")
      const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      // First day of month timestamp for sorting
      const monthTs = new Date(date.getFullYear(), date.getMonth(), 1).getTime();

      // Week Key (Start of week - Sunday)
      const d = new Date(item.timestamp);
      const day = d.getDay(); // 0 is Sunday
      const diff = d.getDate() - day;
      const weekStart = new Date(d.setDate(diff));
      weekStart.setHours(0,0,0,0);
      
      const weekKey = `Week of ${weekStart.toLocaleString('default', { month: 'short' })} ${weekStart.getDate()}`;
      
      if (!groups[monthKey]) {
        groups[monthKey] = { timestamp: monthTs, weeks: {} };
      }
      if (!groups[monthKey].weeks[weekKey]) {
        groups[monthKey].weeks[weekKey] = { timestamp: weekStart.getTime(), items: [] };
      }
      groups[monthKey].weeks[weekKey].items.push(item);
    });

    // Sort Months Descending
    return Object.entries(groups)
      .sort(([, a], [, b]) => b.timestamp - a.timestamp)
      .map(([monthName, monthData]) => {
        // Sort Weeks Descending
        const sortedWeeks = Object.entries(monthData.weeks)
          .sort(([, a], [, b]) => b.timestamp - a.timestamp)
          .map(([weekName, weekData]) => ({
            title: weekName,
            items: weekData.items.sort((a, b) => b.timestamp - a.timestamp)
          }));
        
        return {
          title: monthName,
          weeks: sortedWeeks
        };
      });
  }, [filteredItems]);

  const handleDelete = (id: string) => {
    onDelete(id);
    setSelectedItem(null);
  };

  return (
    <div className="w-full animate-in fade-in duration-500 pb-20">
       <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
               <Archive className="w-6 h-6 text-gray-300" />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Storage Archive</h2>
          </div>
          <p className="text-gray-400 ml-1">Manage your digital return proofs permanently.</p>
        </div>
        
        <div className="relative group w-full md:w-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500 group-focus-within:text-white transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search returns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-80 pl-11 pr-5 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all shadow-lg"
          />
        </div>
      </header>

      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 glass-panel rounded-[3rem] border-dashed border-2 border-white/10">
          <div className="w-24 h-24 rounded-full bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center mb-6 shadow-inner">
            <ArchiveX className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-300">No records found</h3>
          <p className="text-gray-500 mt-2 max-w-md text-center">
            {items.length === 0 ? "You haven't submitted any returns yet. Go to the Dashboard to add one." : "No items match your search criteria."}
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {groupedData.map((monthGroup) => (
            <div key={monthGroup.title} className="relative">
              
              {/* Sticky Month Header */}
              <div className="sticky top-0 z-20 bg-[#111827]/80 backdrop-blur-xl py-3 mb-4 -mx-2 px-2 border-b border-white/5 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                <h3 className="text-xl font-bold text-blue-100 tracking-wide">{monthGroup.title}</h3>
              </div>

              <div className="space-y-8">
                {monthGroup.weeks.map((weekGroup) => (
                  <div key={weekGroup.title} className="pl-4 border-l border-white/10 ml-1">
                    {/* Week Header */}
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Clock className="w-3 h-3" /> {weekGroup.title}
                    </h4>
                    
                    {/* Items Grid/List */}
                    <div className="flex flex-col gap-3">
                      {weekGroup.items.map((item) => (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedItem(item)}
                          className="group w-full p-3 pr-6 rounded-2xl glass-panel border border-white/5 hover:bg-white/5 transition-all duration-300 cursor-pointer flex items-center gap-5 hover:border-white/20 hover:translate-x-1"
                        >
                          {/* Thumbnail */}
                          <div className="w-16 h-16 rounded-xl bg-black/30 overflow-hidden shrink-0 border border-white/10 relative">
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-white truncate group-hover:text-blue-200 transition-colors">{item.title}</h3>
                              <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                                <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {new Date(item.timestamp).toLocaleDateString()}</span>
                                <span className="hidden sm:inline truncate max-w-[200px] opacity-60">{item.description}</span>
                              </div>
                          </div>

                          {/* Month Badge (Hidden on mobile as header exists) */}
                          <div className="hidden sm:flex items-center">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border bg-white/5 text-gray-300 border-white/10">
                                {new Date(item.timestamp).toLocaleString('default', { month: 'short' }).toUpperCase()}
                              </span>
                          </div>

                          <div className="text-gray-600 group-hover:text-white transition-colors">
                            <ChevronRight className="w-5 h-5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
            
            <ReturnCard 
              item={selectedItem} 
              onDelete={handleDelete} 
              onUpdate={onUpdate}
              isModal={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};
