# DMC ERP System (전사적 자원 관리 시스템)

DMC ERP 시스템은 자재 관리, 구매 관리, 생산 관리, 출하 관리 등의 기능을 제공하는 통합 관리 시스템입니다.

## 주요 기능

- **자재 관리**: 자재 입고/출고 및 재고 관리
- **구매 관리**: 구매 요청 및 발주 관리
- **생산 관리**: 생산 계획 및 실적 관리
- **출하 관리**: 제품 출하 및 고객사 관리
- **관리자 기능**: 사용자 관리 및 시스템 설정

## 기술 스택

- **프론트엔드**: Next.js, TypeScript, Tailwind CSS
- **백엔드**: Supabase (PostgreSQL, 인증, 스토리지)
- **배포**: Vercel

## 개발 환경 설정

### 필수 요구사항

- Node.js 18.0 이상
- npm 9.0 이상

### 설치 방법

```bash
# 저장소 복제
git clone https://github.com/your-username/dmc-erp.git
cd dmc-erp

# 의존성 설치
npm install

# 환경 변수 설정 (.env.local 파일 생성)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 개발 서버 실행
npm run dev
```

## 배포 방법

```bash
# Vercel에 배포
vercel login
vercel --prod
```

## 기여 방법

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.

## 연락처

프로젝트 관리자 - admin@example.com

## 시작하기

개발 서버가 시작되면 [http://localhost:3000](http://localhost:3000)으로 접속하세요.

## 로그인/회원가입 문제 해결 가이드

로그인이나 회원가입 중 문제가 발생한 경우 아래 단계를 따라 해결하세요:

### 1. 회원가입

1. [http://localhost:3000/auth/register](http://localhost:3000/auth/register) 페이지로 접속합니다.
2. 이메일, 비밀번호, 이름을 입력하고 회원가입 버튼을 클릭합니다.
3. 회원가입이 성공하면 로그인 페이지로 자동 이동합니다.

### 2. 로그인

1. [http://localhost:3000/auth/login](http://localhost:3000/auth/login) 페이지로 접속합니다.
2. 가입한 이메일과 비밀번호를 입력하고 로그인 버튼을 클릭합니다.
3. 로그인이 성공하면 대시보드 또는 관리자 설정 페이지로 자동 이동합니다.

### 3. 테이블 생성하기

Supabase 테이블이 생성되지 않아 오류가 발생하는 경우:

1. 로그인 후 시스템 설정이 필요하다는 메시지가 표시되면 "관리자 설정 페이지로 이동" 버튼을 클릭합니다.
2. 또는 직접 [http://localhost:3000/admin](http://localhost:3000/admin) 페이지로 접속합니다.
3. "Supabase 테이블 생성" 버튼을 클릭하여 필요한 테이블을 생성합니다.
4. 테이블 생성이 완료되면 "대시보드로 이동" 버튼을 클릭합니다.

### 4. 문제 해결

로그인/회원가입 중 400 오류가 발생하는 경우:

1. Supabase 프로젝트 설정이 올바른지 확인합니다. 
2. `.env.local` 파일에 올바른 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 값이 설정되어 있는지 확인합니다.
3. 브라우저 개발자 도구의 콘솔을 확인하여 자세한 오류 정보를 확인합니다.

문제가 계속되면 다음 내용을 확인해보세요:

1. Supabase 프로젝트 대시보드에서 Authentication > Settings에서 "Enable Email Signup" 옵션이 활성화되어 있는지 확인합니다.
2. 로컬 환경에서 실행 중인 경우 Supabase URL 리디렉션 설정에 `http://localhost:3000`이 등록되어 있는지 확인합니다.
