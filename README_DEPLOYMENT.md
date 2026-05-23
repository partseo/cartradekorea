# 글로벌 중고차 수출 플랫폼 운영 배포 매뉴얼 (README_DEPLOYMENT.md)

본 문서는 플랫폼의 상용 배포(Production Deployment)와 안전한 시스템 운영을 위한 인프라 구축 및 가이드라인을 상세히 정리한 매뉴얼입니다.

---

## 목차
1. [GitHub 저장소 관리 및 Secret Scan](#1-github-저장소-관리-및-secret-scan)
2. [Vercel 프로젝트 연동 및 환경 변수 분리](#2-vercel-프로젝트-연동-및-환경-변수-분리)
3. [Supabase Production DB 및 마이그레이션 반영](#3-supabase-production-db-및-마이그레이션-반영)
4. [Storage 버킷 구성 및 보안 다운로드 정책](#4-storage-버킷-구성-및-보안-다운로드-정책)
5. [Cloudflare DNS 도메인 및 SSL 설정](#5-cloudflare-dns-도메인-및-ssl-설정)
6. [초기 관리자 계정 생성 및 승격 체계](#6-초기-관리자-계정-생성-및-승격-체계)

---

## 1. GitHub 저장소 관리 및 Secret Scan

상용 서비스 배포를 앞두고 소스 코드 내에 API Key 등 민감한 자격 증명이 커밋되어 외부로 누출되는 사고를 원천 방지하기 위해 다음 절차를 반드시 준수하십시오.

### 1) GitHub Secret Scanning 활성화
1. GitHub Repository에 접속한 후 **Settings** 탭으로 이동합니다.
2. 좌측 메뉴에서 **Security** > **Code security and analysis**를 클릭합니다.
3. **Secret scanning** 항목을 찾아 **Enable**을 활성화합니다.
4. (선택사항) **Push protection**을 함께 활성화하여 민감한 키가 감지되었을 때 `git push` 단계에서 차단되도록 구성합니다.

### 2) 로컬 커밋 전 민감 키 검색 절차
배포 전, 로컬 터미널에서 다음 명령어를 실행하여 실수로 커밋 내역에 비밀키가 들어가지 않았는지 필히 수동으로 교차 검증하십시오.

```bash
# 1. 현재 변경 사항의 상태 확인
git status

# 2. 커밋 대기 상태(Staged)의 코드 변경분 상세 확인
git diff --cached

# 3. 코드 내에 Supabase Service Role Key가 남아있는지 검색
git grep "SUPABASE_SERVICE_ROLE_KEY"

# 4. 코드 내에 Resend API Key가 남아있는지 검색
git grep "RESEND_API_KEY"
```

---

## 2. Vercel 프로젝트 연동 및 환경 변수 분리

프론트엔드 호스팅 및 Edge API Route 실행을 위해 Vercel을 사용하며, 환경별(Production, Preview, Development)로 환경변수를 엄격하게 격리합니다.

### 1) Vercel 환경 변수 구분 정책
- **Production**: 실제 바이어가 접속하는 메인 도메인 환경 (`master`/`main` 브랜치 자동 배포)
- **Preview**: 풀 리퀘스트(PR) 발생 시 임시로 배포되어 검수하는 스테이징 환경
- **Development**: 개발자가 로컬 호스트 및 개발용 Supabase 프로젝트와 상호작용하는 개발 환경

### 2) Vercel 환경 변수 등록 및 설정
1. Vercel Dashboard에서 **Project Settings** > **Environment Variables**로 이동합니다.
2. 아래의 환경 변수 구분표를 참고하여 환경별로 분리해서 입력합니다.

| 변수명 | 브라우저 노출 | Value (Production) | Value (Preview / Dev) |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **가능** | `https://prod-project.supabase.co` | `https://dev-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **가능** | *Prod Anon Key* | *Dev Anon Key* |
| `SUPABASE_SERVICE_ROLE_KEY` | **불가 (서버전용)** | *Prod Service Role Key* | *Dev Service Role Key* |
| `NEXT_PUBLIC_SITE_URL` | **가능** | `https://www.globalautoexport.com` | `https://preview.domain.com` 또는 `http://localhost:3000` |
| `RESEND_API_KEY` | **불가 (서버전용)** | *Prod Resend API Key* | *Dev/Sandbox Resend API Key* |
| `NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER` | **가능** | *실제 운영 WhatsApp 번호* | *개발용 테스트 연락처* |

> [!CAUTION]
> `SUPABASE_SERVICE_ROLE_KEY`와 `RESEND_API_KEY`는 브라우저에 절대 노출되어서는 안 되며, Vercel 환경 변수 추가 시 **"Decrypt at Build Time"** 및 **"Prevent users from reading this value"** 보안 옵션을 켜두어야 합니다.

---

## 3. Supabase Production DB 및 마이그레이션 반영

개발 DB(`local`/`dev`)의 이력을 운영 DB에 안전하게 반영하기 위해 Supabase CLI를 통한 마이그레이션 제어를 원칙으로 합니다.

### 1) Supabase CLI 로그인 및 프로젝트 바인딩
운영 배포 시, Supabase CLI를 운영 프로젝트와 연동합니다.
```bash
# Supabase 계정 로그인
supabase login

# 운영 프로젝트 ID 연결
supabase link --project-ref <PRODUCTION_PROJECT_REF_ID>
```

### 2) DB Schema Migration 운영 반영 절차
로컬/개발 환경에서 검증이 끝난 migration DDL 파일을 운영 DB에 순차 적용합니다.

```bash
# 1. 로컬 migration 파일과 원격 운영 DB 스키마 차이 확인
supabase db diff

# 2. 로컬 마이그레이션 디렉토리 내 모든 이력을 운영 DB에 일괄 배포(push)
supabase db push
```

> [!WARNING]
> 운영 DB에 직접 SQL Editor를 사용한 스키마 수정은 변경 이력 추적이 불가능해지므로 금지합니다.
> 오직 `supabase db push` 명령을 통한 마이그레이션 관리를 고수하며, 부득이하게 SQL Editor를 사용할 경우 작업 기록을 위임 로그에 별도 보관해야 합니다.

### 3) 운영 기초 데이터 시드 적재
운영 DB에는 테스트 차량 정보를 적재하지 않고, 오직 국가 요율 등 운영 기초 참조 데이터만 적재해야 합니다.
```bash
# 운영 전용 시드 파일 실행 (참조 정보 전용)
psql -h db.<PRODUCTION_PROJECT_REF_ID>.supabase.co -U postgres -d postgres -f supabase/seed_prod.sql
```

---

## 4. Storage 버킷 구성 및 보안 다운로드 정책

운영 프로젝트의 Storage 버킷은 비즈니스 데이터의 성격에 따라 엄격하게 공개 수준을 통제합니다.

### 1) Storage 버킷 리스트 및 ACL 설정

| 버킷명 | 공개 범위 | 용도 | 권한 정책 (RLS / Policies) |
| :--- | :---: | :--- | :--- |
| `car-images` | **Public** | 차량 매물 사진 | 전체 Read 허용, `admin`/`staff`만 Write/Delete 허용 |
| `car-documents` | **Private** | 차량 성능 점검 문서 | 전체 Read 차단, 로그인된 사용자(또는 본인) 및 관리자만 조회 가능 |
| `export-documents` | **Private** | 견적서, PI, BL, Invoice 등 | 전체 Read 차단, 견적 소유자(본인 Profile ID) 및 관리자만 조회 가능 |

### 2) Private 서류 보안 다운로드 (`signed URL` 정책)
`export-documents`와 `car-documents`는 기밀 문서이므로 Public URL을 발급하지 않습니다.
대신 프론트엔드 혹은 API를 통해 다운로드 시, Supabase Storage SDK의 `createSignedUrl` 메소드를 이용하여 **제한시간(예: 60분)** 동안만 활성화되는 임시 다운로드 링크를 동적으로 생성하여 반환합니다.

```typescript
// 예시: 60분간 유효한 signed URL 생성
const { data, error } = await supabase.storage
  .from('export-documents')
  .createSignedUrl(fileName, 3600); // 3600초 (1시간)
```

---

## 5. Cloudflare DNS 도메인 및 SSL 설정

Cloudflare를 경유해 프론트엔드(Vercel)로 인입되도록 DNS 및 암호화 수준을 구성합니다.

### 1) Cloudflare DNS 레코드 추가
Cloudflare 대시보드로 이동한 후 아래와 같이 CNAME 레코드를 Vercel의 프록시 주소로 설정합니다.

- **Type**: CNAME
- **Name**: `www` (또는 `@`)
- **Target**: `cname.vercel-dns.com`
- **Proxy status**: Proxied (오렌지 구름 켜기)

### 2) Cloudflare SSL/TLS 암호화 수준 설정
Vercel은 자체적으로 Let's Encrypt SSL 인증서를 발급하여 HTTPS origin을 완벽하게 제공하므로, 종단 간(End-to-End) 가장 안전한 암호화 모드인 **Full (strict)** 모드로 설정합니다.

1. Cloudflare 메뉴에서 **SSL/TLS** > **Overview**로 이동합니다.
2. SSL/TLS Encryption Mode를 **Full (strict)**로 설정합니다.

> [!IMPORTANT]
> **설정 순서 주의**:
> 1. Vercel Project Settings에서 커스텀 도메인을 추가하고, Vercel 측에서 자체 SSL 인증서가 성공적으로 발급된 것을 확인합니다.
> 2. 그 이후에 Cloudflare SSL 설정을 `Flexible`에서 `Full (strict)`로 변경하십시오. 
> 3. Flexible 모드는 트래픽이 중간에 평문(HTTP)으로 전송되어 보안에 취약하므로 상용 서비스에서는 절대 사용하지 마십시오.

---

## 6. 초기 관리자 계정 생성 및 승격 체계

상용 환경에서 일반 계정과 관리자 계정을 안전하게 분리하고 승격 과정을 투명하게 기록하기 위한 정책입니다.

### 1) 최초 1회 초기 어드민 계정 승격 절차
최초 1회에 한해, Supabase Console SQL Editor에서 데이터베이스 전권 어드민(Owner) 권한으로 아래 쿼리를 직접 수행하여 초기 어드민을 생성합니다.

```sql
-- 1단계: Supabase Auth에 이메일 가입 진행 (예: admin@globalauto.com)
-- 2단계: 가입 완료 후 SQL Editor에서 아래 쿼리를 실행해 admin으로 승격
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@globalauto.com';

-- 3단계: 관리자 승격 실행자 및 시점 기록을 admin_logs에 수동 적재 (감사용)
INSERT INTO public.admin_logs (admin_id, action, target_table, record_id, details)
VALUES (
  (SELECT id FROM public.profiles WHERE email = 'admin@globalauto.com'),
  'PROMOTE_INITIAL_ADMIN',
  'profiles',
  (SELECT id FROM public.profiles WHERE email = 'admin@globalauto.com'),
  'System bootstrap: Initial administrator account created and promoted via SQL Editor'
);
```

### 2) 상용 운영 중 추가 관리자 승격/강등 규칙
초기 어드민 지정이 완료된 이후에는 절대로 SQL Editor에 직접 접속하여 롤을 제어하지 마십시오.

- **절차**: 신규 관리자 임명 시, 기존 `admin` 계정으로 관리자 대시보드(`/admin/users`)에 접속한 후 UI를 통해 권한을 `staff` 또는 `admin`으로 변경합니다.
- **감사 로그(Audit Trail)**: 권한 변경 트랜잭션 수행 시, 백엔드 API에서 자동으로 `public.admin_logs` 테이블에 실행자 ID, 대상자 ID, 권한 등급 및 변경 일시를 실시간 로깅하여 저장하도록 코드가 작동합니다.
