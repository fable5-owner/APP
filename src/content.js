// 이 파일의 값만 바꾸면 홈페이지 전체 내용이 바뀝니다.
//
// 사진 추가하는 방법:
// 1. 사진 파일을 src/assets/photos/ 안에 넣기
// 2. 이 파일 위쪽에서 import (예: import photo1 from './assets/photos/photo1.jpg')
// 3. 아래 gallery 항목에서 image: photo1 로 채워주면 이모지 대신 실제 사진이 나옵니다.
export const profile = {
  nickname: '민들레',
  status: '오늘도 소소하게 행복한 하루 🌿',
  intro: '나만 보려고 만든 작은 공간. 사진이랑 그날그날 생각을 편하게 남겨두는 곳이에요.',
  avatarEmoji: '🌼',
  visitorCount: 128,
}

export const gallery = [
  { image: null, emoji: '🌸', date: '2025.03.12', caption: '동네 벚꽃길 산책' },
  { image: null, emoji: '☕️', date: '2025.04.02', caption: '처음 가본 카페, 라떼가 맛있었다' },
  { image: null, emoji: '🏖️', date: '2025.06.20', caption: '여름 바다, 발이 시렸던 기억' },
  { image: null, emoji: '🎂', date: '2025.07.01', caption: '생일 축하 받은 날' },
  { image: null, emoji: '🌃', date: '2025.09.15', caption: '야경 보러 갔던 날' },
  { image: null, emoji: '🍂', date: '2025.11.03', caption: '단풍 구경, 사진 100장 찍음' },
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
  { label: '좋아하는 계절', value: '가을' },
  { label: '좋아하는 색', value: '라벤더' },
  { label: '좋아하는 음악', value: '잔잔한 인디' },
  { label: '좋아하는 장소', value: '동네 산책로' },
  { label: '좋아하는 간식', value: '마카롱' },
  { label: '요즘 관심사', value: '필름 사진' },
]

export const guestbook = [
  { from: '지은', message: '홈피 너무 예쁘게 잘 꾸몄다 ㅎㅎ 자주 놀러올게!' },
  { from: '민재', message: '사진 진짜 잘 찍었다... 나도 이런 거 만들어야지' },
  { from: '나', message: '오랜만에 옛날 생각나서 하나 만들어봤다. 소중하게 채워나가야지 :)' },
]
