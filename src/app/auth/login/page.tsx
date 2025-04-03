'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123!');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdminSetup, setShowAdminSetup] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('로그인 시도:', { email });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('로그인 결과:', { data, error });
      
      if (error) {
        throw error;
      }
      
      console.log('로그인 성공:', data);
      
      // 사용자 정보 확인
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user?.id)
        .single();
      
      console.log('사용자 정보:', userData, userError);
      
      if (userError && userError.code === 'PGRST116') {
        console.log('users 테이블이 없거나 사용자 정보가 없습니다. 관리자 설정 페이지로 이동 옵션을 표시합니다.');
        setShowAdminSetup(true);
        setIsLoading(false);
        return;
      }
      
      // 로그인 성공 시 대시보드로 리디렉션
      router.push('/dashboard');
    } catch (error: any) {
      console.error('로그인 오류:', error);
      setError(error.message || '로그인 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  const handleSetupAdmin = () => {
    router.push('/admin');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500">
      {/* 로고 및 배경 효과 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-yellow-500 opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute top-20 -right-20 w-60 h-60 bg-blue-400 opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-20 w-80 h-80 bg-purple-500 opacity-10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">DMC ERP</h1>
          <div className="h-1 w-32 bg-yellow-400 mx-auto rounded-full mb-4"></div>
          <p className="text-blue-100 text-xl">기업 자원 관리 시스템</p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20">
          {error && (
            <div className="bg-red-500/30 backdrop-blur-sm text-white p-4 rounded-lg mb-6 border border-red-500/50">
              <p className="font-medium">{error}</p>
            </div>
          )}

          {showAdminSetup && (
            <div className="bg-yellow-500/30 backdrop-blur-sm text-white p-4 rounded-lg mb-6 border border-yellow-500/50">
              <p className="font-medium">시스템 설정이 필요합니다. 관리자 설정 페이지로 이동하시겠습니까?</p>
              <button 
                onClick={handleSetupAdmin}
                className="mt-3 w-full py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                관리자 설정 페이지로 이동
              </button>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-blue-100 font-medium mb-2 text-lg">
                이메일
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-blue-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/20 text-white backdrop-blur-sm pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 border border-white/30 transition-all placeholder-blue-200"
                  placeholder="이메일 주소"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-blue-100 font-medium mb-2 text-lg">
                비밀번호
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-blue-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/20 text-white backdrop-blur-sm pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 border border-white/30 transition-all placeholder-blue-200"
                  placeholder="비밀번호"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    로그인 중...
                  </>
                ) : (
                  '로그인'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-blue-100">
              <Link href="/auth/register" className="text-blue-200 hover:underline">
                계정이 없으신가요? 회원가입하기
              </Link>
            </p>
            <p className="text-blue-100">
              시스템 관리자 계정: <span className="font-mono bg-white/10 px-2 py-1 rounded">admin@example.com / admin123!</span>
            </p>
          </div>
        </div>
        
        <div className="text-center mt-8 text-blue-200 text-sm">
          <p>© {new Date().getFullYear()} DMC Enterprise. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
} 