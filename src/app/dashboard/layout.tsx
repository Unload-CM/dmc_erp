'use client';

import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* 배경 패턴 효과 */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
      
      {/* 장식용 블러 요소들 */}
      <div className="fixed top-[-10%] right-[-5%] w-[30%] h-[40%] rounded-full bg-blue-400/20 blur-[120px] dark:bg-blue-600/20 pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[30%] h-[40%] rounded-full bg-purple-400/20 blur-[120px] dark:bg-purple-600/20 pointer-events-none" />
      
      <Sidebar />
      
      <main className="relative md:ml-20 lg:ml-64 min-h-screen pt-16 md:pt-4 px-4 md:px-6 pb-6">
        {/* 상단 네비게이션 바 (모바일) */}
        <header className="md:hidden fixed top-0 left-0 right-0 z-10 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow">
          <div className="flex items-center justify-center h-full px-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">DMC ERP</h1>
          </div>
        </header>
        
        {/* 페이지 컨텐츠 */}
        <div className="relative z-0 w-full h-full">
          {children}
        </div>
      </main>

      <style jsx global>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
          background-size: 24px 24px;
        }
        
        @media (prefers-color-scheme: dark) {
          .bg-grid-pattern {
            background-image: 
              linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          }
        }
      `}</style>
    </div>
  );
} 