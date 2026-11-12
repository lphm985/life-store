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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMsg('Tên tài khoản tối thiểu 3 ký tự (chỉ gồm chữ thường, số, dấu gạch dưới)!');
      setLoading(false);
      return;
    }

    // Biến username thành email ảo ngầm phía sau để Supabase Auth xác thực an toàn
    const internalEmail = `${cleanUsername}@lifestore.game`;

    try {
      if (isRegister) {
        // Đăng ký tài khoản bằng username + password
        const { error } = await supabase.auth.signUp({
          email: internalEmail,
          password,
          options: {
            data: {
              username: cleanUsername,
              role: 'player',
            },
          },
        });

        if (error) throw error;
        alert('Tạo tài khoản thành công! Đang tự động đăng nhập...');

        // Tự động đăng nhập luôn sau khi đăng ký
        const { error: loginErr } = await supabase.auth.signInWithPassword({
          email: internalEmail,
          password,
        });

        if (loginErr) throw loginErr;
        router.push(redirectedFrom);
        router.refresh();
      } else {
        // Đăng nhập bằng username + password
        const { error } = await supabase.auth.signInWithPassword({
          email: internalEmail,
          password,
        });

        if (error) {
          throw new Error('Sai tên tài khoản hoặc mật khẩu!');
        }

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
          {isRegister ? 'Tạo tài khoản người chơi mới' : 'Đăng nhập vào nông trại của bạn'}
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 mb-4 rounded-xl bg-red-950/60 border border-red-800/60 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Tên Tài Khoản (Username):</label>
          <input
            type="text"
            required
            autoCapitalize="none"
            autoCorrect="off"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="hiepsi_nongdan"
            className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1">Mật Khẩu:</label>
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
          {loading ? 'Đang xử lý...' : isRegister ? 'Tạo Tài Khoản Ngay' : 'Đăng Nhập Vào Game'}
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
          {isRegister ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Tạo tài khoản mới'}
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
