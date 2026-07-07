import { useEffect, useState } from 'react'
import { profile, gallery, diary, favorites, guestbook } from './content'
import './App.css'

const NAV_LINKS = [
  { id: 'gallery', label: '갤러리' },
  { id: 'diary', label: '다이어리' },
  { id: 'favorites', label: '좋아하는 것' },
  { id: 'guestbook', label: '방명록' },
]

function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])
  return scrolled
}

function Nav() {
  const scrolled = useScrolled()
  const [open, setOpen] = useState(false)

  return (
    <header className={`nav${scrolled ? ' nav--scrolled' : ''}`}>
      <div className="nav__inner">
        <a href="#top" className="nav__brand">
          👑 {profile.nickname}
        </a>
        <nav className={`nav__links${open ? ' nav__links--open' : ''}`}>
          {NAV_LINKS.map((link) => (
            <a key={link.id} href={`#${link.id}`} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
        </nav>
        <button
          type="button"
          className="nav__toggle"
          aria-label="메뉴 열기"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}

const SPARKLES = ['✨', '💗', '⭐️', '🎀', '💫', '🩷']

function Hero() {
  return (
    <section id="top" className="hero">
      <div className="hero__sparkles" aria-hidden="true">
        {SPARKLES.map((s, i) => (
          <span key={i} className={`hero__sparkle hero__sparkle--${i}`}>
            {s}
          </span>
        ))}
      </div>
      <div className="hero__crown" aria-hidden="true">
        👑
      </div>
      <div className="hero__avatar" aria-hidden="true">
        {profile.avatarEmoji}
      </div>
      <h1>{profile.nickname} 공주님의 홈피</h1>
      <p className="hero__status">{profile.status}</p>
      <p className="hero__intro">{profile.intro}</p>
      <div className="hero__actions">
        <a className="button button--primary" href="#gallery">
          🎀 추억 보러가기
        </a>
        <a className="button" href="#diary">
          다이어리 읽기
        </a>
      </div>
      <p className="hero__visitor">오늘도 다녀간 사람 · {profile.visitorCount}명 💌</p>
    </section>
  )
}

function Gallery() {
  return (
    <section id="gallery" className="section">
      <h2 className="section__title">📸 추억 갤러리</h2>
      <div className="gallery">
        {gallery.map((item, i) => (
          <figure key={`${item.date}-${item.caption}`} className={`polaroid polaroid--tilt-${i % 4}`}>
            <div className="polaroid__photo">
              {item.image ? <img src={item.image} alt={item.caption} /> : <span aria-hidden="true">{item.emoji}</span>}
            </div>
            <figcaption>
              <span className="polaroid__date">{item.date}</span>
              <span className="polaroid__caption">{item.caption}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

function Diary() {
  return (
    <section id="diary" className="section">
      <h2 className="section__title">📖 다이어리</h2>
      <ul className="diary">
        {diary.map((entry) => (
          <li key={entry.date} className="diary__entry">
            <span className="diary__date">{entry.date}</span>
            <div className="diary__body">
              <h3>{entry.title}</h3>
              <p>{entry.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Favorites() {
  return (
    <section id="favorites" className="section">
      <h2 className="section__title">💌 내가 좋아하는 것들</h2>
      <ul className="favorites">
        {favorites.map((f) => (
          <li key={f.label} className="favorites__card">
            <span className="favorites__label">{f.label}</span>
            <span className="favorites__value">{f.value}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Guestbook() {
  return (
    <section id="guestbook" className="section section--guestbook">
      <h2 className="section__title">✏️ 방명록</h2>
      <p className="guestbook__hint">다녀간 사람들이 남겨준 한마디</p>
      <ul className="guestbook">
        {guestbook.map((note, i) => (
          <li key={`${note.from}-${i}`} className="guestbook__note">
            <p>{note.message}</p>
            <span>— {note.from}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <p>
        © {new Date().getFullYear()} {profile.nickname}의 작은 홈피 · 소중하게 기록 중 🤍
      </p>
    </footer>
  )
}

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Gallery />
        <Diary />
        <Favorites />
        <Guestbook />
      </main>
      <Footer />
    </>
  )
}
