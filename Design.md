# AI 업무 학습 일지 — 디자인 가이드

> 관련 문서: [[prd]] · [[Plan]] · [[Sitemap]] · [[Contents]]
> 참고 사이트: [씨마크 호텔](https://www.seamarqhotel.com/) (2026-10-13 확인)
> 이 문서는 참고 사이트의 **디자인 언어**(여백, 색의 온도, 글자 운용, 절제된 장식)를 분석해 이 블로그에 맞게 옮긴 가이드다. 참고 사이트를 그대로 따라 만드는 문서가 아니다.

---

## 0. 참고 사이트 분석 요약

| 항목 | 참고 사이트에서 관찰한 것 | 이 블로그에 옮기는 방식 |
|---|---|---|
| 콘셉트 | "Architecture of Light" — 흰 건축, 빛, 바다 수평선. 차분하고 고급스러운 휴식 | **"정돈된 기록"** — 흰 바탕에 글이 주인공, 넓은 여백, 차분한 톤 |
| 색 | 흰 바탕 + 따뜻한 브라운·베이지(`#836346`, `#c5ae9b`, `#f8f3ef`) + 짙은 스톤(`#383431`) + 바다색 청록(`#3e5b5f`, `#90b8bd`) | 같은 계열을 쓰되 **글자 대비(WCAG AA)를 통과하는 값만** 글자에 사용 |
| 글꼴 | 한글 Pretendard, 영문 장식용 세리프(minerva-modern)·디스플레이(quiche-sans) | 한글 Pretendard, 영문 장식용 세리프는 **무료 대체 글꼴 Cormorant Garamond** |
| 글자 운용 | 큰 영문 대문자 제목 + 작은 한글 부제, 넓은 자간(0.3~0.4em)의 작은 라벨 | 섹션마다 **영문 소제목(eyebrow) + 한글 제목** 쌍 |
| 모서리 | 대부분 0 (직각), 칩·배지만 둥근 알약 모양 | 버튼·카드·입력칸 직각, 태그만 알약 모양 |
| 그림자 | 거의 없음, 얇은 선으로 구분 | 그림자 대신 **1px 선** |
| 카드 | 이미지 없이 글로만 된 카드 (이름·설명·날짜·가격) | 글 카드도 **글 중심**: 카테고리·제목·날짜·미리보기 |
| 링크 | "View More →" 텍스트 링크 | "자세히 보기 →" 텍스트 링크 |
| 움직임 | 느리고 부드러운 전환(1.2초 슬라이드, `cubic-bezier(.47,.16,.24,1)`) | 0.3~0.5초의 부드러운 전환, 과한 애니메이션 없음 |
| 화면 나누는 기준 | 973px(모바일/데스크톱), 1280px, 1400px 최대 폭 | 640 · 973 · 1280px |

### 가져오지 않는 것 (지켜야 할 선)
- 참고 사이트의 **로고, 사진, 이름, 문구**는 쓰지 않는다 (저작권·상표).
- 참고 사이트의 **Adobe Fonts(Typekit) 글꼴 키트**를 불러오지 않는다 (사이트 주인의 유료 라이선스). 무료 대체 글꼴을 쓴다.
- 참고 사이트의 색 중 **대비가 낮은 색(`#a37550`, `#c5ae9b`, `#e1c383` 등)은 글자에 쓰지 않고** 선·장식에만 쓴다.

---

## 1. 디자인 원칙

1. **여백이 디자인이다** — 요소를 줄이고 간격을 넉넉하게. 섹션 사이 여백은 데스크톱 128px, 모바일 64px.
2. **글이 주인공** — 장식은 선과 글자로만. 그림자·그라데이션·아이콘 남용 금지.
3. **따뜻한 무채색** — 순수 회색 대신 따뜻한 스톤·베이지 계열. 강조색은 브라운 하나, 보조색은 바다색 청록 하나.
4. **두 언어의 리듬** — 작은 영문 대문자 라벨 + 큰 한글 제목. 영문은 장식, 의미는 한글이 전달한다.
5. **누구나 읽을 수 있게** — 글자 대비 4.5:1 이상, 키보드 초점 표시, 움직임 줄이기 설정 존중.

---

## 2. 색 (Color)

### 2-1. 밝은 화면 (기본)

| 토큰 | 값 | 쓰임 | 흰 바탕 대비 |
|---|---|---|---|
| `--bg` | `#ffffff` | 페이지 바탕 | — |
| `--surface` | `#fbf9f6` | 소개 카드, 푸터, 코드 블록 바탕 | — |
| `--surface-accent` | `#f8f3ef` | 선택된 탭 바탕, 안내 상자, 태그 바탕 | — |
| `--text` | `#383431` | 본문·제목 | **12.3 : 1** |
| `--text-muted` | `#656565` | 날짜, 도움말, 보조 글자 | **5.8 : 1** |
| `--text-subtle` | `#7d7d7d` | 18px 이상 큰 보조 글자만 | 4.1 : 1 (큰 글자 전용) |
| `--accent` | `#836346` | 주 버튼 바탕, eyebrow 라벨, 카테고리 배지, 현재 메뉴 | **5.5 : 1** |
| `--accent-strong` | `#59412d` | 주 버튼 마우스 올림, 눌림 | 9.5 : 1 |
| `--accent-deco` | `#c5ae9b` | 인용 왼쪽 선, 구분 장식 (글자 금지) | 2.1 : 1 |
| `--sea` | `#3e5b5f` | 본문 속 링크, 키보드 초점 테두리, 정보 안내 | **7.3 : 1** |
| `--sea-soft` | `#f1f8f9` | 정보 안내 상자 바탕 | — |
| `--line` | `#e8e8e8` | 카드·목록 구분선 | — |
| `--line-strong` | `#cbc7c4` | 입력칸 테두리, 태그 테두리 | — |
| `--danger` | `#b3261e` | 삭제 버튼, 오류 문구 | **6.5 : 1** |
| `--danger-soft` | `#fdf0ef` | 오류 안내 상자 바탕 | — |
| `--on-accent` | `#ffffff` | 주 버튼 위 글자 | 5.5 : 1 |

### 2-2. 어두운 화면 (`prefers-color-scheme: dark`)

| 토큰 | 값 | 대비 (바탕 `#1a1816` 기준) |
|---|---|---|
| `--bg` | `#1a1816` | — |
| `--surface` | `#24211e` | — |
| `--surface-accent` | `#2e2925` | — |
| `--text` | `#ece8e4` | 약 15 : 1 |
| `--text-muted` | `#a1a1a1` | 약 6.6 : 1 |
| `--accent` | `#c5ae9b` | 약 8 : 1 |
| `--accent-strong` | `#d3bba8` | 약 9 : 1 |
| `--on-accent` | `#1a1816` | — |
| `--sea` | `#90b8bd` | 약 8 : 1 |
| `--line` | `#34302c` | — |
| `--line-strong` | `#4a4440` | — |
| `--danger` | `#ee5454` | 약 4.9 : 1 |

### 2-3. 색 사용 비율
- **흰색·서피스 85%** / 글자색 10% / 강조색(브라운) 4% / 바다색·위험색 1%
- 한 화면에 강조색 버튼은 **하나만** (예: 글쓰기 화면의 [저장])

---

## 3. 글꼴 (Typography)

### 3-1. 글꼴

| 역할 | 글꼴 | 불러오는 곳 | 쓰는 곳 |
|---|---|---|---|
| 한글·본문·UI | **Pretendard Variable** | jsdelivr `pretendard@1.3.9` (dynamic-subset) | 모든 한글, 버튼, 입력칸 |
| 영문 장식 세리프 | **Cormorant Garamond** (400, 500) | Google Fonts | 영문 eyebrow 큰 제목, 로고 영문 부제, 숫자 강조 |
| 코드 | `ui-monospace, SFMono-Regular, Consolas, monospace` | 시스템 | 마크다운 코드 |

```css
--font-sans: "Pretendard Variable", Pretendard, system-ui, -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
--font-serif: "Cormorant Garamond", "Times New Roman", serif;
--font-mono: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
```

> ⚠️ 글꼴을 외부에서 불러오므로 [[Sitemap]] **S-04 CSP**에 다음을 추가해야 한다:
> `style-src`에 `https://fonts.googleapis.com`, `font-src`에 `https://fonts.gstatic.com` (Pretendard는 이미 허용된 `cdn.jsdelivr.net`)
> S-05에 따라 Pretendard CSS에는 SRI를 붙인다. (Google Fonts CSS는 브라우저마다 내용이 달라 SRI를 붙일 수 없음 → 원하면 글꼴 파일을 직접 받아 `/fonts`에 두는 방식으로 바꿀 수 있음)

### 3-2. 글자 크기 단계

| 토큰 | 데스크톱 (≥973px) | 모바일 | 굵기 | 줄 간격 | 자간 | 쓰는 곳 |
|---|---|---|---|---|---|---|
| `display` | 56px | 36px | 300 | 1.2 | -0.02em | 글 목록 맨 위 큰 제목, 소개 이름 |
| `h1` | 40px | 28px | 400 | 1.3 | -0.02em | 페이지 제목, 글 상세 제목 |
| `h2` | 28px | 22px | 500 | 1.4 | -0.01em | 섹션 제목 |
| `h3` | 20px | 18px | 600 | 1.5 | -0.01em | 카드 제목, 작은 제목 |
| `body-lg` | 18px | 17px | 400 | 1.85 | 0 | **글 상세 본문** |
| `body` | 16px | 16px | 400 | 1.75 | 0 | 일반 본문, 입력칸 |
| `small` | 14px | 14px | 400 | 1.6 | 0 | 날짜, 도움말, 버튼 |
| `caption` | 12px | 12px | 500 | 1.5 | 0.02em | 글자 수, 저작권 |
| `eyebrow` | 12px | 11px | 500 | 1 | **0.3em, 대문자** | 섹션 위 영문 라벨 |
| `serif-label` | 22px | 18px | 400 (serif) | 1.2 | 0.04em | 영문 장식 제목 |
| `stat` | 48px | 36px | 400 (serif) | 1 | 0 | 소개 학습 현황 숫자 |

- 한글 제목은 **가볍게**(300~500) — 참고 사이트처럼 굵은 제목 대신 크기와 여백으로 위계를 만든다.
- 한글은 `word-break: keep-all` (단어 중간에서 줄바꿈 금지).
- 한 줄 길이: 본문 최대 **40~45자**(약 720px).

### 3-3. 제목 짝 (eyebrow + 한글 제목)

참고 사이트의 "SPECIAL OFFER / 씨마크 호텔이 준비한…" 구성을 옮긴 이 블로그의 기본 섹션 머리.

```
JOURNAL                       ← eyebrow (12px, 0.3em, 대문자, --accent)
학습 일지                      ← h1 (40px, 400, --text)
업무에 AI를 적용하며 배운 것을 기록합니다.   ← body (16px, --text-muted)
```

| 페이지·섹션 | eyebrow | 한글 제목 |
|---|---|---|
| 글 목록 | JOURNAL | 학습 일지 |
| 소개 | ABOUT | {이름} |
| 소개 › 기술 스택 | STACK | 기술 스택 |
| 소개 › AI 활용 | AI TOOLKIT | AI 활용 |
| 소개 › 학습 현황 | ARCHIVE | 학습 현황 |
| 소개 › 연락처 | CONTACT | 연락처 |
| 글쓰기 | WRITE | 새 글 쓰기 |
| 글 수정 | EDIT | 글 수정 |
| 설정 | SETTINGS | 설정 |

> eyebrow는 장식이므로 스크린 리더가 읽지 않게 `aria-hidden="true"`. 이 영문 라벨들은 [[Contents]]의 "화면 글자는 한국어" 원칙의 예외로, 장식 요소로만 쓴다.

---

## 4. 간격 · 배치 (Spacing & Layout)

### 4-1. 간격 단계 (4px 기준)

| 토큰 | 값 | 쓰임 예 |
|---|---|---|
| `--space-1` | 4px | 아이콘과 글자 사이 |
| `--space-2` | 8px | 배지 안쪽, 태그 사이 |
| `--space-3` | 12px | 라벨과 입력칸 사이 |
| `--space-4` | 16px | **모바일 좌우 여백**, 버튼 사이 |
| `--space-6` | 24px | 카드 안쪽 여백(모바일) |
| `--space-8` | 32px | 카드 안쪽 여백(데스크톱), 폼 칸 사이 |
| `--space-12` | 48px | 제목 짝과 내용 사이 |
| `--space-16` | 64px | **섹션 사이(모바일)** |
| `--space-24` | 96px | 헤더 아래 첫 여백 |
| `--space-32` | 128px | **섹션 사이(데스크톱)** |

### 4-2. 폭과 화면 나누기

| 토큰 | 값 | 쓰임 |
|---|---|---|
| `--w-page` | 1200px | 헤더·푸터·글 목록 격자 최대 폭 |
| `--w-read` | 720px | 글 상세 본문, 글쓰기·수정 폼, 소개 자기소개 |
| `--w-narrow` | 560px | 설정의 입력 영역 |
| 모바일 | ~640px | 1단, 좌우 16px |
| 태블릿 | 641~972px | 1단, 좌우 32px |
| 데스크톱 | **973px~** | 글 목록 2단 격자, 좌우 48px |
| 넓은 화면 | 1280px~ | 글 목록 3단 격자 |

---

## 5. 모양 · 선 · 움직임

| 항목 | 기준 |
|---|---|
| 모서리 | 버튼·카드·입력칸·상자 **0 (직각)**. 태그·카테고리 개수 배지만 `9999px` (알약) |
| 선 | 구분선 1px `--line`, 입력칸 1px `--line-strong`, 강조선 1px `--text` |
| 그림자 | **쓰지 않음**. 예외: 고정 헤더가 스크롤될 때 아래 1px 선만 |
| 전환 속도 | 빠름 0.2s(색 변화) · 보통 0.3s(밑줄·화살표) · 느림 0.5s(나타나기) |
| 전환 곡선 | `--ease: cubic-bezier(.47,.16,.24,1)` (참고 사이트와 같은 느낌의 부드러운 감속) |
| 나타나기 효과 | 섹션이 화면에 들어올 때 아래에서 16px 올라오며 서서히 나타남 (0.5s, 1회만) |
| 움직임 줄이기 | `prefers-reduced-motion: reduce`이면 모든 전환·나타나기 효과 끔 |
| 키보드 초점 | `outline: 2px solid var(--sea); outline-offset: 2px;` — 절대 없애지 않음 |

---

## 6. 컴포넌트

### 6-1. 헤더
- 높이: 데스크톱 80px / 모바일 60px, 바탕 `--bg`, 화면 위에 고정(sticky). 스크롤하면 아래 1px `--line`
- **로고**: 두 줄 — 위 `AI WORK STUDY LOG`(serif-label 14px, 0.2em, `--accent`, 장식) / 아래 「AI 업무 학습 일지」(16px, 600, `--text`)
- **메뉴**: 15px, 500, 메뉴 사이 40px. 현재 메뉴는 `--accent` 글자 + 아래 1px 밑줄. 마우스를 올리면 밑줄이 왼쪽에서 오른쪽으로 그려짐(0.3s)
- **로그인 버튼**: 보조 버튼(작게)
- **모바일 (<973px)**: 메뉴를 [☰] 버튼 안으로 → 누르면 화면 전체를 덮는 흰 메뉴, 메뉴 글자 24px 세로 나열, 사이 32px

### 6-2. 푸터
- 바탕 `--surface`, 위 1px `--line`, 위아래 여백 64px
- 왼쪽: 로고(작게) + 부가 문구 / 오른쪽: 메뉴 링크 · 연락처 링크
- 맨 아래: 저작권 (`caption`, `--text-muted`)

### 6-3. 버튼

| 종류 | 모양 | 쓰는 곳 |
|---|---|---|
| **주 버튼** | 바탕 `--accent`, 글자 `--on-accent`, 높이 52px, 좌우 32px, 15px 500, 자간 0.05em, 직각. 올리면 바탕 `--accent-strong` | 저장, 수정 완료, 추가 |
| **보조 버튼** | 바탕 투명, 1px `--text` 테두리, 글자 `--text`. 올리면 바탕 `--text`·글자 `--bg`로 반전 | 취소, 목록으로, 수정, 로그인 |
| **위험 버튼** | 바탕 투명, 1px `--danger` 테두리, 글자 `--danger`. 올리면 바탕 `--danger-soft` | 삭제 |
| **텍스트 링크** | 글자 + `→`, 아래 1px 밑줄. 올리면 화살표가 4px 오른쪽으로 | 자세히 보기, 더 알아보기, 카테고리 관리 |
| **아이콘 버튼** | 40×40px, 테두리 없음, 올리면 바탕 `--surface-accent` | ↑ ↓ ↻ × ☰ |
| 작은 크기 | 높이 40px, 좌우 20px, 14px | 카드·목록 안 버튼 |
| 비활성 | 투명도 0.4, 커서 `not-allowed` | 저장 중 |

### 6-4. 입력칸 (참고 사이트 예약창 스타일)
- **라벨**: `eyebrow`와 비슷한 작은 글자(13px 500, `--text-muted`), 필수 표시는 라벨 뒤 `*`(`--accent`)
- **한 줄 입력·날짜·선택**: 위·좌·우 테두리 없이 **아래 1px 선만**(`--line-strong`), 높이 48px, 16px. 초점 시 아래 선이 2px `--text`로
- **마크다운 편집기(EasyMDE)**: 1px `--line-strong` 사각 테두리, 도구 막대 바탕 `--surface`, 직각, 최소 높이 400px
- **도움말·글자 수**: 입력칸 아래 8px, `caption`, `--text-muted`. 한도 초과 시 `--danger`
- **오류**: 입력칸 아래 선 `--danger` + 오류 문구(`small`, `--danger`)

### 6-5. 글 카드 (글 목록)
참고 사이트의 글자 중심 오퍼 카드를 옮긴 형태.

```
──────────────────────────────── ← 위 1px --text (카드 시작선)
AI 도구 활용                       ← 카테고리 (eyebrow 스타일, 한글은 자간 0.1em)
ChatGPT로 회의록 요약 자동화하기     ← h3, 2줄 넘으면 … 
2026년 10월 13일                   ← small, --text-muted
회의 녹음을 텍스트로 바꾼 뒤…        ← body, --text-muted, 3줄 넘으면 …
자세히 보기 →                      ← 텍스트 링크
```
- 바탕 없음, 안쪽 위 여백 24px, 카드 사이 세로 48px · 가로 32px
- 마우스를 올리면 제목에 밑줄, 화살표 이동. 카드 전체가 클릭 영역

### 6-6. 카테고리 탭 (글 목록)
- 가로 한 줄, 넘치면 가로 스크롤(이 줄만). 탭 사이 32px
- 탭: 15px, `--text-muted`, 뒤에 개수(caption). 선택된 탭: `--text` + 아래 2px `--text` 선
- 탭 줄 아래 전체 1px `--line`

### 6-7. 배지 · 태그
| 종류 | 모양 |
|---|---|
| 카테고리 배지 | 바탕 없음, 12px 500, `--accent`, 자간 0.1em |
| 미분류 배지 | 같은 모양, `--text-muted` |
| 태그 (기술·관심 분야) | 알약 모양, 1px `--line-strong`, 좌우 14px, 높이 32px, 14px |
| 개수 배지 | 알약 모양, 바탕 `--surface-accent`, 12px |

### 6-8. 자기소개 카드 (글 목록 위)
- 바탕 `--surface`, 직각, 안쪽 32px, 가로 배치: 사진(64px 원형) · 이름(h3) · 한 줄 소개(`--text-muted`) · 오른쪽 끝 [더 알아보기 →]
- 모바일: 세로 배치, 가운데 정렬

### 6-9. 소개 페이지 블록
- **프로필**: 사진 120px 원형(없으면 `--surface-accent` 원 + 이름 첫 글자 serif 48px `--accent`) · 이름 `display` · 한 줄 소개 `body-lg` `--text-muted`
- **AI 도구 목록**: 한 줄씩, 왼쪽 도구 이름(h3, 고정 폭 200px) · 오른쪽 용도(`--text-muted`), 줄 사이 1px `--line`. 모바일은 세로로
- **학습 현황 숫자 카드**: 3칸 격자, 위 1px `--text` 선, 숫자 `stat`(serif) + 아래 라벨(eyebrow 한글)
- **연락처**: 텍스트 링크 가로 나열

### 6-10. 안내 · 오류 메시지
| 종류 | 모양 |
|---|---|
| 정보·성공 | 바탕 `--sea-soft`, 왼쪽 2px `--sea`, 글자 `--text`, 3초 뒤 사라짐 |
| 오류 | 바탕 `--danger-soft`, 왼쪽 2px `--danger`, 글자 `--text`, 직접 닫기 [×] |
| 개인정보 주의 (설정) | 바탕 `--surface-accent`, 왼쪽 2px `--accent` |
| 위치 | 헤더 바로 아래 본문 맨 위, 폭은 본문 폭과 같게 |
| 불러오는 중 | 글자 "불러오는 중…" + 아래 얇은 1px 선이 좌우로 움직임 (움직임 줄이기 시 글자만) |

### 6-11. 빈 화면
- 가운데 정렬, 위아래 여백 96px, serif 장식 문구 `No entries yet`(serif-label, `--accent-deco` 아님 → `--text-muted`) + 한글 안내 + 버튼

### 6-12. 마크다운 본문 (`.markdown-body`)
| 요소 | 모양 |
|---|---|
| 본문 | `body-lg`, 문단 사이 1.5em |
| 제목 `##` | 28px 500, 위 64px 여백, 아래 1px `--line` |
| 제목 `###` | 20px 600, 위 40px 여백 |
| 링크 | `--sea`, 1px 밑줄(아래로 3px 띄움) |
| 굵게 | 600 |
| 인용 | 왼쪽 2px `--accent-deco`, 왼쪽 안쪽 24px, 글자 `--text-muted` |
| 인라인 코드 | 바탕 `--surface-accent`, 좌우 6px, 0.9em, `--font-mono` |
| 코드 블록 | 바탕 `--surface`, 1px `--line`, 안쪽 24px, 직각, 14px, 이 블록만 가로 스크롤 |
| 표 | 위아래 1px `--text`, 줄 사이 1px `--line`, 머리글 `caption` 대문자 느낌 13px 600, 이 블록만 가로 스크롤 |
| 목록 | 왼쪽 24px, 항목 사이 0.5em, 글머리 `--accent` |
| 체크박스 | `accent-color: var(--accent)` |
| 구분선 | 1px `--line`, 위아래 48px, 가운데 짧은 선(64px) |
| 이미지 | 최대 폭 100%, 직각, 아래 설명(`caption`) |

---

## 7. 페이지별 화면 배치

### 7-1. 글 목록 `/`
```
[헤더]
(여백 96)
JOURNAL
학습 일지                                ← display
업무에 AI를 적용하며 배운 것을 기록합니다.
(여백 48)
[자기소개 카드]
(여백 64)
전체 24  AI 도구 활용 8  프롬프트 5 …     ← 카테고리 탭
총 24개의 글
(여백 32)
[글 카드] [글 카드]                       ← 데스크톱 2단 / 넓은 화면 3단 / 모바일 1단
[글 카드] [글 카드]
(여백 128)
[푸터]
```

### 7-2. 글 상세 `/post`
```
[헤더]
(여백 96)   ── 폭 720px 가운데 ──
AI 도구 활용                     ← 카테고리 배지
ChatGPT로 회의록 요약 자동화하기   ← h1
2026년 10월 13일 (수정됨 · 10월 14일)
───────────────────────────────  ← 1px --line, 위아래 48
[마크다운 본문]
───────────────────────────────
[← 목록으로]            [수정] [삭제]
(여백 128)
[푸터]
```

### 7-3. 글쓰기 · 글 수정
```
WRITE / 새 글 쓰기
(여백 48)   ── 폭 720px ──
제목 *           ____________________   ← 아래 선 입력칸
날짜 *  ________     카테고리  [미분류 ▾] 카테고리 관리 → ↻   ← 데스크톱 한 줄 2칸
본문 *  ┌──────── 편집기 ────────┐
        └────────────────────────┘
        1,234 / 20,000자
(여백 48)
                         [취소] [저장]   ← 오른쪽 정렬, 모바일은 꽉 찬 폭 세로
```

### 7-4. 소개 `/about`
```
ABOUT
(사진)  {이름}                ← display
        {한 줄 소개}
── 720px ──
[자기소개 마크다운]
(128) STACK / 기술 스택       [태그] [태그] …
(128) AI TOOLKIT / AI 활용   도구 목록 + 관심 분야 태그
(128) ARCHIVE / 학습 현황    [24 전체 글] [5 이번 달] [87 기록한 지]
                             카테고리별 · 최근 글 3개
(128) CONTACT / 연락처       GitHub →  이메일 →
```

### 7-5. 설정 `/settings`
```
SETTINGS / 설정
카테고리 관리 | 소개 관리          ← 카테고리 탭과 같은 모양
── 560px ──
(카테고리) 새 카테고리 이름 ______ [추가]
           ───────────────────────────
           AI 도구 활용 · 글 8개     ↑ ↓  이름 변경  삭제
           ───────────────────────────
(소개)     [개인정보 주의 상자]
           입력칸들 … 
                                   [저장]
```

---

## 8. 접근성 체크

- [ ] 글자 대비: 본문·버튼·링크 **4.5:1 이상**, 18px 이상 큰 글자 3:1 이상 (2장 표의 값 사용)
- [ ] 모든 버튼·링크·입력칸에 키보드 초점 테두리가 보인다
- [ ] 아이콘 버튼(↑ ↓ ↻ × ☰)에 `aria-label`이 있다
- [ ] 눌리는 영역 최소 **44×44px** (모바일)
- [ ] eyebrow 영문 라벨은 `aria-hidden="true"`
- [ ] 색만으로 상태를 구분하지 않는다 (오류는 색 + 문구, 현재 메뉴는 색 + 밑줄)
- [ ] 움직임 줄이기 설정 시 애니메이션 꺼짐
- [ ] 200% 확대해도 글이 잘리지 않는다

---

## 9. CSS 토큰 (`style.css` 맨 위에 그대로 사용)

```css
:root {
  /* 색 — 밝은 화면 */
  --bg: #ffffff;
  --surface: #fbf9f6;
  --surface-accent: #f8f3ef;
  --text: #383431;
  --text-muted: #656565;
  --text-subtle: #7d7d7d;
  --accent: #836346;
  --accent-strong: #59412d;
  --accent-deco: #c5ae9b;
  --on-accent: #ffffff;
  --sea: #3e5b5f;
  --sea-soft: #f1f8f9;
  --line: #e8e8e8;
  --line-strong: #cbc7c4;
  --danger: #b3261e;
  --danger-soft: #fdf0ef;

  /* 글꼴 */
  --font-sans: "Pretendard Variable", Pretendard, system-ui, -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
  --font-serif: "Cormorant Garamond", "Times New Roman", serif;
  --font-mono: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;

  /* 간격 */
  --space-1: 4px;  --space-2: 8px;   --space-3: 12px;  --space-4: 16px;
  --space-6: 24px; --space-8: 32px;  --space-12: 48px; --space-16: 64px;
  --space-24: 96px; --space-32: 128px;

  /* 폭 */
  --w-page: 1200px;
  --w-read: 720px;
  --w-narrow: 560px;

  /* 움직임 */
  --ease: cubic-bezier(.47, .16, .24, 1);
  --dur-fast: .2s;
  --dur: .3s;
  --dur-slow: .5s;

  color-scheme: light dark;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1a1816;
    --surface: #24211e;
    --surface-accent: #2e2925;
    --text: #ece8e4;
    --text-muted: #a1a1a1;
    --text-subtle: #a1a1a1;
    --accent: #c5ae9b;
    --accent-strong: #d3bba8;
    --accent-deco: #836346;
    --on-accent: #1a1816;
    --sea: #90b8bd;
    --sea-soft: #1f2a2c;
    --line: #34302c;
    --line-strong: #4a4440;
    --danger: #ee5454;
    --danger-soft: #2f1c1b;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
  }
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.75;
  word-break: keep-all;
  -webkit-font-smoothing: antialiased;
}

:focus-visible {
  outline: 2px solid var(--sea);
  outline-offset: 2px;
}
```
