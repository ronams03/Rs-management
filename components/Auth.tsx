
import React, { useState } from 'react';
import { User as UserIcon, Lock, Mail, ArrowRight, Box, Loader2, AlertCircle } from 'lucide-react';
import { User } from '../types';
import { storageService } from '../services/storage';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let user: User;
      if (isLogin) {
        user = await storageService.login(formData.email, formData.password);
      } else {
        user = await storageService.register({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password
        });
      }
      onLogin(user);
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-white/5 rounded-full blur-[100px]"></div>
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-500">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-400 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            <Box className="text-slate-900 w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 mb-2 tracking-tight">
            ReturnOS
          </h1>
          <p className="text-gray-400">Premium Return Management System</p>
        </div>

        {/* Card */}
        <div className="glass-panel p-8 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-xl">
          <div className="flex mb-8 p-1 bg-black/20 rounded-full border border-white/5">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all duration-300 ${
                isLogin ? 'bg-white/10 text-white shadow-lg border border-white/10' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all duration-300 ${
                !isLogin ? 'bg-white/10 text-white shadow-lg border border-white/10' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Full Name - Register Only */}
            {!isLogin && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Full Name</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                  <input 
                    type="text" 
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="w-full glass-input pl-12 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-gray-600 transition-all border border-white/5 focus:border-white/20"
                  />
                </div>
              </div>
            )}

            {/* Email - Login & Register */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                <input 
                  type="email" 
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="name@example.com"
                  className="w-full glass-input pl-12 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-gray-600 transition-all border border-white/5 focus:border-white/20"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                <input 
                  type="password" 
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full glass-input pl-12 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-gray-600 transition-all border border-white/5 focus:border-white/20"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-300 text-sm animate-in shake">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 glass-button group"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="inline-block px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-md border border-white/5 shadow-lg">
            <p className="text-xs text-gray-400 font-medium tracking-wide">
              Developed by <span className="text-gray-200 font-bold">Namoc Roberth</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
