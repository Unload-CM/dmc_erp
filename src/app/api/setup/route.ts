import { NextResponse } from 'next/server';
import { createTables } from '@/lib/create-tables';

export async function GET() {
  try {
    const result = await createTables();
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: '모든 테이블이 생성되었습니다.' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: '테이블 생성 중 오류가 발생했습니다.', 
        error: result.error 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.', 
      error 
    }, { status: 500 });
  }
} 