'use client';

import React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !fullName) {
      setError('모든 필드를 입력해주세요.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('회원가입 시도:', { email });
      
      // 1. Supabase Auth로 유저 등록
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      
      console.log('Auth 회원가입 결과:', { authData, authError });
      
      if (authError) {
        throw authError;
      }
      
      if (!authData.user || !authData.user.id) {
        throw new Error('사용자 ID를 가져올 수 없습니다.');
      }
      
      // 2. users 테이블에 추가 정보 저장
      console.log('users 테이블에 정보 저장 시도', { userId: authData.user.id });
      
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            user_email: email,
            full_name: fullName,
            role: 'admin', // 첫 번째 사용자는 관리자로 설정
            created_at: new Date().toISOString()
          }
        ]);
        
      console.log('users 테이블 저장 결과:', { insertError });
      
      if (insertError) {
        // users 테이블에 추가 실패 시 인증된 사용자 삭제 시도
        console.error('users 테이블 추가 실패:', insertError);
        throw insertError;
      }
      
      // 성공
      setSuccess('계정이 성공적으로 생성되었습니다! 로그인 페이지로 이동합니다.');
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
      
    } catch (err: any) {
      console.error('회원가입 에러:', err);
      setError(err.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-purple-500 to-blue-500">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-xl backdrop-blur-sm bg-opacity-80">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">
            관리자 계정 등록
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            DMC ERP 시스템에 오신 것을 환영합니다
          </p>
        </div>
        
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-3 text-sm text-green-700 bg-green-100 rounded-md">
            {success}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="example@company.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="********"
              />
            </div>
            
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                이름
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="block w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="홍길동"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? '처리 중...' : '회원가입'}
            </button>
          </div>
        </form>
        
        <div className="text-center text-sm mt-4">
          <span className="text-gray-600">이미 계정이 있으신가요?</span>{' '}
          <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            로그인하기
          </Link>
        </div>
        
        <div className="text-center text-xs mt-4 text-gray-500">
          <p>
            회원가입하시면 DMC ERP 시스템을 이용할 수 있습니다.
          </p>
          <p className="mt-1">
            기술적인 문제가 발생하면 관리자에게 문의하세요.
          </p>
        </div>
      </div>
    </div>
  );
} 