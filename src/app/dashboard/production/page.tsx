'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ProductionPlan } from '@/types';
import { FaIndustry, FaCalendarAlt, FaCheckSquare, FaChartBar, FaCubes, FaSearch } from 'react-icons/fa';

export default function ProductionPage() {
  const [activeTab, setActiveTab] = useState<'plan' | 'performance' | 'comparison' | 'model'>('plan');
  const [refreshFlag, setRefreshFlag] = useState(0);
  
  // 페이지 새로고침 함수
  const refreshPage = () => {
    setRefreshFlag(prev => prev + 1);
  };
  
  return (
    <div className="space-y-6">
      {/* 헤더 섹션 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-blue-900 dark:text-blue-300 flex items-center">
            <FaIndustry className="mr-3 text-blue-500" /> 생산관리
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">생산 계획, 실적 및 모델을 관리합니다.</p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <TabButton 
            isActive={activeTab === 'plan'} 
            onClick={() => setActiveTab('plan')}
            icon="📅"
            label="생산 계획"
          />
          <TabButton 
            isActive={activeTab === 'performance'} 
            onClick={() => setActiveTab('performance')}
            icon="✅"
            label="생산 실적"
          />
          <TabButton 
            isActive={activeTab === 'comparison'} 
            onClick={() => setActiveTab('comparison')}
            icon="📊"
            label="계획 대비 실적"
          />
          <TabButton 
            isActive={activeTab === 'model'} 
            onClick={() => setActiveTab('model')}
            icon="🔧"
            label="모델 관리"
          />
        </div>
        
        <div className="p-6">
          {activeTab === 'plan' && <ProductionPlanTab key={`plan-${refreshFlag}`} onRefresh={refreshPage} />}
          {activeTab === 'performance' && <ProductionPerformanceTab key={`performance-${refreshFlag}`} onRefresh={refreshPage} />}
          {activeTab === 'comparison' && <ProductionComparisonTab key={`comparison-${refreshFlag}`} onRefresh={refreshPage} />}
          {activeTab === 'model' && <ProductionModelTab key={`model-${refreshFlag}`} onRefresh={refreshPage} />}
        </div>
      </div>
    </div>
  );
}

function TabButton({ 
  isActive, 
  onClick, 
  icon, 
  label 
}: { 
  isActive: boolean; 
  onClick: () => void; 
  icon: string; 
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center py-4 px-6 text-sm font-medium transition-all duration-200 ${
        isActive 
          ? 'bg-gradient-to-r from-blue-500/10 to-blue-100/30 dark:from-blue-800/30 dark:to-blue-900/20 text-blue-700 dark:text-blue-300 border-b-2 border-blue-500 shadow-sm' 
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
    >
      <span className="mr-2 text-xl">{icon}</span>
      <span>{label}</span>
      
      {/* 액티브 인디케이터 */}
      {isActive && (
        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-blue-300"></span>
      )}
    </button>
  );
}

// 생산 계획 탭
function ProductionPlanTab({ onRefresh }: { onRefresh: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [productionPlans, setProductionPlans] = useState<ProductionPlan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [newPlan, setNewPlan] = useState<Partial<ProductionPlan>>({
    title: '',
    description: '',
    model_id: '',
    model_name: '',
    product_name: '',
    planned_quantity: 0,
    material_status: 'unavailable',
    start_date: '',
    end_date: '',
    status: 'planned'
  });
  
  useEffect(() => {
    fetchProductionPlans();
    fetchModels();
    fetchInventory();
  }, []);
  
  const fetchProductionPlans = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('production_plans')
        .select('*')
        .order('start_date', { ascending: true });
          
      if (error) throw error;
      setProductionPlans(data || []);
    } catch (error: any) {
      console.error('생산 계획 목록 로딩 오류:', error.message || error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchModels = async () => {
    try {
      const { data, error } = await supabase
        .from('product_models')
        .select('*')
        .order('model_name');
          
      if (error) throw error;
      setModels(data || []);
    } catch (error: any) {
      console.error('모델 목록 로딩 오류:', error.message || error);
    }
  };

  const fetchInventory = async () => {
    try {
      // 자재 테이블에서 자재 목록 로드
      const { data, error } = await supabase
        .from('inventory')
        .select('*');
          
      if (error) {
        if (error.message.includes('does not exist')) {
          console.warn('자재 테이블이 존재하지 않습니다. inventory_items 테이블 대신 inventory 테이블을 사용합니다.');
          // 테이블 이름이 다를 수 있으므로 대체 이름으로 시도
          const { data: altData, error: altError } = await supabase
            .from('inventory_items')
            .select('*');
            
          if (altError) {
            console.error('대체 자재 테이블 로딩 오류:', altError);
            throw altError;
          }
          
          setInventory(altData || []);
          return;
        }
        throw error;
      }
      
      console.log('자재 목록 로드됨:', data?.length || 0, '개 항목');
      setInventory(data || []);
    } catch (error: any) {
      console.error('재고 목록 로딩 오류:', error.message || error);
    }
  };

  const handleModelChange = (modelId: string) => {
    const selectedModel = models.find(model => model.id === modelId);
    if (selectedModel) {
      setNewPlan({
        ...newPlan,
        model_id: modelId,
        model_name: selectedModel.model_name,
        product_name: selectedModel.product_name,
        material_status: getMaterialStatus(selectedModel.material_type)
      });
    }
  };

  const getMaterialStatus = (materialType: string) => {
    // '원자재' 카테고리로 필터링
    const rawMaterials = inventory.filter(item => 
      item.category && item.category.toLowerCase() === '원자재'
    );
    
    console.log('원자재 항목:', rawMaterials.length, '개 발견');
    
    if (rawMaterials.length === 0) {
      console.warn('원자재 카테고리 항목이 없습니다.');
      return 'unavailable';
    }
    
    // 원자재 총 수량 계산
    const totalQuantity = rawMaterials.reduce((sum, item) => sum + (item.quantity || 0), 0);
    console.log('원자재 총 수량:', totalQuantity);
    
    if (totalQuantity >= 100) return 'sufficient';
    if (totalQuantity > 0) return 'insufficient';
    return 'unavailable';
  };

  const calculateDaysRequired = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      // 현재 로그인한 사용자의 ID 가져오기
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      
      if (!userId) {
        alert('로그인이 필요합니다.');
        return;
      }

      const daysRequired = calculateDaysRequired(newPlan.start_date!, newPlan.end_date!);
      
      const { data, error } = await supabase
        .from('production_plans')
        .insert([
          {
            ...newPlan,
            days_required: daysRequired,
            created_by: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (error) throw error;
      
      // 새로운 계획 추가 후 목록 새로고침
      onRefresh();
      fetchProductionPlans();
      setShowAddModal(false);
      setNewPlan({
        title: '',
        description: '',
        model_id: '',
        model_name: '',
        product_name: '',
        planned_quantity: 0,
        material_status: 'unavailable',
        start_date: '',
        end_date: '',
        status: 'planned'
      });
      
    } catch (error: any) {
      console.error('생산 계획 추가 오류:', error.message || error);
      alert('생산 계획 추가 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateStatus = async (id: string, newStatus: 'planned' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('production_plans')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // 목록 새로고침
      fetchProductionPlans();
    } catch (error) {
      console.error('생산 계획 상태 업데이트 오류:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };
  
  const handleDeletePlan = async (id: string) => {
    if (!confirm('이 생산 계획을 삭제하시겠습니까?')) return;
    
    try {
      const { error } = await supabase
        .from('production_plans')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // 목록 새로고침
      fetchProductionPlans();
    } catch (error) {
      console.error('생산 계획 삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };
  
  // 검색어에 따른 필터링
  const filteredPlans = productionPlans.filter(plan => 
    plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-lg font-semibold">생산 계획 관리</h2>
        
        <div className="flex mt-4 md:mt-0 space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <span className="mr-1">+</span> 생산 계획 등록
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-100 rounded-full animate-ping opacity-75"></div>
            <div className="absolute top-0 left-0 w-full h-full border-t-4 border-blue-500 rounded-full animate-spin"></div>
          </div>
        </div>
      ) : filteredPlans.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">제목</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">모델</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">제품명</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">계획 수량</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">원자재</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">시작일</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">종료일</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">소요일</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">상태</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {filteredPlans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3">{plan.title}</td>
                  <td className="px-4 py-3">{plan.model_name || '-'}</td>
                  <td className="px-4 py-3">{plan.product_name || '-'}</td>
                  <td className="px-4 py-3">{plan.planned_quantity || 0}</td>
                  <td className="px-4 py-3">
                    {plan.material_status && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        plan.material_status === 'sufficient' ? 'bg-green-100 text-green-800' :
                        plan.material_status === 'insufficient' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {plan.material_status === 'sufficient' ? '충분' :
                         plan.material_status === 'insufficient' ? '부족' : '없음'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{new Date(plan.start_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{new Date(plan.end_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{plan.days_required || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      plan.status === 'planned' ? 'bg-blue-100 text-blue-800' :
                      plan.status === 'material_waiting' ? 'bg-purple-100 text-purple-800' :
                      plan.status === 'production_waiting' ? 'bg-indigo-100 text-indigo-800' :
                      plan.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      plan.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {plan.status === 'planned' ? '계획됨' :
                       plan.status === 'material_waiting' ? '원자재 대기' :
                       plan.status === 'production_waiting' ? '생산 대기' :
                       plan.status === 'in_progress' ? '진행중' :
                       plan.status === 'completed' ? '완료됨' : '취소됨'}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      onClick={() => handleUpdateStatus(plan.id, 'in_progress')}
                      className="px-2 py-1 text-xs bg-blue-500 text-white rounded"
                      disabled={plan.status === 'in_progress'}
                    >
                      진행중
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(plan.id, 'completed')}
                      className="px-2 py-1 text-xs bg-green-500 text-white rounded"
                      disabled={plan.status === 'completed'}
                    >
                      완료
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 mb-4">등록된 생산 계획이 없습니다.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            새 생산 계획 등록하기
          </button>
        </div>
      )}
      
      {/* 생산 계획 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">새 생산 계획 등록</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddPlan}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">제목</label>
                <input
                  type="text"
                  required
                  value={newPlan.title}
                  onChange={(e) => setNewPlan({...newPlan, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">설명</label>
                <textarea
                  rows={2}
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                ></textarea>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">모델</label>
                <select
                  required
                  value={newPlan.model_id}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">모델 선택</option>
                  {models.map(model => (
                    <option key={model.id} value={model.id}>{model.model_name}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">제품명</label>
                <input
                  type="text"
                  readOnly
                  value={newPlan.product_name || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none dark:bg-gray-600 dark:border-gray-700 dark:text-gray-300"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">계획 수량</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newPlan.planned_quantity}
                  onChange={(e) => setNewPlan({...newPlan, planned_quantity: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">원자재 상태</label>
                <div className={`w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-600 dark:border-gray-700 ${
                  newPlan.material_status === 'sufficient' ? 'text-green-700 dark:text-green-300' :
                  newPlan.material_status === 'insufficient' ? 'text-yellow-700 dark:text-yellow-300' :
                  'text-red-700 dark:text-red-300'
                }`}>
                  {newPlan.material_status === 'sufficient' ? '충분' :
                   newPlan.material_status === 'insufficient' ? '부족' : 
                   '없음'}
                </div>
                
                {/* 원자재 정보 표시 */}
                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md text-sm">
                  <h4 className="font-medium mb-1">원자재 정보</h4>
                  {inventory.filter(item => 
                    item.category && item.category.toLowerCase() === '원자재'
                  ).length > 0 ? (
                    <div className="space-y-1">
                      {inventory.filter(item => 
                        item.category && item.category.toLowerCase() === '원자재'
                      ).map(item => (
                        <div key={item.id} className="flex justify-between items-center">
                          <span>{item.name}</span>
                          <span className={item.quantity > 10 ? 'text-green-600' : 'text-yellow-600'}>
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">
                      '원자재' 카테고리로 등록된 자재가 없습니다. 
                      자재관리에서 원자재 항목을 추가해주세요.
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">시작일</label>
                <input
                  type="date"
                  required
                  value={newPlan.start_date}
                  onChange={(e) => setNewPlan({...newPlan, start_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">종료일</label>
                <input
                  type="date"
                  required
                  value={newPlan.end_date}
                  onChange={(e) => setNewPlan({...newPlan, end_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// 생산 실적 탭
function ProductionPerformanceTab({ onRefresh }: { onRefresh: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [performances, setPerformances] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPerformance, setNewPerformance] = useState({
    plan_id: '',
    actual_quantity: 0,
    title: '',
    description: '',
    model_id: '',
    model_name: '',
    product_name: '',
    planned_quantity: 0,
    start_date: '',
    end_date: '',
    achievement_rate: 0
  });

  useEffect(() => {
    fetchPerformances();
    fetchPlans();
  }, []);

  const fetchPerformances = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('production_performances')
        .select('*')
        .order('created_at', { ascending: false });
          
      if (error) throw error;
      setPerformances(data || []);
    } catch (error: any) {
      console.error('생산 실적 목록 로딩 오류:', error.message || error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('production_plans')
        .select('*')
        .order('created_at', { ascending: false });
          
      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error('생산 계획 목록 로딩 오류:', error.message || error);
    }
  };

  const handlePlanChange = (planId: string) => {
    const selectedPlan = plans.find(plan => plan.id === planId);
    if (selectedPlan) {
      const achievementRate = newPerformance.actual_quantity > 0 && selectedPlan.planned_quantity > 0
        ? Math.round((newPerformance.actual_quantity / selectedPlan.planned_quantity) * 100)
        : 0;
      
      setNewPerformance({
        ...newPerformance,
        plan_id: planId,
        title: selectedPlan.title,
        description: selectedPlan.description,
        model_id: selectedPlan.model_id || '',
        model_name: selectedPlan.model_name || '',
        product_name: selectedPlan.product_name || '',
        planned_quantity: selectedPlan.planned_quantity || 0,
        start_date: selectedPlan.start_date,
        end_date: selectedPlan.end_date,
        achievement_rate: achievementRate
      });
    }
  };

  const handleQuantityChange = (quantity: number) => {
    const selectedPlan = plans.find(plan => plan.id === newPerformance.plan_id);
    if (selectedPlan && selectedPlan.planned_quantity > 0) {
      const achievementRate = Math.round((quantity / selectedPlan.planned_quantity) * 100);
      setNewPerformance({
        ...newPerformance,
        actual_quantity: quantity,
        achievement_rate: achievementRate
      });
    } else {
      setNewPerformance({
        ...newPerformance,
        actual_quantity: quantity,
        achievement_rate: 0
      });
    }
  };

  const calculateDaysRequired = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleAddPerformance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      // 현재 로그인한 사용자의 ID 가져오기
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      
      if (!userId) {
        alert('로그인이 필요합니다.');
        return;
      }

      // 소요일 계산
      const daysRequired = calculateDaysRequired(newPerformance.start_date, newPerformance.end_date);
      
      // 생산 계획 존재 여부 확인
      if (newPerformance.plan_id) {
        const { data: planData, error: planError } = await supabase
          .from('production_plans')
          .select('id')
          .eq('id', newPerformance.plan_id)
          .single();
        
        if (planError) {
          console.error('생산 계획 조회 오류:', planError);
          throw new Error('연결된 생산 계획을 찾을 수 없습니다. 유효한 생산 계획을 선택해주세요.');
        }
        
        if (!planData) {
          throw new Error('선택한 생산 계획이 존재하지 않습니다. 다른 계획을 선택해주세요.');
        }
      }
      
      const { data, error } = await supabase
        .from('production_performances')
        .insert([
          {
            ...newPerformance,
            days_required: daysRequired,
            status: newPerformance.achievement_rate >= 100 ? 'completed' : 'in_production',
            created_by: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (error) throw error;
      
      // 생산 계획의 상태를 완료로 업데이트
      if (newPerformance.plan_id) {
        const { error: updateError } = await supabase
          .from('production_plans')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', newPerformance.plan_id);
        
        if (updateError) {
          console.error('생산 계획 상태 업데이트 오류:', updateError);
        }
      }
      
      // 새로운 실적 추가 후 목록 새로고침
      onRefresh();
      fetchPerformances();
      setShowAddModal(false);
      setNewPerformance({
        plan_id: '',
        actual_quantity: 0,
        title: '',
        description: '',
        model_id: '',
        model_name: '',
        product_name: '',
        planned_quantity: 0,
        start_date: '',
        end_date: '',
        achievement_rate: 0
      });
      
    } catch (error: any) {
      console.error('생산 실적 추가 오류:', error.message || error);
      alert(`생산 실적 추가 오류: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeletePerformance = async (id: string) => {
    if (!confirm('이 생산 실적을 삭제하시겠습니까?')) return;
    
    try {
      const { error } = await supabase
        .from('production_performances')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // 목록 새로고침
      fetchPerformances();
    } catch (error) {
      console.error('생산 실적 삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };
  
  // 검색어에 따른 필터링
  const filteredPerformances = performances.filter(performance => 
    performance.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    performance.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    performance.model_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    performance.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-lg font-semibold">생산 실적 관리</h2>
        
        <div className="flex mt-4 md:mt-0 space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <span className="mr-1">+</span> 생산 실적 등록
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-100 rounded-full animate-ping opacity-75"></div>
            <div className="absolute top-0 left-0 w-full h-full border-t-4 border-blue-500 rounded-full animate-spin"></div>
          </div>
        </div>
      ) : filteredPerformances.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">제목</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">모델</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">제품명</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">계획 수량</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">생산 수량</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">시작일</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">종료일</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">소요일</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">달성율</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {filteredPerformances.map((performance) => (
                <tr key={performance.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3">{performance.title}</td>
                  <td className="px-4 py-3">{performance.model_name || '-'}</td>
                  <td className="px-4 py-3">{performance.product_name || '-'}</td>
                  <td className="px-4 py-3">{performance.planned_quantity || 0}</td>
                  <td className="px-4 py-3">{performance.actual_quantity || 0}</td>
                  <td className="px-4 py-3">{new Date(performance.start_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{new Date(performance.end_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{performance.days_required || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="relative w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`absolute top-0 left-0 h-full rounded-full ${
                            performance.achievement_rate >= 100 ? 'bg-green-500' : 
                            performance.achievement_rate >= 70 ? 'bg-blue-500' : 
                            performance.achievement_rate >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} 
                          style={{ width: `${Math.min(100, performance.achievement_rate)}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm">{performance.achievement_rate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      onClick={() => handleDeletePerformance(performance.id)}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 mb-4">등록된 생산 실적이 없습니다.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            생산 실적 등록하기
          </button>
        </div>
      )}
      
      {/* 생산 실적 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">생산 실적 등록</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddPerformance}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">생산 계획</label>
                <select
                  required
                  value={newPerformance.plan_id}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">생산 계획 선택</option>
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.title} ({plan.model_name || '모델 없음'})</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">제목</label>
                <input
                  type="text"
                  required
                  value={newPerformance.title}
                  onChange={(e) => setNewPerformance({...newPerformance, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">모델명</label>
                <input
                  type="text"
                  readOnly
                  value={newPerformance.model_name || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none dark:bg-gray-600 dark:border-gray-700 dark:text-gray-300"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">제품명</label>
                <input
                  type="text"
                  readOnly
                  value={newPerformance.product_name || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none dark:bg-gray-600 dark:border-gray-700 dark:text-gray-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">계획 수량</label>
                  <input
                    type="number"
                    readOnly
                    value={newPerformance.planned_quantity}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none dark:bg-gray-600 dark:border-gray-700 dark:text-gray-300"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">실제 생산 수량</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newPerformance.actual_quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">달성율</label>
                <div className="flex items-center">
                  <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`absolute top-0 left-0 h-full rounded-full ${
                        newPerformance.achievement_rate >= 100 ? 'bg-green-500' : 
                        newPerformance.achievement_rate >= 70 ? 'bg-blue-500' : 
                        newPerformance.achievement_rate >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} 
                      style={{ width: `${Math.min(100, newPerformance.achievement_rate)}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm">{newPerformance.achievement_rate}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">시작일</label>
                  <input
                    type="date"
                    required
                    value={newPerformance.start_date}
                    onChange={(e) => setNewPerformance({...newPerformance, start_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">종료일</label>
                  <input
                    type="date"
                    required
                    value={newPerformance.end_date}
                    onChange={(e) => setNewPerformance({...newPerformance, end_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// 계획 대비 실적 탭
function ProductionComparisonTab({ onRefresh }: { onRefresh: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [performances, setPerformances] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    totalPlanned: 0,
    totalProduced: 0,
    averageAchievement: 0,
    onTimeDelivery: 0,
    completedProjects: 0,
    totalProjects: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // 생산 계획 데이터 가져오기
      const { data: plansData, error: plansError } = await supabase
        .from('production_plans')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (plansError) throw plansError;
      
      // 생산 실적 데이터 가져오기
      const { data: performancesData, error: performancesError } = await supabase
        .from('production_performances')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (performancesError) throw performancesError;
      
      setPlans(plansData || []);
      setPerformances(performancesData || []);
      
      // 요약 통계 계산
      calculateSummaryStats(plansData || [], performancesData || []);
      
    } catch (error: any) {
      console.error('계획 대비 실적 데이터 로딩 오류:', error.message || error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSummaryStats = (plansData: any[], perfData: any[]) => {
    if (plansData.length === 0) {
      setSummaryStats({
        totalPlanned: 0,
        totalProduced: 0,
        averageAchievement: 0,
        onTimeDelivery: 0,
        completedProjects: 0,
        totalProjects: 0
      });
      return;
    }
    
    // 총 계획 수량
    const totalPlanned = plansData.reduce((sum, plan) => sum + (plan.planned_quantity || 0), 0);
    
    // 총 생산 수량
    const totalProduced = perfData.reduce((sum, perf) => sum + (perf.actual_quantity || 0), 0);
    
    // 평균 달성율
    const totalAchievement = perfData.reduce((sum, perf) => sum + (perf.achievement_rate || 0), 0);
    const averageAchievement = perfData.length > 0 ? Math.round(totalAchievement / perfData.length) : 0;
    
    // 제때 납품율 (종료일 이내에 완료된 프로젝트 비율)
    const completedOnTime = perfData.filter(perf => {
      const endDate = new Date(perf.end_date);
      const planEndDate = plansData.find(plan => plan.id === perf.plan_id)?.end_date;
      if (!planEndDate) return false;
      const plannedEndDate = new Date(planEndDate);
      return endDate <= plannedEndDate;
    }).length;
    
    const onTimeDelivery = perfData.length > 0 ? Math.round((completedOnTime / perfData.length) * 100) : 0;
    
    // 완료된 프로젝트 수
    const completedProjects = perfData.length;
    
    // 총 프로젝트 수
    const totalProjects = plansData.length;
    
    setSummaryStats({
      totalPlanned,
      totalProduced,
      averageAchievement,
      onTimeDelivery,
      completedProjects,
      totalProjects
    });
  };

  // 월별 계획 대비 실적 데이터 구성 (차트용)
  const getMonthlyData = () => {
    const months: {[key: string]: {planned: number, actual: number}} = {};
    
    // 월별로 계획 데이터 집계
    plans.forEach(plan => {
      const date = new Date(plan.start_date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!months[monthKey]) {
        months[monthKey] = { planned: 0, actual: 0 };
      }
      
      months[monthKey].planned += plan.planned_quantity || 0;
    });
    
    // 월별로 실적 데이터 집계
    performances.forEach(perf => {
      const date = new Date(perf.start_date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!months[monthKey]) {
        months[monthKey] = { planned: 0, actual: 0 };
      }
      
      months[monthKey].actual += perf.actual_quantity || 0;
    });
    
    // 데이터를 배열로 변환하고 날짜순으로 정렬
    return Object.entries(months)
      .map(([key, value]) => ({
        month: key,
        planned: value.planned,
        actual: value.actual,
        achievement: value.planned > 0 ? Math.round((value.actual / value.planned) * 100) : 0
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return `${year}년 ${month}월`;
  };
  
  const monthlyData = getMonthlyData();
  
  return (
    <div>
      <h2 className="text-lg font-semibold mb-6">계획 대비 실적</h2>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-100 rounded-full animate-ping opacity-75"></div>
            <div className="absolute top-0 left-0 w-full h-full border-t-4 border-blue-500 rounded-full animate-spin"></div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 통계 요약 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">평균 달성율</h3>
              <div className="flex items-center">
                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{summaryStats.averageAchievement}%</span>
                <div className="relative w-24 h-3 bg-gray-200 rounded-full ml-4 overflow-hidden">
                  <div 
                    className={`absolute top-0 left-0 h-full rounded-full ${
                      summaryStats.averageAchievement >= 100 ? 'bg-green-500' : 
                      summaryStats.averageAchievement >= 70 ? 'bg-blue-500' : 
                      summaryStats.averageAchievement >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} 
                    style={{ width: `${Math.min(100, summaryStats.averageAchievement)}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">전체 프로젝트 평균 달성율</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">생산량</h3>
              <div className="flex items-center space-x-2">
                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{summaryStats.totalProduced}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">/ {summaryStats.totalPlanned}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">생산량 / 계획량</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">프로젝트 완료율</h3>
              <div className="flex items-center space-x-2">
                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{summaryStats.completedProjects}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">/ {summaryStats.totalProjects}</span>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400 ml-2">
                  {summaryStats.totalProjects > 0 
                    ? `(${Math.round((summaryStats.completedProjects / summaryStats.totalProjects) * 100)}%)` 
                    : '(0%)'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">완료된 프로젝트 / 전체 프로젝트</p>
            </div>
          </div>
          
          {/* 월별 계획 대비 실적 차트 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">월별 계획 대비 실적</h3>
            
            {monthlyData.length > 0 ? (
              <div>
                <div className="h-64 w-full">
                  {/* 차트 대신 테이블 형태로 표시 */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700">
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">월</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">계획량</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">생산량</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">달성율</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">그래프</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {monthlyData.map((data, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-4 py-3">{formatMonth(data.month)}</td>
                            <td className="px-4 py-3">{data.planned}</td>
                            <td className="px-4 py-3">{data.actual}</td>
                            <td className="px-4 py-3">{data.achievement}%</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <div className="relative w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`absolute top-0 left-0 h-full rounded-full ${
                                      data.achievement >= 100 ? 'bg-green-500' : 
                                      data.achievement >= 70 ? 'bg-blue-500' : 
                                      data.achievement >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`} 
                                    style={{ width: `${Math.min(100, data.achievement)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
                  * 위 데이터는 월별 생산 계획 대비 실제 생산량을 나타냅니다.
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400 mb-4">표시할 데이터가 없습니다.</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">생산 계획과 실적을 등록하면 여기에 차트가 표시됩니다.</p>
              </div>
            )}
          </div>
          
          {/* 모델별 실적 차트 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">모델별 실적</h3>
            
            {performances.length > 0 ? (
              <div>
                {/* 모델별 데이터를 계산하고 표시하는 로직이 필요함 */}
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400">이 섹션은 실제 사용 데이터에 따라 개선될 예정입니다.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400 mb-4">표시할 데이터가 없습니다.</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">생산 실적을 등록하면 여기에 모델별 실적이 표시됩니다.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 모델 관리 탭
function ProductionModelTab({ onRefresh }: { onRefresh: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [models, setModels] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [managers, setManagers] = useState<any[]>([]);
  const [newModel, setNewModel] = useState({
    model_name: '',
    product_name: '',
    specifications: '',
    material_type: 'ABS', // 기본값
    manager: '',
  });

  useEffect(() => {
    fetchModels();
    fetchManagers();
  }, []);

  const fetchModels = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('product_models')
        .select('*')
        .order('created_at', { ascending: false });
          
      if (error) throw error;
      setModels(data || []);
    } catch (error: any) {
      console.error('모델 목록 로딩 오류:', error.message || error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name')
        .order('full_name');
          
      if (error) throw error;
      setManagers(data || []);
    } catch (error: any) {
      console.error('담당자 목록 로딩 오류:', error.message || error);
    }
  };

  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      // 현재 로그인한 사용자의 ID 가져오기
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      
      if (!userId) {
        alert('로그인이 필요합니다.');
        return;
      }
      
      const { data, error } = await supabase
        .from('product_models')
        .insert([
          {
            ...newModel,
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (error) throw error;
      
      // 새로운 모델 추가 후 목록 새로고침
      onRefresh();
      fetchModels();
      setShowAddModal(false);
      setNewModel({
        model_name: '',
        product_name: '',
        specifications: '',
        material_type: 'ABS',
        manager: '',
      });
      
    } catch (error: any) {
      console.error('모델 추가 오류:', error.message || error);
      alert('모델 추가 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteModel = async (id: string) => {
    if (!confirm('이 모델을 삭제하시겠습니까?')) return;
    
    try {
      const { error } = await supabase
        .from('product_models')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // 목록 새로고침
      fetchModels();
    } catch (error) {
      console.error('모델 삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };
  
  // 검색어에 따른 필터링
  const filteredModels = models.filter(model => 
    model.model_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.specifications.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-lg font-semibold">모델 관리</h2>
        
        <div className="flex mt-4 md:mt-0 space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <span className="mr-1">+</span> 새 모델 등록
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-100 rounded-full animate-ping opacity-75"></div>
            <div className="absolute top-0 left-0 w-full h-full border-t-4 border-blue-500 rounded-full animate-spin"></div>
          </div>
        </div>
      ) : filteredModels.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">모델명</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">제품명</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">스펙</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">원자재</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">담당자</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {filteredModels.map((model) => (
                <tr key={model.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3">{model.model_name}</td>
                  <td className="px-4 py-3">{model.product_name}</td>
                  <td className="px-4 py-3">{model.specifications}</td>
                  <td className="px-4 py-3">{model.material_type}</td>
                  <td className="px-4 py-3">{model.manager}</td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      onClick={() => handleDeleteModel(model.id)}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 mb-4">등록된 모델이 없습니다.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            새 모델 등록하기
          </button>
        </div>
      )}
      
      {/* 모델 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">새 모델 등록</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddModel}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">모델명</label>
                <input
                  type="text"
                  required
                  value={newModel.model_name}
                  onChange={(e) => setNewModel({...newModel, model_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">제품명</label>
                <input
                  type="text"
                  required
                  value={newModel.product_name}
                  onChange={(e) => setNewModel({...newModel, product_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">스펙</label>
                <textarea
                  rows={3}
                  value={newModel.specifications}
                  onChange={(e) => setNewModel({...newModel, specifications: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                ></textarea>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">원자재</label>
                <select
                  value={newModel.material_type}
                  onChange={(e) => setNewModel({...newModel, material_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="ABS">ABS</option>
                  <option value="HIPS">HIPS</option>
                  <option value="PP">PP</option>
                  <option value="PE">PE</option>
                  <option value="기타">기타</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">담당자</label>
                <select
                  value={newModel.manager}
                  onChange={(e) => setNewModel({...newModel, manager: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">담당자 선택</option>
                  {managers.map(manager => (
                    <option key={manager.id} value={manager.full_name}>{manager.full_name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 