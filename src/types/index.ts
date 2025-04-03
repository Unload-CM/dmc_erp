export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseRequest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  quantity: number;
  vendor: string;
  unit_price: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface PurchaseRequestItem {
  id: string;
  purchase_request_id: string;
  inventory_id: string;
  name: string;
  quantity: number;
  estimated_price: number;
  created_at: string;
}

export interface ProductionPlan {
  id: string;
  title: string;
  description: string;
  model_id?: string;          // 모델 ID (추가)
  model_name?: string;        // 모델명 (추가)
  product_name?: string;      // 제품명 (추가)
  planned_quantity?: number;  // 계획 수량 (추가)
  material_status?: 'sufficient' | 'insufficient' | 'unavailable'; // 원자재 상태 (추가)
  start_date: string;
  end_date: string;
  days_required?: number;     // 소요일 (추가)
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'material_waiting' | 'production_waiting'; // 상태 업데이트
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ShippingPlan {
  id: string;
  title: string;
  description: string;
  model_id?: string;         // 모델 ID
  model_name?: string;       // 모델명
  product_name?: string;     // 제품명
  quantity?: number;         // 수량
  unit_price?: number;       // 단가
  total_amount?: number;     // 총 금액
  client_id?: string;        // 고객사 ID
  client_name?: string;      // 고객사명
  etd?: string;              // 예상 출발 시간
  eta?: string;              // 예상 도착 시간
  shipping_date: string;
  destination: string;
  status: 'planned' | 'shipped' | 'delivered' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  request_id: string;
  title: string;
  description: string;
  quantity: number;
  vendor: string;
  unit_price: number;
  total_amount: number;
  status: 'pending' | 'in_progress' | 'approved';
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  order_id: string;
  invoice_number: string;
  title: string;
  description: string;
  quantity: number;
  vendor: string;
  unit_price: number;
  total_amount: number;
  issue_date: string;
  created_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  short_name: string;
  location?: string;
  contact?: string;
  contact_person?: string;
  supplied_materials?: string;
  status: 'active' | 'hold' | 'inactive';
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  product_name: string;
  unit_price: number;
  phone_number?: string;
  updated_price?: number;
}

export interface ProductModel {
  id: string;
  model_name: string;         // 모델명
  product_name: string;       // 제품명
  specifications: string;     // 스펙
  material_type: 'ABS' | 'HIPS' | 'PP' | 'PE' | string; // 원자재 종류
  manager: string;            // 담당자
  user_id: string;            // 등록자
  created_at: string;
  updated_at: string;
}

export interface ProductionPerformance {
  id: string;
  plan_id: string;            // 연결된 생산 계획 ID
  title: string;              // 제목
  description: string;        // 설명
  model_id: string;           // 모델 ID
  model_name: string;         // 모델명
  product_name: string;       // 제품명
  planned_quantity: number;   // 계획 수량
  actual_quantity: number;    // 생산 수량
  start_date: string;         // 생산 시작일
  end_date: string;           // 생산 종료일
  days_required: number;      // 소요일
  achievement_rate: number;   // 달성율 (%)
  status: 'material_waiting' | 'production_waiting' | 'in_production' | 'completed'; // 상태
  created_by: string;         // 등록자
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;               // 고객사
  short_name: string;         // 고객사 약칭 (예: THAI SAMSUNG = TSE)
  location: string;           // 위치
  contact: string;            // 연락처
  contact_person: string;     // 담당자 이름
  status: 'active' | 'hold' | 'inactive';  // 상태(거래중, 거래 보류, 거래중지)
  user_id: string;            // 등록자
  created_at: string;
  updated_at: string;
} 