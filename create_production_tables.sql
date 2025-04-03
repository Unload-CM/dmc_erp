-- production_plans 테이블 생성
CREATE TABLE IF NOT EXISTS production_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  model_id UUID REFERENCES product_models(id),
  model_name TEXT,
  product_name TEXT,
  planned_quantity INTEGER DEFAULT 0,
  material_status TEXT DEFAULT 'unavailable',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_required INTEGER,
  status TEXT DEFAULT 'planned',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- production_performances 테이블 생성
CREATE TABLE IF NOT EXISTS production_performances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID REFERENCES production_plans(id),
  title TEXT NOT NULL,
  description TEXT,
  model_id UUID,
  model_name TEXT,
  product_name TEXT,
  planned_quantity INTEGER DEFAULT 0,
  actual_quantity INTEGER DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_required INTEGER,
  achievement_rate INTEGER DEFAULT 0,
  status TEXT DEFAULT 'in_production',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_production_plans_model_id ON production_plans(model_id);
CREATE INDEX IF NOT EXISTS idx_production_performances_plan_id ON production_performances(plan_id);
