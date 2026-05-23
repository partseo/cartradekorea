# 글로벌 중고차 수출 플랫폼 백업 및 데이터 보호 정책 (BACKUP_POLICY.md)

본 문서는 플랫폼의 핵심 비즈니스 데이터(차량 목록, 바이어 정보, 견적 원장, PDF 계약 서류 등)가 유실되는 사고를 방지하기 위해 마련한 상용 서비스 백업 정책입니다.

---

## 1. 데이터베이스(DB) 백업 정책

운영 프로젝트의 데이터 저장소인 Supabase PostgreSQL DB는 장애 발생 시 최후의 방어 수단으로 백업을 관리합니다.

### 1) 기본 일일 백업 (Daily Backup)
- **대상**: Supabase Production DB 전체 인스턴스 (Schemas, Tables, Functions, Roles, Data)
- **방식**: Supabase Managed Daily Automated Backups (자동 수행)
- **주기**: 매일 1회 (트래픽이 가장 적은 새벽 시간대 자동 스케줄링)
- **보관 기간**: 7일 (Pro Tier 요금제 기준 보관 주기 연장 적용 가능)

### 2) 수동 즉시 백업 (Manual Backup Before Migration)
- **대상**: 스키마 구조 변경을 수반하는 대량의 Migration 또는 DB 데이터 대규모 업데이트 전
- **방식**: Supabase Dashboard 혹은 CLI를 이용한 수동 백업 덤프 생성
- **명령어**:
  ```bash
  # Production DB의 스키마 및 데이터를 로컬 덤프 파일로 저장
  supabase db dump --project-ref <PRODUCTION_PROJECT_REF_ID> -f backups/manual_dump_$(date +%Y%m%d_%H%M%S).sql
  ```

### 3) 실시간 시점 복구 검토 (Point-in-Time Recovery - PITR)
- **개요**: 계약/견적 원장이 누적됨에 따라, 특정 일시 분/초 단위로 데이터를 되돌려 복구할 수 있는 PITR 기능의 도입 기준을 정의합니다.
- **활성화 검토 기준**:
  - 일평균 신규 견적 50건 이상 및 누적 계약서 발급액 10만 USD 초과 시점.
  - Supabase Pro Plan 가입 후 PITR Add-on 옵션 추가(최대 30일 시점 복구 가능).
  - 무결성이 생명인 금융성 계약 데이터 거래를 대비하여 1차 보강 작업으로 PITR 모니터링을 상용 배포 1개월 후 심사합니다.

---

## 2. Storage 파일 이중 백업 정책

Supabase Storage에 보관된 계약 서류(Private PDF) 및 성능점검표는 DB 원장과 동일하게 중요하므로 외부 독립 스토리지로 2차 백업을 수행합니다.

### 1) 버킷별 백업 기준

| 버킷명 | 중요도 | 백업 대상 | 백업 주기 / 방식 |
| :--- | :---: | :--- | :--- |
| `car-images` | 보통 | 매물 고화질 차량 이미지 | 백업 제외 (원본 사진 원천 소스로부터 복구 가능) |
| `car-documents` | 높음 | 성능점검표 PDF 원본 | 주 1회 로컬 아카이브 또는 별도 클라우드 저장소 백업 |
| `export-documents` | **최상** | Quotation 및 Proforma Invoice PDF | **주 1회** (또는 실시간 동기화 스크립트 실행) 별도 AWS S3 또는 물리 외장 SSD 이중화 |

### 2) Storage 이중화 스크립트 실행 절차
운영 조직은 주 1회, 배치 서버 혹은 로컬 어드민 터미널에서 아래의 CLI 헬퍼 명령어를 통해 `export-documents` 내역을 안전한 타사 클라우드(예: AWS S3) 또는 로컬 보안 SSD에 사본 다운로드 처리합니다.

```bash
# Supabase CLI를 통한 특정 버킷 파일 다운로드
supabase storage copy -r ss://export-documents/ backups/storage/export-documents/
```

---

## 3. 소스 코드 백업 정책

코드 형상과 인프라 구성 설정 파일(Migration SQL 및 Dockerfile 등)을 온전히 보관하기 위한 정책입니다.

- **기본 백업 저장소**: GitHub Remote Repository (Private 설정 유지)
- **로컬 백업**: 담당 개발자(또는 Tech Lead)의 로컬 개발 머신 및 사내 NAS/외장 SSD에 매 마일스톤 완료 시 소스 압축 사본 저장.
- **민감 비밀키 제외**: 코드 백업 시 `.env.local` 등 로컬 자격 증명 파일은 절대 원본 소스에 포함시키지 않습니다.

---

## 4. Staging 복구 모의 테스트 절차

백업 파일이 있어도 복구 능력을 평시에 점검하지 않으면 실제 재해 상황 시 신속한 RTO(복구 목표 시간) 달성이 불가능합니다.

### 1) 모의 훈련 규정
- **주기**: **월 1회** 지정일 수행.
- **수행자**: DevOps 엔지니어 또는 인프라 담당 관리자.
- **수행 방법**: 전월 생성된 `Daily Backup SQL` 파일 또는 `db dump` 파일을 임시 Staging Supabase 프로젝트(개발 DB와 별도)에 복원하여 기능이 온전히 회복되는지 확인합니다.

### 2) 테스트 절차 가이드
1. 임시 스테이징 프로젝트 생성 (또는 기존 staging 스키마 드롭)
2. 백업 덤프 파일 실행:
   ```bash
   psql -h db.<STAGING_PROJECT_REF_ID>.supabase.co -U postgres -d postgres -f backups/manual_dump_XXXX.sql
   ```
3. 어드민 페이지 및 바이어 프론트엔드가 해당 스테이징 프로젝트 API를 보게끔 지정을 임시 변경한 후, 기존 등록된 매물 차량이 온전히 노출되고 로그인이 되는지 서비스 복구 시나리오를 점검합니다.
4. **목표 지표 검사**:
   - **RPO (복구 시점 목표)**: 최대 24시간 이내 데이터 소실 범위 허용 검사.
   - **RTO (복구 시간 목표)**: 장애 선언 후 복원 완료까지 **4시간** 이내 완료 목표.
