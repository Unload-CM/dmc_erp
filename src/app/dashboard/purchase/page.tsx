'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PurchaseRequest, PurchaseOrder, Vendor } from '@/types';
import { FaShoppingCart, FaClipboardCheck, FaListAlt, FaSearch, FaFilter, FaBuilding } from 'react-icons/fa';

export default function PurchasePage() {
  const [activeTab, setActiveTab] = useState<'request' | 'order' | 'list' | 'vendor'>('request');
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
            <FaShoppingCart className="mr-3 text-blue-500" /> 구매관리
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">구매 요청, 발주 및 발주서 목록을 관리합니다.</p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <TabButton 
            isActive={activeTab === 'request'} 
            onClick={() => setActiveTab('request')}
            icon="📌"
            label="구매 요청"
          />
          <TabButton 
            isActive={activeTab === 'order'} 
            onClick={() => setActiveTab('order')}
            icon="📝"
            label="구매 발주"
          />
          <TabButton 
            isActive={activeTab === 'list'} 
            onClick={() => setActiveTab('list')}
            icon="📄"
            label="발주서 목록"
          />
          <TabButton 
            isActive={activeTab === 'vendor'} 
            onClick={() => setActiveTab('vendor')}
            icon="🏢"
            label="업체 관리"
          />
        </div>
        
        <div className="p-6">
          {activeTab === 'request' && <PurchaseRequestTab key={`request-${refreshFlag}`} onRefresh={refreshPage} />}
          {activeTab === 'order' && <PurchaseOrderTab key={`order-${refreshFlag}`} onRefresh={refreshPage} />}
          {activeTab === 'list' && <PurchaseListTab key={`list-${refreshFlag}`} onRefresh={refreshPage} />}
          {activeTab === 'vendor' && <VendorTab key={`vendor-${refreshFlag}`} onRefresh={refreshPage} />}
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

// 구매 요청 탭
function PurchaseRequestTab({ onRefresh }: { onRefresh: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRequest, setNewRequest] = useState<Partial<PurchaseRequest>>({
    title: '',
    description: '',
    quantity: 1,  // 기본값을 0에서 1로 변경
    vendor: '',
    unit_price: 0,
    status: 'pending'
  });
  
  useEffect(() => {
    checkAndCreateTables();
  }, []);
  
  const checkAndCreateTables = async () => {
    try {
      // 구매 요청 테이블 확인 및 생성
      const { error: purchaseRequestsError } = await supabase
        .from('purchase_requests')
        .select('id')
        .limit(1);
        
      if (purchaseRequestsError && purchaseRequestsError.code === '42P01') {
        console.log('구매 요청 테이블 생성 중...');
        const { error: createError } = await supabase.rpc('create_purchase_tables');
        
        if (createError) {
          // 함수가 존재하지 않는 경우 직접 테이블 생성
          console.log('수동으로 테이블 생성 중...');
          try {
            // 구매 요청 테이블 생성
            await supabase.from('purchase_requests').insert({
              id: '00000000-0000-0000-0000-000000000000',
              user_id: '00000000-0000-0000-0000-000000000000',
              title: '테이블 초기화',
              description: '테이블 초기화',
              quantity: 0,
              vendor: '초기값',
              unit_price: 0,
              status: 'pending',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
            // 구매 발주 테이블 생성
            await supabase.from('purchase_orders').insert({
              id: '00000000-0000-0000-0000-000000000000',
              request_id: '00000000-0000-0000-0000-000000000000',
              title: '테이블 초기화',
              description: '테이블 초기화',
              quantity: 0,
              vendor: '초기값',
              unit_price: 0,
              total_amount: 0,
              status: 'pending',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
            // 인보이스 테이블 생성
            await supabase.from('invoices').insert({
              id: '00000000-0000-0000-0000-000000000000',
              order_id: '00000000-0000-0000-0000-000000000000',
              invoice_number: 'INIT-000',
              title: '테이블 초기화',
              description: '테이블 초기화',
              quantity: 0,
              vendor: '초기값',
              unit_price: 0,
              total_amount: 0,
              issue_date: new Date().toISOString(),
              created_at: new Date().toISOString()
            });
            
            console.log('테이블 생성 완료');
          } catch (error) {
            console.error('테이블 생성 중 오류:', error);
          }
        }
      }
      
      // 테이블 생성 후 데이터 가져오기
      fetchPurchaseRequests();
    } catch (error) {
      console.error('테이블 확인 중 오류:', error);
      setIsLoading(false);
    }
  };
  
  const fetchPurchaseRequests = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('purchase_requests')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setPurchaseRequests(data || []);
    } catch (error) {
      console.error('구매 요청 목록 로딩 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddRequest = async (e: React.FormEvent) => {
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
      
      // NaN 값 방지를 위한 안전한 수치 변환
      const safeRequest = {
        ...newRequest,
        quantity: isNaN(Number(newRequest.quantity)) ? 1 : Number(newRequest.quantity),
        unit_price: isNaN(Number(newRequest.unit_price)) ? 0 : Number(newRequest.unit_price)
      };
      
      const { data, error } = await supabase
        .from('purchase_requests')
        .insert([
          {
            ...safeRequest,
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (error) throw error;
      
      // 새로운 요청 추가 후 목록 새로고침
      onRefresh();
      fetchPurchaseRequests();
      setShowAddModal(false);
      setNewRequest({
        title: '',
        description: '',
        quantity: 1,
        vendor: '',
        unit_price: 0,
        status: 'pending'
      });
      
    } catch (error) {
      console.error('구매 요청 추가 오류:', error);
      alert('구매 요청 추가 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateStatus = async (id: string, newStatus: 'pending' | 'approved' | 'rejected' | 'completed') => {
    try {
      const { error } = await supabase
        .from('purchase_requests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // 목록 새로고침
      fetchPurchaseRequests();
    } catch (error) {
      console.error('구매 요청 상태 업데이트 오류:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };
  
  const handleDeleteRequest = async (id: string) => {
    if (!confirm('이 구매 요청을 삭제하시겠습니까?')) return;
    
    try {
      const { error } = await supabase
        .from('purchase_requests')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // 목록 새로고침
      fetchPurchaseRequests();
    } catch (error) {
      console.error('구매 요청 삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };
  
  // 검색어에 따른 필터링
  const filteredRequests = purchaseRequests.filter(request => 
    request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-lg font-semibold">구매 요청 관리</h2>
        
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
            <span className="mr-1">+</span> 구매 요청 등록
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
      ) : filteredRequests.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">제목</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">수량</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">업체</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">단가</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">총 금액</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">상태</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">생성일</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3">{request.title}</td>
                  <td className="px-4 py-3">{isNaN(request.quantity) ? 0 : request.quantity}</td>
                  <td className="px-4 py-3">{request.vendor}</td>
                  <td className="px-4 py-3">{isNaN(request.unit_price) ? 0 : request.unit_price?.toLocaleString()}원</td>
                  <td className="px-4 py-3">{
                    (() => {
                      const qty = isNaN(request.quantity) ? 0 : request.quantity;
                      const price = isNaN(request.unit_price) ? 0 : request.unit_price;
                      return (qty * price).toLocaleString();
                    })()
                  }원</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {request.status === 'pending' ? '대기중' :
                       request.status === 'approved' ? '승인됨' :
                       request.status === 'rejected' ? '거부됨' : '완료됨'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{new Date(request.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      onClick={() => handleUpdateStatus(request.id, 'approved')}
                      className="px-2 py-1 text-xs bg-green-500 text-white rounded"
                      disabled={request.status === 'approved'}
                    >
                      승인
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(request.id, 'rejected')}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded"
                      disabled={request.status === 'rejected'}
                    >
                      거부
                    </button>
                    <button
                      onClick={() => handleDeleteRequest(request.id)}
                      className="px-2 py-1 text-xs bg-gray-500 text-white rounded"
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
          <p className="text-gray-500 dark:text-gray-400 mb-4">등록된 구매 요청이 없습니다.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            새 구매 요청 등록하기
          </button>
        </div>
      )}
      
      {/* 구매 요청 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">새 구매 요청 등록</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddRequest}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">제목</label>
                <input
                  type="text"
                  required
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">설명</label>
                <textarea
                  rows={4}
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                ></textarea>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">수량</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newRequest.quantity === undefined || isNaN(Number(newRequest.quantity)) ? '' : newRequest.quantity}
                  onChange={(e) => {
                    const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                    setNewRequest({...newRequest, quantity: isNaN(Number(value)) ? 1 : value});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">업체</label>
                <input
                  type="text"
                  required
                  value={newRequest.vendor}
                  onChange={(e) => setNewRequest({...newRequest, vendor: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">단가</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newRequest.unit_price === undefined || isNaN(Number(newRequest.unit_price)) ? '' : newRequest.unit_price}
                  onChange={(e) => {
                    const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                    setNewRequest({...newRequest, unit_price: isNaN(Number(value)) ? 0 : value});
                  }}
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

// 구매 발주 탭
function PurchaseOrderTab({ onRefresh }: { onRefresh: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<PurchaseRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [newOrder, setNewOrder] = useState<Partial<PurchaseOrder>>({
    status: 'pending'
  });
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 테이블 확인 및 생성 함수 호출(PurchaseRequestTab에서 이미 호출했을 수 있지만 안전하게 재확인)
        const { error: tableError } = await supabase
          .from('purchase_orders')
          .select('id')
          .limit(1);
          
        if (tableError && tableError.code === '42P01') {
          // 테이블이 없는 경우 PurchaseRequestTab에서 생성할 것이므로 잠시 대기
          setTimeout(() => fetchData(), 2000);
          return;
        }
        
        await Promise.all([fetchPurchaseOrders(), fetchApprovedRequests()]);
      } catch (error) {
        console.error('데이터 로딩 오류:', error);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const fetchPurchaseOrders = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setPurchaseOrders(data || []);
    } catch (error) {
      console.error('구매 발주 목록 로딩 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchApprovedRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_requests')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setApprovedRequests(data || []);
    } catch (error) {
      console.error('승인된 구매 요청 목록 로딩 오류:', error);
    }
  };
  
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      // 선택된 요청 정보 가져오기
      const selectedRequestData = approvedRequests.find(req => req.id === selectedRequest);
      if (!selectedRequestData) {
        alert('요청 정보를 찾을 수 없습니다.');
        return;
      }
      
      // 구매 발주 생성
      const { data, error } = await supabase
        .from('purchase_orders')
        .insert([
          {
            request_id: selectedRequestData.id,
            title: selectedRequestData.title,
            description: selectedRequestData.description,
            quantity: selectedRequestData.quantity,
            vendor: selectedRequestData.vendor,
            unit_price: selectedRequestData.unit_price,
            total_amount: selectedRequestData.quantity * selectedRequestData.unit_price,
            status: newOrder.status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (error) throw error;
      
      // 구매 요청 상태 업데이트
      await supabase
        .from('purchase_requests')
        .update({ status: 'completed' })
        .eq('id', selectedRequestData.id);
      
      // 목록 새로고침
      onRefresh();
      fetchPurchaseOrders();
      fetchApprovedRequests();
      setShowCreateModal(false);
      setSelectedRequest(null);
      setNewOrder({ status: 'pending' });
      
    } catch (error) {
      console.error('구매 발주 생성 오류:', error);
      alert('구매 발주 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateStatus = async (id: string, newStatus: 'pending' | 'in_progress' | 'approved') => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('purchase_orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // 승인 상태일 경우 인보이스 생성
      if (newStatus === 'approved') {
        await createInvoice(id);
      }
      
      // 목록 새로고침
      fetchPurchaseOrders();
    } catch (error) {
      console.error('구매 발주 상태 업데이트 오류:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const createInvoice = async (orderId: string) => {
    try {
      // 발주 정보 가져오기
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('id', orderId)
        .single();
      
      if (error) throw error;
      if (!data) {
        throw new Error('발주 정보를 찾을 수 없습니다.');
      }
      
      // 인보이스 번호 생성 (DMC-날짜-001 형식)
      const today = new Date();
      const dateStr = today.getFullYear().toString() +
                    (today.getMonth() + 1).toString().padStart(2, '0') +
                    today.getDate().toString().padStart(2, '0');
      
      // 마지막 인보이스 번호 가져오기
      const { data: lastInvoice, error: countError } = await supabase
        .from('invoices')
        .select('invoice_number')
        .order('created_at', { ascending: false })
        .limit(1);
        
      let invoiceNumber = `DMC-${dateStr}-001`;
      
      if (!countError && lastInvoice && lastInvoice.length > 0) {
        const lastNum = lastInvoice[0].invoice_number.split('-')[2];
        const nextNum = (parseInt(lastNum) + 1).toString().padStart(3, '0');
        invoiceNumber = `DMC-${dateStr}-${nextNum}`;
      }
      
      // 인보이스 생성
      const { error: insertError } = await supabase
        .from('invoices')
        .insert([
          {
            order_id: orderId,
            invoice_number: invoiceNumber,
            title: data.title,
            description: data.description,
            quantity: data.quantity,
            vendor: data.vendor,
            unit_price: data.unit_price,
            total_amount: data.total_amount,
            issue_date: today.toISOString(),
            created_at: today.toISOString()
          }
        ]);
      
      if (insertError) throw insertError;
      
    } catch (error) {
      console.error('인보이스 생성 오류:', error);
      alert('인보이스 생성 중 오류가 발생했습니다.');
    }
  };
  
  // 검색어에 따른 필터링
  const filteredOrders = purchaseOrders.filter(order => 
    order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.vendor.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-lg font-semibold">구매 발주 관리</h2>
        
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
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            disabled={approvedRequests.length === 0}
          >
            <span className="mr-1">+</span> 구매 발주 생성
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
      ) : filteredOrders.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">제목</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">수량</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">업체</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">단가</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">총 금액</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">상태</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">생성일</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3">{order.title}</td>
                  <td className="px-4 py-3">{order.quantity}</td>
                  <td className="px-4 py-3">{order.vendor}</td>
                  <td className="px-4 py-3">{order.unit_price?.toLocaleString()}원</td>
                  <td className="px-4 py-3">{order.total_amount?.toLocaleString()}원</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {order.status === 'pending' ? '승인대기' :
                       order.status === 'in_progress' ? '진행중' : '승인완료'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 space-x-2">
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value as 'pending' | 'in_progress' | 'approved')}
                      className="px-2 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">승인대기</option>
                      <option value="in_progress">진행중</option>
                      <option value="approved">승인완료</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 mb-4">등록된 구매 발주가 없습니다.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            disabled={approvedRequests.length === 0}
          >
            새 구매 발주 생성하기
          </button>
        </div>
      )}
      
      {/* 구매 발주 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">새 구매 발주 생성</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateOrder}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">승인된 구매 요청</label>
                {approvedRequests.length > 0 ? (
                  <select
                    required
                    value={selectedRequest || ''}
                    onChange={(e) => setSelectedRequest(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">요청을 선택하세요</option>
                    {approvedRequests.map(req => (
                      <option key={req.id} value={req.id}>
                        {req.title} - {req.vendor} ({req.quantity}개, {req.unit_price?.toLocaleString()}원)
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">승인된 구매 요청이 없습니다.</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">상태</label>
                <select
                  required
                  value={newOrder.status || 'pending'}
                  onChange={(e) => setNewOrder({...newOrder, status: e.target.value as 'pending' | 'in_progress' | 'approved'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="pending">승인대기</option>
                  <option value="in_progress">진행중</option>
                  <option value="approved">승인완료</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !selectedRequest}
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

// 발주서 목록 탭
function PurchaseListTab({ onRefresh }: { onRefresh: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 테이블 확인 및 생성 함수 호출(이미 호출했을 수 있지만 안전하게 재확인)
        const { error: tableError } = await supabase
          .from('invoices')
          .select('id')
          .limit(1);
          
        if (tableError && tableError.code === '42P01') {
          // 테이블이 없는 경우 PurchaseRequestTab에서 생성할 것이므로 잠시 대기
          setTimeout(() => fetchData(), 2000);
          return;
        }
        
        await fetchInvoices();
      } catch (error) {
        console.error('데이터 로딩 오류:', error);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('인보이스 목록 로딩 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 검색어에 따른 필터링
  const filteredInvoices = invoices.filter(invoice => 
    invoice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-lg font-semibold">발주서 목록</h2>
        
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
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-100 rounded-full animate-ping opacity-75"></div>
            <div className="absolute top-0 left-0 w-full h-full border-t-4 border-blue-500 rounded-full animate-spin"></div>
          </div>
        </div>
      ) : filteredInvoices.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">인보이스 번호</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">제목</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">업체</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">수량</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">단가</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">총 금액</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">발행일</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 font-medium">{invoice.invoice_number}</td>
                  <td className="px-4 py-3">{invoice.title}</td>
                  <td className="px-4 py-3">{invoice.vendor}</td>
                  <td className="px-4 py-3">{invoice.quantity}</td>
                  <td className="px-4 py-3">{invoice.unit_price?.toLocaleString()}원</td>
                  <td className="px-4 py-3">{invoice.total_amount?.toLocaleString()}원</td>
                  <td className="px-4 py-3">{new Date(invoice.issue_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button
                      className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      onClick={() => window.alert('발주서 출력 기능이 곧 추가될 예정입니다.')}
                    >
                      출력
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 mb-4">등록된 발주서가 없습니다.</p>
          <p className="text-gray-500 dark:text-gray-400">
            구매 발주를 승인하면 자동으로 발주서가 생성됩니다.
          </p>
        </div>
      )}
    </div>
  );
}

// 구매 업체 관리 탭
function VendorTab({ onRefresh }: { onRefresh: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hold' | 'inactive'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [newVendor, setNewVendor] = useState<Partial<Vendor>>({
    name: '',
    product_name: '',
    unit_price: 0,
    location: '',
    contact_person: '',
    phone_number: '',
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
    } catch (error) {
      console.error('업체 목록 로딩 오류:', error);
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
      
      // 새로운 업체 추가 후 목록 새로고침
      fetchVendors();
      setShowAddModal(false);
      setNewVendor({
        name: '',
        product_name: '',
        unit_price: 0,
        location: '',
        contact_person: '',
        phone_number: '',
        status: 'active'
      });
      
    } catch (error) {
      console.error('업체 추가 오류:', error);
      alert('업체 추가 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;

    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('vendors')
        .update({
          name: selectedVendor.name,
          product_name: selectedVendor.product_name,
          unit_price: selectedVendor.unit_price,
          updated_price: selectedVendor.updated_price,
          location: selectedVendor.location,
          contact_person: selectedVendor.contact_person,
          phone_number: selectedVendor.phone_number,
          status: selectedVendor.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedVendor.id);
      
      if (error) throw error;
      
      // 업체 정보 업데이트 후 목록 새로고침
      fetchVendors();
      setShowEditModal(false);
      setSelectedVendor(null);
      
    } catch (error) {
      console.error('업체 수정 오류:', error);
      alert('업체 수정 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'active' | 'hold' | 'inactive') => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('vendors')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // 상태 업데이트 후 목록 새로고침
      fetchVendors();
      
    } catch (error) {
      console.error('업체 상태 업데이트 오류:', error);
      alert('업체 상태 업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (!confirm('정말 이 업체를 삭제하시겠습니까?')) return;
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // 업체 삭제 후 목록 새로고침
      fetchVendors();
      
    } catch (error) {
      console.error('업체 삭제 오류:', error);
      alert('업체 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 검색 및 필터링된 업체 목록
  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = 
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vendor.contact_person && vendor.contact_person.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'active': return '구매중';
      case 'hold': return '구매 보류';
      case 'inactive': return '구매중지';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'hold': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-lg font-semibold">구매 업체 관리</h2>
        
        <div className="flex flex-col md:flex-row mt-4 md:mt-0 space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="업체명, 제품명 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'hold' | 'inactive')}
            className="py-2 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">전체 상태</option>
            <option value="active">구매중</option>
            <option value="hold">구매 보류</option>
            <option value="inactive">구매중지</option>
          </select>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <span className="mr-1">+</span> 업체 추가
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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">업체명</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">제품명</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">업체 단가</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">업데이트 단가</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">위치</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">담당자</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">전화번호</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">상태</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3">{vendor.name}</td>
                  <td className="px-4 py-3">{vendor.product_name}</td>
                  <td className="px-4 py-3">{vendor.unit_price?.toLocaleString()}원</td>
                  <td className="px-4 py-3">{vendor.updated_price ? `${vendor.updated_price.toLocaleString()}원` : '-'}</td>
                  <td className="px-4 py-3">{vendor.location || '-'}</td>
                  <td className="px-4 py-3">{vendor.contact_person || '-'}</td>
                  <td className="px-4 py-3">{vendor.phone_number || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vendor.status)}`}>
                      {getStatusLabel(vendor.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      onClick={() => {
                        setSelectedVendor(vendor);
                        setShowEditModal(true);
                      }}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteVendor(vendor.id)}
                      className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
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
          <p className="text-gray-500 dark:text-gray-400 mb-4">등록된 업체가 없습니다.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            새 업체 추가하기
          </button>
        </div>
      )}
      
      {/* 업체 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">업체 추가</h3>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">업체명 *</label>
                <input
                  type="text"
                  required
                  value={newVendor.name || ''}
                  onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">제품명 *</label>
                <input
                  type="text"
                  required
                  value={newVendor.product_name || ''}
                  onChange={(e) => setNewVendor({...newVendor, product_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">업체 단가 *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newVendor.unit_price === undefined || isNaN(Number(newVendor.unit_price)) ? '' : newVendor.unit_price}
                  onChange={(e) => {
                    const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                    setNewVendor({...newVendor, unit_price: isNaN(Number(value)) ? 0 : value});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">위치</label>
                <input
                  type="text"
                  value={newVendor.location || ''}
                  onChange={(e) => setNewVendor({...newVendor, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">담당자</label>
                <input
                  type="text"
                  value={newVendor.contact_person || ''}
                  onChange={(e) => setNewVendor({...newVendor, contact_person: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">전화번호</label>
                <input
                  type="text"
                  value={newVendor.phone_number || ''}
                  onChange={(e) => setNewVendor({...newVendor, phone_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">상태 *</label>
                <select
                  required
                  value={newVendor.status || 'active'}
                  onChange={(e) => setNewVendor({...newVendor, status: e.target.value as 'active' | 'hold' | 'inactive'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="active">구매중</option>
                  <option value="hold">구매 보류</option>
                  <option value="inactive">구매중지</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* 업체 수정 모달 */}
      {showEditModal && selectedVendor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">업체 수정</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedVendor(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleEditVendor}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">업체명 *</label>
                <input
                  type="text"
                  required
                  value={selectedVendor.name}
                  onChange={(e) => setSelectedVendor({...selectedVendor, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">제품명 *</label>
                <input
                  type="text"
                  required
                  value={selectedVendor.product_name}
                  onChange={(e) => setSelectedVendor({...selectedVendor, product_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">업체 단가 *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={selectedVendor.unit_price === undefined || isNaN(Number(selectedVendor.unit_price)) ? '' : selectedVendor.unit_price}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                    setSelectedVendor({...selectedVendor, unit_price: isNaN(Number(value)) ? 0 : value});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">업데이트 단가</label>
                <input
                  type="number"
                  min="0"
                  value={selectedVendor.updated_price === undefined || isNaN(Number(selectedVendor.updated_price)) ? '' : selectedVendor.updated_price}
                  onChange={(e) => {
                    const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                    setSelectedVendor({
                      ...selectedVendor, 
                      updated_price: isNaN(Number(value)) ? undefined : value
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">입력 시 이 단가로 업데이트됩니다</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">위치</label>
                <input
                  type="text"
                  value={selectedVendor.location || ''}
                  onChange={(e) => setSelectedVendor({...selectedVendor, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">담당자</label>
                <input
                  type="text"
                  value={selectedVendor.contact_person || ''}
                  onChange={(e) => setSelectedVendor({...selectedVendor, contact_person: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">전화번호</label>
                <input
                  type="text"
                  value={selectedVendor.phone_number || ''}
                  onChange={(e) => setSelectedVendor({...selectedVendor, phone_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">상태 *</label>
                <select
                  required
                  value={selectedVendor.status}
                  onChange={(e) => setSelectedVendor({...selectedVendor, status: e.target.value as 'active' | 'hold' | 'inactive'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="active">구매중</option>
                  <option value="hold">구매 보류</option>
                  <option value="inactive">구매중지</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedVendor(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 