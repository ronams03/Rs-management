
import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Check, Cloud } from 'lucide-react';
import { ReturnItem, User } from '../types';
import { storageService } from '../services/storage';

interface DashboardProps {
  onAddReturn: (item: ReturnItem) => void;
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ onAddReturn, user }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<{ base64: string, mimeType: string } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load draft on mount
  useEffect(() => {
    const draft = storageService.getDraft(user.email);
    if (draft) {
      if (draft.title) setTitle(draft.title);
      if (draft.description) setDescription(draft.description);
      if (draft.imagePreview) setImagePreview(draft.imagePreview);
      if (draft.imageData) setImageData(draft.imageData);
      setSaveStatus('saved');
    }
    setIsDraftLoaded(true);
  }, [user.email]);

  // Auto-save draft with debounce
  useEffect(() => {
    if (!isDraftLoaded) return;

    // Don't save if empty (unless user explicitly cleared it)
    if (!title && !description && !imagePreview) {
      setSaveStatus('idle');
      return;
    }

    setSaveStatus('saving');
    const timer = setTimeout(() => {
      const draftData = {
        title,
        description,
        imagePreview,
        imageData
      };
      try {
        storageService.saveDraft(user.email, draftData);
        setSaveStatus('saved');
      } catch (e) {
        console.warn("Draft storage limit exceeded");
        setSaveStatus('idle');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, description, imagePreview, imageData, isDraftLoaded, user.email]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        
        // Extract pure base64 and mime type
        const base64 = result.split(',')[1];
        const mimeType = file.type;
        setImageData({ base64, mimeType });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearDraft = () => {
    storageService.clearDraft(user.email);
    setSaveStatus('idle');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !imagePreview) return;

    setIsSubmitting(true);
    // Simulate network delay for "shiny" UX
    setTimeout(() => {
      const newItem: ReturnItem = {
        id: Date.now().toString(36).toUpperCase(),
        title,
        description,
        imageUrl: imagePreview,
        timestamp: Date.now()
      };
      onAddReturn(newItem);
      
      // Reset form
      setTitle('');
      setDescription('');
      setImagePreview(null);
      setImageData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      clearDraft();
      setIsSubmitting(false);
    }, 800);
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Welcome, {user.fullName}</h1>
          <p className="text-gray-400">Upload proof of service below to digitize your return record.</p>
        </div>
        {/* Mobile-friendly status indicator for draft */}
        <div className="hidden sm:block">
          {saveStatus === 'saving' && (
            <span className="text-xs font-medium text-gray-500 flex items-center gap-2 animate-pulse bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <Cloud className="w-3 h-3" /> Saving draft...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs font-medium text-green-500/70 flex items-center gap-2 animate-in fade-in bg-green-500/5 px-3 py-1.5 rounded-full border border-green-500/10">
              <Check className="w-3 h-3" /> Draft saved
            </span>
          )}
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Left Column: Upload Area */}
        <div className="space-y-6">
           <div 
             className={`
               relative w-full aspect-[4/3] rounded-[2rem] border-2 border-dashed transition-all duration-300
               flex flex-col items-center justify-center overflow-hidden group shadow-2xl
               ${imagePreview 
                 ? 'border-white/10 bg-black/40' 
                 : 'border-gray-600 hover:border-white/40 hover:bg-white/5 bg-white/[0.02]'}
             `}
           >
             {imagePreview ? (
               <>
                 <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-6" />
                 <button 
                   onClick={clearImage}
                   className="absolute top-4 right-4 p-3 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-red-500/80 transition-colors border border-white/10"
                 >
                   <X className="w-5 h-5" />
                 </button>
               </>
             ) : (
               <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                 <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)] group-hover:scale-110 transition-transform duration-300 border border-white/10">
                   <Upload className="w-8 h-8 text-gray-300" />
                 </div>
                 <p className="text-xl font-medium text-gray-200">Upload Proof</p>
                 <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 5MB</p>
                 <input 
                   ref={fileInputRef}
                   type="file" 
                   accept="image/*" 
                   onChange={handleFileChange} 
                   className="hidden" 
                 />
               </label>
             )}
           </div>
        </div>

        {/* Right Column: Form Details */}
        <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-[2.5rem] flex flex-col gap-6 h-fit border border-white/10 shadow-2xl bg-gradient-to-b from-white/[0.04] to-transparent">
          
          {/* Mobile Status Indicator (visible only on small screens) */}
          <div className="flex sm:hidden justify-end mb-[-10px]">
             {saveStatus === 'saved' && <span className="text-[10px] text-green-500/70 flex items-center gap-1"><Check className="w-3 h-3" /> Saved</span>}
             {saveStatus === 'saving' && <span className="text-[10px] text-gray-500 flex items-center gap-1">Saving...</span>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3 ml-1">RETURN TITLE</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Defective Keyboard Order #123"
              className="w-full glass-input rounded-2xl px-5 py-4 text-white placeholder-gray-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3 ml-1">DESCRIPTION & CONDITION</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Describe the item condition and reason for return..."
              className="w-full glass-input rounded-2xl px-5 py-4 text-white placeholder-gray-500 transition-all resize-none"
            />
          </div>

          <div className="pt-6 mt-auto">
            <button
              type="submit"
              disabled={!title || !description || !imagePreview || isSubmitting}
              className={`
                w-full py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg
                ${(!title || !description || !imagePreview) 
                  ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed border border-white/5' 
                  : 'bg-gradient-to-r from-gray-100 to-gray-300 text-gray-900 hover:from-white hover:to-gray-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] transform hover:-translate-y-0.5 active:translate-y-0'}
              `}
            >
              {isSubmitting ? (
                  <span className="flex items-center gap-2">Processing...</span>
              ) : (
                  <span className="flex items-center gap-2"><Check className="w-5 h-5" /> Submit Return Record</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
