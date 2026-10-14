#!/usr/bin/env python3
"""Builds douyin_guide.html (inline SVG illustrations) for PDF rendering."""
import math

RED, CYAN, INK, MUTED, BG, CARD = "#fe2c55", "#18c9c4", "#111318", "#6b7280", "#f6f6f8", "#ffffff"
GOLD, BLUE, GREEN = "#f5a524", "#3b82f6", "#22a06b"


def bars(items, width=640, unit="", max_v=None, color=RED, hl=None, label_w=150, h=44, fmt=None):
    """Horizontal bar chart. items: [(label, value, color|None, note|None)]"""
    max_v = max_v or max(i[1] for i in items)
    bw = width - label_w - 120
    out = [f'<svg viewBox="0 0 {width} {len(items)*(h+14)+6}" width="100%">']
    for k, it in enumerate(items):
        label, v = it[0], it[1]
        c = it[2] if len(it) > 2 and it[2] else color
        y = k * (h + 14) + 4
        w = max(4, bw * v / max_v)
        txt = fmt(v) if fmt else f"{v:,}{unit}"
        out.append(f'<text x="0" y="{y+h*0.66}" font-size="17" font-weight="700" fill="{INK}">{label}</text>')
        out.append(f'<rect x="{label_w}" y="{y}" width="{bw}" height="{h}" rx="8" fill="#ececf1"/>')
        out.append(f'<rect x="{label_w}" y="{y}" width="{w}" height="{h}" rx="8" fill="{c}"/>')
        out.append(f'<text x="{label_w+w+8}" y="{y+h*0.68}" font-size="18" font-weight="900" fill="{INK}">{txt}</text>')
    out.append("</svg>")
    return "".join(out)


def donut(parts, size=260, hole=0.58, center=("", "")):
    """parts: [(label, value, color)]"""
    total = sum(p[1] for p in parts)
    cx = cy = size / 2
    r = size / 2 - 6
    ang = -math.pi / 2
    out = [f'<svg viewBox="0 0 {size} {size}" width="{size}" height="{size}">']
    for _, v, c in parts:
        a2 = ang + 2 * math.pi * v / total
        x1, y1 = cx + r * math.cos(ang), cy + r * math.sin(ang)
        x2, y2 = cx + r * math.cos(a2), cy + r * math.sin(a2)
        ri = r * hole
        x3, y3 = cx + ri * math.cos(a2), cy + ri * math.sin(a2)
        x4, y4 = cx + ri * math.cos(ang), cy + ri * math.sin(ang)
        large = 1 if (a2 - ang) > math.pi else 0
        out.append(
            f'<path d="M{x1:.1f},{y1:.1f} A{r},{r} 0 {large} 1 {x2:.1f},{y2:.1f} L{x3:.1f},{y3:.1f} '
            f'A{ri},{ri} 0 {large} 0 {x4:.1f},{y4:.1f}Z" fill="{c}" stroke="#fff" stroke-width="3"/>'
        )
        ang = a2
    out.append(f'<text x="{cx}" y="{cy-2}" text-anchor="middle" font-size="30" font-weight="900" fill="{INK}">{center[0]}</text>')
    out.append(f'<text x="{cx}" y="{cy+22}" text-anchor="middle" font-size="13" fill="{MUTED}">{center[1]}</text>')
    out.append("</svg>")
    return "".join(out)


def legend(parts):
    total = sum(p[1] for p in parts)
    return "".join(
        f'<div class="lg"><i style="background:{c}"></i><b>{l}</b><span>{v/total*100:.1f}%</span></div>'
        for l, v, c in parts
    )


def phone(x=0, y=0, scale=1.0, mode="feed", title=""):
    """Phone mock illustration (feed / live / local)."""
    g = [f'<g transform="translate({x},{y}) scale({scale})">']
    g.append('<rect x="0" y="0" width="200" height="400" rx="30" fill="#0b0c10"/>')
    g.append('<rect x="8" y="8" width="184" height="384" rx="24" fill="url(#scr%s)"/>' % mode)
    g.append('<rect x="72" y="14" width="56" height="12" rx="6" fill="#0b0c10"/>')
    if mode == "feed":
        g.append('<circle cx="100" cy="170" r="42" fill="#ffffff22"/><path d="M90 148 L90 192 L126 170Z" fill="#ffffffcc"/>')
        g.append('<text x="18" y="342" font-size="12" fill="#fff" font-weight="700">@yuna_daily</text>')
        g.append('<text x="18" y="360" font-size="10.5" fill="#ffffffcc">오늘의 브이로그 #일상 #맛집</text>')
        for i, (ic, n) in enumerate([("♥", "128만"), ("✎", "3.2만"), ("➦", "9.1만")]):
            g.append(f'<text x="168" y="{214+i*40}" text-anchor="middle" font-size="22" fill="#fff">{ic}</text>')
            g.append(f'<text x="168" y="{228+i*40}" text-anchor="middle" font-size="9" fill="#fff">{n}</text>')
        g.append('<circle cx="168" cy="184" r="14" fill="#ffd1dc" stroke="#fff" stroke-width="2"/>')
        g.append(f'<circle cx="168" cy="198" r="7" fill="{RED}"/><text x="168" y="201" text-anchor="middle" font-size="10" fill="#fff" font-weight="900">+</text>')
    elif mode == "live":
        g.append(f'<rect x="18" y="40" width="46" height="18" rx="9" fill="{RED}"/><text x="41" y="53" text-anchor="middle" font-size="10" fill="#fff" font-weight="900">● LIVE</text>')
        g.append('<circle cx="100" cy="140" r="40" fill="#ffffff2a"/><circle cx="100" cy="130" r="14" fill="#ffffff55"/><rect x="80" y="148" width="40" height="26" rx="12" fill="#ffffff55"/>')
        g.append('<rect x="18" y="232" width="164" height="54" rx="12" fill="#ffffffee"/>')
        g.append('<rect x="26" y="240" width="38" height="38" rx="8" fill="#ffd9a8"/>')
        g.append('<text x="72" y="256" font-size="11" fill="#111" font-weight="700">수분 크림 50ml</text>')
        g.append(f'<text x="72" y="274" font-size="13" fill="{RED}" font-weight="900">¥ 59</text>')
        g.append(f'<rect x="130" y="256" width="44" height="22" rx="11" fill="{RED}"/><text x="152" y="271" text-anchor="middle" font-size="10" fill="#fff" font-weight="900">구매</text>')
        g.append('<text x="18" y="312" font-size="10" fill="#fff">🎁 선물 ×128   ·   시청 2.4만</text>')
        g.append('<text x="18" y="334" font-size="10" fill="#ffffffcc">A: 이거 진짜 좋아요!</text><text x="18" y="350" font-size="10" fill="#ffffffcc">B: 장바구니 담았어요</text>')
    else:  # local
        g.append('<rect x="18" y="40" width="164" height="30" rx="15" fill="#ffffffee"/><text x="34" y="60" font-size="11" fill="#555">📍 근처 맛집 / 카페 검색</text>')
        for i, (nm, pr, old) in enumerate([("훠궈 2인 세트", "¥ 128", "¥ 268"), ("카페 음료 쿠폰", "¥ 9.9", "¥ 28"), ("헤어 컷 + 펌", "¥ 188", "¥ 480")]):
            yy = 84 + i * 88
            g.append(f'<rect x="18" y="{yy}" width="164" height="78" rx="12" fill="#fff"/>')
            g.append(f'<rect x="26" y="{yy+8}" width="62" height="62" rx="8" fill="{["#ffd0a6","#cdeaff","#e6d4ff"][i]}"/>')
            g.append(f'<text x="96" y="{yy+28}" font-size="11" font-weight="700" fill="#111">{nm}</text>')
            g.append(f'<text x="96" y="{yy+50}" font-size="15" font-weight="900" fill="{RED}">{pr}</text>')
            g.append(f'<text x="96" y="{yy+66}" font-size="9" fill="#999" text-decoration="line-through">{old}</text>')
        g.append('<text x="18" y="368" font-size="10" fill="#fff">매장에서 QR 코드로 사용(核销)</text>')
    g.append("</g>")
    grad = {
        "feed": ("#3a1c71", "#d76d77", "#ffaf7b"),
        "live": ("#1a2a6c", "#b21f1f", "#fdbb2d"),
        "local": ("#134e5e", "#2c8a8a", "#71b280"),
    }[mode]
    defs = (f'<linearGradient id="scr{mode}" x1="0" y1="0" x2="0" y2="1">'
            f'<stop offset="0" stop-color="{grad[0]}"/><stop offset="0.6" stop-color="{grad[1]}"/><stop offset="1" stop-color="{grad[2]}"/></linearGradient>')
    return defs, "".join(g)


def phone_svg(mode, w=200, h=400, scale=1.0):
    d, g = phone(0, 0, 1.0, mode)
    return f'<svg viewBox="0 0 200 400" width="{w*scale:.0f}" height="{h*scale:.0f}"><defs>{d}</defs>{g}</svg>'


def box(x, y, w, h, text, sub="", fill="#fff", stroke=INK, tc=INK, fs=15):
    t = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="14" fill="{fill}" stroke="{stroke}" stroke-width="2"/>'
    t += f'<text x="{x+w/2}" y="{y+h/2-(4 if sub else -5)}" text-anchor="middle" font-size="{fs}" font-weight="900" fill="{tc}">{text}</text>'
    if sub:
        t += f'<text x="{x+w/2}" y="{y+h/2+16}" text-anchor="middle" font-size="11.5" fill="{tc}" opacity=".8">{sub}</text>'
    return t


def arrow(x1, y1, x2, y2, c=INK, label=""):
    ang = math.atan2(y2 - y1, x2 - x1)
    hx, hy = x2 - 10 * math.cos(ang), y2 - 10 * math.sin(ang)
    px, py = -math.sin(ang) * 6, math.cos(ang) * 6
    s = f'<line x1="{x1}" y1="{y1}" x2="{hx:.1f}" y2="{hy:.1f}" stroke="{c}" stroke-width="3" stroke-linecap="round"/>'
    s += f'<path d="M{x2},{y2} L{hx+px:.1f},{hy+py:.1f} L{hx-px:.1f},{hy-py:.1f}Z" fill="{c}"/>'
    if label:
        s += f'<text x="{(x1+x2)/2}" y="{(y1+y2)/2-8}" text-anchor="middle" font-size="12" font-weight="700" fill="{c}">{label}</text>'
    return s


# ---------- diagrams ----------
def flywheel():
    cx, cy, r = 320, 200, 120
    names = [("영상·라이브", "콘텐츠 제작", RED), ("추천 알고리즘", "취향 맞춤 노출", BLUE), ("시청·체류", "하루 7억 명 사용", GREEN), ("구매·방문", "쇼핑·쿠폰 결제", GOLD)]
    s = ['<svg viewBox="0 0 640 400" width="100%">']
    s.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#e3e3ea" stroke-width="3" stroke-dasharray="6 8"/>')
    s.append(f'<text x="{cx}" y="{cy-4}" text-anchor="middle" font-size="22" font-weight="900" fill="{INK}">더우인</text><text x="{cx}" y="{cy+20}" text-anchor="middle" font-size="13" fill="{MUTED}">선순환 구조</text>')
    pts = []
    for i, (n, sub, c) in enumerate(names):
        a = -math.pi / 2 + i * math.pi / 2
        x, y = cx + r * math.cos(a), cy + r * math.sin(a)
        pts.append((x, y))
        s.append(box(x - 82, y - 30, 164, 60, n, sub, fill=c, stroke=c, tc="#fff"))
    for (a,b,c,d) in [(402,92,478,168),(480,232,402,306),(238,308,162,232),(160,168,238,94)]:
        s.append(arrow(a,b,c,d,INK))
    s.append(f'<text x="40" y="380" font-size="13" fill="{MUTED}">광고 수익과 판매 수수료가 다시 창작자·판매자 유입을 늘립니다.</text>')
    s.append("</svg>")
    return "".join(s)


def money_flow():
    s = ['<svg viewBox="0 0 640 330" width="100%">']
    s.append(box(10, 120, 130, 80, "이용자", "영상 · 라이브 시청", fill="#fff", stroke=INK))
    s.append(box(250, 120, 140, 80, "더우인 플랫폼", "추천·결제·정산", fill=INK, stroke=INK, tc="#fff"))
    ys = [(10, "광고주", "광고비 지급", RED), (115, "판매자(상점)", "수수료 2~8%", GOLD), (220, "지역 상점", "쿠폰 판매 수수료", GREEN)]
    for y, n, sub, c in ys:
        s.append(box(480, y, 150, 70, n, sub, fill=c, stroke=c, tc="#fff", fs=14))
        s.append(arrow(480, y + 35, 392, 160, c))
    s.append(arrow(142, 160, 248, 160, INK, "시간·관심"))
    s.append(f'<text x="10" y="262" font-size="14" fill="{MUTED}">→ 이용자 시선이 광고와 결제 수수료로 바뀝니다</text>')
    s.append(f'<text x="10" y="286" font-size="14" fill="{MUTED}">→ 라이브 선물(후원) 수익도 일부 포함</text>')
    s.append("</svg>")
    return "".join(s)


def funnel():
    s = ['<svg viewBox="0 0 330 330" width="100%">']
    steps = [("① 숏폼·라이브 노출", "취향 맞춤 추천", RED, 330), ("② 상품 카드·장바구니", "클릭으로 상품 확인", "#ff6a55", 285), ("③ 앱 안에서 결제", "더우인 페이", GOLD, 240), ("④ 택배·후기", "물류 연계, 재구매", GREEN, 195)]
    for i, (n, sub, c, w) in enumerate(steps):
        x = (330 - w) / 2
        y = i * 82
        s.append(f'<rect x="{x}" y="{y}" width="{w}" height="72" rx="14" fill="{c}"/>')
        s.append(f'<text x="165" y="{y+31}" text-anchor="middle" font-size="{15 if w>200 else 13.5}" font-weight="900" fill="#fff">{n}</text>')
        s.append(f'<text x="165" y="{y+53}" text-anchor="middle" font-size="12.5" fill="#fff" opacity=".95">{sub}</text>')
    s.append("</svg>")
    return "".join(s)


def timeline():
    ev = [("2016.9", "더우인 출시", "(당시 '아메이/A.me')"), ("2017", "틱톡 해외 출시", "해외 버전 분리"), ("2018", "중국 숏폼 1위권", "추천 알고리즘 확산"), ("2020", "라이브 커머스", "전자상거래 본격화"), ("2021~", "지역 생활 서비스", "메이퇀과 경쟁"), ("2025", "GMV 4조 위안대", "(추정치)")]
    s = ['<svg viewBox="0 0 640 170" width="100%">']
    s.append(f'<line x1="30" y1="60" x2="610" y2="60" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>')
    for i, (y, a, b) in enumerate(ev):
        x = 40 + i * 112
        c = [RED, BLUE, GREEN, GOLD, CYAN, RED][i]
        s.append(f'<circle cx="{x}" cy="60" r="12" fill="{c}" stroke="#fff" stroke-width="4"/>')
        s.append(f'<text x="{x}" y="34" text-anchor="middle" font-size="14" font-weight="900" fill="{INK}">{y}</text>')
        s.append(f'<text x="{x}" y="96" text-anchor="middle" font-size="13" font-weight="900" fill="{c}">{a}</text>')
        s.append(f'<text x="{x}" y="116" text-anchor="middle" font-size="10.5" fill="{MUTED}">{b}</text>')
    s.append("</svg>")
    return "".join(s)


def compare_phones():
    return (
        '<div class="two">'
        f'<div class="pcol">{phone_svg("feed", scale=0.8)}<h4 style="color:{RED}">더우인 (抖音)</h4><p>중국 본토 전용<br>쇼핑·쿠폰·검색까지 한 앱</p></div>'
        '<div class="vs">VS</div>'
        f'<div class="pcol">{phone_svg("live", scale=0.8)}<h4 style="color:{CYAN}">틱톡 (TikTok)</h4><p>해외 전용<br>광고 중심, 쇼핑은 확대 중</p></div>'
        "</div>"
    )


# ---------- data ----------
ad_mix = [("광고·마케팅", 46.6, RED), ("이커머스", 45.5, GOLD), ("기타(라이브 선물 등)", 7.9, CYAN)]
bd_geo = [("중국 내(더우인 등)", 68, RED), ("해외(대부분 틱톡)", 32, CYAN)]

CSS = f"""
@font-face{{font-family:'NSK';font-weight:400;src:url(noto-sans-kr-korean-400-normal.woff2),url(noto-sans-kr-latin-400-normal.woff2)}}
@font-face{{font-family:'NSK';font-weight:700;src:url(noto-sans-kr-korean-700-normal.woff2),url(noto-sans-kr-latin-700-normal.woff2)}}
@font-face{{font-family:'NSK';font-weight:900;src:url(noto-sans-kr-korean-900-normal.woff2),url(noto-sans-kr-latin-900-normal.woff2)}}
@font-face{{font-family:'NSK';font-weight:400;unicode-range:U+0000-00FF,U+2000-206F,U+2190-21FF,U+25A0-25FF,U+2600-27BF;src:url(noto-sans-kr-latin-400-normal.woff2)}}
@page{{size:A4;margin:0}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:'NSK','WenQuanYi Zen Hei',sans-serif;color:{INK};background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
.page{{width:210mm;height:297mm;padding:16mm 15mm 14mm;position:relative;overflow:hidden;page-break-after:always;background:#fff}}
.page.alt{{background:{BG}}}
.body{{height:calc(297mm - 16mm - 22mm);display:flex;flex-direction:column;justify-content:space-between}}
.kick{{font-size:13px;font-weight:900;letter-spacing:.12em;color:{RED};text-transform:uppercase}}
h2{{font-size:34px;font-weight:900;line-height:1.25;margin:4px 0 8px}}
h3{{font-size:19px;font-weight:900;margin:18px 0 8px}}
h4{{font-size:20px;font-weight:900;margin:8px 0 2px}}
p,li{{font-size:15.2px;line-height:1.7;color:#2a2d35}}
ul{{padding-left:18px}}
.lead{{font-size:17px;color:#3a3d46;margin-bottom:14px}}
.card{{background:{CARD};border-radius:18px;padding:18px 20px;box-shadow:0 1px 0 #e6e6ec,0 0 0 1px #ececf1}}
.row{{display:flex;gap:14px;align-items:stretch}}
.col{{flex:1}}
.tag{{display:inline-block;font-size:10.5px;font-weight:900;padding:3px 9px;border-radius:99px;background:{INK};color:#fff;margin-right:4px}}
.big{{font-size:34px;font-weight:900;line-height:1}}
.kpis{{display:flex;gap:10px;margin:10px 0}}
.kpi{{flex:1;background:{CARD};border-radius:14px;padding:12px;box-shadow:0 0 0 1px #ececf1}}
.kpi b{{display:block;font-size:30px;font-weight:900}}
.kpi span{{font-size:12.5px;color:{MUTED}}}
.lg{{display:flex;align-items:center;gap:8px;font-size:14.5px;margin:8px 0}}
.lg i{{width:12px;height:12px;border-radius:4px;display:inline-block}}
.lg span{{margin-left:auto;font-weight:900}}
.note{{font-size:12px;color:{MUTED};margin-top:6px;line-height:1.5}}
.callout{{background:#fff4f6;border-left:5px solid {RED};padding:14px 18px;border-radius:12px;font-size:15px;line-height:1.65;margin:16px 0}}
.two{{display:flex;align-items:center;justify-content:center;gap:16px}}
.pcol{{text-align:center;flex:0 0 auto}}
.pcol p{{font-size:14px}}
.vs{{font-size:28px;font-weight:900;color:{MUTED}}}
.foot{{position:absolute;left:15mm;right:15mm;bottom:8mm;font-size:9.5px;color:{MUTED};display:flex;justify-content:space-between}}
.cover{{background:linear-gradient(160deg,#0b0c10 0%,#1b1030 55%,#3a0f2a 100%);color:#fff}}
.cover h1{{font-size:64px;font-weight:900;line-height:1.05;margin:10px 0}}
.cover p{{color:#e8e8ee;font-size:15px}}
.glow{{position:absolute;border-radius:50%;filter:blur(40px);opacity:.55}}
table{{width:100%;border-collapse:collapse;font-size:14.5px}}
th,td{{padding:10px 12px;text-align:left;border-bottom:1px solid #e8e8ee}}
th{{font-size:11px;color:{MUTED};font-weight:700}}
td b{{font-weight:900}}
.src{{font-size:11.5px;line-height:1.6;color:{MUTED}}}
.src a{{color:{MUTED}}}
"""


def page(inner, n, alt=False, kick="", title=""):
    import re
    inner = re.sub(r'^(\s*<div class="kick">.*?</h2>(?:\s*<p class="lead">.*?</p>)?)', r'<div class="hd">\1</div>', inner, count=1, flags=re.S)
    return (f'<section class="page{" alt" if alt else ""}"><div class="body">{inner}</div>'
            f'<div class="foot"><span>더우인(抖音) 한눈에 보기</span><span>{n}</span></div></section>')


def build():
    p = []
    # 1 COVER
    cover = f"""
<section class="page cover">
 <div class="glow" style="width:380px;height:380px;background:{RED};right:-90px;top:60px"></div>
 <div class="glow" style="width:300px;height:300px;background:{CYAN};left:-100px;bottom:80px"></div>
 <div style="position:relative">
  <div class="kick" style="color:{CYAN}">CHINA'S SHORT-VIDEO GIANT</div>
  <h1>더우인<br><span style="color:{RED}">抖音</span> 완전정복</h1>
  <p style="max-width:95mm;margin-top:10px">중국판 틱톡이 어떻게 하루 7억 명을 모으고,<br>광고·쇼핑·지역 서비스로 돈을 버는지<br>그림으로 쉽게 이해하는 가이드</p>
  <div style="display:flex;gap:18px;margin-top:22px;align-items:flex-end">
    {phone_svg("feed", scale=1.15)}
    {phone_svg("live", scale=1.0)}
    {phone_svg("local", scale=0.85)}
  </div>
  <div class="kpis" style="margin-top:26px">
    <div class="kpi" style="background:#ffffff14;box-shadow:none"><b>7.14억</b><span style="color:#cfd2dc">DAU (2026.7, QuestMobile)</span></div>
    <div class="kpi" style="background:#ffffff14;box-shadow:none"><b>≈9,012억</b><span style="color:#cfd2dc">2025 매출 추정(위안)</span></div>
    <div class="kpi" style="background:#ffffff14;box-shadow:none"><b>19.1%</b><span style="color:#cfd2dc">중국 광고시장 점유율</span></div>
  </div>
  <p style="font-size:11px;color:#a9adb9;margin-top:10px">※ 바이트댄스는 비상장사라 수치 대부분이 언론·서드파티 추정입니다. 작성 기준: 2026년 10월.</p>
 </div>
</section>"""
    p.append(cover)

    # 2 WHAT IS DOUYIN
    p.append(page(f"""
<div class="kick">01 · 기본 개념</div><h2>더우인은 무슨 앱?</h2>
<p class="lead">바이트댄스가 2016년 중국에서 출시한 <b>숏폼 영상 앱</b>입니다. 같은 회사가 만든 해외 버전이 틱톡이고, 두 앱은 <b>서버·계정·콘텐츠가 완전히 분리</b>되어 있습니다.</p>
<div class="card">{compare_phones()}</div>
<h3>성장 연표</h3>
<div class="card">{timeline()}</div>
<div class="callout"><b>핵심:</b> 틱톡은 "영상 재미"가 중심이지만, 더우인은 영상 → 쇼핑 → 결제 → 지역 서비스까지 이어지는 <b>"중국 생활 앱"</b>으로 진화했습니다.</div>
""", 2))

    # 3 USERS
    users = bars([("위챗(WeChat)", 9.31, BLUE), ("더우인", 7.14, RED)], unit="억", fmt=lambda v: f"{v:.2f}억 명", max_v=10, label_w=140)
    tshare = [("바이트댄스 계열", 41, RED), ("그 외 모든 앱", 59, "#cfd3dc")]
    p.append(page(f"""
<div class="kick">02 · 규모</div><h2>하루 7억 명이 쓰는 앱</h2>
<p class="lead">중국 인터넷에서 더우인이 차지하는 위치를 숫자로 보면 이렇습니다.</p>
<div class="card"><h3 style="margin-top:0">일간 활성 이용자(DAU) 비교 · 2026년 7월</h3>{users}
<p class="note">출처: QuestMobile 분석(노무라 인용). 월간 이용자는 9억 명 안팎이며 10억 명 주장은 더우인 라이트 포함 수치로 알려져 있습니다.</p></div>
<div class="row" style="margin-top:14px">
 <div class="card col" style="text-align:center"><h3 style="margin-top:0">중국 앱 사용 시간 비중</h3>{donut(tshare, 230, center=("41%","바이트댄스"))}
  <p class="note">보도마다 40~41%로 표기(Daum/BigGo 인용). 나머지는 단순 잔여분입니다.</p></div>
 <div class="card col"><h3 style="margin-top:0">왜 오래 머물까?</h3>
  <ul><li><b>추천 알고리즘</b>: 팔로우 없이도 취향에 맞는 영상이 끝없이 이어짐</li><li><b>세로 풀스크린</b>: 한 번 스와이프로 다음 영상</li><li><b>쇼핑·쿠폰이 같은 앱</b>: 볼 이유가 많음</li><li><b>사용 시간이 위챗을 처음 추월</b>했다는 보도</li></ul></div>
</div>
""", 3, alt=True))

    # 4 ALGORITHM / FLYWHEEL
    p.append(page(f"""
<div class="kick">03 · 작동 원리</div><h2>왜 계속 보게 될까: 선순환 구조</h2>
<p class="lead">더우인의 힘은 <b>추천 → 체류 → 거래 → 수익 → 다시 콘텐츠</b>로 이어지는 순환에 있습니다.</p>
<div class="card">{flywheel()}</div>
<div class="row" style="margin-top:14px">
 <div class="card col"><h3 style="margin-top:0">① 콘텐츠</h3><p>일반인부터 브랜드, 상점 계정까지 누구나 영상·라이브를 올립니다.</p></div>
 <div class="card col"><h3 style="margin-top:0">② 추천</h3><p>시청 시간·좋아요·완주율 등을 학습해 개인별로 영상을 골라 보여줍니다.</p></div>
 <div class="card col"><h3 style="margin-top:0">③ 거래</h3><p>영상 속 상품·매장 쿠폰을 바로 결제해 광고가 곧 매출로 연결됩니다.</p></div>
</div>
""", 4))

    # 5 MONEY
    p.append(page(f"""
<div class="kick">04 · 수익 구조</div><h2>더우인은 어떻게 돈을 벌까</h2>
<p class="lead">이용자는 무료로 쓰고, 돈은 광고주·판매자·지역 상점이 냅니다.</p>
<div class="card">{money_flow()}</div>
<div class="row" style="margin-top:14px">
 <div class="card col" style="text-align:center"><h3 style="margin-top:0">더우인 매출 구성(추정)</h3>{donut(ad_mix, 230, center=("≈9,012억","위안 · 2025"))}</div>
 <div class="card col"><h3 style="margin-top:0">구성 비율</h3>{legend(ad_mix)}
  <div class="callout" style="margin-top:12px">광고(약 4,200억 위안)와 이커머스가 <b>거의 반반</b>. 광고만 파는 구조가 아니라는 점이 핵심입니다.</div>
  <p class="note">출처: 중국 매체 추정(新浪·腾讯新闻). 나머지 7.9%는 합계 100% 맞춤을 위한 잔여분입니다.</p></div>
</div>
""", 5, alt=True))

    # 6 ECOMMERCE
    gmv = bars([("2024년", 3.5, GOLD), ("2025년", 4.3, RED)], width=360, fmt=lambda v: f"{v:.1f}조", max_v=5, label_w=62)
    p.append(page(f"""
<div class="kick">05 · 핵심 엔진 ①</div><h2>이커머스: 영상이 곧 매장</h2>
<p class="lead">쇼핑을 하러 가는 곳이 아니라, <b>구경하다가 사게 되는</b> 방식(발견형 쇼핑)입니다.</p>
<div class="row">
 <div class="card" style="flex:0 0 66mm;text-align:center">{phone_svg("live", scale=1.05)}<p class="note" style="text-align:center">라이브 화면 예시(일러스트)</p></div>
 <div class="card col"><h3 style="margin-top:0">구매 여정</h3>{funnel()}</div>
</div>
<div class="row" style="margin-top:14px">
 <div class="card col"><h3 style="margin-top:0">더우인 이커머스 GMV(추정)</h3>{gmv}
  <p class="note">GMV는 총 거래액이며 더우인 매출이 아닙니다. 출처별 편차 있음(2025: 4.3조는 일부 출처 추정).</p></div>
 <div class="card col"><h3 style="margin-top:0">플랫폼이 챙기는 돈</h3>
  <ul><li>거래 수수료 <b>약 2~8%</b></li><li>판매자 광고비(상품 노출·라이브 홍보)</li><li>물류·판매자 도구 이용료</li></ul>
  <p class="note">선반형(검색) 쇼핑이 라이브보다 빠르게 성장 중이라는 보도가 있습니다.</p></div>
</div>
""", 6))

    # 7 LOCAL LIFE
    p.append(page(f"""
<div class="kick">06 · 핵심 엔진 ②</div><h2>지역 생활 서비스: 메이퇀과의 전쟁</h2>
<p class="lead">맛집·카페·미용실 쿠폰을 앱에서 사고, 매장에서 QR로 쓰는 사업입니다.</p>
<div class="row">
 <div class="card" style="flex:0 0 66mm;text-align:center">{phone_svg("local", scale=1.05)}<p class="note" style="text-align:center">쿠폰 화면 예시(일러스트)</p></div>
 <div class="card col">
  <h3 style="margin-top:0">숫자로 보기</h3>
  <div class="kpis" style="flex-wrap:wrap">
   <div class="kpi"><b>8,500억</b><span>2025 GMV(위안)</span></div>
   <div class="kpi"><b>1,520만</b><span>활성 판매자 수</span></div>
  </div>
  <div class="kpis"><div class="kpi"><b>50~60%</b><span>쿠폰 사용률(核销率)</span></div><div class="kpi"><b>&lt;25%</b><span>2026 Q1 GMV 증가율</span></div></div>
  <div class="callout">외식이 가장 큰 비중(2024 약 62%). 다만 성장세가 꺾이고 쿠폰 사용률이 낮아 <b>수익화 단계</b>로 전환 중이며, 2026년 하반기 손익분기를 목표로 하는 것으로 보도됐습니다.</div>
 </div>
</div>
<h3>어떻게 돈이 될까</h3>
<div class="card"><ul><li>상점이 <b>쿠폰을 올리면</b> 더우인이 판매 수수료를 받음</li><li>상점이 <b>"본지추(本地推)"</b> 같은 광고로 근처 이용자에게 노출 → 2025년 관련 매출 1.9배 이상 증가 보도</li><li>가까운 거리의 이용자에게 보여 줘서 <b>실제 방문</b>으로 이어지게 함</li></ul></div>
<p class="note">출처: 腾讯新闻(晚点), 野村 콜 인용 보도 등 2차 자료. GMV 정의는 기사마다 다릅니다.</p>
""", 7, alt=True))

    # 8 AD MARKET
    adm = bars([("타오바오(알리)", 22.5, GOLD), ("더우인", 19.1, RED), ("위챗(텐센트)", 10.8, BLUE)], fmt=lambda v: f"{v:.1f}%", max_v=25, label_w=150)
    p.append(page(f"""
<div class="kick">07 · 광고</div><h2>중국 광고 시장에서의 위치</h2>
<p class="lead">중국 온라인 광고의 절반 이상은 <b>"거래로 이어지는 광고"</b>입니다. 더우인은 이 시장의 한복판에 있습니다.</p>
<div class="card"><h3 style="margin-top:0">광고 매출 점유율 · 2025년 상반기</h3>{adm}
<p class="note">출처: QuestMobile (중국 인터넷 광고 시장 3,598.5억 위안, +5.6%). 세 곳이 하드 광고 매출의 약 절반을 차지.</p></div>
<div class="row" style="margin-top:14px">
 <div class="card col"><h3 style="margin-top:0">광고 방식 예시</h3><ul><li><b>피드 광고</b>: 영상 사이에 끼는 광고</li><li><b>스타 광고</b>: 인플루언서 영상에 상품 연결</li><li><b>라이브 광고</b>: 라이브 방송 홍보</li><li><b>검색·본지추</b>: 지역 상점 노출</li></ul></div>
 <div class="card col"><h3 style="margin-top:0">특징</h3><ul><li>광고팀 평가가 <b>판매자 매출 성장</b> 쪽으로 이동</li><li>광고가 이커머스의 한 모듈처럼 운영된다는 분석</li><li>이용자 데이터로 정밀 타겟팅</li></ul></div>
</div>
<div class="callout" style="margin-top:14px">광고비를 쓰면 상품이 팔리고, 팔리면 다시 광고를 쓰는 <b>순환</b>이 만들어집니다. 위챗은 광고보다 게임·핀테크 비중이 큽니다.</div>
""", 8))

    # 9 DOUYIN vs TIKTOK
    dvt = bars([("더우인 (≈9,012억 위안)", 132, RED), ("틱톡 (추정 250~336억 달러)", 33.6, CYAN)], fmt=lambda v: f"약 ${v:.0f}B", max_v=140, label_w=240)
    p.append(page(f"""
<div class="kick">08 · 비교</div><h2>왜 더우인이 틱톡보다 훨씬 클까</h2>
<p class="lead">틱톡이 더 유명해도 <b>벌어들이는 돈은 더우인이 몇 배</b>입니다.</p>
<div class="card"><h3 style="margin-top:0">2025년 매출 규모(추정, 달러 환산 약 6.8위안/달러)</h3>{dvt}
<p class="note">틱톡 값은 출처에 따라 250억~336억 달러. 더우인 값은 비공식 추정이며 회계 기준이 달라 직접 비교는 참고용입니다.</p></div>
<h3>이유 6가지</h3>
<div class="row"><div class="card col"><ul>
<li><b>경쟁이 다름</b>: 중국엔 유튜브·인스타가 없음</li>
<li><b>결제·물류가 닫힌 쇼핑</b>: 앱 안에서 구매 완료</li>
<li><b>지역 서비스</b>: 틱톡엔 없는 매출원(8,500억 위안 GMV)</li></ul></div>
<div class="card col"><ul>
<li><b>광고 시장 구조</b>: 거래 직결 광고가 절반 이상</li>
<li><b>이용자당 수익</b>: 틱톡은 약 11.5달러(메타 40달러+) 추정</li>
<li><b>정치 리스크</b>: 인도 금지·미국 매각 등으로 해외 확장 제약</li></ul></div></div>
<div class="callout"><b>그래도:</b> 증가 속도는 틱톡이 빠릅니다. 2025년 해외 매출 +50% vs 중국 약 +20%. 틱톡샵 GMV도 약 70% 늘었습니다.</div>
""", 9, alt=True))

    # 10 COMPETITORS
    rev = bars([("알리바바 (FY26)", 1023.7, GOLD), ("더우인 (2025, 추정)", 901.2, RED), ("텐센트 (2025)", 751.8, BLUE)], fmt=lambda v: f"{v:,.0f}십억", unit="", max_v=1100, label_w=190)
    op = bars([("텐센트 IFRS", 241.6, BLUE), ("알리바바 GAAP", 50.2, GOLD)], fmt=lambda v: f"{v:,.1f}십억", max_v=270, label_w=190)
    p.append(page(f"""
<div class="kick">09 · 경쟁사</div><h2>알리바바·텐센트와 비교</h2>
<div class="card"><h3 style="margin-top:0">매출 (십억 위안 = 10억 위안)</h3>{rev}
<p class="note">알리바바는 2025.4~2026.3, 텐센트·더우인은 2025 역년. 더우인은 추정치(비공시).</p></div>
<div class="card" style="margin-top:14px"><h3 style="margin-top:0">영업이익 (십억 위안)</h3>{op}
<p class="note">더우인 영업이익은 비공개. 바이트댄스 전체 순이익 추정은 약 500억 달러(보도) vs 70%+ 감소(보도)로 엇갈려, 더우인 단독 비교는 불가.</p></div>
<table style="margin-top:14px"><tr><th>구분</th><th>매출 성장</th><th>수익성</th><th>성격</th></tr>
<tr><td><b>더우인</b></td><td>+28%</td><td>비공개</td><td>광고+이커머스</td></tr>
<tr><td><b>텐센트</b></td><td>+14%</td><td>영업이익률 약 32%</td><td>게임·핀테크·광고</td></tr>
<tr><td><b>알리바바</b></td><td>+3% (정리 후 +11%)</td><td>약 5%</td><td>이커머스·클라우드</td></tr></table>
""", 10))

    # 11 RISKS + SUMMARY + SOURCES
    p.append(page(f"""
<div class="kick">10 · 정리</div><h2>한 장 요약 &amp; 주의점</h2>
<div class="row"><div class="card col"><h3 style="margin-top:0;color:{GREEN}">강점</h3><ul><li>압도적 사용 시간·DAU</li><li>광고와 이커머스의 이중 수익원</li><li>지역 서비스로 확장</li><li>AI 추천 기술</li></ul></div>
<div class="card col"><h3 style="margin-top:0;color:{RED}">리스크</h3><ul><li>이커머스 성장률 둔화(20% 안팎 이하로 보도)</li><li>지역 생활 쿠폰 사용률·ROI 하락</li><li>AI 투자 부담으로 이익 불확실</li><li>소비 둔화·광고 지출 변동</li></ul></div></div>
<div class="callout" style="margin-top:14px"><b>한 줄:</b> 더우인 = <b>"영상 앱 + 쇼핑몰 + 동네 쿠폰 앱"</b>이 합쳐진 중국 생활 플랫폼. 그래서 틱톡보다 훨씬 많은 돈을 법니다.</div>
<h3>용어 풀이</h3>
<table><tr><td><b>DAU</b></td><td>하루 동안 앱을 쓴 이용자 수</td></tr>
<tr><td><b>GMV</b></td><td>총 거래액(플랫폼 매출과 다름)</td></tr>
<tr><td><b>核销(허시아오)</b></td><td>구매한 쿠폰을 매장에서 실제로 사용한 비율</td></tr>
<tr><td><b>본지추(本地推)</b></td><td>근처 이용자에게 매장을 노출하는 지역 광고 도구</td></tr>
<tr><td><b>CPM</b></td><td>광고 1,000회 노출당 비용</td></tr></table>
<h3>자료 출처</h3>
<p class="src">Sacra(sacra.com/c/bytedance) · SCMP(ByteDance profit plunges…) · 腾讯新闻(我们测算了字节去年营收;抖音本地生活…) · 新浪(抖音2025年业绩与利润概览) · QuestMobile/China Trading Desk(2025 H1 광고시장) · BigGo Finance(Douyin usage time) · Digital in Asia · Marketing to China · Tencent 2025 Annual Results · Alibaba FY2026 Form 20-F/6-K · Bloomberg 보도(ROIC.ai, Yahoo Finance 경유) · 财联社(抖音集团副总裁澄清)<br>모든 더우인 수치는 비공시 추정이며 출처별로 정의·시점이 다릅니다. 투자 판단용이 아닌 교육·이해용 자료입니다.</p>
""", 11, alt=True))
    return "".join(p)


html = f"<!doctype html><html lang='ko'><head><meta charset='utf-8'><title>더우인 완전정복</title><style>{CSS}</style></head><body>{build()}</body></html>"
open("douyin_guide.html", "w", encoding="utf-8").write(html)
print("ok", len(html))
