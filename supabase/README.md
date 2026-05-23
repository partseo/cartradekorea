# Supabase Database Migration & Environment Management Guide

이 가이드는 글로벌 중고차 수출 플랫폼의 데이터베이스 스키마 버전 관리와 다중 환경(Local, Staging, Production) 배포, 백업 및 복구 프로세스를 안전하게 처리하기 위한 지침입니다.

---

## 1. 다중 환경(Environment) 분리

운영 안정성을 위해 개발(Local), 검증(Staging), 실서비스(Production) 프로젝트를 격리하여 관리합니다.

*   **Local (개발 환경)**: 로컬 개발자의 개인 PC에서 Docker 기반으로 Supabase를 기동하여 자유롭게 스키마 및 데이터를 실험하는 환경.
*   **Staging (검증 환경)**: 운영 반영 전, 프론트엔드 배포판과 연동하여 통합 테스트 및 시나리오 검증을 진행하는 클라우드 환경.
*   **Production (운영 환경)**: 실제 바이어와 딜러가 사용하는 실서비스 환경. 엄격한 접근 권한과 변경 승인 절차가 요구됨.

---

## 2. Supabase CLI 마이그레이션 관리 규칙

모든 스키마 변경 사항은 `supabase/migrations/` 폴더 내에 마이그레이션 SQL 파일로 이력을 관리합니다.

### 2.1 마이그레이션 생성 및 적용 규칙
1.  **신규 변경사항 작성**:
    ```bash
    supabase migration new <변경내용_설명>
    ```
    이 명령어를 실행하면 `supabase/migrations/YYYYMMDDHHMMSS_<변경내용_설명>.sql` 형태의 타임스탬프 기반 SQL 파일이 생성됩니다.
2.  **SQL 작성**: 생성된 파일 내부에 변경 DDL(테이블 생성, 컬럼 추가 등)을 점진적으로 기록합니다.
3.  **로컬 적용**:
    ```bash
    supabase db reset
    ```
    로컬 DB를 리셋하고 migrations 폴더 내의 모든 SQL을 타임스탬프 순서대로 다시 실행하여 최신 스키마를 동기화합니다.

### 2.2 운영 DB 반영 프로세스 (Staging/Production)
수동 SQL Editor 실행 방식을 탈피하고 CLI 또는 CI/CD 도구를 사용해 자동 동기화합니다.
```bash
# staging 프로젝트 연결 및 마이그레이션 반영
supabase db push --linked-project <staging-project-ref>

# production 프로젝트 연결 및 마이그레이션 반영
supabase db push --linked-project <production-project-ref>
```

---

## 3. Seed 데이터 관리 분리

개발 데이터와 운영 기초 데이터의 혼선을 방지하기 위해 시드 파일을 분리하여 적용합니다.

*   **운영용 시드 (`seed_prod.sql`)**:
    *   **내용**: 국가 정보(`countries`), 항구 정보(`ports`) 등 플랫폼 운영에 필수적인 기초 환경 설정 및 고정 요율 데이터.
    *   **경로**: `supabase/seed_prod.sql`
*   **개발용 시드 (`seed_dev.sql`)**:
    *   **내용**: 모의 차량 데이터(`cars`), 모의 사용자(`profiles`), 샘플 견적 요청(`quote_requests`) 등 로컬 개발/테스트용 데이터.
    *   **경로**: `supabase/seed_dev.sql`

> **[TIP]** 로컬 개발 환경 리셋 시:
> `supabase db reset --seed-file supabase/seed_dev.sql`을 사용해 로컬 테스트 데이터를 채워 넣습니다.

---

## 4. 운영 DB 직접 SQL Editor 실행 시 주의사항

운영 중인 데이터베이스에 Supabase Dashboard SQL Editor를 통해 직접 쿼리를 실행할 때는 아래의 안전 수칙을 반드시 준수해야 합니다.

> [!CAUTION]
> **직접 실행 주의사항**
> 1. **DML(INSERT/UPDATE/DELETE) 수행 전 SELECT 확인**: 대량 데이터 변경이나 삭제 전, `WHERE` 절 조건이 올바른지 `SELECT` 쿼리로 먼저 대상 수를 검증하십시오.
> 2. **트랜잭션 명시적 선언**: 실수로 쿼리가 부분 실행되는 것을 막기 위해 `BEGIN;` ~ `COMMIT;` (또는 에러 시 `ROLLBACK;`)을 사용하여 쿼리 그룹을 트랜잭션으로 묶어 실행하십시오.
> 3. **스키마 변경(DDL) 수동 실행 지양**: 운영 DB 스키마는 반드시 migration 파일을 통해 자동 반영하도록 하며, 부득이하게 SQL Editor에서 직접 실행한 경우에는 반드시 로컬의 `supabase/migrations/` 폴더에 동일한 파일을 수동으로 복사하여 기록을 맞춰야 형상 불일치를 막을 수 있습니다.

---

## 5. 백업 및 Rollback(복구) 절차

데이터 손실 및 장애 상황에 대비하여 주기적 백업과 즉각 복구 매뉴얼을 준수합니다.

### 5.1 일일 자동 백업 설정 (Supabase Dashboard)
*   **Staging / Production**: Supabase Dashboard -> **Database** -> **Backups** 메뉴에서 매일 자동으로 백업되도록 설정합니다. (Standard Plan 이상 권장)

### 5.2 수동 백업 (중요 변경 작업 직전)
스키마 마이그레이션이나 대규모 데이터 이전 작업을 실행하기 직전에는 수동으로 데이터베이스 덤프를 생성합니다.
```bash
# 스키마 및 데이터 백업 파일 생성
supabase db dump --linked-project <production-project-ref> -f production_backup_$(date +%Y%m%d_%H%M%S).sql
```

### 5.3 장애 시 롤백 및 복구 절차
작업 도중 오류가 발생해 직전 상태로 롤백해야 하는 경우:
1.  **작업 중단 및 점검**: 데이터 쓰기 트래픽을 최소화하기 위해 서비스를 일시적으로 점검 모드로 전환합니다.
2.  **데이터베이스 복원**: Supabase Dashboard의 **Point-in-Time Recovery (PITR)** 기능을 이용해 오류 발생 5분 전 시점으로 복구하거나, 직전 백업한 덤프 SQL 파일을 복구합니다.
    ```bash
    # 덤프 파일을 통한 데이터 복구
    psql -h db.<project-ref>.supabase.co -p 5432 -d postgres -U postgres -f production_backup_YYYYMMDD_HHMMSS.sql
    ```
