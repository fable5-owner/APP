// ─────────────────────────────────────────────────────────────
//  이 파일의 값만 바꾸면 홈페이지 전체 내용이 바뀝니다.
//
//  ▸ 사진 넣기
//    1. 사진을 src/assets/photos/ 안에 넣기
//    2. 아래처럼 위쪽에서 import
//         import photo1 from './assets/photos/photo1.jpg'
//    3. gallery 항목의 image: null  →  image: photo1  로 교체
//
//  ▸ 영상 넣기 (두 가지 방법 중 하나)
//    (A) 파일 직접 올리기
//        1. 영상을 src/assets/videos/ 안에 넣기 (mp4 권장)
//        2. 위쪽에서 import
//             import clip1 from './assets/videos/clip1.mp4'
//        3. videos 항목의 src: null  →  src: clip1  로 교체
//        4. (선택) 썸네일 이미지도 poster 에 넣으면 더 예쁨
//    (B) 유튜브 / 비메오 링크 붙이기
//        videos 항목의 embedUrl 에 링크만 넣으면 됩니다
//          embedUrl: 'https://youtu.be/xxxxxxxx'
//
//  src / embedUrl 둘 다 비어 있으면 "영상 준비 중" 카드가 보여요.
// ─────────────────────────────────────────────────────────────

import friendsFilm from './assets/videos/friends-film.mp4'
import friendsFilmPoster from './assets/videos/friends-film.jpg'
import childhoodMemories from './assets/videos/childhood-memories.mp4'
import childhoodMemoriesPoster from './assets/videos/childhood-memories.jpg'

export const profile = {
  nickname: 'Áng',
  koreanName: '민주',
  since: 'SINCE 2026',
  title: 'Áng의 작은 방',
  tagline: '사진과 영상, 그리고 그날의 마음을 조심스레 모아두는 곳.',
  intro:
    '거창하지 않아도 괜찮아요. 좋아하는 것들과 오래 간직하고 싶은 순간을 이 방 안에 하나씩 걸어둡니다.',
  visitorCount: 128,
}

export const gallery = [
  { image: null, date: '2025.03.12', caption: '동네 벚꽃길 산책' },
  { image: null, date: '2025.04.02', caption: '처음 가본 카페, 라떼가 맛있었다' },
  { image: null, date: '2025.06.20', caption: '여름 바다, 발이 시렸던 기억' },
  { image: null, date: '2025.07.01', caption: '생일 축하 받은 날' },
  { image: null, date: '2025.09.15', caption: '야경 보러 갔던 날' },
  { image: null, date: '2025.11.03', caption: '단풍 구경, 사진 100장 찍음' },
]

export const videos = [
  {
    src: friendsFilm,
    embedUrl: null,
    poster: friendsFilmPoster,
    date: 'ROLL 01',
    title: '우리들의 날들',
    description: '친구들과 함께한 순간을 필름 다이어리처럼 담았어요.',
  },
  {
    src: childhoodMemories,
    embedUrl: null,
    poster: childhoodMemoriesPoster,
    date: 'ONCE UPON A TIME',
    title: '어린 시절',
    description: '오래 간직하고 싶은 다섯 장의 기억.',
  },
]

export const diary = [
  {
    date: '2026.07.05',
    title: '오늘의 기록',
    text: '별일 없던 하루였지만, 그래서 더 편안했다. 이런 날도 소중하게 남겨두고 싶어서 여기 적어본다.',
  },
  {
    date: '2026.06.18',
    title: '작은 행복',
    text: '좋아하는 노래 들으면서 산책했다. 날씨가 딱 좋아서 계속 걷고 싶었던 하루.',
  },
  {
    date: '2026.05.02',
    title: '고마웠던 순간',
    text: '친구가 별거 아닌 걸로 챙겨줘서 괜히 마음이 몽글몽글했다. 오래 기억하고 싶다.',
  },
]

export const favorites = [
  { label: '좋아하는 계절', value: '봄' },
  { label: '좋아하는 색', value: '빨간색' },
  { label: '좋아하는 음악', value: '베트남' },
  { label: '좋아하는 장소', value: '베트남' },
  { label: '좋아하는 간식', value: '고기' },
  { label: '관심사', value: '영화' },
]

export const guestbook = [
  { from: '지은', message: '홈피 너무 예쁘게 잘 꾸몄다 ㅎㅎ 자주 놀러올게!' },
  { from: '민재', message: '사진이랑 영상 진짜 잘 담았다... 나도 이런 거 만들어야지' },
  { from: '나', message: '오랜만에 옛날 생각나서 하나 만들어봤다. 소중하게 채워나가야지.' },
]
