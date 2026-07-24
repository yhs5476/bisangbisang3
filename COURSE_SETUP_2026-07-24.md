# 7.24 교육 연결 가이드

비상비상 MVP는 한 소스에서 두 배포 대상을 지원한다.

- 기존 데모: Sites의 Vinext/Vite/Cloudflare Worker 빌드
- 교육 과정: Vercel의 표준 Next.js 빌드

## 강의 자료 링크

- [GitHub Desktop 설치](https://desktop.github.com/download/)
- [GitHub Desktop으로 기존 프로젝트 게시](https://docs.github.com/en/desktop/adding-and-cloning-repositories/adding-an-existing-project-to-github-using-github-desktop?platform=windows)
- [Vercel](https://vercel.com/)
- [Vercel Git 저장소 배포](https://vercel.com/docs/git)
- [Vercel 지원 Node.js 버전](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [Supabase](https://supabase.com/)
- [Anthropic frontend-design 스킬 예시](https://github.com/anthropics/skills/tree/main/skills/frontend-design)

## 오류가 발생했던 이유

기존 `npm run build`는 Sites용 Bash 스크립트를 실행하고 Cloudflare Worker용 `dist`
산출물을 만든다. Vercel의 Next.js 빌드와 산출물 형식이 다르므로 그대로 연결하면
프레임워크 감지 또는 빌드 단계에서 실패할 수 있다.

또한 Cloudflare 전용 `db/index.ts`가 전체 TypeScript 검사에 포함되어 표준 Next.js
빌드에서 `cloudflare:workers` 모듈 오류를 만들었다.

## 1. GitHub Desktop

GitHub Desktop에는 `package.json`, `vercel.json`, `.git`이 함께 있는 앱 폴더를
추가해야 한다. 이 PC의 원본 경로는 다음과 같다.

```text
C:\Users\User\Documents\비상비상\bisang-bisang-mvp
```

원본 저장소에는 기존 Sites 배포용 `sites` 원격이 있다. GitHub Desktop은 원격이 이미
있는 저장소에서 `Publish repository`를 표시하지 않을 수 있으므로 이 원격을 삭제하지
말고, Codex가 준비한 다음 교육용 복제본을 GitHub Desktop에 추가한다.

```text
C:\Users\User\Documents\비상비상\bisang-bisang-mvp-vercel
```

1. GitHub Desktop에서 `File → Add local repository`를 선택한다.
2. 위의 `bisang-bisang-mvp-vercel` 폴더를 선택한다.
3. `Publish repository`를 누르고 저장소 이름을 `bisang-bisang-mvp`로 지정한다.
4. 공개 여부를 확인하고 본인 GitHub 계정으로 Publish한다.
5. `View on GitHub`에서 `main` 브랜치 루트에 `vercel.json`이 보이는지 확인한다.

비밀키가 들어가는 `.env.local`은 Git에 올리지 않는다.

## 2. Vercel

1. Vercel에서 `Add New → Project`를 선택한다.
2. GitHub에 올린 비상비상 저장소를 Import한다.
3. Framework Preset이 `Next.js`인지 확인한다.
4. Root Directory는 비워 둔다.
5. Node.js Version은 `24.x`를 사용한다.
6. Install Command는 저장소의 `vercel.json`에 따라 `npm ci`를 사용한다.
7. Build Command는 `npm run build:vercel`을 사용한다.
8. Output Directory Override는 끄고 Next.js 기본값을 사용한다.
9. 현재 MVP 배포에는 환경변수가 필요하지 않으므로 바로 Deploy한다.

기존에 실패한 Vercel 프로젝트를 다시 쓰는 경우 `Settings → Build and Deployment`에서
Framework, Root Directory, Node.js, Install Command, Build Command를 위 값으로 맞추고
특히 이전 `dist` Output Directory Override를 끈다. 그다음 기존 빌드 캐시를 사용하지
않고 Redeploy한다.

GitHub 저장소가 목록에 보이지 않으면 Vercel의 GitHub App이 해당 개인 저장소에 접근할
수 있도록 Repository access를 승인한다.

로컬 전체 확인 명령:

```bash
npm ci
npm run test:vercel
```

Windows에서 실행할 때 기본 `npm run build`는 Sites용 Linux 명령이므로 사용하지 않는다.

## 3. 배포 완료 확인

1. Vercel Production URL을 연다.
2. 가족 화면으로 이동한다.
3. `안부 묻기`를 누른다.
4. 전송 완료 상태가 표시되는지 확인한다.

현재 `checkinSent`는 브라우저 메모리 상태이므로 새로고침하면 초기화된다. 이것은 현재
MVP의 정상 동작이며, Supabase 영속화 단계에서 저장 상태로 전환한다.

## 4. Supabase

현재 MVP의 Vercel 배포에는 Supabase가 필요하지 않다. 데이터 저장 수업을 진행할 때
Supabase 프로젝트를 만든 뒤 Vercel의 Project Settings → Environment Variables에
다음 키를 등록하고 새로 배포한다.

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

실제 데이터 저장을 시작할 때 `@supabase/supabase-js` 또는 Next.js 서버 인증이
필요하면 `@supabase/ssr`을 추가한다. 키만 등록했다고 현재 시뮬레이션 데이터가 자동으로
DB에 저장되는 것은 아니다. 브라우저에는 publishable key만 사용하고 `service_role`
키를 넣지 않는다. 테이블에는 Row Level Security 정책을 설정한다.

## 5. 프론트엔드 디자인 스킬

공유된 `frontend-design` 자료는 배포 라이브러리가 아니라 디자인 작업 지침이다.
비상비상에서는 Material 3 기반 최소 폰트 규격, 가족 안부 흐름, 모바일 가독성 검수에
그 원칙을 적용한다.
