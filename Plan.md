# AI 업무 학습 일지 — 구현 계획

> 관련 문서: [[prd]] · [[Sitemap]] · [[Contents]] · [[Design]]
> 목표: 빌드 도구 없이 HTML·CSS·JS로 만든 한국어 블로그. 글은 Firebase(Firestore)에 저장하고, 구글 로그인으로 관리자만 쓰고 고칠 수 있으며, GitHub → Vercel로 배포한다.

---

## 1. 구성 한눈에 보기

```
[브라우저]  HTML · CSS · JS (페이지 6개, 빌드 없음)
    │  Firebase SDK(CDN)로 직접 요청
    ▼
[Firebase]  Firestore(글·카테고리·소개 저장) + Authentication(구글 로그인) + 보안 규칙(권한·입력값 검사)
[Vercel]    정적 파일 배포 + 보안 헤더(vercel.json)
```

| 항목 | 결정 |
|---|---|
| 페이지 | 글 목록 `/` · 소개 `/about` · 글 상세 `/post?id=` · 글쓰기 `/write` · 글 수정 `/edit?id=` · 설정 `/settings` |
| 데이터 | Firestore `posts`, `categories`, `profile/main` ([[Sitemap]] 4장) |
| 권한 | 읽기는 누구나, 쓰기·수정·삭제는 관리자 UID 1명 (`firestore.rules`) |
| 본문 | 마크다운 (EasyMDE 편집기 → marked 변환 → DOMPurify 정리) |
| 라이브러리 | 모두 CDN, 버전 고정 + SRI — Firebase 12.19.0, EasyMDE 2.21.0, marked 18.0.14, DOMPurify 3.4.16, Pretendard 1.3.9, Font Awesome 4.7.0 |
| 디자인 | [[Design]] — 흰 바탕, 따뜻한 브라운 강조색, 넓은 여백, 직각 |

---

## 2. 파일과 역할

```
03_blog/
├─ index.html · about.html · post.html · write.html · edit.html · settings.html
├─ style.css               공통 스타일 (Design.md 토큰·컴포넌트)
├─ css/                    페이지 전용 스타일
├─ js/
│  ├─ config.js            ★ Firebase 설정값 · 관리자 UID (직접 채우는 파일)
│  ├─ firebase.js          Firebase 연결, 글·카테고리·소개 저장/조회, 로그인
│  ├─ common.js            헤더·로그인 버튼·메시지·마크다운 안전 출력·주소 검사
│  ├─ editor.js            마크다운 편집기 설정 (한국어 도구 막대, 임시 저장)
│  └─ list.js · about.js · post.js · write.js · edit.js · settings.js   페이지별 기능
├─ firestore.rules         ★ Firestore 보안 규칙 (콘솔에 붙여넣는 파일)
├─ vercel.json             깔끔한 주소 + 보안 헤더(CSP 등)
└─ .gitignore
```

---

## 3. Firebase 연결 방법 (단계별)

> 준비물: 구글 계정 1개. 무료 요금제(Spark)로 충분하며 카드 등록이 필요 없다.
> 아래 주소의 `{프로젝트ID}`는 1단계에서 만든 프로젝트 ID로 바꾼다 (예: `ai-study-log-1a2b3`).

### 1단계 · 프로젝트 만들기
1. https://console.firebase.google.com 접속 → 구글 계정으로 로그인
2. **[프로젝트 만들기]** (또는 [Firebase 프로젝트 시작하기])
3. 프로젝트 이름 입력 (예: `ai-study-log`) → 아래에 표시되는 **프로젝트 ID를 메모**
4. Google 애널리틱스 → **사용 안 함** → [프로젝트 만들기] → 완료되면 [계속]

### 2단계 · 웹 앱 등록하고 설정값 복사
1. https://console.firebase.google.com/project/{프로젝트ID}/settings/general
   (왼쪽 위 ⚙ 톱니바퀴 → **프로젝트 설정** → **일반** 탭)
2. 아래 **내 앱** 영역에서 웹 아이콘 **`</>`** 클릭
3. 앱 닉네임 입력 (예: `blog-web`) → "Firebase 호스팅 설정" **체크하지 않음** → [앱 등록]
4. 화면에 나온 `const firebaseConfig = { … }` 안의 값 6개를 복사
5. 이 폴더의 **`js/config.js`** 를 열어 같은 이름의 칸에 붙여넣기
   ```js
   export const firebaseConfig = {
     apiKey: "AIza…",
     authDomain: "{프로젝트ID}.firebaseapp.com",
     projectId: "{프로젝트ID}",
     storageBucket: "{프로젝트ID}.firebasestorage.app",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef…",
   };
   ```
   > `npm install firebase` 안내가 나와도 따라 할 필요 없다. 이 블로그는 CDN으로 불러온다.

### 3단계 · Firestore 데이터베이스 만들기
1. https://console.firebase.google.com/project/{프로젝트ID}/firestore
   (왼쪽 메뉴 **Firestore Database**. 메뉴가 묶여 있으면 "빌드" 또는 "Databases & Storage" 안에 있다)
2. **[데이터베이스 만들기]**
3. 버전(에디션)을 묻는 화면이 나오면 **Standard** 선택
4. 데이터베이스 ID는 기본값 `(default)` 그대로
5. 위치: **`asia-northeast3 (Seoul)`** → 한 번 정하면 바꿀 수 없다
6. 보안 규칙: **프로덕션 모드로 시작** 선택 (테스트 모드 X — 바로 다음 단계에서 우리 규칙으로 바꾼다) → [만들기]

### 4단계 · 구글 로그인 켜기
1. https://console.firebase.google.com/project/{프로젝트ID}/authentication/providers
   (왼쪽 메뉴 **Authentication** → [시작하기] → **로그인 방법** 탭)
2. 제공업체 목록에서 **Google** 클릭 → **사용 설정** 켜기
3. 프로젝트 지원 이메일 선택 (내 구글 계정) → [저장]
4. 다른 로그인 방법(이메일/비밀번호 등)은 켜지 않는다

### 5단계 · 승인된 도메인 확인
1. https://console.firebase.google.com/project/{프로젝트ID}/authentication/settings
   (Authentication → **설정** 탭 → **승인된 도메인**)
2. `localhost`가 있는지 확인 (내 컴퓨터에서 테스트용)
3. Vercel 배포 후 받은 주소(예: `ai-study-log.vercel.app`)를 **[도메인 추가]** 로 추가 — 7단계 이후에 다시 와서 하면 된다
4. 쓰지 않는 도메인은 삭제

### 6단계 · 내 UID 확인하고 관리자로 등록
1. 내 컴퓨터에서 사이트 실행 (이 폴더에서 터미널 열고)
   ```bash
   npx serve .
   ```
   → 안내된 주소(예: http://localhost:3000) 접속
2. 오른쪽 위 **[로그인]** → 구글 계정 선택
   → 아직 관리자 UID가 비어 있으면 화면에 **"내 UID: …"** 가 표시된다
3. 또는 https://console.firebase.google.com/project/{프로젝트ID}/authentication/users 에서 내 계정 줄의 **사용자 UID** 복사
4. 복사한 UID를 두 곳에 넣는다
   - `js/config.js` → `export const ADMIN_UID = "복사한UID";`
   - `firestore.rules` → `'REPLACE_WITH_ADMIN_UID'` 를 `'복사한UID'` 로

### 7단계 · 보안 규칙 게시
1. https://console.firebase.google.com/project/{프로젝트ID}/firestore/rules
   (Firestore Database → **규칙** 탭)
2. 편집창의 내용을 **전부 지우고** `firestore.rules` 파일 내용을 통째로 붙여넣기
3. **[게시]** → 오류 없이 게시되었는지 확인
4. (선택) 같은 화면의 **규칙 플레이그라운드**로 확인
   - 위치 `/posts/test`, 유형 `create`, 인증 안 함 → **거부**되어야 정상
   - 위치 `/posts/test`, 유형 `get`, 인증 안 함 → **허용**되어야 정상

### 8단계 · API 키 사용처 제한 (배포 후 권장)
1. https://console.cloud.google.com/apis/credentials?project={프로젝트ID}
2. **API 키** 목록에서 `Browser key (auto created by Firebase)` 클릭
3. **애플리케이션 제한사항** → **웹사이트** 선택 → 아래 주소 추가
   - `http://localhost:*/*`
   - `https://{프로젝트ID}.firebaseapp.com/*` (구글 로그인 창이 쓰는 주소 — 빠뜨리면 로그인이 안 됨)
   - `https://{내 Vercel 주소}/*` (예: `https://ai-study-log.vercel.app/*`)
4. [저장] → 반영까지 최대 5분

### 9단계 · 연결 확인
1. 사이트 새로고침 → 위쪽 "Firebase 설정이 필요합니다" 안내가 **사라지면** 연결 성공
2. 로그인 → 메뉴에 **글쓰기 · 설정**이 보이면 관리자 인식 성공
3. 설정 → 카테고리 추가, 소개 작성 → 글쓰기 → 저장 → 목록·상세 확인
4. 처음 넣을 내용은 [[Contents]] 9장(기본 카테고리, 소개 초안, 첫 글)을 사용

### 자주 막히는 곳
| 증상 | 원인 · 해결 |
|---|---|
| "Firebase 설정이 필요합니다"가 계속 보임 | `js/config.js`의 `apiKey`·`projectId`·`appId`가 비어 있음 |
| 로그인 창이 바로 닫힘 / `auth/unauthorized-domain` | 5단계 승인된 도메인에 지금 주소가 없음 |
| 로그인 창이 안 뜸 | 브라우저 팝업 차단 → 주소창 오른쪽에서 팝업 허용 |
| 로그인했는데 글쓰기 메뉴가 없음 | `config.js`의 `ADMIN_UID`가 내 UID와 다름 |
| 저장 시 "권한이 없습니다" | `firestore.rules`의 UID가 다르거나 규칙을 [게시]하지 않음 |
| 파일을 더블클릭해서 열면 아무것도 안 됨 | 모듈 스크립트는 `file://`에서 동작하지 않음 → `npx serve .` 로 열기 |
| 8단계 후 로그인 실패 | API 키 제한에 `{프로젝트ID}.firebaseapp.com/*` 누락 |

---

## 4. 배포 (GitHub → Vercel)

1. GitHub에 새 저장소 만들기: https://github.com/new (예: `ai-study-log`, Public/Private 모두 가능)
2. 이 폴더에서
   ```bash
   git remote add origin https://github.com/{아이디}/ai-study-log.git
   git push -u origin main
   ```
3. https://vercel.com/new → GitHub로 로그인 → 저장소 **Import**
4. Framework Preset **Other**, Build Command·Output Directory **비워 둠** → [Deploy]
5. 발급된 `https://{이름}.vercel.app` 을 Firebase **승인된 도메인**(5단계)과 **API 키 제한**(8단계)에 추가
6. 이후에는 `git push` 만 하면 자동 재배포

> `config.js`의 Firebase 설정값은 공개되어도 되는 값이라 GitHub에 올려도 된다. 실제 보호는 보안 규칙이 한다.

---

## 5. 확인 방법

- **기능**: [[Sitemap]] 3장의 페이지별 기능을 하나씩 해 본다 (글쓰기 → 목록 순서 → 상세 → 수정 → 삭제 확인 창, 카테고리 추가·순서·삭제 시 미분류 전환, 소개 편집 → 소개 페이지 반영)
- **보안**: [[Sitemap]] **5-3 보안 확인 체크리스트** 전부
- **디자인**: [[Design]] 8장 접근성 체크, 휴대폰 폭(375px)에서 가로 스크롤 없음, 다크 모드
- **배포**: https://securityheaders.com 에 내 주소 → A 등급 이상, 개발자도구 Console에 CSP 위반 없음

---

## 6. 이후 확장 아이디어
- 검색, 목록 페이지 나누기, 태그
- 이미지 올리기 (Firebase Storage)
- 검색엔진 노출이 중요해지면 Astro 등으로 정적 HTML 생성
