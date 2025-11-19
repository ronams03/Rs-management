
import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { StorageView } from './components/StorageView';
import { TrashView } from './components/TrashView';
import { Auth } from './components/Auth';
import { ReturnItem, ViewState, User } from './types';
import { Menu, Code, Heart, Download, Upload, Database, ShieldCheck, RefreshCw, Cloud } from 'lucide-react';
import { storageService } from './services/storage';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [trashItems, setTrashItems] = useState<ReturnItem[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Settings State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Check for active session on mount
  useEffect(() => {
    const session = storageService.getSession();
    if (session) {
      setUser(session);
    }
  }, []);

  // Load user-specific items when user changes
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        setIsLoadingData(true);
        try {
          const userItems = await storageService.getItems(user.email);
          setItems(userItems);
          
          // Load trash if needed (or just preload it)
          const userTrash = await storageService.getTrash(user.email);
          setTrashItems(userTrash);
        } catch (e) {
          console.error("Failed to load data", e);
        } finally {
          setIsLoadingData(false);
        }
      } else {
        setItems([]);
        setTrashItems([]);
      }
    };
    loadData();
  }, [user]); // Removed currentView dependency to fix optimistic update race condition

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    await storageService.logout();
    setUser(null);
    setItems([]);
    setTrashItems([]);
    setCurrentView('dashboard');
  };

  const handleAddReturn = async (newItem: ReturnItem) => {
    if (!user) return;
    // Optimistic update
    setItems(prev => [newItem, ...prev]);
    setCurrentView('storage');
    // Persist
    try {
      await storageService.saveItem(user.email, newItem);
    } catch (e) {
      console.error("Failed to save item", e);
    }
  };

  // Soft delete (Move to Trash)
  const handleSoftDelete = async (id: string) => {
    if (!user) return;
    const itemToDelete = items.find(i => i.id === id);
    if (itemToDelete) {
      setItems(prev => prev.filter(item => item.id !== id));
      setTrashItems(prev => [itemToDelete, ...prev]);
      try {
        await storageService.softDelete(user.email, id);
      } catch (e) {
        console.error("Failed to soft delete item", e);
      }
    }
  };

  // Update Item
  const handleUpdateReturn = async (updatedItem: ReturnItem) => {
    if (!user) return;
    setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    try {
      await storageService.updateItem(user.email, updatedItem);
    } catch (e) {
      console.error("Failed to update item", e);
    }
  };

  // TRASH ACTIONS
  const handleRestore = async (id: string) => {
    if (!user) return;
    const itemToRestore = trashItems.find(i => i.id === id);
    if (itemToRestore) {
        setTrashItems(prev => prev.filter(i => i.id !== id));
        setItems(prev => [itemToRestore, ...prev]);
        try {
            await storageService.restore(user.email, id);
        } catch (e) {
            console.error("Failed to restore", e);
        }
    }
  };

  const handleRestoreAll = async () => {
    if (!user) return;
    setItems(prev => [...prev, ...trashItems]);
    setTrashItems([]);
    try {
        await storageService.restoreAll(user.email);
    } catch (e) {
        console.error("Failed to restore all", e);
    }
  };

  const handlePermDelete = async (id: string) => {
    if (!user) return;
    setTrashItems(prev => prev.filter(i => i.id !== id));
    try {
        await storageService.permanentDelete(user.email, id);
    } catch (e) {
        console.error("Failed to permanently delete", e);
    }
  };

  const handleEmptyTrash = async () => {
    if (!user) return;
    setTrashItems([]);
    try {
        await storageService.emptyTrash(user.email);
    } catch (e) {
        console.error("Failed to empty trash", e);
    }
  };


  // Export Logic
  const handleExportData = () => {
    if (!user) return;
    const jsonString = storageService.exportData(user.email);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ReturnOS_Backup_${user.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import Logic
  const handleImportClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonString = event.target?.result as string;
        const result = await storageService.importData(user.email, jsonString);
        
        if (result.success) {
          setImportStatus({ type: 'success', msg: result.message });
          // Refresh data
          const updatedItems = await storageService.getItems(user.email);
          setItems(updatedItems);
        } else {
          setImportStatus({ type: 'error', msg: result.message });
        }
      } catch (err) {
        setImportStatus({ type: 'error', msg: 'Failed to read file' });
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black text-slate-200">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-20 glass-panel z-40 flex items-center px-6 justify-between border-b border-white/10 bg-gray-900/80">
        <div className="font-bold text-xl text-white tracking-tight">ReturnOS</div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
        >
          <Menu />
        </button>
      </div>

      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        isMobileOpen={isMobileMenuOpen}
        toggleMobile={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        user={user}
        onLogout={handleLogout}
      />

      <main className="flex-1 min-w-0 h-screen overflow-y-auto pt-24 lg:pt-0">
        <div className="max-w-[1600px] mx-auto p-6 lg:p-12">
          
          {currentView === 'dashboard' && (
            <Dashboard onAddReturn={handleAddReturn} user={user} />
          )}

          {currentView === 'storage' && (
            <>
              {isLoadingData ? (
                <div className="flex items-center justify-center h-96">
                   <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
              ) : (
                <StorageView 
                  items={items} 
                  onDelete={handleSoftDelete} 
                  onUpdate={handleUpdateReturn}
                />
              )}
            </>
          )}

          {currentView === 'trash' && (
            <TrashView 
              items={trashItems}
              onRestore={handleRestore}
              onDeleteForever={handlePermDelete}
              onRestoreAll={handleRestoreAll}
              onEmptyTrash={handleEmptyTrash}
            />
          )}

          {currentView === 'settings' && (
             <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
               <h2 className="text-4xl font-bold text-white mb-8 flex items-center gap-4">
                 <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                   <Code className="w-8 h-8" />
                 </div>
                 System Settings
               </h2>

               <div className="grid gap-8">
                 {/* Profile Card */}
                 <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">User Profile</h3>
                        <p className="text-gray-400 text-sm">Manage your account identity.</p>
                      </div>
                      <ShieldCheck className="w-6 h-6 text-green-400" />
                    </div>
                    
                    <div className="mt-6 space-y-4 relative z-10">
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/20 border border-white/5">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-600 to-gray-500 flex items-center justify-center text-white font-bold">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-bold">Full Name</p>
                          <p className="text-white font-medium">{user.fullName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/20 border border-white/5">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                          @
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-bold">Email Address</p>
                          <p className="text-white font-medium">{user.email}</p>
                        </div>
                      </div>
                    </div>
                 </div>

                 {/* Data Portability Card */}
                 <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden bg-gradient-to-br from-white/[0.02] to-transparent">
                    <div className="flex items-start justify-between relative z-10 mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                           Data Management <Cloud className="w-4 h-4 text-blue-300" />
                        </h3>
                        <p className="text-gray-400 text-sm max-w-lg">
                          Transfer your returns data between devices using secure backup files.
                        </p>
                      </div>
                      <Database className="w-6 h-6 text-blue-400" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 relative z-10">
                       <button 
                         onClick={handleExportData}
                         className="group relative p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left overflow-hidden"
                       >
                         <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                         <Download className="w-8 h-8 text-blue-300 mb-4" />
                         <h4 className="text-lg font-bold text-white mb-1">Backup Data</h4>
                         <p className="text-xs text-gray-400">Download a secure JSON file of all your return records to this device.</p>
                       </button>

                       <button 
                         onClick={handleImportClick}
                         className="group relative p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left overflow-hidden"
                       >
                         <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                         <Upload className="w-8 h-8 text-green-300 mb-4" />
                         <h4 className="text-lg font-bold text-white mb-1">Restore Data</h4>
                         <p className="text-xs text-gray-400">Import a backup file to restore your records on this device.</p>
                       </button>
                    </div>

                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".json" 
                      onChange={handleFileImport} 
                      className="hidden" 
                    />

                    {importStatus && (
                      <div className={`mt-6 p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2
                        ${importStatus.type === 'success' 
                          ? 'bg-green-500/10 border-green-500/20 text-green-300' 
                          : 'bg-red-500/10 border-red-500/20 text-red-300'}
                      `}>
                         {importStatus.type === 'success' ? <ShieldCheck className="w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
                         <span className="text-sm font-medium">{importStatus.msg}</span>
                         <button onClick={() => setImportStatus(null)} className="ml-auto opacity-50 hover:opacity-100">✕</button>
                      </div>
                    )}
                 </div>
               </div>
             </div>
          )}

          {currentView === 'about' && (
             <div className="glass-panel p-10 rounded-[3rem] flex flex-col items-center justify-center text-center min-h-[600px] animate-in fade-in zoom-in-95 border border-white/5 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
                   <div className="absolute top-10 right-10 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]"></div>
                   <div className="absolute bottom-10 left-10 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px]"></div>
               </div>

               <div className="w-32 h-32 rounded-full bg-gradient-to-br from-white to-gray-300 flex items-center justify-center mb-8 border-4 border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.15)] relative z-10">
                 <Code className="w-12 h-12 text-gray-800" />
               </div>
               
               <h2 className="text-4xl font-bold text-white mb-2 relative z-10">ReturnOS</h2>
               <div className="px-5 py-1.5 bg-white/10 rounded-full mb-8 border border-white/5 relative z-10 shadow-inner">
                   <span className="text-xs font-bold tracking-widest text-gray-300 uppercase">Developed by Namoc Roberth</span>
               </div>

               <div className="max-w-2xl relative z-10">
                   <div className="bg-black/20 p-8 rounded-3xl border border-white/5 backdrop-blur-sm">
                       <Heart className="w-8 h-8 text-red-400 mx-auto mb-4" />
                       <p className="text-gray-300 text-lg leading-relaxed italic">
                         "I developed this because most of the scholars were forgetful to save the proof of their return service."
                       </p>
                       <div className="mt-6 pt-6 border-t border-white/10">
                           <p className="text-sm text-gray-500">
                               Ensuring every return service is documented, stored safely, and easily accessible forever.
                           </p>
                       </div>
                   </div>
               </div>
             </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
