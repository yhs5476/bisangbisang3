# 7.24 교육 연결 가이드

비상비상 MVP는 한 소스에서 두 배포 대상을 지원한다.

- 기존 데모: Sites의 Vinext/Vite/Cloudflare Worker 빌드
- 교육 과정: Vercel의 표준 Next.js 빌드

## 강의 자료 링크

- [GitHub Desktop 설치](https://desktop.github.com/download/)
- [Vercel](https://vercel.com/)
- [Supabase](https://supabase.com/)
- [Anthropic frontend-design 스킬 예시](https://github.com/anthropics/skills/tree/main/skills/frontend-design)

## 오류가 발생했던 이유

기존 `npm run build`는 Sites용 Bash 스크립트를 실행하고 Cloudflare Worker용 `dist`
산출물을 만든다. Vercel의 Next.js 빌드와 산출물 형식이 다르므로 그대로 연결하면
프레임워크 감지 또는 빌드 단계에서 실패할 수 있다.

또한 Cloudflare 전용 `db/index.ts`가 전체 TypeScript 검사에 포함되어 표준 Next.js
빌드에서 `cloudflare:workers` 모듈 오류를 만들었다.

## 1. GitHub Desktop

1. GitHub Desktop에서 `File → Add local repository`를 선택한다.
2. 이 프로젝트 폴더를 추가한다.
3. `Publish repository`로 본인 GitHub 계정에 새 저장소를 만든다.
4. 소스에 비밀키가 포함되지 않았는지 확인하고 Push한다.

현재 `sites` 원격은 기존 Sites 배포용이므로 삭제하지 않는다. GitHub 원격은 보통
`origin` 이름으로 추가한다.

## 2. Vercel

1. Vercel에서 `Add New → Project`를 선택한다.
2. GitHub에 올린 비상비상 저장소를 Import한다.
3. Framework Preset이 `Next.js`인지 확인한다.
4. 저장소 안에 이 프로젝트만 있다면 Root Directory는 비워 둔다.
5. Build Command는 저장소의 `vercel.json`에 따라 `npm run build:vercel`을 사용한다.
6. Output Directory는 직접 지정하지 않는다. Next.js 기본값을 사용한다.
7. Deploy를 실행한다.

로컬 확인 명령:

```bash
npm run build:vercel
```

## 3. Supabase

현재 MVP는 Supabase에 연결되지 않았다. 먼저 Supabase 프로젝트를 만든 뒤 Vercel의
Project Settings → Environment Variables에 다음 키를 등록한다.

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

실제 데이터 저장을 시작할 때 `@supabase/supabase-js` 또는 Next.js 서버 인증이
필요하면 `@supabase/ssr`을 추가한다. 키만 등록했다고 현재 시뮬레이션 데이터가 자동으로
DB에 저장되는 것은 아니다.

## 4. 프론트엔드 디자인 스킬

공유된 `frontend-design` 자료는 배포 라이브러리가 아니라 디자인 작업 지침이다.
비상비상에서는 Material 3 기반 최소 폰트 규격, 가족 안부 흐름, 모바일 가독성 검수에
그 원칙을 적용한다.
