import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { musicBox } from './music'
import { song, stanzas, lines, defaultStarts } from './lyrics'
import './LyricsPlayer.css'

const STORAGE_KEY = 'anh-lyrics-sync-v1'
const MIN_GAP = 1 // 줄과 줄 사이 최소 간격(초)

function loadStarts() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')
    if (
      Array.isArray(saved) &&
      saved.length === lines.length &&
      saved.every((n, i) => Number.isFinite(n) && (i === 0 || n >= saved[i - 1]))
    ) {
      return saved
    }
  } catch {
    // ignore malformed storage
  }
  return defaultStarts
}

function fmt(sec) {
  if (!Number.isFinite(sec) || sec < 0) sec = 0
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function fmtPrecise(sec) {
  const m = Math.floor(sec / 60)
  const s = sec - m * 60
  return `${m}:${s.toFixed(1).padStart(4, '0')}`
}

// 마지막으로 시작된 줄의 인덱스 (아직 첫 줄 전이면 -1)
function activeIndexAt(t, starts) {
  let idx = -1
  for (let i = 0; i < starts.length; i++) {
    if (starts[i] <= t) idx = i
    else break
  }
  return idx
}

export default function LyricsPlayer() {
  const audioRef = useRef(null)
  const listRef = useRef(null)
  const lineRefs = useRef([])
  const rafRef = useRef(0)

  const [starts, setStarts] = useState(loadStarts)
  const [now, setNow] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [syncMode, setSyncMode] = useState(false)
  const [target, setTarget] = useState(0) // 싱크 모드에서 다음에 찍을 줄
  const [copied, setCopied] = useState(false)

  const active = useMemo(() => activeIndexAt(now, starts), [now, starts])
  const edited = useMemo(
    () => starts.some((t, i) => Math.abs(t - defaultStarts[i]) > 0.001),
    [starts],
  )

  const persist = useCallback((next) => {
    setStarts(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // storage may be unavailable (private mode) — keep it in memory at least
    }
  }, [])

  /* ── 재생 상태 / 시간 추적 ───────────────────────────── */

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const tick = () => {
      setNow(audio.currentTime)
      rafRef.current = requestAnimationFrame(tick)
    }
    const onPlay = () => {
      musicBox.giveWay() // 배경 오르골 음악은 멈춘다
      setPlaying(true)
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(tick)
    }
    const onPause = () => {
      setPlaying(false)
      cancelAnimationFrame(rafRef.current)
      setNow(audio.currentTime)
    }
    const onMeta = () => setDuration(audio.duration || 0)
    const onSeek = () => setNow(audio.currentTime)

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onPause)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('durationchange', onMeta)
    audio.addEventListener('seeked', onSeek)
    onMeta()

    // 배경 음악을 다시 켜면 가사 플레이어는 양보한다
    const unsub = musicBox.subscribe((on) => {
      if (on && !audio.paused) audio.pause()
    })

    return () => {
      cancelAnimationFrame(rafRef.current)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onPause)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('durationchange', onMeta)
      audio.removeEventListener('seeked', onSeek)
      unsub()
    }
  }, [])

  /* ── 현재 줄이 바뀌면 가사창 안에서만 부드럽게 스크롤 ─── */

  useEffect(() => {
    const box = listRef.current
    const el = lineRefs.current[Math.max(active, 0)]
    if (!box || !el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const top = el.offsetTop - box.clientHeight / 2 + el.offsetHeight / 2
    box.scrollTo({ top: Math.max(top, 0), behavior: reduce ? 'auto' : 'smooth' })
  }, [active])

  /* ── 컨트롤 ──────────────────────────────────────────── */

  const seek = useCallback((t) => {
    const audio = audioRef.current
    if (!audio) return
    const max = Number.isFinite(audio.duration) ? audio.duration : t
    audio.currentTime = Math.min(Math.max(t, 0), max)
    setNow(audio.currentTime)
  }, [])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      musicBox.giveWay()
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }, [])

  const playFrom = (t) => {
    seek(t)
    const audio = audioRef.current
    if (audio?.paused) {
      musicBox.giveWay()
      audio.play().catch(() => {})
    }
  }

  const jumpLine = (dir) => {
    if (dir > 0) return seek(starts[Math.min(active + 1, lines.length - 1)])
    // 이전: 줄이 시작된 지 3초가 넘었으면 그 줄 처음으로, 아니면 바로 앞 줄로
    if (active < 0) return seek(0)
    if (now - starts[active] > 3) return seek(starts[active])
    return seek(active === 0 ? 0 : starts[active - 1])
  }

  /* ── 싱크 맞추기 ─────────────────────────────────────── */

  const tap = useCallback(() => {
    const audio = audioRef.current
    if (!audio || target >= lines.length) return
    const t = Math.round(audio.currentTime * 100) / 100
    const next = starts.slice()
    next[target] = t
    // 줄 순서가 뒤바뀌지 않도록 앞뒤 줄을 최소 간격만큼 밀어서 정리한다
    for (let j = target + 1; j < next.length; j++) {
      if (next[j] < next[j - 1] + MIN_GAP) next[j] = Math.round((next[j - 1] + MIN_GAP) * 100) / 100
    }
    for (let j = target - 1; j >= 0; j--) {
      if (next[j] > next[j + 1] - MIN_GAP) next[j] = Math.max(Math.round((next[j + 1] - MIN_GAP) * 100) / 100, 0)
    }
    persist(next)
    setTarget(target + 1)
  }, [persist, starts, target])

  useEffect(() => {
    if (!syncMode) return
    const onKey = (e) => {
      if (e.code !== 'Space') return
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'A') return
      e.preventDefault()
      tap()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [syncMode, tap])

  const nudge = (index, delta) => {
    const next = starts.slice()
    const lo = index === 0 ? 0 : next[index - 1] + 0.1
    const hi = index === next.length - 1 ? Infinity : next[index + 1] - 0.1
    next[index] = Math.round(Math.min(Math.max(next[index] + delta, lo), hi) * 100) / 100
    persist(next)
  }

  const shiftAll = (delta) => {
    const next = starts.map((t) => Math.max(0, Math.round((t + delta) * 100) / 100))
    persist(next)
  }

  const reset = () => {
    persist(defaultStarts)
    setTarget(0)
  }

  const copyTimings = async () => {
    const text = JSON.stringify(starts)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      window.prompt('아래 값을 복사해 주세요', text)
    }
  }

  /* ── 화면 ────────────────────────────────────────────── */

  const lineProgress =
    active >= 0
      ? Math.min(
          Math.max(
            (now - starts[active]) /
              ((starts[active + 1] ?? (duration || starts[active] + 20)) - starts[active]),
            0,
          ),
          1,
        )
      : 0
  const countdown = active < 0 ? Math.max(Math.ceil(starts[0] - now), 0) : 0
  const stanzaOf = (i) => lines[i]?.stanza ?? -1
  const activeStanza = stanzaOf(active)

  let lineNo = 0

  return (
    <div className="lp">
      <audio ref={audioRef} src={song.src} preload="metadata" />

      <div className="lp__head">
        <span className="lp__note" aria-hidden="true">♪</span>
        <h3 className="lp__title">{song.title}</h3>
        <p className="lp__sub">{song.subtitle}</p>
      </div>

      <div
        className={`lp__stage${playing ? ' is-playing' : ''}`}
        ref={listRef}
        aria-live="off"
        tabIndex={-1}
      >
        {active < 0 && (
          <p className="lp__intro">
            {playing ? (
              <>
                ♪ 전주 중… <b>{countdown}</b>초 뒤 노래가 시작돼요
              </>
            ) : (
              '▶ 재생을 누르면 가사가 흐르기 시작해요'
            )}
          </p>
        )}
        {stanzas.map((pair, s) => (
          <div
            key={s}
            className={`lp__stanza${s === activeStanza ? ' is-current' : ''}${
              s < activeStanza ? ' is-past' : ''
            }`}
          >
            {pair.map((text) => {
              const i = lineNo++
              const isActive = i === active
              const isTarget = syncMode && i === target
              return (
                <button
                  type="button"
                  key={i}
                  ref={(el) => {
                    lineRefs.current[i] = el
                  }}
                  className={`lp__line${isActive ? ' is-active' : ''}${
                    i < active ? ' is-done' : ''
                  }${isTarget ? ' is-target' : ''}`}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => (syncMode ? setTarget(i) : playFrom(starts[i]))}
                  title={syncMode ? '이 줄을 다음에 찍을 줄로 선택' : `${fmt(starts[i])} 부터 듣기`}
                >
                  <span className="lp__time">{fmt(starts[i])}</span>
                  <span className="lp__text">{text}</span>
                  {isActive && (
                    <span
                      className="lp__bar"
                      style={{ transform: `scaleX(${lineProgress})` }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div className="lp__controls">
        <div className="lp__seek">
          <span className="lp__clock">{fmt(now)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(now, duration || 0)}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="재생 위치"
            style={{ '--fill': `${duration ? (now / duration) * 100 : 0}%` }}
          />
          <span className="lp__clock">{fmt(duration)}</span>
        </div>
        <div className="lp__buttons">
          <button type="button" className="lp__btn" onClick={() => jumpLine(-1)} aria-label="이전 줄">
            ⏮
          </button>
          <button
            type="button"
            className="lp__btn lp__btn--main"
            onClick={togglePlay}
            onPointerDown={() => musicBox.giveWay()}
            aria-label={playing ? '일시정지' : '재생'}
          >
            {playing ? '❚❚' : '▶'}
          </button>
          <button type="button" className="lp__btn" onClick={() => jumpLine(1)} aria-label="다음 줄">
            ⏭
          </button>
        </div>
      </div>

      <div className="lp__foot">
        <button
          type="button"
          className="lp__link"
          aria-expanded={syncMode}
          onClick={() => {
            setSyncMode((v) => !v)
            setTarget(active < 0 ? 0 : Math.min(active + 1, lines.length - 1))
          }}
        >
          {syncMode ? '싱크 맞추기 닫기' : '⏱ 가사 타이밍이 안 맞나요? 직접 맞추기'}
        </button>
        {edited && !syncMode && <span className="lp__badge">내가 맞춘 타이밍 적용 중</span>}
      </div>

      {syncMode && (
        <div className="lp__sync">
          <p className="lp__sync-tip">
            반주(MR)만 있는 음원이라 가사 시작 시간을 박자 구조로 추정했어요. 음악을 재생하고,
            <b> 노래가 시작되는 순간마다 아래 [지금!] 버튼(또는 스페이스바)</b>을 누르면 그 줄의
            시작 시간이 저장돼요.
          </p>
          <div className="lp__sync-now">
            {target < lines.length ? (
              <>
                다음에 찍을 줄 <b>{target + 1}/{lines.length}</b>
                <span className="lp__sync-line">“{lines[target].text}”</span>
              </>
            ) : (
              <b>모든 줄을 맞췄어요! 🎉</b>
            )}
          </div>
          <div className="lp__sync-actions">
            <button type="button" className="btn btn--solid lp__tap" onClick={tap} disabled={target >= lines.length}>
              지금!
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setTarget((t) => Math.max(t - 1, 0))}>
              한 줄 뒤로
            </button>
          </div>

          <details className="lp__fine">
            <summary>줄별 미세 조정 · 전체 이동</summary>
            <div className="lp__shift">
              전체
              {[-1, -0.2, 0.2, 1].map((d) => (
                <button type="button" key={d} className="lp__chip" onClick={() => shiftAll(d)}>
                  {d > 0 ? '+' : ''}
                  {d}초
                </button>
              ))}
            </div>
            <ul className="lp__rows">
              {lines.map((l, i) => (
                <li key={i}>
                  <span className="lp__row-time">{fmtPrecise(starts[i])}</span>
                  <span className="lp__row-text">{l.text}</span>
                  <button type="button" className="lp__chip" onClick={() => nudge(i, -0.2)} aria-label="0.2초 앞당기기">
                    −
                  </button>
                  <button type="button" className="lp__chip" onClick={() => nudge(i, 0.2)} aria-label="0.2초 늦추기">
                    +
                  </button>
                </li>
              ))}
            </ul>
          </details>

          <div className="lp__sync-actions">
            <button type="button" className="btn btn--ghost" onClick={copyTimings}>
              {copied ? '복사됐어요 ✓' : '타이밍 값 복사'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={reset} disabled={!edited}>
              기본값으로 되돌리기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
