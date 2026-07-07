// 이 파일의 값만 바꾸면 홈페이지 전체 내용이 바뀝니다.
export const profile = {
  name: '이름',
  role: 'Frontend Developer',
  tagline: '사용자 경험을 고민하는 프론트엔드 개발자입니다.',
  location: 'Seoul, Korea',
  email: 'you@example.com',
  avatarInitials: '이',
  socials: [
    { label: 'GitHub', href: 'https://github.com/your-id' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/your-id' },
    { label: 'Email', href: 'mailto:you@example.com' },
  ],
}

export const about = `안녕하세요, ${profile.name}입니다. 사용하기 쉬운 인터페이스와 견고한 코드를
만드는 데 관심이 많습니다. 새로운 기술을 배우고 적용하는 과정을 즐기며,
팀과 함께 문제를 해결할 때 가장 큰 보람을 느낍니다.`

export const skills = [
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Node.js',
  'HTML / CSS',
  'Git',
  'Figma',
]

export const projects = [
  {
    title: '프로젝트 이름 1',
    description: '이 프로젝트에 대한 간단한 설명을 작성하세요. 어떤 문제를 해결했는지, 어떤 기술을 사용했는지 적어보세요.',
    tags: ['React', 'Vite'],
    href: '#',
  },
  {
    title: '프로젝트 이름 2',
    description: '두 번째 프로젝트 설명입니다. 담당 역할과 성과를 간단히 소개하세요.',
    tags: ['TypeScript', 'Node.js'],
    href: '#',
  },
  {
    title: '프로젝트 이름 3',
    description: '세 번째 프로젝트 설명입니다. 링크를 실제 저장소나 배포 주소로 교체하세요.',
    tags: ['Next.js'],
    href: '#',
  },
]

export const experience = [
  {
    period: '2023 — 현재',
    title: '직함',
    org: '회사/조직 이름',
    description: '이 기간 동안 맡았던 업무와 성과를 간단히 작성하세요.',
  },
  {
    period: '2021 — 2023',
    title: '직함',
    org: '회사/조직 이름',
    description: '이전 경력에 대한 설명을 작성하세요.',
  },
]
