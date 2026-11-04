'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sprout, LogIn, UserPlus } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get('redirectedFrom') || '/play';

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isRegister) {
        // Đăng ký tài khoản
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim() || email.split('@')[0],
              role: 'player', // Mặc định role player
            },
          },
        });

        if (error) throw error;
        alert('Đăng ký thành công! Vui lòng kiểm tra email hoặc đăng nhập.');
        setIsRegister(false);
      } else {
        // Đăng nhập
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        router.push(redirectedFrom);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Đã có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 shadow-2xl">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-emerald-600/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto mb-3 shadow-inner">
          <Sprout className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Life Store RPG</h1>
        <p className="text-xs text-slate-400 mt-1">
          {isRegister ? 'Tạo nông trại và bắt đầu hành trình RPG' : 'Đăng nhập để vào thế giới nông trại'}
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 mb-4 rounded-xl bg-red-950/60 border border-red-800/60 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleAuth} className="space-y-4">
        {isRegister && (
          <div>
            <label className="text-xs text-slate-400 block mb-1">Tên Người Chơi:</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Hiệp Sĩ Nông Dân"
              className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        <div>
          <label className="text-xs text-slate-400 block mb-1">Email:</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="player@example.com"
            className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1">Mật khẩu:</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg active:scale-95 transition flex items-center justify-center gap-1.5"
        >
          {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
          {loading ? 'Đang xử lý...' : isRegister ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập Ngay'}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-800 text-center">
        <button
          onClick={() => {
            setIsRegister(!isRegister);
            setErrorMsg('');
          }}
          className="text-xs text-emerald-400 hover:underline"
        >
          {isRegister ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký miễn phí'}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-slate-400 text-xs">Đang tải trang đăng nhập...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
