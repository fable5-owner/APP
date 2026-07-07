import { useEffect, useRef, useState } from 'react'
import { profile, gallery, videos, diary, favorites, guestbook } from './content'
import { musicBox } from './music'
import './App.css'

const NAV_LINKS = [
  { id: 'gallery', label: '갤러리' },
  { id: 'films', label: '영상' },
  { id: 'diary', label: '다이어리' },
  { id: 'favorites', label: '좋아하는 것' },
  { id: 'guestbook', label: '방명록' },
]

/* ─── 장식용 SVG 오너먼트 ─────────────────────────────── */

function Crest() {
  return (
    <svg className="crest" viewBox="0 0 64 64" role="img" aria-label="왕관 문양">
      <circle cx="32" cy="32" r="30" className="crest__ring" />
      <path
        className="crest__crown"
        d="M20 38 L20 28 L26 33 L32 24 L38 33 L44 28 L44 38 Z"
      />
      <circle cx="20" cy="26" r="1.7" className="crest__dot" />
      <circle cx="32" cy="22" r="1.9" className="crest__dot" />
      <circle cx="44" cy="26" r="1.7" className="crest__dot" />
      <line x1="22" y1="41" x2="42" y2="41" className="crest__base" />
    </svg>
  )
}

function Flourish() {
  return (
    <svg className="flourish" viewBox="0 0 220 16" role="presentation" aria-hidden="true">
      <line x1="8" y1="8" x2="92" y2="8" className="flourish__line" />
      <line x1="128" y1="8" x2="212" y2="8" className="flourish__line" />
      <path
        className="flourish__leaf"
        d="M110 2 C104 6 104 10 110 14 C116 10 116 6 110 2 Z"
      />
      <circle cx="96" cy="8" r="1.6" className="flourish__dot" />
      <circle cx="124" cy="8" r="1.6" className="flourish__dot" />
    </svg>
  )
}

function Corner({ where }) {
  return (
    <svg className={`corner corner--${where}`} viewBox="0 0 48 48" aria-hidden="true">
      <path d="M2 2 L2 20 M2 2 L20 2" className="corner__stroke" />
      <path d="M2 2 C16 6 20 14 20 20" className="corner__curl" />
    </svg>
  )
}

/* ─── 은은하게 흩날리는 꽃잎 ─────────────────────────── */

function Petals() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf = 0
    let w = 0
    let h = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      w = canvas.offsetWidth
      h = canvas.offsetHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const rand = (a, b) => a + Math.random() * (b - a)
    const petals = Array.from({ length: 16 }, () => ({
      x: rand(0, w),
      y: rand(-h, h),
      r: rand(5, 11),
      s: rand(0.25, 0.7),
      drift: rand(0.4, 1.1),
      a: rand(0, Math.PI * 2),
      spin: rand(-0.01, 0.01),
      hue: Math.random() > 0.5 ? '#e9b7c6' : '#dcc6e6',
      alpha: rand(0.25, 0.55),
    }))

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of petals) {
        p.y += p.s
        p.x += Math.sin(p.y / 60) * p.drift
        p.a += p.spin
        if (p.y > h + 20) {
          p.y = -20
          p.x = rand(0, w)
        }
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.a)
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.hue
        ctx.beginPath()
        ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="petals" aria-hidden="true" />
}

/* ─── 스크롤 등장 애니메이션 ─────────────────────────── */

function Reveal({ children, className = '', as: Tag = 'div', ...rest }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true)
            io.disconnect()
          }
        }
      },
      { threshold: 0.14 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag ref={ref} className={`reveal${shown ? ' reveal--in' : ''} ${className}`} {...rest}>
      {children}
    </Tag>
  )
}

/* ─── 섹션 헤더 ─────────────────────────────────────── */

function SectionHead({ eyebrow, title }) {
  return (
    <header className="sec__head">
      <span className="sec__eyebrow">{eyebrow}</span>
      <h2 className="sec__title">{title}</h2>
      <Flourish />
    </header>
  )
}

/* ─── 네비게이션 ─────────────────────────────────────── */

function useScrolled(threshold = 12) {
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
          {profile.nickname}
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
          aria-label="메뉴"
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

/* ─── 히어로 ─────────────────────────────────────────── */

function Hero() {
  return (
    <section id="top" className="hero">
      <Petals />
      <Corner where="tl" />
      <Corner where="tr" />
      <Corner where="bl" />
      <Corner where="br" />
      <div className="hero__inner">
        <Crest />
        <span className="hero__since">{profile.since}</span>
        <h1 className="hero__title">{profile.title}</h1>
        <p className="hero__korname">한국 이름 · {profile.koreanName}</p>
        <Flourish />
        <p className="hero__tagline">{profile.tagline}</p>
        <p className="hero__intro">{profile.intro}</p>
        <div className="hero__actions">
          <a className="btn btn--solid" href="#gallery">
            추억 둘러보기
          </a>
          <a className="btn btn--ghost" href="#films">
            영상 보기
          </a>
        </div>
        <p className="hero__visitor">
          <span>{profile.visitorCount}</span> 번째 발걸음이 다녀갔어요
        </p>
      </div>
    </section>
  )
}

/* ─── 갤러리 ─────────────────────────────────────────── */

function Gallery() {
  return (
    <section id="gallery" className="sec">
      <SectionHead eyebrow="Gallery" title="추억의 갤러리" />
      <div className="gallery">
        {gallery.map((item, i) => (
          <Reveal
            as="figure"
            key={`${item.date}-${item.caption}`}
            className="frame"
            style={{ transitionDelay: `${(i % 3) * 80}ms` }}
          >
            <div className="frame__inner">
              <div className="frame__photo">
                {item.image ? (
                  <img src={item.image} alt={item.caption} loading="lazy" />
                ) : (
                  <span className="frame__mono" aria-hidden="true">
                    {profile.nickname.charAt(0)}
                  </span>
                )}
              </div>
              <figcaption className="frame__cap">
                <span className="frame__date">{item.date}</span>
                <span className="frame__text">{item.caption}</span>
              </figcaption>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ─── 영상 ──────────────────────────────────────────── */

function toEmbed(url) {
  if (!url) return null
  if (url.includes('youtube.com/watch?v=')) {
    return url.replace('watch?v=', 'embed/').split('&')[0]
  }
  if (url.includes('youtu.be/')) {
    return url.replace('youtu.be/', 'www.youtube.com/embed/').split('?')[0]
  }
  if (url.includes('vimeo.com/') && !url.includes('player.')) {
    return url.replace('vimeo.com/', 'player.vimeo.com/video/')
  }
  return url
}

function Film({ item }) {
  const embed = toEmbed(item.embedUrl)
  return (
    <Reveal as="figure" className="film">
      <div className="film__media">
        {item.src ? (
          <video controls poster={item.poster || undefined} preload="metadata">
            <source src={item.src} />
          </video>
        ) : embed ? (
          <iframe
            src={embed}
            title={item.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="film__soon">
            <svg viewBox="0 0 48 48" aria-hidden="true" className="film__play">
              <circle cx="24" cy="24" r="22" />
              <path d="M19 15 L34 24 L19 33 Z" />
            </svg>
            <span>영상 준비 중</span>
          </div>
        )}
      </div>
      <figcaption className="film__cap">
        <span className="film__date">{item.date}</span>
        <h3 className="film__title">{item.title}</h3>
        <p className="film__desc">{item.description}</p>
      </figcaption>
    </Reveal>
  )
}

function Films() {
  return (
    <section id="films" className="sec sec--tint">
      <SectionHead eyebrow="Cinema" title="영상 기록" />
      <div className="films">
        {videos.map((item) => (
          <Film key={`${item.date}-${item.title}`} item={item} />
        ))}
      </div>
    </section>
  )
}

/* ─── 다이어리 ───────────────────────────────────────── */

function Diary() {
  return (
    <section id="diary" className="sec">
      <SectionHead eyebrow="Diary" title="그날의 마음" />
      <div className="journal">
        {diary.map((entry) => (
          <Reveal as="article" key={entry.date} className="leaf">
            <span className="leaf__date">{entry.date}</span>
            <h3 className="leaf__title">{entry.title}</h3>
            <p className="leaf__text">{entry.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ─── 좋아하는 것 ────────────────────────────────────── */

function Favorites() {
  return (
    <section id="favorites" className="sec sec--tint">
      <SectionHead eyebrow="Favorites" title="내가 좋아하는 것들" />
      <Reveal className="faves">
        {favorites.map((f) => (
          <div key={f.label} className="fave">
            <span className="fave__label">{f.label}</span>
            <span className="fave__dots" aria-hidden="true" />
            <span className="fave__value">{f.value}</span>
          </div>
        ))}
      </Reveal>
      <Reveal className="faves__more">
        <a className="btn btn--solid" href="archive.html" target="_blank" rel="noreferrer">
          ✦ 좋아하는 것들의 기록 보기
        </a>
        <span className="faves__more-hint">금 · 돈 · 해바라기 그리고 데이지</span>
      </Reveal>
    </section>
  )
}

/* ─── 방명록 ─────────────────────────────────────────── */

function Guestbook() {
  return (
    <section id="guestbook" className="sec">
      <SectionHead eyebrow="Guestbook" title="방명록" />
      <p className="notes__hint">다녀간 사람들이 남겨준 한마디</p>
      <div className="notes">
        {guestbook.map((note, i) => (
          <Reveal
            as="blockquote"
            key={`${note.from}-${i}`}
            className="note"
            style={{ transitionDelay: `${(i % 3) * 80}ms` }}
          >
            <p className="note__msg">{note.message}</p>
            <cite className="note__from">— {note.from}</cite>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <Flourish />
      <p>
        {profile.title} · 소중하게 기록하는 중
        <br />© {new Date().getFullYear()} {profile.nickname} · {profile.koreanName}
      </p>
    </footer>
  )
}

function MusicToggle() {
  const [on, setOn] = useState(false)

  useEffect(() => () => musicBox.stop(), [])

  return (
    <button
      type="button"
      className="music-toggle"
      aria-pressed={on}
      onClick={() => setOn(musicBox.toggle())}
    >
      {on ? '♪ 음악 재생 중' : '♪ 음악 켜기'}
    </button>
  )
}

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Gallery />
        <Films />
        <Diary />
        <Favorites />
        <Guestbook />
      </main>
      <Footer />
      <MusicToggle />
    </>
  )
}
