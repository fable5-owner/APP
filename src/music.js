// 저작권 걱정 없는 오르골풍 배경음악. mp3 파일이 아니라 브라우저에서
// 그때그때 직접 소리를 만들어 재생하는 방식이라 원본 음원이 존재하지 않음.
const NOTES = {
  C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.0, A4: 440.0,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0, C6: 1046.5,
}

// 펜타토닉 스케일의 짧은 오르골풍 멜로디 (음, 박자 단위)
const MELODY = [
  ['E5', 1], ['G5', 1], ['A5', 1], ['G5', 1],
  ['E5', 1], ['D5', 1], ['C5', 2],
  ['G4', 1], ['A4', 1], ['C5', 1], ['D5', 1],
  ['E5', 1], ['D5', 1], ['C5', 2],
]

const BEAT = 0.42

class MusicBox {
  playing = false
  timerId = null
  nextNoteTime = 0
  noteIndex = 0
  ctx = null
  // 가사 플레이어가 소리를 쓰는 동안엔 첫 터치 자동재생이 끼어들지 않게 막는다
  held = false
  listeners = new Set()

  subscribe(fn) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  emit() {
    this.listeners.forEach((fn) => fn(this.playing))
  }

  ensureContext() {
    if (this.ctx) return
    this.ctx = new (window.AudioContext || window.webkitAudioContext)()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.16

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 3200

    const delay = this.ctx.createDelay()
    delay.delayTime.value = 0.28
    const feedback = this.ctx.createGain()
    feedback.gain.value = 0.25
    delay.connect(feedback)
    feedback.connect(delay)

    this.master.connect(filter)
    filter.connect(this.ctx.destination)
    filter.connect(delay)
    delay.connect(this.ctx.destination)
  }

  playNote(freq, time, dur) {
    const osc = this.ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0, time)
    gain.gain.linearRampToValueAtTime(1, time + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur)
    osc.connect(gain)
    gain.connect(this.master)
    osc.start(time)
    osc.stop(time + dur + 0.05)
  }

  scheduler = () => {
    while (this.nextNoteTime < this.ctx.currentTime + 0.5) {
      const [note, beats] = MELODY[this.noteIndex % MELODY.length]
      const dur = beats * BEAT
      this.playNote(NOTES[note], this.nextNoteTime, dur * 0.9)
      this.nextNoteTime += dur
      this.noteIndex++
    }
  }

  play() {
    this.ensureContext()
    if (this.ctx.state === 'suspended') this.ctx.resume()
    if (this.playing) return
    this.playing = true
    this.nextNoteTime = this.ctx.currentTime + 0.1
    this.timerId = setInterval(this.scheduler, 120)
    this.emit()
  }

  // 페이지 첫 상호작용에서 자동으로 시작할 때 쓰는 진입점
  autoPlay() {
    if (!this.held) this.play()
  }

  // 다른 오디오(가사 플레이어)에게 자리를 내준다
  giveWay() {
    this.held = true
    if (this.playing) this.stop()
  }

  stop() {
    this.playing = false
    if (this.timerId) clearInterval(this.timerId)
    this.timerId = null
    this.emit()
  }

  toggle() {
    this.held = false
    if (this.playing) this.stop()
    else this.play()
    return this.playing
  }
}

export const musicBox = new MusicBox()
