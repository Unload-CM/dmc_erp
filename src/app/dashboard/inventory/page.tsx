'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { InventoryItem } from '@/types';
import { FaBox, FaArrowDown, FaArrowUp, FaClipboardList, FaSearch, FaFilter } from 'react-icons/fa';
// toast 모듈은 임시로 제거하고 alert으로 대체

// 타입 확장 (임시)
interface ExtendedInventoryItem extends InventoryItem {
  code?: string;
  unit_price?: number;
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'in' | 'out' | 'list'>('list');
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultMessage, setResultMessage] = useState<{type: 'success' | 'error', message: string}>({
    type: 'success',
    message: ''
  });
  const [inventoryItems, setInventoryItems] = useState<ExtendedInventoryItem[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deleteItemName, setDeleteItemName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 페이지 새로고침 함수
  const refreshPage = () => {
    setRefreshFlag(prev => prev + 1);
  };

  // 상세 보기 모달 열기
  const openDetailModal = (itemId: string) => {
    setSelectedItem(itemId);
    setShowDetailModal(true);
  };

  // 수정 모달 열기
  const openEditModal = (itemId: string) => {
    setSelectedItem(itemId);
    setShowEditModal(true);
  };

  // 삭제 모달 열기
  const openDeleteModal = (itemId: string, itemName: string) => {
    setDeleteItemId(itemId);
    setDeleteItemName(itemName);
    setShowDeleteModal(true);
  };

  // 자재 삭제 처리
  const handleDeleteItem = async (id: string) => {
    try {
      setIsDeleting(true);
      console.log('자재 삭제 시작:', id);
      
      // 삭제 전 다시 한번 확인을 위해 해당 항목이 존재하는지 확인
      const { data: checkData, error: checkError } = await supabase
        .from('inventory')
        .select('id, name')
        .eq('id', id)
        .single();
      
      if (checkError) {
        if (checkError.code === 'PGRST116') {
          console.log('삭제할 항목이 이미 존재하지 않습니다:', id);
          setResultMessage({
            type: 'error',
            message: '삭제할 항목이 이미 존재하지 않습니다. 페이지를 새로고침합니다.'
          });
          setShowResultModal(true);
          refreshPage(); // 목록 다시 불러오기
          setShowDeleteModal(false);
          return;
        }
        throw checkError;
      }
      
      // 실제 삭제 수행
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('삭제 중 오류 발생:', error);
        throw error;
      }
      
      console.log('자재 삭제 성공:', id);

      // 삭제 성공 모달 표시
      setResultMessage({
        type: 'success',
        message: '자재가 성공적으로 삭제되었습니다.'
      });
      
      // 모달 전환 (삭제 확인 모달 닫고 결과 모달 열기)
      setShowDeleteModal(false);
      setShowResultModal(true);
      
      // 페이지 새로고침
      refreshPage();
    } catch (error: any) {
      console.error('자재 삭제 오류:', error);
      setResultMessage({
        type: 'error',
        message: `자재 삭제 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`
      });
      setShowResultModal(true);
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* 헤더 섹션 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-blue-900 dark:text-blue-300 flex items-center">
            <FaBox className="mr-3 text-blue-500" /> 자재관리
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">자재 입고, 출고 및 목록을 관리합니다.</p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <TabButton 
            isActive={activeTab === 'in'} 
            onClick={() => setActiveTab('in')}
            icon="📥"
            label="자재 입고 (IN)"
          />
          <TabButton 
            isActive={activeTab === 'out'} 
            onClick={() => setActiveTab('out')}
            icon="📤"
            label="자재 출고 (OUT)"
          />
          <TabButton 
            isActive={activeTab === 'list'} 
            onClick={() => setActiveTab('list')}
            icon="📋"
            label="자재 목록"
          />
        </div>
        
        <div className="p-6">
          {activeTab === 'in' && <InventoryInTab key={`in-${refreshFlag}`} onRefresh={refreshPage} />}
          {activeTab === 'out' && <InventoryOutTab key={`out-${refreshFlag}`} onRefresh={refreshPage} />}
          {activeTab === 'list' && 
            <InventoryListTab 
              key={`list-${refreshFlag}`} 
              onRefresh={refreshPage} 
              onViewDetail={openDetailModal}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
            />
          }
        </div>
      </div>
      
      {/* 자재 상세 보기 모달 */}
      {showDetailModal && selectedItem && (
        <ItemDetailModal 
          itemId={selectedItem} 
          onClose={() => setShowDetailModal(false)} 
        />
      )}
      
      {/* 결과 모달 */}
      {showResultModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${
                resultMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {resultMessage.type === 'success' ? '작업 성공' : '작업 실패'}
              </h3>
              <button
                onClick={() => setShowResultModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className={`p-4 rounded-lg mb-4 ${
              resultMessage.type === 'success' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
            }`}>
              <p className={`${
                resultMessage.type === 'success' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
              }`}>
                {resultMessage.message}
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowResultModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 자재 수정 모달 */}
      {showEditModal && selectedItem && (
        <ItemEditModal 
          itemId={selectedItem} 
          onClose={() => setShowEditModal(false)}
          onUpdate={(updatedItem) => {
            setInventoryItems(inventoryItems.map(item => 
              item.id === updatedItem.id ? updatedItem : item
            ));
            setShowEditModal(false);
            refreshPage();
          }}
        />
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && deleteItemId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">자재 삭제 확인</h3>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              <span className="font-medium text-red-600 dark:text-red-400">{deleteItemName}</span> 자재를 데이터베이스에서 영구적으로 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteItemId(null);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                disabled={isDeleting}
              >
                취소
              </button>
              <button
                onClick={() => deleteItemId && handleDeleteItem(deleteItemId)}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
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

function InventoryInTab({ onRefresh }: { onRefresh: () => void }) {
  const [newItem, setNewItem] = useState<Partial<InventoryItem> & {unit_price?: number}>({
    name: '',
    description: '',
    quantity: 0,
    unit: '',
    unit_price: 0,
    category: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [itemType, setItemType] = useState<'IN' | 'OUT'>('IN');
  const [units, setUnits] = useState<{id: string, name: string, symbol: string}[]>([]);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      console.log('단위 목록 조회 시작');
      const { data, error } = await supabase
        .from('units')
        .select('id, name, symbol')
        .order('name');

      if (error) {
        console.error('단위 목록 조회 오류:', error);
        if (error.code === '42P01') { // 테이블이 존재하지 않는 경우
          createUnitsTableIfNotExists();
          return;
        }
        
        if (error.message?.includes('not exist') || error.message?.includes('undefined')) {
          createUnitsTableIfNotExists();
          return;
        }
        
        throw error;
      }

      console.log('단위 목록 조회 결과:', data?.length || 0);
      
      if (!data || data.length === 0) {
        // 테이블은 있지만 데이터가 없는 경우
        console.warn('단위 테이블에 데이터가 없습니다. 샘플 데이터를 추가하세요.');
        createUnitsTableIfNotExists();
        return;
      }

      setUnits(data);
      // 첫 번째 단위로 기본값 설정
      if (data.length > 0 && !newItem.unit) {
        setNewItem(prev => ({ ...prev, unit: data[0].symbol }));
      }
    } catch (error) {
      console.error('단위 목록 로딩 중 예상치 못한 오류:', error);
      setMessage({
        type: 'error',
        text: '단위 목록을 불러오는 중 오류가 발생했습니다. 페이지를 새로고침하거나 관리자에게 문의하세요.'
      });
    }
  };

  const createUnitsTableIfNotExists = () => {
    const sqlCommand = `
-- units 테이블 생성
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  symbol VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- units 테이블에 기본 데이터 입력
INSERT INTO units (name, symbol, description, category) VALUES
('미터', 'm', '길이의 SI 기본 단위', '길이'),
('센티미터', 'cm', '미터의 1/100', '길이'),
('밀리미터', 'mm', '미터의 1/1000', '길이'),
('킬로그램', 'kg', '질량의 SI 기본 단위', '질량'),
('그램', 'g', '킬로그램의 1/1000', '질량'),
('리터', 'L', '부피의 단위', '부피'),
('밀리리터', 'mL', '리터의 1/1000', '부피'),
('제곱미터', 'm²', '면적의 단위', '면적'),
('개', 'ea', '개수 단위', '수량'),
('팩', 'pack', '묶음 단위', '수량'),
('상자', 'box', '상자 단위', '수량'),
('세트', 'set', '세트 단위', '수량')
ON CONFLICT (id) DO NOTHING;
`;

    const message = `
단위 테이블이 존재하지 않거나 데이터가 비어 있습니다.

Supabase의 SQL 에디터에서 다음 명령을 실행한 후, 페이지를 새로고침 하세요:

${sqlCommand}

또는 관리자에게 문의하여 단위 테이블을 설정해달라고 요청하세요.
`;

    alert(message);
    console.warn('단위 테이블 문제 감지됨');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewItem({
      ...newItem,
      [name]: name === 'quantity' ? parseFloat(value) : value,
    });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as 'IN' | 'OUT';
    setItemType(type);
    
    // 타입에 따라 기본 수량 설정
    if (type === 'IN' && newItem.quantity !== undefined && newItem.quantity < 10) {
      setNewItem({...newItem, quantity: 10});
    } else if (type === 'OUT' && newItem.quantity !== undefined && newItem.quantity >= 10) {
      setNewItem({...newItem, quantity: 9});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // 단위가 선택되지 않았는지 확인
      if (!newItem.unit) {
        throw new Error('단위를 선택해주세요. 단위가 없다면 단위 테이블을 먼저 생성해야 합니다.');
      }

      // Supabase 설정 확인
      if (!supabase) {
        throw new Error('Supabase 클라이언트가 초기화되지 않았습니다. 페이지를 새로고침하거나 관리자에게 문의하세요.');
      }

      // 네트워크 연결 확인
      if (!navigator.onLine) {
        throw new Error('인터넷 연결이 끊어졌습니다. 네트워크 연결을 확인하고 다시 시도해주세요.');
      }

      // Supabase 연결 확인 (타입 안전하게 처리)
      try {
        // 임의 속성 확인을 위한
        const supabaseAny = supabase as any;
        if (typeof supabaseAny.checkConnection === 'function') {
          const connectionStatus = await supabaseAny.checkConnection();
          if (!connectionStatus.ok) {
            console.error('Supabase 연결 상태 확인 실패:', connectionStatus.error);
            throw new Error('데이터베이스 연결에 실패했습니다. 잠시 후 다시 시도하거나 관리자에게 문의하세요.');
          }
        }
      } catch (connError) {
        console.warn('Supabase 연결 확인 중 오류:', connError);
        // 연결 확인 실패는 무시하고 계속 진행
      }

      // 타입에 따른 수량 검증
      let finalQuantity = newItem.quantity || 0;
      if (itemType === 'IN' && finalQuantity < 10) {
        finalQuantity = 10;
      } else if (itemType === 'OUT' && finalQuantity >= 10) {
        finalQuantity = 9;
      }

      console.log('자재 입고 시도:', { ...newItem, quantity: finalQuantity });

      const itemToInsert = {
        name: newItem.name,
        description: newItem.description,
        quantity: finalQuantity,
        category: newItem.category,
        unit_price: 0, // 데이터베이스 호환성을 위해 추가
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // 오류 처리를 위해 두 단계로 나눔
      try {
        const response = await supabase
          .from('inventory')
          .insert([itemToInsert]);
          
        // 삽입 오류 확인
        if (response.error) {
          console.error('Supabase 삽입 오류:', response.error);
          throw new Error(response.error.message || response.error.details || '자재 등록 중 데이터베이스 오류가 발생했습니다.');
        }
        
        // 삽입된 데이터 조회
        const { data, error } = await supabase
          .from('inventory')
          .select('*')
          .eq('name', newItem.name)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (error) {
          console.error('데이터 확인 오류:', error);
          throw error;
        }
        
        if (!data || data.length === 0) {
          console.warn('자재가 추가되었으나 데이터를 조회할 수 없습니다.');
        } else {
          console.log('자재 입고 성공:', data[0]);
        }
        
        setMessage({
          type: 'success',
          text: `자재가 성공적으로 ${itemType === 'IN' ? '입고' : '출고'}되었습니다.`,
        });
        
        setNewItem({
          name: '',
          description: '',
          quantity: 0,
          unit: '',
          unit_price: 0,
          category: '',
        });
        
        setItemType('IN');
      } catch (insertError: any) {
        console.error('Supabase 작업 오류:', insertError);
        throw new Error(insertError.message || insertError.details || '자재 등록 중 데이터베이스 오류가 발생했습니다.');
      }
      
      // 부모 컴포넌트에 새로고침 신호 전달
      setTimeout(() => {
        onRefresh();
      }, 1500);
    } catch (error: any) {
      console.error('자재 입고 오류:', error);
      setMessage({
        type: 'error',
        text: error.message || 
              error.error_description || 
              error.details || 
              (error.code ? `오류 코드: ${error.code}` : '자재 등록 중 오류가 발생했습니다. 네트워크 연결을 확인하거나 관리자에게 문의하세요.'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">자재 {itemType === 'IN' ? '입고' : '출고'} 등록</h2>
      
      {message && (
        <div 
          className={`p-4 mb-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              자재명
            </label>
            <input
              type="text"
              name="name"
              value={newItem.name}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              구분
            </label>
            <select
              value={itemType}
              onChange={handleTypeChange}
              className="w-full p-2 border rounded-md"
            >
              <option value="IN">입고 (IN)</option>
              <option value="OUT">출고 (OUT)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {itemType === 'IN' ? '수량이 10 이상으로 설정됩니다.' : '수량이 9 이하로 설정됩니다.'}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              카테고리
            </label>
            <div className="relative">
              <input
                type="text"
                name="category"
                value={newItem.category}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
                placeholder="원자재, 부품, 완제품 등"
              />
              <p className="text-xs text-gray-500 mt-1">
                생산계획에 연동하려면 카테고리를 '원자재'로 입력하세요.
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              수량
            </label>
            <input
              type="number"
              name="quantity"
              min={itemType === 'IN' ? 10 : 1}
              max={itemType === 'OUT' ? 9 : undefined}
              value={newItem.quantity}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              단위
            </label>
            <select
              name="unit"
              value={newItem.unit || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              required
            >
              {units.length === 0 && (
                <option value="">단위를 로드하는 중...</option>
              )}
              {units.map((unit) => (
                <option key={unit.id} value={unit.symbol}>
                  {unit.name} ({unit.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            설명
          </label>
          <textarea
            name="description"
            value={newItem.description}
            onChange={handleChange}
            rows={3}
            className="w-full p-2 border rounded-md"
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 text-white rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50 ${
              itemType === 'IN' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {isLoading ? '처리 중...' : `${itemType === 'IN' ? '입고' : '출고'} 등록`}
          </button>
        </div>
      </form>
    </div>
  );
}

function InventoryOutTab({ onRefresh }: { onRefresh: () => void }) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedItemUnit, setSelectedItemUnit] = useState<string>('');
  const [outQuantity, setOutQuantity] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // 자재 목록 로드 함수
  const fetchInventoryItems = async () => {
    try {
      setIsDataLoading(true);
      console.log('자재 목록 조회 시작 (출고 탭)');
      
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('name');

      if (error) {
        console.error('자재 목록 조회 오류:', error);
        throw error;
      }
      
      console.log('자재 목록 조회 성공:', data?.length || 0, '개의 항목');
      
      if (data) {
        setInventoryItems(data);
      }
    } catch (error) {
      console.error('자재 목록 로딩 오류:', error);
    } finally {
      setIsDataLoading(false);
    }
  };

  // 자재 목록 로드
  useEffect(() => {
    fetchInventoryItems();
  }, []);

  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const itemId = e.target.value;
    setSelectedItemId(itemId);
    
    // 선택된 아이템의 단위 정보 설정
    if (itemId) {
      const selectedItem = inventoryItems.find(item => item.id === itemId);
      if (selectedItem) {
        setSelectedItemUnit(selectedItem.unit);
      }
    } else {
      setSelectedItemUnit('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (!selectedItemId) {
      setMessage({ type: 'error', text: '자재를 선택해주세요.' });
      setIsLoading(false);
      return;
    }

    try {
      // 선택된 자재 정보 가져오기
      const { data: selectedItemData, error: selectError } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', selectedItemId)
        .single();
      
      if (selectError) {
        throw new Error('선택한 자재 정보를 가져오는데 실패했습니다. 새로고침 후 다시 시도해주세요.');
      }
      
      if (!selectedItemData) {
        throw new Error('선택한 자재 정보를 찾을 수 없습니다.');
      }
      
      if (selectedItemData.quantity < outQuantity) {
        throw new Error('출고 수량이 재고 수량보다 많습니다.');
      }

      // 자재 출고 처리 (수량 감소)
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ 
          quantity: selectedItemData.quantity - outQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedItemId);

      if (updateError) throw updateError;

      console.log('자재 출고 성공:', selectedItemId, '수량:', outQuantity);

      setMessage({
        type: 'success',
        text: '자재가 성공적으로 출고되었습니다.',
      });
      
      // 자재 목록 갱신
      await fetchInventoryItems();
      
      // 입력 필드 초기화
      setSelectedItemId('');
      setOutQuantity(1);
      
      // 부모 컴포넌트에 새로고침 신호 전달
      setTimeout(() => {
        onRefresh();
      }, 1500);
    } catch (error: any) {
      console.error('자재 출고 오류:', error);
      setMessage({
        type: 'error',
        text: error.message || '자재 출고 중 오류가 발생했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">자재 출고 등록</h2>
      
      {message && (
        <div 
          className={`p-4 mb-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}
      
      {isDataLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                출고할 자재 선택
              </label>
              <select
                value={selectedItemId}
                onChange={handleItemChange}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">자재를 선택하세요</option>
                {inventoryItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (재고: {item.quantity} {item.unit})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                출고 수량
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={outQuantity}
                  onChange={(e) => setOutQuantity(parseInt(e.target.value))}
                  min="1"
                  className="w-full p-2 border rounded-md"
                  required
                />
                {selectedItemUnit && (
                  <span className="ml-2 text-gray-500">{selectedItemUnit}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? '처리 중...' : '출고 등록'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function InventoryListTab({ onRefresh, onViewDetail, onEdit, onDelete }: { onRefresh: () => void; onViewDetail: (itemId: string) => void; onEdit: (itemId: string) => void; onDelete: (itemId: string, itemName: string) => void }) {
  const [inventoryItems, setInventoryItems] = useState<ExtendedInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // 모든 자재 정보 가져오기
  const fetchInventory = async () => {
    setIsLoading(true);
    
    try {
      // 기본 테이블에서 먼저 조회
      let { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        if (error.code === 'PGRST116') {
          // 기본 테이블이 없는 경우 inventory_items 테이블에서 조회 시도
          const { data: altData, error: altError } = await supabase
            .from('inventory_items')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (altError) {
            throw altError;
          }
          
          data = altData || [];
        } else {
          throw error;
        }
      }

      // 자재 목록 설정
      setInventoryItems(data || []);
      
      // 카테고리 목록 추출
      const uniqueCategories = Array.from(new Set(data?.map(item => item.category) || []));
      setCategories(uniqueCategories);

    } catch (error: any) {
      console.error('자재 목록 조회 오류:', error);
      alert(`자재 목록 조회 실패: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 마운트 시 자재 목록 로드
  useEffect(() => {
    fetchInventory();
  }, []);

  // 검색어로 필터링된 자재 목록
  const filteredItems = useMemo(() => {
    return inventoryItems.filter(item => {
      const nameMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const codeMatch = item.code?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      const categoryMatch = item.category?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      const descriptionMatch = item.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      
      const searchMatch = nameMatch || codeMatch || categoryMatch || descriptionMatch;
      const categoryFilterMatch = categoryFilter ? item.category === categoryFilter : true;
      
      return searchMatch && categoryFilterMatch;
    });
  }, [inventoryItems, searchTerm, categoryFilter]);

  // 자재 유형 결정 (임시 로직: 수량에 따라 결정)
  const getItemStatus = (quantity: number): '충분' | '부족' | '없음' => {
    if (quantity <= 0) return '없음';
    if (quantity < 10) return '부족';
    return '충분';
  };

  return (
    <div className="space-y-6">
      {/* 검색 및 필터링 툴바 */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
        <div className="flex items-center w-full md:w-auto space-x-2">
          <div className="relative flex-grow">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="자재명, 코드, 카테고리 검색..."
              className="w-full md:w-64 pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
          >
            <option value="">모든 카테고리</option>
            {categories.map((category, index) => (
              <option key={index} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <button
          onClick={fetchInventory}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          새로고침
        </button>
      </div>
      
      {/* 자재 목록 표 */}
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {filteredItems.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">자재 목록이 없습니다.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">자재명</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">코드</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">카테고리</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">수량</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">단위</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">단가</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">상태</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {filteredItems.map((item) => {
                  const status = getItemStatus(item.quantity);
                  let statusColor = '';
                  
                  if (status === '충분') statusColor = 'text-green-500 dark:text-green-400';
                  else if (status === '부족') statusColor = 'text-yellow-500 dark:text-yellow-400';
                  else if (status === '없음') statusColor = 'text-red-500 dark:text-red-400';
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{item.code || '-'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{item.category || '-'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{item.quantity}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{item.unit || '-'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {item.unit_price ? `${item.unit_price.toLocaleString()}원` : '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => onViewDetail(item.id)}
                            className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          >
                            상세
                          </button>
                          <button
                            onClick={() => onEdit(item.id)}
                            className="px-2 py-1 text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => onDelete(item.id, item.name)}
                            className="px-2 py-1 text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// 자재 상세 보기 모달 컴포넌트
function ItemDetailModal({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('inventory')
          .select('*')
          .eq('id', itemId)
          .single();
          
        if (error) throw error;
        setItem(data);
      } catch (error) {
        console.error('자재 상세 정보 로딩 오류:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchItemDetails();
  }, [itemId]);
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">자재 상세 정보</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : item ? (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-blue-800 dark:text-blue-300">{item.name}</h4>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">{item.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">카테고리</p>
                  <p className="font-medium text-gray-900 dark:text-white">{item.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">수량</p>
                  <p className="font-medium text-gray-900 dark:text-white">{item.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">단위</p>
                  <p className="font-medium text-gray-900 dark:text-white">{item.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">총 수량</p>
                  <p className="font-medium text-gray-900 dark:text-white">{item.quantity}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">등록일</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(item.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">최종 수정일</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(item.updated_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">자재 정보를 찾을 수 없습니다.</p>
          )}
        </div>
        
        <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

// 자재 수정 모달 컴포넌트
function ItemEditModal({ 
  itemId, 
  onClose,
  onUpdate
}: { 
  itemId: string; 
  onClose: () => void;
  onUpdate: (item: InventoryItem) => void;
}) {
  const [formData, setFormData] = useState<Partial<InventoryItem> & { type: string }>({
    name: '',
    description: '',
    category: '',
    quantity: 0,
    unit: '',
    type: 'IN',
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [units, setUnits] = useState<{id: string, name: string, symbol: string}[]>([]);
  
  // 자재 타입 판별 (물품 수량으로 구분)
  const getItemType = (item: InventoryItem) => {
    return item.quantity >= 10 ? 'IN' : 'OUT';
  };
  
  useEffect(() => {
    fetchItemDetails();
    fetchUnits();
  }, [itemId]);

  const fetchUnits = async () => {
    try {
      console.log('단위 목록 조회 시작 (수정 모달)');
      const { data, error } = await supabase
        .from('units')
        .select('id, name, symbol')
        .order('name');

      if (error) {
        console.error('단위 목록 조회 오류:', error);
        if (error.code === '42P01') { // 테이블이 존재하지 않는 경우
          createUnitsTableIfNotExists();
          return;
        }
        
        if (error.message?.includes('not exist') || error.message?.includes('undefined')) {
          createUnitsTableIfNotExists();
          return;
        }
        
        throw error;
      }

      console.log('단위 목록 조회 결과:', data?.length || 0);
      
      if (!data || data.length === 0) {
        // 테이블은 있지만 데이터가 없는 경우
        console.warn('단위 테이블에 데이터가 없습니다. 샘플 데이터를 추가하세요.');
        createUnitsTableIfNotExists();
        return;
      }

      setUnits(data);
    } catch (error) {
      console.error('단위 목록 로딩 중 예상치 못한 오류:', error);
      setError('단위 목록을 불러오는 중 오류가 발생했습니다. 페이지를 새로고침하거나 관리자에게 문의하세요.');
    }
  };
  
  const createUnitsTableIfNotExists = () => {
    const sqlCommand = `
-- units 테이블 생성
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  symbol VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- units 테이블에 기본 데이터 입력
INSERT INTO units (name, symbol, description, category) VALUES
('미터', 'm', '길이의 SI 기본 단위', '길이'),
('센티미터', 'cm', '미터의 1/100', '길이'),
('밀리미터', 'mm', '미터의 1/1000', '길이'),
('킬로그램', 'kg', '질량의 SI 기본 단위', '질량'),
('그램', 'g', '킬로그램의 1/1000', '질량'),
('리터', 'L', '부피의 단위', '부피'),
('밀리리터', 'mL', '리터의 1/1000', '부피'),
('제곱미터', 'm²', '면적의 단위', '면적'),
('개', 'ea', '개수 단위', '수량'),
('팩', 'pack', '묶음 단위', '수량'),
('상자', 'box', '상자 단위', '수량'),
('세트', 'set', '세트 단위', '수량')
ON CONFLICT (id) DO NOTHING;
`;

    const message = `
단위 테이블이 존재하지 않거나 데이터가 비어 있습니다.

Supabase의 SQL 에디터에서 다음 명령을 실행한 후, 페이지를 새로고침 하세요:

${sqlCommand}

또는 관리자에게 문의하여 단위 테이블을 설정해달라고 요청하세요.
`;

    alert(message);
    console.warn('단위 테이블 문제 감지됨');
  };
  
  // 자재 상세 정보 로드
  const fetchItemDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', itemId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setFormData({
          id: data.id,
          name: data.name,
          description: data.description,
          category: data.category,
          quantity: data.quantity,
          unit: data.unit,
          type: getItemType(data),
        });
      }
    } catch (error) {
      console.error('자재 상세 정보 로딩 오류:', error);
      setError('자재 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 입력 필드 변경 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity' ? parseFloat(value) : value,
    });
  };
  
  // 수정 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUpdating(true);
    
    try {
      if (!formData.id) throw new Error('자재 정보를 찾을 수 없습니다.');
      
      // 구분이 OUT이고 수량이 10 이상이면 자동으로 IN으로 변경
      // 구분이 IN이고 수량이 10 미만이면 자동으로 OUT으로 변경
      let updatedType = formData.type;
      let updatedQuantity = formData.quantity || 0;
      
      if (formData.type === 'OUT' && updatedQuantity >= 10) {
        updatedType = 'IN';
      } else if (formData.type === 'IN' && updatedQuantity < 10) {
        updatedType = 'OUT';
      }
      
      // 업데이트할 객체 생성 (type은 DB에 저장하지 않음)
      const { type, ...itemToUpdate } = {
        ...formData,
        quantity: updatedQuantity,
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('inventory')
        .update(itemToUpdate as InventoryItem)
        .eq('id', formData.id);
      
      if (error) throw error;
      
      // 업데이트된 데이터 가져오기
      const { data, error: fetchError } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', formData.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (data) {
        // 부모 컴포넌트에 업데이트된 아이템 전달
        onUpdate(data);
      }
    } catch (error: any) {
      console.error('자재 수정 오류:', error);
      setError(error.message || '자재 정보 수정 중 오류가 발생했습니다.');
    } finally {
      setUpdating(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">자재 정보 수정</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  자재명
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    구분
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type || 'IN'}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="IN">입고 (IN)</option>
                    <option value="OUT">출고 (OUT)</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {formData.type === 'IN' ? '수량이 10 이상으로 설정됩니다.' : '수량이 9 이하로 설정됩니다.'}
                  </p>
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    카테고리
                  </label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  설명
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    수량
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    단위
                  </label>
                  <select
                    id="unit"
                    name="unit"
                    value={formData.unit || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">단위 선택</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.symbol}>
                        {unit.name} ({unit.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  disabled={updating}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                  disabled={updating}
                >
                  {updating ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 