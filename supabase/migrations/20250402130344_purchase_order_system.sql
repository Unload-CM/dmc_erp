-- 사용자 테이블 (기존 auth.users 기능 확장)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR,
    avatar_url VARCHAR,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security for users
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own data" 
ON public.users 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" 
ON public.users 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- 구매 요청 테이블
CREATE TABLE IF NOT EXISTS public.purchase_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    title VARCHAR NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 0,
    vendor VARCHAR NOT NULL DEFAULT '',
    unit_price INTEGER NOT NULL DEFAULT 0,
    status VARCHAR NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security for purchase_requests
ALTER TABLE IF EXISTS public.purchase_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to view purchase_requests"
ON public.purchase_requests
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert purchase_requests"
ON public.purchase_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to update purchase_requests"
ON public.purchase_requests
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to delete purchase_requests"
ON public.purchase_requests
FOR DELETE
TO authenticated
USING (true);

-- 구매 발주 테이블
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES purchase_requests(id) ON DELETE SET NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    vendor VARCHAR NOT NULL,
    unit_price INTEGER NOT NULL,
    total_amount INTEGER NOT NULL,
    status VARCHAR NOT NULL CHECK (status IN ('pending', 'in_progress', 'approved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security for purchase_orders
ALTER TABLE IF EXISTS public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to view purchase_orders"
ON public.purchase_orders
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert purchase_orders"
ON public.purchase_orders
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update purchase_orders"
ON public.purchase_orders
FOR UPDATE
TO authenticated
USING (true);

-- 인보이스 테이블
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
    invoice_number VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    vendor VARCHAR NOT NULL,
    unit_price INTEGER NOT NULL,
    total_amount INTEGER NOT NULL,
    issue_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security for invoices
ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to view invoices"
ON public.invoices
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert invoices"
ON public.invoices
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 인벤토리 테이블
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    category VARCHAR NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit_price INTEGER NOT NULL DEFAULT 0,
    location VARCHAR,
    threshold INTEGER DEFAULT 10,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security for inventory_items
ALTER TABLE IF EXISTS public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to view inventory_items"
ON public.inventory_items
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert inventory_items"
ON public.inventory_items
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to update inventory_items"
ON public.inventory_items
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to delete inventory_items"
ON public.inventory_items
FOR DELETE
TO authenticated
USING (true);

-- 인벤토리 입/출고 이력 테이블
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL CHECK (type IN ('in', 'out')),
    quantity INTEGER NOT NULL,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security for inventory_transactions
ALTER TABLE IF EXISTS public.inventory_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to view inventory_transactions"
ON public.inventory_transactions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert inventory_transactions"
ON public.inventory_transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 생산 공정 테이블
CREATE TABLE IF NOT EXISTS public.production_processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    status VARCHAR NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security for production_processes
ALTER TABLE IF EXISTS public.production_processes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to view production_processes"
ON public.production_processes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert production_processes"
ON public.production_processes
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update production_processes"
ON public.production_processes
FOR UPDATE
TO authenticated
USING (true);

-- 생산 작업 테이블
CREATE TABLE IF NOT EXISTS public.production_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_id UUID REFERENCES production_processes(id) ON DELETE SET NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    assigned_user UUID REFERENCES auth.users(id),
    status VARCHAR NOT NULL CHECK (status IN ('planned', 'in_progress', 'completed', 'on_hold')),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security for production_jobs
ALTER TABLE IF EXISTS public.production_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to view production_jobs"
ON public.production_jobs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert production_jobs"
ON public.production_jobs
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update production_jobs"
ON public.production_jobs
FOR UPDATE
TO authenticated
USING (true);

-- 생산 작업 이력 테이블
CREATE TABLE IF NOT EXISTS public.production_job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES production_jobs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR NOT NULL,
    quantity INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security for production_job_logs
ALTER TABLE IF EXISTS public.production_job_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to view production_job_logs"
ON public.production_job_logs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert production_job_logs"
ON public.production_job_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 배송 테이블
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR NOT NULL,
    customer_address TEXT NOT NULL,
    phone_number VARCHAR,
    tracking_number VARCHAR,
    status VARCHAR NOT NULL CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    notes TEXT,
    shipped_date TIMESTAMPTZ,
    delivered_date TIMESTAMPTZ,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security for shipments
ALTER TABLE IF EXISTS public.shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to view shipments"
ON public.shipments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert shipments"
ON public.shipments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to update shipments"
ON public.shipments
FOR UPDATE
TO authenticated
USING (true);

-- 배송 상품 테이블
CREATE TABLE IF NOT EXISTS public.shipment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    product_name VARCHAR NOT NULL,
    quantity INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security for shipment_items
ALTER TABLE IF EXISTS public.shipment_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to view shipment_items"
ON public.shipment_items
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert shipment_items"
ON public.shipment_items
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update shipment_items"
ON public.shipment_items
FOR UPDATE
TO authenticated
USING (true);

-- 구매 업체 관리 테이블
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,                        -- 업체명
    product_name VARCHAR NOT NULL,                -- 제품명
    unit_price INTEGER NOT NULL DEFAULT 0,        -- 업체 단가
    updated_price INTEGER,                        -- 업데이트 단가
    location VARCHAR,                             -- 위치
    contact_person VARCHAR,                       -- 담당자
    phone_number VARCHAR,                         -- 전화번호
    status VARCHAR NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hold', 'inactive')), -- 상태(구매중, 구매 보류, 구매중지)
    user_id UUID REFERENCES auth.users(id),       -- 등록자
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security for vendors
ALTER TABLE IF EXISTS public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to view vendors"
ON public.vendors
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert vendors"
ON public.vendors
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to update vendors"
ON public.vendors
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to delete vendors"
ON public.vendors
FOR DELETE
TO authenticated
USING (true);
