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

## 가사와 함께 듣는 노래

`src/assets/audio/arirang-mr.mp3` 음원을 가사와 함께 재생하는 "노래" 섹션이 있습니다.

- 가사와 줄별 시작 시간은 `src/lyrics.js` 에서 관리합니다.
- 음원이 반주(MR)뿐이라 시작 시간은 박자 구조로 추정한 값입니다. 어긋나면 페이지에서
  "직접 맞추기"를 열어 노래가 시작되는 순간마다 **지금!** (또는 스페이스바)을 누르면 되고,
  브라우저에 저장됩니다. **타이밍 값 복사**로 얻은 배열을 `defaultStarts` 에 붙여넣으면
  모든 방문자에게 기본값으로 적용됩니다.

## 스크립트

- `npm run dev` — 개발 서버 실행
- `npm run build` — 프로덕션 빌드 (`dist/`)
- `npm run preview` — 빌드 결과 미리보기
- `npm run lint` — oxlint 실행
