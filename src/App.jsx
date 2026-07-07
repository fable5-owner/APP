import { useEffect, useState } from 'react'
import { profile, about, skills, projects, experience } from './content'
import './App.css'

const NAV_LINKS = [
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'contact', label: 'Contact' },
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
          {profile.name}
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

function Hero() {
  return (
    <section id="top" className="hero">
      <div className="hero__avatar" aria-hidden="true">
        {profile.avatarInitials}
      </div>
      <p className="hero__eyebrow">{profile.role}</p>
      <h1>{profile.name}</h1>
      <p className="hero__tagline">{profile.tagline}</p>
      <div className="hero__actions">
        <a className="button button--primary" href="#projects">
          프로젝트 보기
        </a>
        <a className="button" href="#contact">
          연락하기
        </a>
      </div>
      <ul className="hero__socials">
        {profile.socials.map((s) => (
          <li key={s.label}>
            <a href={s.href} target="_blank" rel="noreferrer noopener">
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

function About() {
  return (
    <section id="about" className="section">
      <h2 className="section__title">About</h2>
      <p className="about__text">{about}</p>
      <p className="about__meta">📍 {profile.location}</p>
    </section>
  )
}

function Skills() {
  return (
    <section id="skills" className="section">
      <h2 className="section__title">Skills</h2>
      <ul className="skills">
        {skills.map((skill) => (
          <li key={skill} className="skills__tag">
            {skill}
          </li>
        ))}
      </ul>
    </section>
  )
}

function Projects() {
  return (
    <section id="projects" className="section">
      <h2 className="section__title">Projects</h2>
      <div className="projects">
        {projects.map((p) => (
          <a key={p.title} className="project-card" href={p.href} target="_blank" rel="noreferrer noopener">
            <h3>{p.title}</h3>
            <p>{p.description}</p>
            <ul className="project-card__tags">
              {p.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          </a>
        ))}
      </div>
    </section>
  )
}

function Experience() {
  return (
    <section id="experience" className="section">
      <h2 className="section__title">Experience</h2>
      <ol className="timeline">
        {experience.map((item) => (
          <li key={`${item.title}-${item.period}`} className="timeline__item">
            <span className="timeline__period">{item.period}</span>
            <div className="timeline__body">
              <h3>
                {item.title} · {item.org}
              </h3>
              <p>{item.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Contact() {
  return (
    <section id="contact" className="section section--contact">
      <h2 className="section__title">Contact</h2>
      <p className="contact__text">함께 일하고 싶으신가요? 언제든 편하게 연락 주세요.</p>
      <a className="button button--primary" href={`mailto:${profile.email}`}>
        {profile.email}
      </a>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <p>
        © {new Date().getFullYear()} {profile.name}. All rights reserved.
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
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
