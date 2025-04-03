-- unit_price 열을 unit 열로 변경하는 SQL 명령
ALTER TABLE "inventory" 
ADD COLUMN "unit" TEXT;

-- 기존 데이터를 마이그레이션하는 코드 (선택적)
-- UPDATE "inventory" SET "unit" = 'ea' WHERE "unit" IS NULL;

-- 마이그레이션 후 unit_price 열은 선택적으로 제거할 수 있습니다
-- ALTER TABLE "inventory" DROP COLUMN "unit_price"; 