# 나의 작은 홈피 👑

React + Vite로 만든 개인 소장용 홈페이지입니다. 포트폴리오가 아니라 사진과 추억을
예쁘게 모아두는 공주풍 미니홈피 컨셉이에요.

## 시작하기

```bash
npm install
npm run dev
```

## 내용 커스터마이징

닉네임, 상태메시지, 갤러리, 다이어리, 좋아하는 것들, 방명록 등 모든 표시 내용은
`src/content.js` 한 곳에서 관리합니다. 이 파일의 값만 수정하면 사이트 전체 내용이 바뀝니다.

## 사진 추가하기

1. 사진 파일을 `src/assets/photos/`에 넣습니다.
2. `src/content.js` 위쪽에서 `import photo1 from './assets/photos/photo1.jpg'` 형태로 불러옵니다.
3. `gallery` 배열의 해당 항목에 `image: photo1`을 넣으면 이모지 대신 실제 사진이 보여집니다.

## 스크립트

- `npm run dev` — 개발 서버 실행
- `npm run build` — 프로덕션 빌드 (`dist/`)
- `npm run preview` — 빌드 결과 미리보기
- `npm run lint` — oxlint 실행
