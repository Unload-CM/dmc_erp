'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShippingPlan } from '@/types';
import { FaTruck, FaBuilding, FaIndustry, FaSearch, FaFilter } from 'react-icons/fa';

export default function ShippingPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'client' | 'vendor'>('list');
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
            <FaTruck className="mr-3 text-blue-500" /> 출하관리
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">출하 목록, 고객사 및 업체를 관리합니다.</p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <TabButton 
            isActive={activeTab === 'list'} 
            onClick={() => setActiveTab('list')}
            icon="🚛"
            label="출하 목록"
          />
          <TabButton 
            isActive={activeTab === 'client'} 
            onClick={() => setActiveTab('client')}
            icon="🏢"
            label="고객사 관리"
          />
          <TabButton 
            isActive={activeTab === 'vendor'} 
            onClick={() => setActiveTab('vendor')}
            icon="🔗"
            label="업체 관리"
          />
        </div>
        
        <div className="p-6">
          {activeTab === 'list' && <ShippingListTab key={`list-${refreshFlag}`} onRefresh={refreshPage} />}
          {activeTab === 'client' && <ClientManagementTab key={`client-${refreshFlag}`} onRefresh={refreshPage} />}
          {activeTab === 'vendor' && <VendorManagementTab key={`vendor-${refreshFlag}`} onRefresh={refreshPage} />}
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

// 출하 목록 탭
function ShippingListTab({ onRefresh }: { onRefresh: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [shippingPlans, setShippingPlans] = useState<ShippingPlan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  
  const [newShipping, setNewShipping] = useState<Partial<ShippingPlan>>({
    title: '',
    description: '',
    model_id: '',
    model_name: '',
    product_name: '',
    quantity: 0,
    unit_price: 0,
    total_amount: 0,
    client_id: '',
    client_name: '',
    shipping_date: '',
    etd: '',
    eta: '',
    destination: '',
    status: 'planned'
  });
  
  useEffect(() => {
    fetchShippingPlans();
    fetchModels();
    fetchClients();
  }, []);
  
  const fetchShippingPlans = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('shipping_plans')
        .select('*')
        .order('shipping_date', { ascending: true });
          
      if (error) throw error;
      setShippingPlans(data || []);
    } catch (error: any) {
      console.error('출하 목록 로딩 오류:', error.message || error);
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

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
          
      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error('고객사 목록 로딩 오류:', error.message || error);
    }
  };

  const handleModelChange = (modelId: string) => {
    const selectedModel = models.find(model => model.id === modelId);
    if (selectedModel) {
      setNewShipping({
        ...newShipping,
        model_id: modelId,
        model_name: selectedModel.model_name,
        product_name: selectedModel.product_name,
      });
    }
  };

  const handleClientChange = (clientId: string) => {
    const selectedClient = clients.find(client => client.id === clientId);
    if (selectedClient) {
      setNewShipping({
        ...newShipping,
        client_id: clientId,
        client_name: selectedClient.name,
        destination: selectedClient.location || '',
      });
    }
  };

  const calculateTotalAmount = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  };

  const handleQuantityChange = (quantity: number) => {
    const totalAmount = calculateTotalAmount(quantity, newShipping.unit_price || 0);
    setNewShipping({
      ...newShipping,
      quantity,
      total_amount: totalAmount
    });
  };

  const handleUnitPriceChange = (unitPrice: number) => {
    const totalAmount = calculateTotalAmount(newShipping.quantity || 0, unitPrice);
    setNewShipping({
      ...newShipping,
      unit_price: unitPrice,
      total_amount: totalAmount
    });
  };
  
  const handleAddShipping = async (e: React.FormEvent) => {
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
        .from('shipping_plans')
        .insert([
          {
            ...newShipping,
            created_by: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (error) throw error;
      
      // 새로운 출하 추가 후 목록 새로고침
      onRefresh();
      fetchShippingPlans();
      setShowAddModal(false);
      setNewShipping({
        title: '',
        description: '',
        model_id: '',
        model_name: '',
        product_name: '',
        quantity: 0,
        unit_price: 0,
        total_amount: 0,
        client_id: '',
        client_name: '',
        shipping_date: '',
        etd: '',
        eta: '',
        destination: '',
        status: 'planned'
      });
      
    } catch (error: any) {
      console.error('출하 계획 추가 오류:', error.message || error);
      alert('출하 계획 추가 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateStatus = async (id: string, newStatus: 'planned' | 'shipped' | 'delivered' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('shipping_plans')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // 목록 새로고침
      fetchShippingPlans();
    } catch (error) {
      console.error('출하 상태 업데이트 오류:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };
  
  const handleDeleteShipping = async (id: string) => {
    if (!confirm('이 출하 계획을 삭제하시겠습니까?')) return;
    
    try {
      const { error } = await supabase
        .from('shipping_plans')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // 목록 새로고침
      fetchShippingPlans();
    } catch (error) {
      console.error('출하 계획 삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };
  
  // 검색어에 따른 필터링
  const filteredShippings = shippingPlans.filter(shipping => 
    shipping.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipping.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipping.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-lg font-semibold">출하 목록 관리</h2>
        
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
            <span className="mr-1">+</span> 출하 등록
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
      ) : filteredShippings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">제목</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">모델</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">제품명</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">수량</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">총금액</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">고객사</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">출하일</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">ETD/ETA</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">상태</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {filteredShippings.map((shipping) => (
                <tr key={shipping.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3">{shipping.title}</td>
                  <td className="px-4 py-3">{shipping.model_name || '-'}</td>
                  <td className="px-4 py-3">{shipping.product_name || '-'}</td>
                  <td className="px-4 py-3">{shipping.quantity || 0}</td>
                  <td className="px-4 py-3">{shipping.total_amount?.toLocaleString() || 0}원</td>
                  <td className="px-4 py-3">{shipping.client_name || '-'}</td>
                  <td className="px-4 py-3">{new Date(shipping.shipping_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {shipping.etd ? new Date(shipping.etd).toLocaleString() : '-'} / 
                    {shipping.eta ? new Date(shipping.eta).toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      shipping.status === 'planned' ? 'bg-yellow-100 text-yellow-800' :
                      shipping.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      shipping.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {shipping.status === 'planned' ? '계획됨' :
                       shipping.status === 'shipped' ? '발송됨' :
                       shipping.status === 'delivered' ? '배송완료' : '취소됨'}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      onClick={() => handleUpdateStatus(shipping.id, 'shipped')}
                      className="px-2 py-1 text-xs bg-blue-500 text-white rounded"
                      disabled={shipping.status === 'shipped' || shipping.status === 'delivered'}
                    >
                      발송
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(shipping.id, 'delivered')}
                      className="px-2 py-1 text-xs bg-green-500 text-white rounded"
                      disabled={shipping.status === 'delivered'}
                    >
                      완료
                    </button>
                    <button
                      onClick={() => handleDeleteShipping(shipping.id)}
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
          <p className="text-gray-500 dark:text-gray-400 mb-4">등록된 출하 계획이 없습니다.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            새 출하 등록하기
          </button>
        </div>
      )}
      
      {/* 출하 계획 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">새 출하 등록</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddShipping}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">제목</label>
                <input
                  type="text"
                  required
                  value={newShipping.title}
                  onChange={(e) => setNewShipping({...newShipping, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">모델</label>
                <select
                  required
                  value={newShipping.model_id}
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
                  value={newShipping.product_name || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none dark:bg-gray-600 dark:border-gray-700 dark:text-gray-300"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">수량</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newShipping.quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">단가</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newShipping.unit_price}
                    onChange={(e) => handleUnitPriceChange(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">총 금액</label>
                <input
                  type="text"
                  readOnly
                  value={`${newShipping.total_amount?.toLocaleString() || 0}원`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none dark:bg-gray-600 dark:border-gray-700 dark:text-gray-300"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">고객사</label>
                <select
                  required
                  value={newShipping.client_id}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">고객사 선택</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name} ({client.short_name})</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">목적지</label>
                <input
                  type="text"
                  required
                  value={newShipping.destination}
                  onChange={(e) => setNewShipping({...newShipping, destination: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">출하일</label>
                <input
                  type="date"
                  required
                  value={newShipping.shipping_date}
                  onChange={(e) => setNewShipping({...newShipping, shipping_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">예상 출발 시간 (ETD)</label>
                  <input
                    type="datetime-local"
                    value={newShipping.etd}
                    onChange={(e) => setNewShipping({...newShipping, etd: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">예상 도착 시간 (ETA)</label>
                  <input
                    type="datetime-local"
                    value={newShipping.eta}
                    onChange={(e) => setNewShipping({...newShipping, eta: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">설명</label>
                <textarea
                  rows={2}
                  value={newShipping.description}
                  onChange={(e) => setNewShipping({...newShipping, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                ></textarea>
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

// 고객사 관리 탭
function ClientManagementTab({ onRefresh }: { onRefresh: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    short_name: '',
    location: '',
    contact: '',
    contact_person: '',
    status: 'active'
  });
  
  useEffect(() => {
    fetchClients();
  }, []);
  
  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });
          
      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error('고객사 목록 로딩 오류:', error.message || error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddClient = async (e: React.FormEvent) => {
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
        .from('clients')
        .insert([
          {
            ...newClient,
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (error) throw error;
      
      // 새로운 고객사 추가 후 목록 새로고침
      onRefresh();
      fetchClients();
      setShowAddModal(false);
      setNewClient({
        name: '',
        short_name: '',
        location: '',
        contact: '',
        contact_person: '',
        status: 'active'
      });
      
    } catch (error: any) {
      console.error('고객사 추가 오류:', error.message || error);
      alert('고객사 추가 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteClient = async (id: string) => {
    if (!confirm('이 고객사를 삭제하시겠습니까?')) return;
    
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // 목록 새로고침
      fetchClients();
    } catch (error) {
      console.error('고객사 삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };
  
  const handleUpdateStatus = async (id: string, newStatus: 'active' | 'hold' | 'inactive') => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // 목록 새로고침
      fetchClients();
    } catch (error) {
      console.error('고객사 상태 업데이트 오류:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };
  
  // 검색어에 따른 필터링
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.short_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-lg font-semibold">고객사 관리</h2>
        
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
            <span className="mr-1">+</span> 고객사 추가
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
      ) : filteredClients.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">고객사</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">고객사 약칭</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">위치</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">연락처</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">담당자</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">상태</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3">{client.name}</td>
                  <td className="px-4 py-3">{client.short_name}</td>
                  <td className="px-4 py-3">{client.location}</td>
                  <td className="px-4 py-3">{client.contact}</td>
                  <td className="px-4 py-3">{client.contact_person}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      client.status === 'active' ? 'bg-green-100 text-green-800' :
                      client.status === 'hold' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {client.status === 'active' ? '거래중' :
                       client.status === 'hold' ? '거래 보류' : '거래중지'}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      onClick={() => handleUpdateStatus(client.id, 'active')}
                      className="px-2 py-1 text-xs bg-green-500 text-white rounded"
                      disabled={client.status === 'active'}
                    >
                      거래중
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(client.id, 'hold')}
                      className="px-2 py-1 text-xs bg-yellow-500 text-white rounded"
                      disabled={client.status === 'hold'}
                    >
                      보류
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(client.id, 'inactive')}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded"
                      disabled={client.status === 'inactive'}
                    >
                      중지
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      className="px-2 py-1 text-xs bg-gray-500 text-white rounded ml-2"
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
          <p className="text-gray-500 dark:text-gray-400 mb-4">등록된 고객사가 없습니다.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            고객사 등록하기
          </button>
        </div>
      )}
      
      {/* 고객사 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">새 고객사 등록</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddClient}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">고객사명</label>
                <input
                  type="text"
                  required
                  value={newClient.name}
                  onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="예: THAI SAMSUNG"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">고객사 약칭</label>
                <input
                  type="text"
                  required
                  value={newClient.short_name}
                  onChange={(e) => setNewClient({...newClient, short_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="예: TSE"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">위치</label>
                <input
                  type="text"
                  value={newClient.location}
                  onChange={(e) => setNewClient({...newClient, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="예: Thailand, Bangkok"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">연락처</label>
                <input
                  type="text"
                  value={newClient.contact}
                  onChange={(e) => setNewClient({...newClient, contact: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="예: +66-2-123-4567"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">담당자 이름</label>
                <input
                  type="text"
                  value={newClient.contact_person}
                  onChange={(e) => setNewClient({...newClient, contact_person: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="예: John Doe"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">상태</label>
                <select
                  value={newClient.status}
                  onChange={(e) => setNewClient({...newClient, status: e.target.value as 'active' | 'hold' | 'inactive'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="active">거래중</option>
                  <option value="hold">거래 보류</option>
                  <option value="inactive">거래중지</option>
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

// 공급업체 관리 탭
function VendorManagementTab({ onRefresh }: { onRefresh: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [vendors, setVendors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: '',
    short_name: '',
    location: '',
    contact: '',
    contact_person: '',
    supplied_materials: '',
    status: 'active'
  });
  
  useEffect(() => {
    fetchVendors();
  }, []);
  
  const fetchVendors = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name', { ascending: true });
          
      if (error) throw error;
      setVendors(data || []);
    } catch (error: any) {
      console.error('공급업체 목록 로딩 오류:', error.message || error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddVendor = async (e: React.FormEvent) => {
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
        .from('vendors')
        .insert([
          {
            ...newVendor,
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (error) throw error;
      
      // 새로운 공급업체 추가 후 목록 새로고침
      onRefresh();
      fetchVendors();
      setShowAddModal(false);
      setNewVendor({
        name: '',
        short_name: '',
        location: '',
        contact: '',
        contact_person: '',
        supplied_materials: '',
        status: 'active'
      });
      
    } catch (error: any) {
      console.error('공급업체 추가 오류:', error.message || error);
      alert('공급업체 추가 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteVendor = async (id: string) => {
    if (!confirm('이 공급업체를 삭제하시겠습니까?')) return;
    
    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // 목록 새로고침
      fetchVendors();
    } catch (error) {
      console.error('공급업체 삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };
  
  const handleUpdateStatus = async (id: string, newStatus: 'active' | 'hold' | 'inactive') => {
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // 목록 새로고침
      fetchVendors();
    } catch (error) {
      console.error('공급업체 상태 업데이트 오류:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };
  
  // 검색어에 따른 필터링
  const filteredVendors = vendors.filter(vendor => 
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.short_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.supplied_materials.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-lg font-semibold">공급업체 관리</h2>
        
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
            <span className="mr-1">+</span> 공급업체 추가
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
      ) : filteredVendors.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">공급업체</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">약칭</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">위치</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">연락처</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">담당자</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">공급품목</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">상태</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3">{vendor.name}</td>
                  <td className="px-4 py-3">{vendor.short_name}</td>
                  <td className="px-4 py-3">{vendor.location}</td>
                  <td className="px-4 py-3">{vendor.contact}</td>
                  <td className="px-4 py-3">{vendor.contact_person}</td>
                  <td className="px-4 py-3">{vendor.supplied_materials}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      vendor.status === 'active' ? 'bg-green-100 text-green-800' :
                      vendor.status === 'hold' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {vendor.status === 'active' ? '거래중' :
                       vendor.status === 'hold' ? '거래 보류' : '거래중지'}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      onClick={() => handleUpdateStatus(vendor.id, 'active')}
                      className="px-2 py-1 text-xs bg-green-500 text-white rounded"
                      disabled={vendor.status === 'active'}
                    >
                      거래중
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(vendor.id, 'hold')}
                      className="px-2 py-1 text-xs bg-yellow-500 text-white rounded"
                      disabled={vendor.status === 'hold'}
                    >
                      보류
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(vendor.id, 'inactive')}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded"
                      disabled={vendor.status === 'inactive'}
                    >
                      중지
                    </button>
                    <button
                      onClick={() => handleDeleteVendor(vendor.id)}
                      className="px-2 py-1 text-xs bg-gray-500 text-white rounded ml-2"
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
          <p className="text-gray-500 dark:text-gray-400 mb-4">등록된 공급업체가 없습니다.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            공급업체 등록하기
          </button>
        </div>
      )}
      
      {/* 공급업체 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">새 공급업체 등록</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddVendor}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">공급업체명</label>
                <input
                  type="text"
                  required
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="예: ABC Materials Co., Ltd."
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">약칭</label>
                <input
                  type="text"
                  required
                  value={newVendor.short_name}
                  onChange={(e) => setNewVendor({...newVendor, short_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="예: ABC"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">위치</label>
                <input
                  type="text"
                  value={newVendor.location}
                  onChange={(e) => setNewVendor({...newVendor, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="예: China, Shenzhen"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">연락처</label>
                <input
                  type="text"
                  value={newVendor.contact}
                  onChange={(e) => setNewVendor({...newVendor, contact: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="예: +86-755-1234-5678"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">담당자 이름</label>
                <input
                  type="text"
                  value={newVendor.contact_person}
                  onChange={(e) => setNewVendor({...newVendor, contact_person: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="예: Mr. Zhang"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">공급품목</label>
                <input
                  type="text"
                  value={newVendor.supplied_materials}
                  onChange={(e) => setNewVendor({...newVendor, supplied_materials: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="예: PCB, 전자부품, 플라스틱 사출"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">상태</label>
                <select
                  value={newVendor.status}
                  onChange={(e) => setNewVendor({...newVendor, status: e.target.value as 'active' | 'hold' | 'inactive'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="active">거래중</option>
                  <option value="hold">거래 보류</option>
                  <option value="inactive">거래중지</option>
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