# 🎓 학생 상담 신청 및 상담 기록 통합 관리 시스템

Apple 스타일 미니멀 디자인과 **시각적 드래그 앤 드롭 UI 페이지 빌더**를 갖춘 교내 학생 상담 통합 웹 애플리케이션입니다.  
별도의 유료 서버나 데이터베이스 구축 없이 **Google Sheets + GitHub + Streamlit Community Cloud**만으로 무료 운영이 가능합니다.

---

## 📌 주요 기능 요약

1. **학생용 공개 포털**
   - 상담 분야·운영시간·주의사항 안내 확인 및 온라인 상담 신청 접수
   - 학번 + 이름 + 개인 조회 비밀번호(PIN)를 통한 본인 신청 내역 조회 및 '접수' 상태 신청 취소
2. **관리자 통합 관리 콘솔 (비밀번호 인증 필수)**
   - **대시보드**: 전체/접수/확정/완료/취소 현황 및 상담 분야별 통계 시각화
   - **상담 신청 관리**: 상태 필터·검색, 상태 변경(`접수 → 상담 확정 → 상담 완료 / 취소`), 원클릭 상담 기록 작성 연계
   - **학생별 상담 기록**: 학생 검색·등록, 날짜별 상담 일지 작성·수정·안전 삭제, 누적 상담 횟수 자동 집계
   - **디자인 편집 (시각적 UI 빌더)**: 14종 컴포넌트를 드래그 앤 드롭으로 배치하고 크기·여백·색상·정렬을 편집한 뒤 데스크톱/태블릿/모바일 화면으로 미리보고 즉시 게시
   - **운영 및 분야 설정**: 상담 분야 추가·수정·순서 변경 및 공지사항·운영시간 문구 실시간 수정
   - **데이터 내보내기**: 전체/학생별/기간별 상담 기록 및 분야별 통계를 **Excel(.xlsx), CSV, JSON**으로 다운로드

---

## 🚀 1단계: Google Cloud 및 Google Sheets 준비하기

애플리케이션이 데이터를 저장할 구글 스프레드시트와 API 연결 키를 발급받습니다.

### 1-1. Google Cloud 프로젝트 및 API 활성화
1. [Google Cloud Console](https://console.cloud.google.com/)에 구글 계정으로 로그인합니다.
2. 상단 프로젝트 선택 메뉴에서 **새 프로젝트**를 클릭하고 이름(예: `school-counseling-app`)을 입력해 생성합니다.
3. 좌측 메뉴 **API 및 서비스 → 라이브러리**로 이동하여 아래 두 가지 API를 검색해 각각 **사용(Enable)**을 누릅니다.
   - **Google Sheets API**
   - **Google Drive API**

### 1-2. 서비스 계정(Service Account) 생성 및 JSON 키 다운로드
1. 좌측 메뉴 **API 및 서비스 → 사용자 인증 정보**로 이동합니다.
2. 상단 **+ 사용자 인증 정보 만들기 → 서비스 계정**을 클릭합니다.
3. 서비스 계정 이름(예: `counseling-sheet-bot`)을 입력하고 **만들고 계속하기 → 완료**를 클릭합니다.
4. 생성된 서비스 계정 이메일(`counseling-sheet-bot@...iam.gserviceaccount.com`)을 클릭한 뒤 상단 **키(Keys)** 탭으로 이동합니다.
5. **키 추가 → 새 키 만들기 → JSON → 만들기**를 클릭하면 컴퓨터에 `.json` 키 파일이 다운로드됩니다.
   - ⚠️ **주의:** 이 JSON 파일은 외부에 절대 공개하거나 GitHub에 올리지 마세요.

### 1-3. Google Sheets 생성 및 권한 공유
1. [Google Sheets](https://sheets.google.com/)에서 **빈 스프레드시트**를 새로 만듭니다.
2. 브라우저 주소창에서 스프레드시트 ID를 복사해 메모해 둡니다.
   - 주소 예시: `https://docs.google.com/spreadsheets/d/`**`1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890`**`/edit`
   - 굵게 표시된 부분이 **`SPREADSHEET_ID`** 입니다.
3. 우측 상단 **공유(Share)** 버튼을 누르고, 1-2에서 만든 **서비스 계정 이메일**을 입력한 뒤 권한을 **편집자(Editor)**로 설정하여 공유합니다.
   - 시트 탭(`학생정보`, `상담신청` 등 7개 시트)은 앱 최초 실행 시 자동으로 생성되므로 직접 만드실 필요가 없습니다.

---

## 💻 2단계: 로컬 컴퓨터에서 빌드 및 테스트 실행

```bash
# 1. Python 가상환경 생성 및 패키지 설치
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 2. React 프론트엔드 정적 빌드 생성 (배포 전 필수 1회 실행)
cd frontend
npm install
npm run build
cd ..

# 3. 자동화 검증 테스트 실행
pytest -v

# 4. 로컬 비밀 설정 파일 생성 후 앱 실행
cp .streamlit/secrets.toml.example .streamlit/secrets.toml
# .streamlit/secrets.toml 파일을 열어 ADMIN_PASSWORD, SPREADSHEET_ID, gcp_service_account 값을 입력한 뒤 실행:
streamlit run app.py
```

---

## ☁️ 3단계: GitHub 업로드 및 Streamlit Community Cloud 배포

### 3-1. GitHub 저장소(Repository)에 코드 올리기
1. [GitHub](https://github.com/)에서 새 저장소(Private 권장)를 생성합니다.
2. 로컬 프로젝트 폴더에서 아래 명령어로 업로드합니다.
   - `.gitignore`에 의해 `.streamlit/secrets.toml`은 자동 제외되며, 빌드된 `frontend/dist/` 폴더는 함께 업로드됩니다.
```bash
git init
git add .
git commit -m "학생 상담 신청 및 상담 기록 통합 관리 시스템 초기 배포"
git branch -M main
git remote add origin https://github.com/본인아이디/저장소이름.git
git push -u origin main
```

### 3-2. Streamlit Community Cloud 배포 및 Secrets 설정
1. [Streamlit Community Cloud](https://share.streamlit.io/)에 GitHub 계정으로 로그인합니다.
2. **Create app → Yup, I have an app**을 선택합니다.
3. 연결한 GitHub 저장소, 브랜치(`main`), **Main file path(`app.py`)**를 선택합니다.
4. **Advanced settings...** 버튼을 클릭하여 **Secrets** 입력란에 `.streamlit/secrets.toml.example` 형식대로 아래 정보를 붙여넣습니다.
   - `ADMIN_PASSWORD`: 관리자가 로그인할 때 사용할 강력한 비밀번호
   - `SESSION_SECRET`: 임의의 32자 이상 영문·숫자 문자열
   - `SPREADSHEET_ID`: 1-3에서 복사한 구글 시트 ID
   - `[gcp_service_account]`: 다운로드한 JSON 키 파일의 각 항목 값 (`private_key`의 `\n` 줄바꿈 문자 유지)
5. **Save → Deploy!**를 클릭하면 약 1~2분 뒤 고유 웹 주소(`https://...streamlit.app`)로 서비스가 시작됩니다.

---

## 🔒 개인정보 보호 및 운영 보안 수칙

- **GitHub에 개인정보 저장 금지**: 학생 학적 정보와 상담 기록은 오직 권한이 통제된 Google Sheets에만 저장되며, GitHub 저장소에는 프로그램 코드와 UI 정적 에셋만 보관합니다.
- **내보내기 파일 관리**: Excel/CSV로 다운로드한 파일은 교내 보안 PC에만 저장하고 메신저·공용 클라우드 업로드를 삼가세요.
- **정기 비밀번호 변경**: 학기 단위로 Streamlit Cloud의 `ADMIN_PASSWORD`를 변경해 관리하시기 바랍니다.


---

## ⚡ 보너스: 내 컴퓨터에 Node.js 없이 GitHub에서 자동 빌드하는 방법

컴퓨터에 `npm` / `Node.js`가 설치되어 있지 않다면, 이 프로젝트에 포함된 **GitHub Actions 자동 빌드 워크플로우(`.github/workflows/build-frontend.yml`)**를 사용하면 됩니다.

1. 압축을 푼 폴더 전체를 그대로 GitHub 저장소(`main` 브랜치)에 업로드합니다.
2. GitHub 저장소 상단의 **Actions** 탭으로 이동하면 `Build React Frontend (frontend/dist)` 작업이 자동으로 실행되어 약 30초 만에 `frontend/dist/` 폴더를 자동 생성하고 저장소에 커밋합니다.
   - 만약 수동으로 실행하고 싶다면 **Actions → Build React Frontend (frontend/dist) → Run workflow** 버튼을 누르세요.
3. 완료 후 Streamlit Community Cloud에서 **Deploy**하면 즉시 정상 작동합니다.

> 💡 **내 컴퓨터에 Node.js가 설치되어 있는 경우**:  
> Windows에서는 `build_frontend.bat` 파일을 더블클릭하거나, macOS/Linux에서는 `./build_frontend.sh`를 실행하면 `cd frontend && npm install && npm run build && cd ..` 과정이 한 번에 완료됩니다.
