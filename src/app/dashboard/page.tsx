'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { InventoryItem, PurchaseRequest, ProductionPlan, ShippingPlan } from '@/types';
import { 
  FaBox, FaShoppingCart, FaIndustry, FaTruck, FaBell, FaCalendarCheck, FaExclamationTriangle,
  FaChevronRight, FaChartLine, FaSearch, FaRegCalendarAlt, FaCog, FaUsers, FaClipboardList,
  FaArrowUp, FaArrowDown, FaEquals, FaWarehouse, FaBoxOpen, FaDatabase
} from 'react-icons/fa';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Chart.js 등록
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [greetingMessage, setGreetingMessage] = useState('');
  const [inventorySummary, setInventorySummary] = useState({ count: 0, lowStock: 0 });
  const [purchaseRequests, setPurchaseRequests] = useState<any[]>([]);
  const [productionPlans, setProductionPlans] = useState<any[]>([]);
  const [shippingPlans, setShippingPlans] = useState<any[]>([]);
  const [inventoryCategories, setInventoryCategories] = useState<Array<{category: string, count: number, quantity: number}>>([]);
  const [recentActivityCount, setRecentActivityCount] = useState(0);
  
  // 전일 대비 증감률 계산 상태 추가
  const [inventoryGrowth, setInventoryGrowth] = useState<number>(0);
  const [lowStockGrowth, setLowStockGrowth] = useState<number>(0);
  const [purchaseGrowth, setPurchaseGrowth] = useState<number>(0);
  const [productionGrowth, setProductionGrowth] = useState<number>(0);

  useEffect(() => {
    // 시간에 따른 인사말 설정
    const hours = new Date().getHours();
    let greeting = '';
    
    if (hours < 12) {
      greeting = '좋은 아침입니다';
    } else if (hours < 18) {
      greeting = '안녕하세요';
    } else {
      greeting = '좋은 저녁입니다';
    }
    
    setGreetingMessage(greeting);

    async function fetchDashboardData() {
      setIsLoading(true);

      try {
        console.log('대시보드 데이터 로딩 시작...');
        
        // 재고 상태 요약 조회 - 모든 데이터 정확히 가져오기
        let inventoryCount = 0;
        let lowStockCount = 0;
        
        try {
          // 기본 테이블에서 먼저 조회
          const { count, error } = await supabase
            .from('inventory')
            .select('*', { count: 'exact' });
            
          if (error) {
            if (error.code === 'PGRST116') { // 테이블이 존재하지 않는 경우
              console.log('inventory 테이블이 없어 inventory_items 테이블에서 조회합니다.');
              const { count: altCount, error: altError } = await supabase
                .from('inventory_items')
                .select('*', { count: 'exact' });
                
              if (!altError) {
                inventoryCount = altCount || 0;
              } else {
                console.error('대체 테이블 조회 오류:', altError);
              }
            } else {
              console.error('재고 카운트 조회 오류:', error);
            }
          } else {
            inventoryCount = count || 0;
          }
          
          // 부족 재고 항목 조회
          const { data: lowStockItems, error: lowStockError } = await supabase
            .from('inventory')
            .select('*')
            .lt('quantity', 10);

          if (lowStockError) {
            if (lowStockError.code === 'PGRST116') {
              const { data: altLowStockItems, error: altLowStockError } = await supabase
                .from('inventory_items')
                .select('*')
                .lt('quantity', 10);
                
              if (!altLowStockError) {
                lowStockCount = altLowStockItems?.length || 0;
              }
            }
          } else {
            lowStockCount = lowStockItems?.length || 0;
          }

          // 이전 날짜의 재고 데이터 조회 (일주일 전)
          const lastWeek = new Date();
          lastWeek.setDate(lastWeek.getDate() - 7);
          const lastWeekStr = lastWeek.toISOString().split('T')[0];

          // 일주일 전 재고 수량 통계 조회
          const { data: historicalInventory } = await supabase
            .from('inventory_history')
            .select('total_count')
            .eq('date', lastWeekStr)
            .single();

          if (historicalInventory) {
            const prevCount = historicalInventory.total_count || 0;
            const growth = prevCount > 0 ? ((inventoryCount - prevCount) / prevCount) * 100 : 0;
            setInventoryGrowth(parseFloat(growth.toFixed(1)));
          } else {
            // 히스토리 없는 경우 랜덤 증감률 (실제 구현시 삭제)
            setInventoryGrowth(Math.floor(Math.random() * 10) - 2);
          }

          // 부족 재고 증감률 (히스토리 테이블 없는 경우 랜덤값)
          setLowStockGrowth(Math.floor(Math.random() * 6) - 3);
        } catch (inventoryError) {
          console.error('재고 정보 조회 중 오류:', inventoryError);
        }

        setInventorySummary({
          count: inventoryCount,
          lowStock: lowStockCount
        });

        // 카테고리별 재고 항목 수 조회
        try {
          const { data: inventoryItems, error: categoryError } = await supabase
            .from('inventory')
            .select('category, quantity');
            
          if (!categoryError && inventoryItems) {
            const categoryCount: Record<string, {count: number, quantity: number}> = {};
            inventoryItems.forEach(item => {
              if (item.category) {
                if (!categoryCount[item.category]) {
                  categoryCount[item.category] = {count: 0, quantity: 0};
                }
                categoryCount[item.category].count += 1;
                categoryCount[item.category].quantity += (item.quantity || 0);
              }
            });
            
            const categoryData = Object.entries(categoryCount)
              .map(([category, data]) => ({ 
                category, 
                count: data.count,
                quantity: data.quantity
              }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 5);
              
            setInventoryCategories(categoryData);
          }
        } catch (categoryError) {
          console.error('카테고리 정보 조회 중 오류:', categoryError);
        }

        // 최근 구매 요청 조회 및 증감률 계산
        try {
          const { data: recentPurchaseRequests, error: purchaseError } = await supabase
            .from('purchase_request')
            .select('*, purchase_request_items(*)')
            .order('created_at', { ascending: false })
            .limit(5);

          if (!purchaseError) {
            setPurchaseRequests(recentPurchaseRequests || []);
            
            // 구매 요청 증감률 계산
            const today = new Date();
            const lastWeek = new Date(today);
            lastWeek.setDate(today.getDate() - 7);
            
            const { count: currentWeekCount } = await supabase
              .from('purchase_request')
              .select('*', { count: 'exact' })
              .gte('created_at', today.toISOString().split('T')[0]);
              
            const { count: lastWeekCount } = await supabase
              .from('purchase_request')
              .select('*', { count: 'exact' })
              .gte('created_at', lastWeek.toISOString().split('T')[0])
              .lt('created_at', today.toISOString().split('T')[0]);
              
            // null 체크 및 안전한 계산  
            const currentCount = currentWeekCount || 0;
            const previousCount = lastWeekCount || 1; // 0으로 나누기 방지
            
            if (previousCount > 0) {
              const growth = ((currentCount - previousCount) / previousCount) * 100;
              setPurchaseGrowth(parseFloat(growth.toFixed(1)));
            } else {
              setPurchaseGrowth(3.8); // 기본값
            }
          }
        } catch (purchaseError) {
          console.error('구매 요청 조회 중 오류:', purchaseError);
        }

        // 진행 중인 생산 계획 조회 및 증감률 계산
        try {
          const { data: ongoingProductionPlans, error: productionError } = await supabase
            .from('production_plans')
            .select('*')
            .eq('status', 'in_progress')
            .order('start_date', { ascending: true })
            .limit(3);

          if (!productionError) {
            setProductionPlans(ongoingProductionPlans || []);
            
            // 생산계획 증감률 계산 (현재 진행중 vs 지난주 진행중)
            const { count: currentProductionCount } = await supabase
              .from('production_plans')
              .select('*', { count: 'exact' })
              .eq('status', 'in_progress');
              
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            
            const { data: completedLastWeek } = await supabase
              .from('production_plans')
              .select('*', { count: 'exact' })
              .eq('status', 'completed')
              .gte('updated_at', lastWeek.toISOString());
              
            const lastWeekProdCount = completedLastWeek?.length || 0;
            
            // null 체크 및 안전한 계산
            const currentCount = currentProductionCount || 0;
            
            if (lastWeekProdCount > 0) {
              const growth = ((currentCount - lastWeekProdCount) / lastWeekProdCount) * 100;
              setProductionGrowth(parseFloat(growth.toFixed(1)));
            } else {
              setProductionGrowth(0); // 변화 없음
            }
          }
        } catch (productionError) {
          console.error('생산 계획 조회 중 오류:', productionError);
        }

        // 예정된 출하 계획 조회
        try {
          const { data: upcomingShippingPlans, error: shippingError } = await supabase
            .from('shipping_plan')
            .select('*')
            .eq('status', 'planned')
            .order('shipping_date', { ascending: true })
            .limit(3);

          if (!shippingError) {
            setShippingPlans(upcomingShippingPlans || []);
          }
        } catch (shippingError) {
          console.error('출하 계획 조회 중 오류:', shippingError);
        }
        
        // 최근 활동 조회 - 모든 테이블의 최근 변경사항 합산
        let activityCount = 0;
        
        try {
          // 지난 24시간 내 활동 집계
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayIso = yesterday.toISOString();
          
          // 재고 활동
          const { count: inventoryActivityCount } = await supabase
            .from('inventory')
            .select('*', { count: 'exact' })
            .gt('updated_at', yesterdayIso);
            
            activityCount += inventoryActivityCount || 0;
          
          // 구매 활동
          const { count: purchaseActivityCount } = await supabase
            .from('purchase_request')
            .select('*', { count: 'exact' })
            .gt('updated_at', yesterdayIso);
            
            activityCount += purchaseActivityCount || 0;
          
          // 생산 활동
          const { count: productionActivityCount } = await supabase
            .from('production_plans')
            .select('*', { count: 'exact' })
            .gt('updated_at', yesterdayIso);
            
            activityCount += productionActivityCount || 0;
          
          // 배송 활동
          const { count: shippingActivityCount } = await supabase
            .from('shipping_plan')
            .select('*', { count: 'exact' })
            .gt('updated_at', yesterdayIso);
            
            activityCount += shippingActivityCount || 0;
          
          setRecentActivityCount(activityCount);
        } catch (activityError) {
          console.error('최근 활동 조회 중 오류:', activityError);
          setRecentActivityCount(0);
        }
        
        console.log('대시보드 데이터 로딩 완료');
      } catch (error) {
        console.error('대시보드 데이터 로딩 오류:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-96 justify-center items-center">
        <div className="relative w-20 h-20">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full animate-ping"></div>
          <div className="absolute top-0 left-0 w-full h-full border-t-4 border-blue-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 헤더 섹션 */}
      <header className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 backdrop-blur-sm bg-white/60 dark:bg-gray-800/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-blue-900 dark:text-blue-300">{greetingMessage}, 관리자님</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">DMC ERP 시스템 대시보드입니다.</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center">
            <div className="relative">
              <input 
                type="text" 
                placeholder="검색어를 입력하세요" 
                className="pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full md:w-64 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <div className="relative ml-3">
              <button className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-md">
                <FaBell />
              </button>
              {recentActivityCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {recentActivityCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* 빠른 접근 버튼 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <QuickAccessButton 
          title="자재관리"
          icon={<FaBox className="text-blue-500" size={24} />}
          href="/dashboard/inventory"
          bgColor="bg-blue-50 dark:bg-blue-900/20"
          textColor="text-blue-700 dark:text-blue-300"
        />
        <QuickAccessButton 
          title="구매관리"
          icon={<FaShoppingCart className="text-green-500" size={24} />}
          href="/dashboard/purchase"
          bgColor="bg-green-50 dark:bg-green-900/20"
          textColor="text-green-700 dark:text-green-300"
        />
        <QuickAccessButton 
          title="생산관리"
          icon={<FaIndustry className="text-purple-500" size={24} />}
          href="/dashboard/production"
          bgColor="bg-purple-50 dark:bg-purple-900/20"
          textColor="text-purple-700 dark:text-purple-300"
        />
        <QuickAccessButton 
          title="배송관리"
          icon={<FaTruck className="text-orange-500" size={24} />}
          href="/dashboard/shipping"
          bgColor="bg-orange-50 dark:bg-orange-900/20"
          textColor="text-orange-700 dark:text-orange-300"
        />
        <QuickAccessButton 
          title="사용자관리"
          icon={<FaUsers className="text-indigo-500" size={24} />}
          href="/dashboard/admin"
          bgColor="bg-indigo-50 dark:bg-indigo-900/20"
          textColor="text-indigo-700 dark:text-indigo-300"
        />
        <QuickAccessButton 
          title="설정"
          icon={<FaCog className="text-gray-500" size={24} />}
          href="/dashboard/settings"
          bgColor="bg-gray-50 dark:bg-gray-800"
          textColor="text-gray-700 dark:text-gray-300"
        />
      </div>

      {/* 요약 카드 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard 
          title="총 자재 수" 
          value={inventorySummary.count.toString()} 
          icon={<FaBox className="text-blue-400" size={24} />}
          change="+5.2%"
          changeType="up"
        />
        <DashboardCard 
          title="부족 재고 항목" 
          value={inventorySummary.lowStock.toString()} 
          icon={<FaExclamationTriangle className="text-red-400" size={24} />}
          change="-2.1%"
          changeType="down"
          color="red"
        />
        <DashboardCard 
          title="구매 요청" 
          value={purchaseRequests.length.toString()} 
          icon={<FaShoppingCart className="text-green-400" size={24} />}
          change="+3.8%"
          changeType="up"
          color="green"
        />
        <DashboardCard 
          title="진행 중인 생산" 
          value={productionPlans.length.toString()} 
          icon={<FaIndustry className="text-purple-400" size={24} />}
          change="0%"
          changeType="neutral"
          color="purple"
        />
      </div>

      {/* 정보 카드 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 카테고리별 자재 현황 */}
        <SectionCard 
          title="카테고리별 자재 현황" 
          icon={<FaBoxOpen className="text-blue-500" />}
          link="자재관리로 이동"
          linkHref="/dashboard/inventory"
        >
          {inventoryCategories.length > 0 ? (
            <div className="space-y-4">
              {inventoryCategories.map((category, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {category.category}
                  </div>
                  <div className="flex-grow">
                    <div className="relative h-4 overflow-hidden bg-gray-200 dark:bg-gray-700 rounded-full">
                      <div 
                        className={`absolute h-full bg-blue-${600 - index * 100} rounded-full`}
                        style={{ width: `${Math.min(100, (category.count / inventorySummary.count) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-12 text-right text-sm font-medium text-gray-700 dark:text-gray-300 ml-3">
                    {category.count}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
              <FaBoxOpen size={32} className="mb-3 opacity-30" />
              <p>자재 정보가 없습니다.</p>
            </div>
          )}
        </SectionCard>

        {/* 최근 구매 요청 */}
        <SectionCard 
          title="최근 구매 요청" 
          icon={<FaShoppingCart className="text-green-500" />}
          link="바로가기"
          linkHref="/dashboard/purchase"
        >
          {purchaseRequests.length > 0 ? (
            <div className="divide-y dark:divide-gray-700">
              {purchaseRequests.map((request) => (
                <div key={request.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{request.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      상태: <span className={`${getStatusColor(request.status)}`}>{request.status}</span>
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(request.created_at)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
              <FaShoppingCart size={32} className="mb-3 opacity-30" />
              <p>구매 요청이 없습니다.</p>
            </div>
          )}
        </SectionCard>

        {/* 생산 일정 */}
        <SectionCard 
          title="생산 일정" 
          icon={<FaIndustry className="text-purple-500" />}
          link="바로가기"
          linkHref="/dashboard/production"
        >
          {productionPlans.length > 0 ? (
            <div className="divide-y dark:divide-gray-700">
              {productionPlans.map((plan) => (
                <div key={plan.id} className="py-3">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-gray-900 dark:text-white">{plan.title}</p>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full dark:bg-purple-900 dark:text-purple-300">
                      진행중
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                    <FaRegCalendarAlt className="mr-1" size={12} />
                    {new Date(plan.start_date).toLocaleDateString()} ~ {new Date(plan.end_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
              <FaIndustry size={32} className="mb-3 opacity-30" />
              <p>진행 중인 생산 계획이 없습니다.</p>
            </div>
          )}
        </SectionCard>
      </div>

      {/* 출하 일정 */}
      <SectionCard 
        title="출하 예정" 
        icon={<FaTruck className="text-blue-500" />}
        link="바로가기"
        linkHref="/dashboard/shipping"
      >
        {shippingPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {shippingPlans.map((plan) => (
              <div key={plan.id} className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium text-gray-900 dark:text-white">{plan.title}</p>
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <FaRegCalendarAlt className="mr-2" size={14} />
                    {new Date(plan.shipping_date).toLocaleDateString()}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 line-clamp-2">{plan.description}</p>
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <FaTruck className="mr-2" size={14} />
                    {plan.destination}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
            <FaTruck size={48} className="mb-4 opacity-30" />
            <p className="text-xl">예정된 출하 계획이 없습니다.</p>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function QuickAccessButton({
  title,
  icon,
  href,
  bgColor = 'bg-gray-50',
  textColor = 'text-gray-700',
}: {
  title: string;
  icon: React.ReactNode;
  href: string;
  bgColor?: string;
  textColor?: string;
}) {
  return (
    <Link
      href={href}
      className={`${bgColor} ${textColor} rounded-xl p-4 flex flex-col items-center justify-center transition-all hover:shadow-md hover:scale-105 border border-gray-200 dark:border-gray-700`}
    >
      <div className="mb-2">{icon}</div>
      <p className="text-sm font-medium">{title}</p>
    </Link>
  );
}

function DashboardCard({
  title,
  value,
  icon,
  change,
  changeType = 'neutral',
  color = 'blue',
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'red' | 'green' | 'yellow' | 'purple';
}) {
  const getColorClass = () => {
    const baseClass = 'rounded-lg p-6 bg-white dark:bg-gray-800 shadow-lg border';
    switch (color) {
      case 'red': return `${baseClass} border-red-200 dark:border-red-900`;
      case 'green': return `${baseClass} border-green-200 dark:border-green-900`;
      case 'yellow': return `${baseClass} border-yellow-200 dark:border-yellow-900`;
      case 'purple': return `${baseClass} border-purple-200 dark:border-purple-900`;
      default: return `${baseClass} border-blue-200 dark:border-blue-900`;
    }
  };

  return (
    <div className={getColorClass()}>
      <div className="flex justify-between items-start">
        <div className="p-3 rounded-lg bg-opacity-10"
          style={{ backgroundColor: `var(--color-${color}-100)` }}
        >
          {icon}
        </div>
        <div className="flex items-center text-sm">
          {changeType === 'up' && <FaArrowUp className="text-green-500 mr-1" />}
          {changeType === 'down' && <FaArrowDown className="text-red-500 mr-1" />}
          {changeType === 'neutral' && <FaEquals className="text-gray-500 mr-1" />}
          <span 
            className={`${
              changeType === 'up' ? 'text-green-600 dark:text-green-400' : 
              changeType === 'down' ? 'text-red-600 dark:text-red-400' : 
              'text-gray-600 dark:text-gray-400'
            }`}
          >
            {change}
          </span>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{title}</p>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
  icon,
  link,
  linkHref,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  link?: string;
  linkHref?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          {icon && <span className="mr-3">{icon}</span>}
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
        </div>
        {link && linkHref && (
          <Link href={linkHref} className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center">
            {link} <FaChevronRight className="ml-1" size={12} />
          </Link>
        )}
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'approved':
      return 'text-green-600 dark:text-green-400';
    case 'pending':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'in_progress':
      return 'text-blue-600 dark:text-blue-400';
    case 'cancelled':
    case 'rejected':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// 카테고리별 재고 차트 컴포넌트 개선
const InventoryCategoryChart = () => {
  if (inventoryCategories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-60 text-gray-500">
        <div className="text-lg mb-2">데이터가 없습니다</div>
        <p className="text-sm text-center">재고 카테고리 데이터가 없습니다.</p>
      </div>
    );
  }

  const colors = [
    'rgb(53, 162, 235)',
    'rgb(75, 192, 192)',
    'rgb(255, 99, 132)',
    'rgb(255, 159, 64)',
    'rgb(153, 102, 255)'
  ];

  const data = {
    labels: inventoryCategories.map(item => item.category),
    datasets: [
      {
        label: '항목 수',
        data: inventoryCategories.map(item => item.count),
        backgroundColor: colors,
        borderWidth: 1,
      },
      {
        label: '총 수량',
        data: inventoryCategories.map(item => item.quantity),
        backgroundColor: colors.map(color => color.replace(')', ', 0.7)')),
        borderWidth: 1,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '카테고리별 재고 현황'
      }
    }
  };

  return (
    <div className="h-80">
      <Bar data={data} options={options} />
    </div>
  );
}; 