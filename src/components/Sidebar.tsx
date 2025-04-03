'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaBox, FaShoppingCart, FaIndustry, FaTruck, FaCog, FaTools, FaChartLine, FaBars, FaTimes } from 'react-icons/fa';

const menuItems = [
  { name: '대시보드', path: '/dashboard', icon: <FaChartLine size={20} /> },
  { name: '자재관리', path: '/dashboard/inventory', icon: <FaBox size={20} /> },
  { name: '구매관리', path: '/dashboard/purchase', icon: <FaShoppingCart size={20} /> },
  { name: '생산관리', path: '/dashboard/production', icon: <FaIndustry size={20} /> },
  { name: '출하관리', path: '/dashboard/shipping', icon: <FaTruck size={20} /> },
  { name: '설정', path: '/dashboard/settings', icon: <FaCog size={20} /> },
  { name: '관리자 패널', path: '/dashboard/admin', icon: <FaTools size={20} /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 현재 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 매 분마다 업데이트
    
    return () => clearInterval(timer);
  }, []);

  // 모바일에서 메뉴 아이템 클릭 시 메뉴 닫기
  const handleMobileMenuItemClick = () => {
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* 모바일 메뉴 토글 버튼 */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-30 p-2 rounded-full bg-blue-600 text-white shadow-lg"
      >
        {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      {/* 배경 오버레이 (모바일) */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-20"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <div 
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-blue-900 to-blue-800 text-white z-30 transition-all duration-300 shadow-2xl
          ${isOpen ? 'w-64' : 'w-20'} 
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* 로고 섹션 */}
        <div className="p-4 flex items-center justify-between border-b border-blue-700">
          {isOpen ? (
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                <FaChartLine className="text-white" size={20} />
              </div>
              <h1 className="ml-3 text-xl font-bold">DMC ERP</h1>
            </div>
          ) : (
            <div className="w-10 h-10 mx-auto rounded-full bg-blue-500 flex items-center justify-center">
              <FaChartLine className="text-white" size={20} />
            </div>
          )}
          
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="hidden md:block rounded p-1 hover:bg-blue-700"
          >
            {isOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* 시간 및 정보 섹션 */}
        {isOpen && (
          <div className="p-4 border-b border-blue-700 text-sm text-blue-300">
            <p>{currentTime.toLocaleDateString('ko-KR', { weekday: 'long' })}</p>
            <p className="text-white font-semibold">
              {currentTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}

        {/* 네비게이션 메뉴 */}
        <nav className="mt-6">
          <ul className="space-y-2 px-2">
            {menuItems.map((item) => {
              const isActive = pathname.startsWith(item.path);

              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    onClick={handleMobileMenuItemClick}
                    className={`flex items-center py-3 px-4 rounded-lg transition-all duration-200
                      ${isActive 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-blue-200 hover:bg-blue-700/60'
                      }
                      ${!isOpen && 'justify-center'}`}
                  >
                    <span className="inline-flex items-center justify-center">
                      {item.icon}
                    </span>
                    {isOpen && <span className="ml-3">{item.name}</span>}
                    
                    {/* 활성 메뉴 인디케이터 */}
                    {isActive && isOpen && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-blue-400"></span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 사용자 프로필 섹션 */}
        {isOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-700">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="font-bold text-lg">A</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">관리자</p>
                <p className="text-xs text-blue-300">admin@example.com</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 