'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [createTablesLoading, setCreateTablesLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error' | 'info'} | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/auth/login');
          return;
        }
        
        setUser(session.user);
        setLoading(false);
      } catch (error) {
        console.error('인증 확인 오류:', error);
        router.push('/auth/login');
      }
    };
    
    checkAuth();
  }, [router]);

  const handleCreateTables = async () => {
    setCreateTablesLoading(true);
    setMessage({ text: '테이블 생성 중...', type: 'info' });
    
    try {
      const response = await fetch('/api/setup');
      const data = await response.json();
      
      if (data.success) {
        setMessage({ text: '테이블이 성공적으로 생성되었습니다.', type: 'success' });
      } else {
        setMessage({ text: `오류 발생: ${data.message}`, type: 'error' });
      }
    } catch (error) {
      console.error('테이블 생성 오류:', error);
      setMessage({ text: '테이블 생성 중 예기치 않은 오류가 발생했습니다.', type: 'error' });
    } finally {
      setCreateTablesLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 text-center">
          <div className="inline-block w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-700">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl p-8 mx-auto">
        <h1 className="text-3xl font-bold text-gray-800">관리자 설정</h1>
        <p className="mt-2 text-gray-600">
          DMC ERP 시스템의 초기 설정을 구성합니다.
        </p>
        
        <div className="p-6 mt-8 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700">데이터베이스 설정</h2>
          <p className="mt-2 text-gray-600">
            Supabase 테이블을 생성하고 초기 데이터를 설정합니다.
          </p>
          
          {message && (
            <div className={`p-4 mt-4 rounded-md ${
              message.type === 'success' ? 'bg-green-100 text-green-700' :
              message.type === 'error' ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {message.text}
            </div>
          )}
          
          <div className="mt-6 space-y-4">
            <button
              onClick={handleCreateTables}
              disabled={createTablesLoading}
              className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {createTablesLoading ? '테이블 생성 중...' : 'Supabase 테이블 생성'}
            </button>
            
            <div className="p-4 mt-4 text-sm bg-yellow-50 text-yellow-700 rounded-md">
              <p className="font-medium">주의사항:</p>
              <ul className="mt-2 ml-4 list-disc">
                <li>이 작업은 Supabase에 필요한 테이블을 생성합니다.</li>
                <li>이미 테이블이 존재하는 경우, 기존 테이블은 유지됩니다.</li>
                <li>이 버튼은 한 번만 클릭하세요.</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="p-6 mt-8 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700">사용자 계정</h2>
          <p className="mt-2 text-gray-600">
            현재 로그인한 사용자: <span className="font-medium">{user?.email}</span>
          </p>
          
          <div className="mt-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              대시보드로 이동
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 