# Todo

개인용 할 일 관리 앱입니다. `staynamcheon`과 같은 Neon PostgreSQL DB를 공유하지만, `todo_` 접두사 테이블만 추가해서 사용합니다. 기존 서비스의 테이블은 건드리지 않습니다.

## 주요 기능

- 휴대폰 번호 / 비밀번호 로그인
- 즉시 회원가입
- 할 일 생성, 수정, 삭제, 완료 처리
- 우선순위, 마감일, 카테고리, 태그 관리
- 앱 내 알림 + 브라우저 푸시
- 알림 리마인더
- 다크모드
- 검색, 필터, 정렬

## 실행

```bash
npm install
npm run dev
```

기본 개발 주소:

- `http://localhost:3000`

## 환경변수

`.env.local` 또는 `.env`에 아래 값들을 설정해야 합니다.

```env
DATABASE_URL=
SESSION_SECRET=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
TODO_CRON_SECRET=
```

## DB 구조

이 앱은 아래 `todo_` 테이블만 사용합니다.

- `todo_users`
- `todo_categories`
- `todo_todos`
- `todo_tags`
- `todo_todo_tags`
- `todo_history`
- `todo_reminders`
- `todo_notifications`
- `todo_push_subscriptions`

초기 생성 SQL은 [`prisma/todo-init.sql`](./prisma/todo-init.sql)에 있습니다.

## 주의사항

- 기존 `staynamcheon` 테이블은 수정하지 않습니다.
- 푸시 알림은 브라우저 권한과 서비스워커가 필요합니다.
- 날짜는 KST 기준으로 표시됩니다.
- 브라우저 푸시 구독이 꼬였을 때는 설정 화면의 `구독 초기화` 버튼으로 다시 시작할 수 있습니다.

## 개발 메모

- Prisma Client는 `postinstall`과 `build` 시 자동 생성됩니다.
- 빌드 명령은 `prisma generate && next build`입니다.
- 현재 프로젝트는 로컬 개발과 내부 테스트용으로 먼저 운영하고, 배포는 이후에 진행합니다.

