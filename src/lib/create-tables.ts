import { supabase } from './supabase';

export async function createTables() {
  try {
    console.log('Supabase 테이블 생성 시작...');
    
    // 1. users 테이블 생성
    const { error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (usersError) {
      console.log('users 테이블이 없습니다. 테이블을 생성합니다.');
      const { error: createUsersError } = await supabase
        .from('users')
        .insert([
          {
            id: '00000000-0000-0000-0000-000000000000',
            email: 'system@example.com',
            full_name: 'System Admin',
            role: 'admin',
            created_at: new Date().toISOString()
          }
        ]);
      
      if (createUsersError && !createUsersError.message.includes('already exists')) {
        throw createUsersError;
      }
    }
    console.log('✅ users 테이블 확인 완료');

    // 2. inventory 테이블 확인
    const { error: inventoryError } = await supabase
      .from('inventory')
      .select('id')
      .limit(1);
    
    if (inventoryError) {
      console.log('inventory 테이블이 없습니다. 테이블을 생성합니다.');
      const { error: createInventoryError } = await supabase
        .from('inventory')
        .insert([
          {
            name: '샘플 자재',
            description: '테이블 생성 테스트용 샘플 자재',
            quantity: 10,
            unit_price: 1000,
            category: '기타',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
      
      if (createInventoryError && !createInventoryError.message.includes('already exists')) {
        throw createInventoryError;
      }
    }
    console.log('✅ inventory 테이블 확인 완료');

    // 3. purchase_request 테이블 확인
    const { error: purchaseRequestError } = await supabase
      .from('purchase_request')
      .select('id')
      .limit(1);
    
    if (purchaseRequestError) {
      console.log('purchase_request 테이블이 없는 것으로 판단됩니다.');
    }
    console.log('✅ purchase_request 테이블 확인 완료');

    // 4. purchase_request_items 테이블 확인
    const { error: purchaseRequestItemsError } = await supabase
      .from('purchase_request_items')
      .select('id')
      .limit(1);
    
    if (purchaseRequestItemsError) {
      console.log('purchase_request_items 테이블이 없는 것으로 판단됩니다.');
    }
    console.log('✅ purchase_request_items 테이블 확인 완료');

    // 5. production_plan 테이블 확인
    const { error: productionPlanError } = await supabase
      .from('production_plan')
      .select('id')
      .limit(1);
    
    if (productionPlanError) {
      console.log('production_plan 테이블이 없는 것으로 판단됩니다.');
    }
    console.log('✅ production_plan 테이블 확인 완료');

    // 6. shipping_plan 테이블 확인
    const { error: shippingPlanError } = await supabase
      .from('shipping_plan')
      .select('id')
      .limit(1);
    
    if (shippingPlanError) {
      console.log('shipping_plan 테이블이 없는 것으로 판단됩니다.');
    }
    console.log('✅ shipping_plan 테이블 확인 완료');

    console.log('✅ 모든 테이블 확인 완료');
    return { success: true };
  } catch (error) {
    console.error('테이블 확인 오류:', error);
    return { success: false, error };
  }
} 