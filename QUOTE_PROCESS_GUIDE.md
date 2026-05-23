# 글로벌 중고차 수출 플랫폼 견적 처리 지침서 (QUOTE_PROCESS_GUIDE.md)

본 지침서는 바이어가 제출한 수출 FOB/CIF 견적 요청을 접수하고, 물류 요율을 산정/수정하여 공식 PDF 서류를 전송하기까지의 비즈니스 실무 행동 강령입니다.

---

## 1. FOB & CIF 요금 정의 및 조율 한계선 (Markup/Discount Limit)

플랫폼의 견적 계산 API는 기본 데이터베이스에 적재된 요율을 바탕으로 예측치를 계산합니다. 관리자는 현지 물류 상황 및 바이어와의 협상에 따라 다음 범위를 엄수하여 견적 요금을 수동으로 조정해야 합니다.

### 1) FOB (Free On Board) 조건 조율
FOB는 차량 가격에 국내 인도점까지의 모든 비용이 포함된 구조입니다.
- **내륙 운송비 (Inland Transport)**: 기본 $150~$300 범위. 인천/부산 야드에서 항구까지 탁송 거리에 맞춰 수정하되, 최대 **±$100** 범위 내에서만 임의 변경 가능.
- **수출 검사 및 통관 수수료 (Inspection & Customs)**: 서류 행정 및 관세 법인 수수료 대행료로 최하 **$100 이하로 임의 할인 금지** (원가 방어선).

### 2) CIF (Cost, Insurance and Freight) 조건 조율
CIF는 FOB 가격에 해상 운임(Ocean Freight) 및 적하 보험료(Marine Insurance)가 더해진 조건입니다.
- **해상 운임 (Ocean Freight)**: 선사 부킹 요율 변동성이 매우 큽니다. 선사 조회 결과(RORO 또는 컨테이너 단가)를 기준으로 갱신하며, 바이어에게 청구 시에는 원가 대비 **최소 5% ~ 최대 15% 마크업(수수료 수익)**을 추가하여 최종 견적서에 기재하는 것을 원칙으로 합니다.
- **적하 보험료 (Marine Insurance)**: CIF 조건 시 필수이며, 일반적으로 FOB 가격의 **0.2% ~ 0.5%** 수준으로 계산합니다. 원가 이하로 요율을 제공해서는 안 되며 안전장치를 위해 수동 입력 시 기본 **$50~$100**의 최소 청구 최저선을 유지하십시오.

---

## 2. PDF 서류 유효기간 설정 및 바이어 추적 가이드

공식 서류인 Quotation(견적서)과 Proforma Invoice(계약용 청구서)는 시장 환율 및 물류비 변동에 의해 유효기간을 반드시 한정해야 합니다.

- **서류 유효기간 기본 설정**:
  - **Quotation (공식 견적서)**: 생성일 기준 **14일간 유효** (14일 초과 시 재요청 필요).
  - **Proforma Invoice (PI, 청구서)**: 생성일 기준 **7일간 유효** (선적 공간 및 환율 선점을 위해 유효기간을 짧게 강제 유도).
- **바이어 추적 및 소통 프로세스**:
  1. **견적 접수 후 24시간 이내**: 수동 요금 검토 후 Quotation PDF를 발급 및 이메일 전송하고, 바이어의 WhatsApp 번호로 "Quotation has been sent to your email" 템플릿 문장을 복사하여 1차 연락을 시도합니다.
  2. **서류 발급 후 3일차**: 피드백이 없는 경우 WhatsApp을 통해 "차량 마킹(Reserved) 기한 마감 임박" 메시지를 보내며 송금 의향을 타진합니다.
  3. **서류 발급 후 7일차**: 최종 계약(PI 발행)으로 전환되지 않을 시 자동 취소 상태로 변경하고, 매물의 Reserved 설정을 해제하여 다시 `available` 상태로 반환합니다.

---

## 3. 이메일 발송 API 에러 시 비상 대응 요령 (수동 URL 전달)

운영 도메인의 메일 서버(Resend API) 점검 또는 바이어 메일함의 용량 초과 등으로 메일 전송 실패 경고가 발생할 때 바이어를 놓치지 않기 위한 매뉴얼입니다.

1. **상태 확인**: 견적 상세 페이지에서 메일 전송 결과가 `Fail`로 식별되거나 바이어에게 수신되지 않았다고 응답이 올 경우.
2. **수동 Signed URL 확보**:
   - 관리자 페이지의 서류 관리 탭에서 해당 PDF(Quotation 또는 Proforma Invoice) 옆의 **Download** 버튼을 마우스 우클릭하여 링크 주소를 복사합니다.
   - 이 복사된 주소는 **1시간 동안 유효한 임시 Signed URL**입니다.
3. **WhatsApp/채팅을 통한 즉각 전송**:
   - 복사한 URL 주소를 바이어의 WhatsApp으로 직접 전송하며 아래 템플릿으로 메시지를 보냅니다.
   - *메시지 템플릿*: 
     > "Hi [Buyer Name], there was a temporary delay in email server routing. You can instantly access and download your official document via this link: [복사한 Signed URL] (This link will be valid for 1 hour for secure connection.)"
4. **만료 시 재발급**: 1시간이 지나 링크가 열리지 않는다고 바이어가 회신하면, 관리자 페이지에서 다운로드 링크 복사 과정을 재수행하여 신규 Signed URL을 즉석에서 다시 전달해 줍니다.
