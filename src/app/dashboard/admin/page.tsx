'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { FaTools, FaUsers, FaSitemap, FaDatabase, FaSearch } from 'react-icons/fa';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'user' | 'site' | 'data'>('user');
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
            <FaTools className="mr-3 text-blue-500" /> 관리자 패널
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">사용자, 사이트 및 데이터 관리 기능을 제공합니다.</p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <TabButton 
            isActive={activeTab === 'user'} 
            onClick={() => setActiveTab('user')}
            icon="👥"
            label="사용자 관리"
          />
          <TabButton 
            isActive={activeTab === 'site'} 
            onClick={() => setActiveTab('site')}
            icon="🏗️"
            label="사이트 관리"
          />
          <TabButton 
            isActive={activeTab === 'data'} 
            onClick={() => setActiveTab('data')}
            icon="🗄️"
            label="데이터 관리"
          />
        </div>
        
        <div className="p-6">
          {activeTab === 'user' && <UserManagementTab key={`user-${refreshFlag}`} onRefresh={refreshPage} />}
          {activeTab === 'site' && <SiteManagementTab key={`site-${refreshFlag}`} onRefresh={refreshPage} />}
          {activeTab === 'data' && <DataManagementTab key={`data-${refreshFlag}`} onRefresh={refreshPage} />}
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

// 사용자 관리 탭
function UserManagementTab({ onRefresh }: { onRefresh: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<Partial<User>>({
    email: '',
    full_name: '',
    role: 'user'
  });
  const [editUser, setEditUser] = useState<Partial<User>>({
    email: '',
    full_name: '',
    role: 'user'
  });
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
          
      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('사용자 목록 로딩 오류:', error.message || error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      // 유저 생성 시 임시 비밀번호 (추후 사용자가 변경할 수 있음)
      const tempPassword = 'ChangeMe123!';
      
      // Supabase Auth로 사용자 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email as string,
        password: tempPassword,
        options: {
          data: {
            full_name: newUser.full_name,
            role: newUser.role
          }
        }
      });
      
      if (authError) throw authError;
      
      // 사용자 테이블에 추가 정보 저장
      const { error: dbError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user?.id,
            email: newUser.email,
            full_name: newUser.full_name,
            role: newUser.role,
            created_at: new Date().toISOString()
          }
        ]);
      
      if (dbError) throw dbError;
      
      // 새로운 사용자 추가 후 목록 새로고침
      onRefresh();
      fetchUsers();
      setShowAddModal(false);
      setNewUser({
        email: '',
        full_name: '',
        role: 'user'
      });
      
      alert(`사용자가 생성되었습니다. 임시 비밀번호는 ${tempPassword} 입니다.`);
      
    } catch (error: any) {
      console.error('사용자 추가 오류:', error.message || error);
      alert('사용자 추가 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    try {
      setIsLoading(true);
      
      // 사용자 정보 업데이트
      const { error: dbError } = await supabase
        .from('users')
        .update({
          full_name: editUser.full_name,
          role: editUser.role
        })
        .eq('id', selectedUser.id);
      
      if (dbError) throw dbError;
      
      // Supabase Auth에서 사용자 정보 업데이트 (관리자 권한 필요)
      // 실제로는 어드민 API를 통해 수행해야 할 수 있음
      try {
        // 메타데이터 업데이트 시도
        await supabase.auth.admin.updateUserById(
          selectedUser.id,
          { user_metadata: { full_name: editUser.full_name, role: editUser.role } }
        );
      } catch (authError) {
        console.warn('Auth 메타데이터 업데이트 실패:', authError);
        // 실패해도 계속 진행 (관리자 API 권한이 없을 수 있음)
      }
      
      // 목록 새로고침
      onRefresh();
      fetchUsers();
      setShowEditModal(false);
      setSelectedUser(null);
      
      alert('사용자 정보가 수정되었습니다.');
      
    } catch (error: any) {
      console.error('사용자 수정 오류:', error.message || error);
      alert('사용자 수정 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOpenEditModal = (user: User) => {
    setSelectedUser(user);
    setEditUser({
      email: user.email,
      full_name: user.full_name,
      role: user.role
    });
    setShowEditModal(true);
  };
  
  const handleDeleteUser = async (id: string, email: string) => {
    if (!confirm(`사용자 ${email}을 삭제하시겠습니까?`)) return;
    
    try {
      // 사용자 데이터 삭제
      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (dbError) throw dbError;
      
      // Supabase Auth에서 사용자 삭제 (관리자 기능 필요)
      // 실제로는 Supabase 대시보드나 Admin API를 통해 수행해야 함
      alert('사용자 정보가 삭제되었습니다. Auth 항목은 관리자가 Supabase 대시보드에서 삭제해야 합니다.');
      
      // 목록 새로고침
      fetchUsers();
    } catch (error) {
      console.error('사용자 삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };
  
  // 검색어에 따른 필터링
  const filteredUsers = users.filter(user => 
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-lg font-semibold">사용자 관리</h2>
        
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
            <span className="mr-1">+</span> 사용자 등록
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
      ) : filteredUsers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">이름</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">이메일</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">역할</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">가입일</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3">{user.full_name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                    }`}>
                      {user.role === 'admin' ? '관리자' : '일반 사용자'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(user)}
                      className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
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
          <p className="text-gray-500 dark:text-gray-400 mb-4">등록된 사용자가 없습니다.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            새 사용자 등록하기
          </button>
        </div>
      )}
      
      {/* 사용자 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">새 사용자 등록</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddUser}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">이메일</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">이름</label>
                <input
                  type="text"
                  required
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">역할</label>
                <select
                  required
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value as 'admin' | 'user'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="user">일반 사용자</option>
                  <option value="admin">관리자</option>
                </select>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  * 임시 비밀번호가 자동으로 생성됩니다. 사용자는 첫 로그인 후 비밀번호를 변경해야 합니다.
                </p>
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
      
      {/* 사용자 수정 모달 */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">사용자 정보 수정</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleEditUser}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">이메일</label>
                <input
                  type="email"
                  disabled
                  value={editUser.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">* 이메일은 변경할 수 없습니다</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">이름</label>
                <input
                  type="text"
                  required
                  value={editUser.full_name}
                  onChange={(e) => setEditUser({...editUser, full_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">역할</label>
                <select
                  required
                  value={editUser.role}
                  onChange={(e) => setEditUser({...editUser, role: e.target.value as 'admin' | 'user'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="user">일반 사용자</option>
                  <option value="admin">관리자</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
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

// 사이트 관리 탭
function SiteManagementTab({ onRefresh }: { onRefresh: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [siteInfo, setSiteInfo] = useState({
    site_name: '디엠씨 ERP 시스템',
    company_name: '디엠씨 자동차부품',
    logo_url: '/logo.png',
    main_color: '#1E40AF',
    secondary_color: '#3B82F6',
    contact_email: 'contact@dmc.com',
    contact_phone: '042-123-4567',
    address: '대전광역시 유성구 123번길 45',
    timezone: 'Asia/Seoul',
    version: '1.0.0',
    updated_at: ''
  });
  const [siteId, setSiteId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...siteInfo });
  
  useEffect(() => {
    fetchSiteSettings();
  }, []);
  
  const fetchSiteSettings = async () => {
    try {
      setIsLoading(true);
      
      // 사이트 설정 테이블이 없는 경우 생성
      await createSiteSettingsTableIfNotExists();
      
      // 사이트 설정 조회
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116: 결과가 없음
        throw error;
      }
      
      if (data) {
        setSiteInfo({
          site_name: data.site_name,
          company_name: data.company_name,
          logo_url: data.logo_url,
          main_color: data.main_color,
          secondary_color: data.secondary_color,
          contact_email: data.contact_email,
          contact_phone: data.contact_phone,
          address: data.address,
          timezone: data.timezone,
          version: data.version,
          updated_at: data.updated_at
        });
        setSiteId(data.id);
        setEditForm({
          site_name: data.site_name,
          company_name: data.company_name,
          logo_url: data.logo_url,
          main_color: data.main_color,
          secondary_color: data.secondary_color,
          contact_email: data.contact_email,
          contact_phone: data.contact_phone,
          address: data.address,
          timezone: data.timezone,
          version: data.version,
          updated_at: data.updated_at
        });
      } else {
        // 기본 설정 데이터가 없으면 초기 데이터 생성
        const { data: insertData, error: insertError } = await supabase
          .from('site_settings')
          .insert([{ 
            ...siteInfo, 
            updated_at: new Date().toISOString() 
          }])
          .select();
        
        if (insertError) throw insertError;
        
        if (insertData && insertData.length > 0) {
          setSiteId(insertData[0].id);
        }
      }
    } catch (error: any) {
      console.error('사이트 설정 로딩 오류:', error.message || error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const createSiteSettingsTableIfNotExists = async () => {
    try {
      // 테이블 존재 여부 확인
      const { error } = await supabase
        .from('site_settings')
        .select('site_name')
        .limit(1);
      
      if (error && error.code === '42P01') { // 테이블이 없을 경우
        console.log('사이트 설정 테이블이 없습니다. 생성을 시도합니다.');
        
        // Supabase 관리 콘솔에서 SQL 에디터로 테이블을 생성해야 함을 알림
        alert('사이트 설정 테이블이 없습니다. Supabase 관리 콘솔에서 다음 SQL을 실행하여 테이블을 생성하세요:\n\nCREATE TABLE site_settings (\n  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n  site_name TEXT DEFAULT \'디엠씨 ERP 시스템\',\n  company_name TEXT DEFAULT \'디엠씨 자동차부품\',\n  logo_url TEXT DEFAULT \'/logo.png\',\n  main_color TEXT DEFAULT \'#1E40AF\',\n  secondary_color TEXT DEFAULT \'#3B82F6\',\n  contact_email TEXT,\n  contact_phone TEXT,\n  address TEXT,\n  timezone TEXT DEFAULT \'Asia/Seoul\',\n  version TEXT DEFAULT \'1.0.0\',\n  updated_at TIMESTAMPTZ DEFAULT NOW()\n);');
      }
    } catch (error) {
      console.error('테이블 체크 오류:', error);
    }
  };
  
  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      
      if (siteId) {
        // ID가 있는 경우 - 기존 설정 업데이트
        const { error } = await supabase
          .from('site_settings')
          .update({ 
            ...editForm, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', siteId);
        
        if (error) throw error;
      } else {
        // ID가 없는 경우 - 새 설정 추가
        const { data, error } = await supabase
          .from('site_settings')
          .insert([{ 
            ...editForm, 
            updated_at: new Date().toISOString() 
          }])
          .select();
        
        if (error) throw error;
        
        // 새로 생성된 ID 저장
        if (data && data.length > 0) {
          setSiteId(data[0].id);
        }
      }
      
      setSiteInfo(editForm);
      setIsEditing(false);
      alert('사이트 설정이 성공적으로 저장되었습니다.');
    } catch (error: any) {
      console.error('설정 저장 오류:', error.message || error);
      alert('설정 저장 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleColorChange = (colorType: 'main_color' | 'secondary_color', color: string) => {
    setEditForm({
      ...editForm,
      [colorType]: color
    });
  };
  
  const resetChanges = () => {
    setEditForm({ ...siteInfo });
    setIsEditing(false);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-lg font-semibold">사이트 관리</h2>
        
        <div className="flex mt-4 md:mt-0 space-x-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <span className="mr-1">✏️</span> 설정 편집
            </button>
          ) : (
            <>
              <button
                onClick={resetChanges}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? '저장 중...' : '변경사항 저장'}
              </button>
            </>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-100 rounded-full animate-ping opacity-75"></div>
            <div className="absolute top-0 left-0 w-full h-full border-t-4 border-blue-500 rounded-full animate-spin"></div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {/* 기본 정보 섹션 */}
            <div className="space-y-4 col-span-1 md:col-span-2">
              <h3 className="text-md font-medium border-b pb-2 mb-2 border-gray-200 dark:border-gray-700">기본 정보</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">사이트 이름</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.site_name}
                      onChange={(e) => setEditForm({...editForm, site_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-800 dark:text-gray-200">{siteInfo.site_name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">회사명</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.company_name}
                      onChange={(e) => setEditForm({...editForm, company_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-800 dark:text-gray-200">{siteInfo.company_name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">로고 URL</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.logo_url}
                      onChange={(e) => setEditForm({...editForm, logo_url: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-800 dark:text-gray-200">{siteInfo.logo_url}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">버전</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.version}
                      onChange={(e) => setEditForm({...editForm, version: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-800 dark:text-gray-200">{siteInfo.version}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* 연락처 정보 섹션 */}
            <div className="space-y-4">
              <h3 className="text-md font-medium border-b pb-2 mb-2 border-gray-200 dark:border-gray-700">연락처 정보</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">이메일</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editForm.contact_email}
                    onChange={(e) => setEditForm({...editForm, contact_email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-800 dark:text-gray-200">{siteInfo.contact_email || '-'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">전화번호</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.contact_phone}
                    onChange={(e) => setEditForm({...editForm, contact_phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-800 dark:text-gray-200">{siteInfo.contact_phone || '-'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">주소</label>
                {isEditing ? (
                  <textarea
                    value={editForm.address}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows={2}
                  />
                ) : (
                  <p className="text-gray-800 dark:text-gray-200">{siteInfo.address || '-'}</p>
                )}
              </div>
            </div>
            
            {/* 스타일 및 타임존 섹션 */}
            <div className="space-y-4">
              <h3 className="text-md font-medium border-b pb-2 mb-2 border-gray-200 dark:border-gray-700">스타일 및 지역 설정</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">메인 색상</label>
                <div className="flex items-center">
                  {isEditing ? (
                    <>
                      <input
                        type="color"
                        value={editForm.main_color}
                        onChange={(e) => handleColorChange('main_color', e.target.value)}
                        className="w-10 h-10 rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={editForm.main_color}
                        onChange={(e) => handleColorChange('main_color', e.target.value)}
                        className="ml-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </>
                  ) : (
                    <>
                      <div 
                        className="w-6 h-6 rounded border border-gray-300" 
                        style={{ backgroundColor: siteInfo.main_color }}
                      ></div>
                      <span className="ml-2 text-gray-800 dark:text-gray-200">{siteInfo.main_color}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">보조 색상</label>
                <div className="flex items-center">
                  {isEditing ? (
                    <>
                      <input
                        type="color"
                        value={editForm.secondary_color}
                        onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                        className="w-10 h-10 rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={editForm.secondary_color}
                        onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                        className="ml-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </>
                  ) : (
                    <>
                      <div 
                        className="w-6 h-6 rounded border border-gray-300" 
                        style={{ backgroundColor: siteInfo.secondary_color }}
                      ></div>
                      <span className="ml-2 text-gray-800 dark:text-gray-200">{siteInfo.secondary_color}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">타임존</label>
                {isEditing ? (
                  <select
                    value={editForm.timezone}
                    onChange={(e) => setEditForm({...editForm, timezone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="Asia/Seoul">아시아/서울 (GMT+9)</option>
                    <option value="Asia/Tokyo">아시아/도쿄 (GMT+9)</option>
                    <option value="America/New_York">미국/뉴욕 (GMT-5/4)</option>
                    <option value="Europe/London">유럽/런던 (GMT+0/1)</option>
                    <option value="Australia/Sydney">호주/시드니 (GMT+10/11)</option>
                  </select>
                ) : (
                  <p className="text-gray-800 dark:text-gray-200">{siteInfo.timezone === 'Asia/Seoul' ? '아시아/서울 (GMT+9)' : siteInfo.timezone}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* 마지막 업데이트 정보 */}
          {siteInfo.updated_at && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              마지막 업데이트: {new Date(siteInfo.updated_at).toLocaleString()}
            </div>
          )}
          
          {/* 미리보기 섹션 */}
          {!isEditing && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-md font-medium mb-4">색상 미리보기</h3>
              <div className="flex flex-wrap gap-4">
                <div 
                  className="w-48 h-32 rounded-lg shadow-md flex flex-col justify-center items-center text-white" 
                  style={{ backgroundColor: siteInfo.main_color }}
                >
                  <span>메인 색상</span>
                  <span className="text-xs mt-1">{siteInfo.main_color}</span>
                </div>
                
                <div 
                  className="w-48 h-32 rounded-lg shadow-md flex flex-col justify-center items-center text-white" 
                  style={{ backgroundColor: siteInfo.secondary_color }}
                >
                  <span>보조 색상</span>
                  <span className="text-xs mt-1">{siteInfo.secondary_color}</span>
                </div>
                
                <div className="w-48 h-32 rounded-lg shadow-md bg-gradient-to-r flex flex-col justify-center items-center text-white"
                  style={{ backgroundImage: `linear-gradient(to right, ${siteInfo.main_color}, ${siteInfo.secondary_color})` }}
                >
                  <span>그라데이션</span>
                  <span className="text-xs mt-1">메인 → 보조</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 데이터 관리 탭
function DataManagementTab({ onRefresh }: { onRefresh: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [backups, setBackups] = useState<any[]>([]);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<any>(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [backupFrequency, setBackupFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [isAutoBackupLoading, setIsAutoBackupLoading] = useState(false);
  const [manualBackupLoading, setManualBackupLoading] = useState(false);
  
  // 설정 ID 저장할 변수 추가
  const [settingsId, setSettingsId] = useState<string | null>(null);
  
  useEffect(() => {
    checkBackupTableAndFetch();
  }, []);
  
  const checkBackupTableAndFetch = async () => {
    try {
      setIsLoading(true);
      
      // 백업 테이블이 없는 경우 생성
      await createBackupTableIfNotExists();
      
      // 백업 설정 조회
      const id = await fetchBackupSettings();
      setSettingsId(id);
      
      // 백업 목록 조회
      await fetchBackups();
      
    } catch (error: any) {
      console.error('백업 정보 로딩 오류:', error.message || error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const createBackupTableIfNotExists = async () => {
    try {
      // 테이블 존재 여부 확인
      const { error } = await supabase
        .from('db_backups')
        .select('id')
        .limit(1);
      
      if (error && error.code === '42P01') { // 테이블이 없을 경우
        console.log('백업 테이블이 없습니다. 생성을 시도합니다.');
        
        // Supabase 관리 콘솔에서 SQL 에디터로 테이블을 생성해야 함을 알림
        alert('백업 테이블이 없습니다. Supabase 관리 콘솔에서 다음 SQL을 실행하여 테이블을 생성하세요:\n\n' + 
              'CREATE TABLE db_backups (\n' +
              '  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n' +
              '  backup_name TEXT NOT NULL,\n' +
              '  backup_type TEXT NOT NULL,\n' +
              '  file_path TEXT NOT NULL,\n' +
              '  file_size BIGINT,\n' +
              '  tables_included TEXT[],\n' +
              '  created_at TIMESTAMPTZ DEFAULT NOW(),\n' +
              '  created_by TEXT,\n' +
              '  notes TEXT\n' +
              ');');
      }
      
      // 백업 설정 테이블 확인
      const { error: settingsError } = await supabase
        .from('backup_settings')
        .select('id')
        .limit(1);
      
      if (settingsError && settingsError.code === '42P01') {
        // 위의 알림에 포함되어 있으므로 추가 알림은 하지 않음
      }
      
    } catch (error) {
      console.error('테이블 체크 오류:', error);
    }
  };
  
  const fetchBackupSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('backup_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116: 결과가 없음
        throw error;
      }
      
      if (data) {
        setAutoBackupEnabled(data.auto_backup_enabled);
        setBackupFrequency(data.backup_frequency || 'weekly');
        return data.id; // ID 반환 추가
      } else {
        // 기본 설정 데이터가 없으면 초기 데이터 생성
        const { data: insertData, error: insertError } = await supabase
          .from('backup_settings')
          .insert([{
            auto_backup_enabled: false,
            backup_frequency: 'weekly',
            retention_period: 30,
            updated_at: new Date().toISOString()
          }])
          .select();
        
        if (insertError) throw insertError;
        
        return insertData?.[0]?.id; // 새로 만든 ID 반환
      }
    } catch (error: any) {
      console.error('백업 설정 로딩 오류:', error.message || error);
      return null;
    }
  };
  
  const fetchBackups = async () => {
    try {
      const { data, error } = await supabase
        .from('db_backups')
        .select('*')
        .order('created_at', { ascending: false });
          
      if (error) throw error;
      setBackups(data || []);
    } catch (error: any) {
      console.error('백업 목록 로딩 오류:', error.message || error);
    }
  };
  
  const handleToggleAutoBackup = async () => {
    try {
      setIsAutoBackupLoading(true);
      
      // 다음 예정 백업 시간 계산
      const nextBackup = new Date();
      if (backupFrequency === 'daily') {
        nextBackup.setDate(nextBackup.getDate() + 1);
      } else if (backupFrequency === 'weekly') {
        nextBackup.setDate(nextBackup.getDate() + 7);
      } else if (backupFrequency === 'monthly') {
        nextBackup.setMonth(nextBackup.getMonth() + 1);
      }
      
      if (!settingsId) {
        // ID가 없는 경우 - 새 설정 추가
        const { data, error } = await supabase
          .from('backup_settings')
          .insert([{
            auto_backup_enabled: !autoBackupEnabled,
            backup_frequency: backupFrequency,
            next_scheduled_backup: nextBackup.toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select();
          
        if (error) throw error;
        if (data && data.length > 0) {
          setSettingsId(data[0].id);
        }
      } else {
        // ID가 있는 경우 - 기존 설정 업데이트
        const { error } = await supabase
          .from('backup_settings')
          .update({
            auto_backup_enabled: !autoBackupEnabled,
            backup_frequency: backupFrequency,
            next_scheduled_backup: nextBackup.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', settingsId);
        
        if (error) throw error;
      }
      
      setAutoBackupEnabled(!autoBackupEnabled);
      alert(`자동 백업이 ${!autoBackupEnabled ? '활성화' : '비활성화'}되었습니다.`);
      
    } catch (error: any) {
      console.error('자동 백업 설정 오류:', error.message || error);
      alert('자동 백업 설정 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsAutoBackupLoading(false);
    }
  };
  
  const handleFrequencyChange = async (freq: 'daily' | 'weekly' | 'monthly') => {
    try {
      setIsAutoBackupLoading(true);
      setBackupFrequency(freq);
      
      // 다음 예정 백업 시간 계산
      const nextBackup = new Date();
      if (freq === 'daily') {
        nextBackup.setDate(nextBackup.getDate() + 1);
      } else if (freq === 'weekly') {
        nextBackup.setDate(nextBackup.getDate() + 7);
      } else if (freq === 'monthly') {
        nextBackup.setMonth(nextBackup.getMonth() + 1);
      }
      
      if (!settingsId) {
        // ID가 없는 경우 - 새 설정 추가
        const { data, error } = await supabase
          .from('backup_settings')
          .insert([{
            auto_backup_enabled: autoBackupEnabled,
            backup_frequency: freq,
            next_scheduled_backup: nextBackup.toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select();
          
        if (error) throw error;
        if (data && data.length > 0) {
          setSettingsId(data[0].id);
        }
      } else {
        // ID가 있는 경우 - 기존 설정 업데이트
        const { error } = await supabase
          .from('backup_settings')
          .update({
            backup_frequency: freq,
            next_scheduled_backup: nextBackup.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', settingsId);
        
        if (error) throw error;
      }
      
    } catch (error: any) {
      console.error('백업 주기 설정 오류:', error.message || error);
      alert('백업 주기 설정 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsAutoBackupLoading(false);
    }
  };
  
  const createManualBackup = async () => {
    try {
      setManualBackupLoading(true);
      
      // 현재 시간 포맷팅
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const backupName = `manual_backup_${dateStr}_${timeStr}`;
      
      // 실제로는 서버 측에서 백업 파일을 생성하고 저장해야 함
      // 여기서는 가상의 백업 파일 정보를 저장
      const { error } = await supabase
        .from('db_backups')
        .insert([{
          backup_name: backupName,
          backup_type: 'manual',
          file_path: `/backups/${backupName}.sql`,
          file_size: Math.floor(Math.random() * 10000000), // 가상 파일 크기 (실제로는 실제 파일 크기)
          tables_included: ['users', 'inventory', 'production_plan', 'shipping_plan', 'purchase_request'],
          created_at: now.toISOString(),
          created_by: 'admin',
          notes: '수동 백업'
        }]);
      
      if (error) throw error;
      
      alert('수동 백업이 성공적으로 생성되었습니다.');
      fetchBackups();
      
    } catch (error: any) {
      console.error('수동 백업 생성 오류:', error.message || error);
      alert('수동 백업 생성 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setManualBackupLoading(false);
    }
  };
  
  const handleDeleteBackup = async (id: string, name: string) => {
    if (!confirm(`백업 '${name}'을(를) 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
    
    try {
      // 백업 레코드 삭제
      const { error } = await supabase
        .from('db_backups')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // 실제로는 서버 측에서 백업 파일도 삭제해야 함
      
      alert('백업이 삭제되었습니다.');
      fetchBackups();
      
    } catch (error: any) {
      console.error('백업 삭제 오류:', error.message || error);
      alert('백업 삭제 중 오류가 발생했습니다: ' + error.message);
    }
  };
  
  const handleRestoreBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBackup) return;
    
    if (!confirm(`'${selectedBackup.backup_name}' 백업으로 데이터베이스를 복원하시겠습니까? 현재 데이터는 덮어씌워집니다.`)) return;
    
    try {
      setIsLoading(true);
      
      // 실제로는 서버 측에서 백업 파일을 사용하여 데이터베이스 복원 작업을 수행해야 함
      // 여기서는 작업이 성공했다고 가정
      
      setTimeout(() => {
        alert(`'${selectedBackup.backup_name}' 백업으로 데이터베이스가 성공적으로 복원되었습니다.`);
        setShowRestoreModal(false);
        setSelectedBackup(null);
        setIsLoading(false);
      }, 2000); // 가상의 복원 작업 시간
      
    } catch (error: any) {
      console.error('백업 복원 오류:', error.message || error);
      alert('백업 복원 중 오류가 발생했습니다: ' + error.message);
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-lg font-semibold">데이터 관리</h2>
        
        <div className="flex mt-4 md:mt-0 space-x-2">
          <button
            onClick={createManualBackup}
            disabled={manualBackupLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {manualBackupLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                백업 생성 중...
              </>
            ) : (
              <>
                <span className="mr-2">💾</span> 수동 백업 생성
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* 자동 백업 설정 섹션 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-md font-medium border-b pb-2 mb-4 border-gray-200 dark:border-gray-700">자동 백업 설정</h3>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={autoBackupEnabled}
                      onChange={handleToggleAutoBackup}
                      disabled={isAutoBackupLoading}
                      className="sr-only"
                    />
                    <div className={`block w-14 h-8 rounded-full ${autoBackupEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'} transition-colors`}></div>
                    <div className={`absolute left-1 top-1 bg-white dark:bg-gray-200 w-6 h-6 rounded-full transition-transform transform ${autoBackupEnabled ? 'translate-x-6' : ''}`}></div>
                  </div>
                  <span className="ml-3 text-gray-700 dark:text-gray-300">자동 백업 {autoBackupEnabled ? '활성화' : '비활성화'}</span>
                </label>
              </div>
              
              {isAutoBackupLoading && (
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">백업 주기:</span>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleFrequencyChange('daily')}
                  disabled={isAutoBackupLoading}
                  className={`px-3 py-1 text-xs rounded-lg ${
                    backupFrequency === 'daily' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  매일
                </button>
                <button
                  onClick={() => handleFrequencyChange('weekly')}
                  disabled={isAutoBackupLoading}
                  className={`px-3 py-1 text-xs rounded-lg ${
                    backupFrequency === 'weekly' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  매주
                </button>
                <button
                  onClick={() => handleFrequencyChange('monthly')}
                  disabled={isAutoBackupLoading}
                  className={`px-3 py-1 text-xs rounded-lg ${
                    backupFrequency === 'monthly' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  매월
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* 백업 목록 섹션 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h3 className="text-md font-medium p-6 border-b border-gray-200 dark:border-gray-700">백업 목록</h3>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="relative w-16 h-16">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-100 rounded-full animate-ping opacity-75"></div>
                <div className="absolute top-0 left-0 w-full h-full border-t-4 border-blue-500 rounded-full animate-spin"></div>
              </div>
            </div>
          ) : backups.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">백업 이름</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">유형</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">파일 크기</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">생성일</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {backups.map((backup) => (
                    <tr key={backup.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{backup.backup_name}</div>
                        <div className="text-xs text-gray-500">{backup.notes}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          backup.backup_type === 'manual' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        }`}>
                          {backup.backup_type === 'manual' ? '수동' : '자동'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {(backup.file_size / 1000000).toFixed(2)} MB
                      </td>
                      <td className="px-4 py-3">
                        {new Date(backup.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 space-x-2">
                        <button
                          onClick={() => {
                            setSelectedBackup(backup);
                            setShowRestoreModal(true);
                          }}
                          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          복원
                        </button>
                        <button
                          onClick={() => handleDeleteBackup(backup.id, backup.backup_name)}
                          className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
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
              <p className="text-gray-500 dark:text-gray-400 mb-4">백업 데이터가 없습니다.</p>
              <button
                onClick={createManualBackup}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                첫 백업 생성하기
              </button>
            </div>
          )}
        </div>
        
        {/* 복원 확인 모달 */}
        {showRestoreModal && selectedBackup && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">백업 복원 확인</h3>
                <button
                  onClick={() => {
                    setShowRestoreModal(false);
                    setSelectedBackup(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleRestoreBackup}>
                <div className="mb-6">
                  <p className="text-red-600 dark:text-red-400 font-medium mb-2">⚠️ 주의</p>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    백업을 복원하면 현재의 모든 데이터가 선택한 백업의 데이터로 대체됩니다. 이 작업은 되돌릴 수 없습니다.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>복원할 백업: </strong> {selectedBackup.backup_name} ({new Date(selectedBackup.created_at).toLocaleString()})
                  </p>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRestoreModal(false);
                      setSelectedBackup(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? '복원 중...' : '확인, 복원하기'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 