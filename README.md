# 공학용 계산기 (Web)

간단한 공학용 계산기 웹앱입니다. 사인/코사인 등 삼각함수, 역함수, 쌍곡함수, 계승(factorial), 조합(nCr), 로그, 루트 등을 지원합니다. 각 기능은 `math.js` CDN을 사용하여 계산됩니다.

사용법

1. 로컬에서 확인:

```powershell
# 파일이 있는 폴더로 이동
cd "c:\Users\user\OneDrive\바탕 화면\계산기"
# 로컬 파일을 브라우저에서 열기 (더 나은 결과는 간단한 HTTP 서버 사용)
explorer .\index.html
```

2. 간단한 로컬 서버(추천):

```powershell
# Python이 설치되어 있다면
python -m http.server 8000
# 브라우저에서 http://localhost:8000 열기
```

GitHub에 올리기

```powershell
git init
git add .
git commit -m "Add scientific calculator"
# GitHub에서 새 리포지토리 생성 후 아래를 실행
git remote add origin https://github.com/<yourname>/<repo>.git
git push -u origin main
```

파일

- `index.html` — UI 및 진입점
- `style.css` — 스타일
- `script.js` — 계산 로직 및 이벤트 처리
- `.gitignore` — 무시 항목

추가 기능

- 복소수 지원 (`i` 리터럴 사용 가능)
- 히스토리 저장: `localStorage` 에 자동 저장 및 불러오기
- 다크/라이트 테마 토글 (상태 유지)
- 단위 변환(길이: m, km, cm, mm, in)
- 히스토리 복사/내보내기(JSON)
- 향상된 키보드 단축: `Ctrl+Enter`(계산), `Ctrl+L`(지우기), `Alt+U`(단위 변환 열기)

브라우저에서 바로 열어 사용하면 됩니다. GitHub에 올리기 전 `index.html` 을 확인하세요.

원하면 추가 기능(복소수 지원, 테마, 모바일 최적화, 단위 변환)을 이어서 구현해드릴게요.