# -*- coding: utf-8 -*-
"""S&P 500 시장 위치 분석 보고서 — PDF 조립 엔진.

콘텐츠는 content_*.py 의 블록 리스트로 정의하고, 여기서 ReportLab Platypus
플로어블로 변환해 A4 문서로 빌드한다. 목차는 multiBuild 2-pass 로 생성.
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Image, Table,
    TableStyle, PageBreak, NextPageTemplate, KeepTogether, Flowable, FrameBreak,
)
from reportlab.platypus.tableofcontents import TableOfContents

# ------------------------------------------------------------------ 폰트
FD = "/usr/share/fonts/truetype/nanum"
pdfmetrics.registerFont(TTFont("NG", f"{FD}/NanumGothic.ttf"))
pdfmetrics.registerFont(TTFont("NGB", f"{FD}/NanumGothicBold.ttf"))
pdfmetrics.registerFont(TTFont("NSQ", f"{FD}/NanumSquareR.ttf"))
pdfmetrics.registerFont(TTFont("NSQB", f"{FD}/NanumSquareB.ttf"))
pdfmetrics.registerFont(TTFont("NMJ", f"{FD}/NanumMyeongjo.ttf"))
pdfmetrics.registerFont(TTFont("NMJB", f"{FD}/NanumMyeongjoBold.ttf"))
pdfmetrics.registerFontFamily("NG", normal="NG", bold="NGB", italic="NG",
                              boldItalic="NGB")

# ------------------------------------------------------------------ 색
NAVY = colors.HexColor("#0f2a4a")
NAVY2 = colors.HexColor("#16385f")
GOLD = colors.HexColor("#c9a227")
INK = colors.HexColor("#1a1a1a")
INK2 = colors.HexColor("#52514e")
MUTED = colors.HexColor("#898781")
LINE = colors.HexColor("#d9d7cf")
TINT = colors.HexColor("#f2f5f9")
TINT2 = colors.HexColor("#faf7ee")
RED = colors.HexColor("#d03b3b")
BLUE = colors.HexColor("#2a78d6")

PAGE_W, PAGE_H = A4
ML, MR, MT, MB = 22 * mm, 22 * mm, 20 * mm, 20 * mm
TEXT_W = PAGE_W - ML - MR

# ------------------------------------------------------------------ 스타일
def st(name, **kw):
    base = dict(fontName="NG", fontSize=10.3, leading=19.2, textColor=INK,
                alignment=TA_JUSTIFY, spaceAfter=9.5, wordWrap="CJK")
    base.update(kw)
    return ParagraphStyle(name, **base)

S = {
    "part_no": st("part_no", fontName="NSQB", fontSize=64, leading=70,
                  textColor=GOLD, alignment=TA_LEFT, spaceAfter=6),
    "part_title": st("part_title", fontName="NSQB", fontSize=27, leading=36,
                     textColor=colors.white, alignment=TA_LEFT, spaceAfter=12),
    "part_sub": st("part_sub", fontName="NG", fontSize=10.5, leading=18,
                   textColor=colors.HexColor("#b9c6d6"), alignment=TA_LEFT),
    "h1": st("h1", fontName="NSQB", fontSize=15.5, leading=21, textColor=NAVY,
             spaceBefore=21, spaceAfter=9, alignment=TA_LEFT),
    "h2": st("h2", fontName="NGB", fontSize=12, leading=17, textColor=NAVY2,
             spaceBefore=14, spaceAfter=6, alignment=TA_LEFT),
    "h3": st("h3", fontName="NGB", fontSize=10.5, leading=15,
             textColor=colors.HexColor("#3d5a7a"), spaceBefore=8, spaceAfter=4,
             alignment=TA_LEFT),
    "p": st("p"),
    "lead": st("lead", fontSize=11.2, leading=19.8, textColor=colors.HexColor("#333333")),
    "small": st("small", fontSize=8.3, leading=12.5, textColor=MUTED),
    "caption": st("caption", fontSize=8.5, leading=12.5, textColor=INK2,
                  alignment=TA_LEFT, spaceBefore=4, spaceAfter=13),
    "bullet": st("bullet", leftIndent=11, bulletIndent=2, spaceAfter=6.5),
    "quote": st("quote", fontName="NMJ", fontSize=11.5, leading=19,
                textColor=NAVY2, alignment=TA_CENTER, spaceBefore=10, spaceAfter=2),
    "quote_by": st("quote_by", fontSize=8.5, leading=12, textColor=MUTED,
                   alignment=TA_CENTER, spaceAfter=10),
    "toc_h": st("toc_h", fontName="NSQB", fontSize=22, leading=30, textColor=NAVY,
                spaceAfter=14, alignment=TA_LEFT),
    "cell": st("cell", fontSize=8.8, leading=13, alignment=TA_LEFT, spaceAfter=0),
    "cell_c": st("cell_c", fontSize=8.8, leading=13, alignment=TA_CENTER, spaceAfter=0),
    "cell_h": st("cell_h", fontName="NGB", fontSize=9, leading=13,
                 textColor=colors.white, alignment=TA_CENTER, spaceAfter=0),
    "stat_v": st("stat_v", fontName="NSQB", fontSize=17, leading=21, textColor=NAVY,
                 alignment=TA_CENTER, spaceAfter=0),
    "stat_l": st("stat_l", fontSize=8.2, leading=11.5, textColor=INK2,
                 alignment=TA_CENTER, spaceAfter=0),
    "callout_t": st("callout_t", fontName="NGB", fontSize=10.5, leading=15,
                    textColor=NAVY, spaceAfter=3, alignment=TA_LEFT),
    "callout_b": st("callout_b", fontSize=9.5, leading=15.5, alignment=TA_JUSTIFY,
                    spaceAfter=0),
    "kv_t": st("kv_t", fontName="NGB", fontSize=9.8, leading=14, textColor=NAVY2,
               spaceAfter=1, alignment=TA_LEFT),
    "kv_d": st("kv_d", fontSize=9.3, leading=15.2, spaceAfter=9,
               textColor=colors.HexColor("#3a3a38")),
}

TOC_STYLES = [
    st("toc0", fontName="NGB", fontSize=10.5, leading=22, textColor=NAVY,
       spaceBefore=6, alignment=TA_LEFT),
    st("toc1", fontName="NG", fontSize=9.5, leading=17.5, leftIndent=14,
       textColor=INK, alignment=TA_LEFT),
]


class HRule(Flowable):
    def __init__(self, width=TEXT_W, color=LINE, thick=0.7, pad=4):
        super().__init__()
        self.width, self.color, self.thick, self.pad = width, color, thick, pad
        self.height = thick + pad * 2

    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thick)
        self.canv.line(0, self.pad, self.width, self.pad)


class SetPart(Flowable):
    """헤더에 표시할 현재 파트명을 갱신하는 마커 (그리지 않음)."""
    width = height = 0

    def __init__(self, label):
        super().__init__()
        self.label = label

    def draw(self):
        self.canv._cur_part = self.label


class ReportDoc(BaseDocTemplate):
    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph):
            name = flowable.style.name
            text = flowable.getPlainText()
            if name == "part_title":
                self.notify("TOCEntry", (0, text, self.page))
            elif name == "h1":
                self.notify("TOCEntry", (1, text, self.page))


# ------------------------------------------------------------------ 페이지 장식
REPORT_TITLE = "S&P 500은 지금 어디에 서 있는가"
DATE_LABEL = "2026년 7월 31일"


def deco_body(canv, doc):
    canv.saveState()
    part = getattr(canv, "_cur_part", "")
    canv.setStrokeColor(LINE); canv.setLineWidth(0.6)
    canv.line(ML, PAGE_H - 13 * mm, PAGE_W - MR, PAGE_H - 13 * mm)
    canv.setFont("NG", 7.5); canv.setFillColor(MUTED)
    canv.drawString(ML, PAGE_H - 11.2 * mm, REPORT_TITLE)
    canv.drawRightString(PAGE_W - MR, PAGE_H - 11.2 * mm, part)
    canv.line(ML, 13 * mm, PAGE_W - MR, 13 * mm)
    canv.drawString(ML, 9.2 * mm, DATE_LABEL)
    canv.setFillColor(NAVY); canv.setFont("NSQB", 8.5)
    canv.drawRightString(PAGE_W - MR, 9.2 * mm, f"{canv.getPageNumber():02d}")
    canv.restoreState()


def deco_plain(canv, doc):
    canv.saveState()
    canv.setFont("NG", 7.5); canv.setFillColor(MUTED)
    canv.setStrokeColor(LINE); canv.setLineWidth(0.6)
    canv.line(ML, 13 * mm, PAGE_W - MR, 13 * mm)
    canv.drawString(ML, 9.2 * mm, DATE_LABEL)
    canv.setFillColor(NAVY); canv.setFont("NSQB", 8.5)
    canv.drawRightString(PAGE_W - MR, 9.2 * mm, f"{canv.getPageNumber():02d}")
    canv.restoreState()


def deco_cover(canv, doc):
    canv.saveState()
    canv.setFillColor(NAVY)
    canv.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    canv.setFillColor(NAVY2)
    canv.rect(0, 0, PAGE_W, 58 * mm, stroke=0, fill=1)
    canv.setStrokeColor(GOLD); canv.setLineWidth(2)
    canv.line(ML, PAGE_H - 52 * mm, ML + 42 * mm, PAGE_H - 52 * mm)
    # 표제
    canv.setFillColor(colors.HexColor("#9fb4ca")); canv.setFont("NSQ", 13)
    canv.drawString(ML, PAGE_H - 66 * mm, "시장 전략 심층 보고서  |  MARKET STRATEGY IN-DEPTH")
    canv.setFillColor(colors.white)
    canv.setFont("NSQB", 33)
    canv.drawString(ML - 1 * mm, PAGE_H - 82 * mm, "S&P 500은 지금")
    canv.drawString(ML - 1 * mm, PAGE_H - 96 * mm, "어디에 서 있는가")
    canv.setFillColor(GOLD); canv.setFont("NSQ", 12.5)
    canv.drawString(ML, PAGE_H - 110 * mm, "사이클·밸류에이션·AI 슈퍼사이클로 진단한 현재 좌표")
    # 핵심 수치 밴드
    canv.setFillColor(colors.HexColor("#dbe4ee")); canv.setFont("NG", 9.5)
    stats = [("지수(7/30)", "7,416"), ("사상최고치", "7,621"), ("연초 이후", "+8.7%"),
             ("실러 CAPE", "40.3배"), ("강세장", "45개월차")]
    x = ML
    for lbl, val in stats:
        canv.setFont("NSQB", 15); canv.setFillColor(colors.white)
        canv.drawString(x, PAGE_H - 132 * mm, val)
        canv.setFont("NG", 8); canv.setFillColor(colors.HexColor("#9fb4ca"))
        canv.drawString(x, PAGE_H - 138 * mm, lbl)
        x += 33.5 * mm
    canv.setStrokeColor(colors.HexColor("#2c4a6e")); canv.setLineWidth(0.7)
    canv.line(ML, PAGE_H - 122 * mm, PAGE_W - MR, PAGE_H - 122 * mm)
    canv.line(ML, PAGE_H - 144 * mm, PAGE_W - MR, PAGE_H - 144 * mm)
    # 하단
    canv.setFillColor(colors.white); canv.setFont("NSQB", 12)
    canv.drawString(ML, 42 * mm, "2026년 7월 31일")
    canv.setFillColor(colors.HexColor("#9fb4ca")); canv.setFont("NG", 8.8)
    canv.drawString(ML, 35 * mm, "데이터 기준일: 2026년 7월 30일(현지) · 작성: 리서치 데스크")
    canv.drawString(ML, 29 * mm, "본 자료는 정보 제공 목적의 일반 자료로, 특정 상품의 매수·매도 권유가 아닙니다.")
    canv.setFillColor(GOLD); canv.setFont("NSQB", 9)
    canv.drawString(ML, 20 * mm, "100 PAGES  ·  11 PARTS  ·  30 FIGURES")
    canv.restoreState()


def deco_back(canv, doc):
    canv.saveState()
    canv.setFillColor(NAVY)
    canv.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    canv.setStrokeColor(GOLD); canv.setLineWidth(1.6)
    canv.line(ML, PAGE_H * 0.62, ML + 34 * mm, PAGE_H * 0.62)
    canv.setFillColor(colors.white); canv.setFont("NSQB", 21)
    canv.drawString(ML, PAGE_H * 0.62 - 13 * mm, "S&P 500은 지금 어디에 서 있는가")
    canv.setFillColor(GOLD); canv.setFont("NSQ", 11.5)
    canv.drawString(ML, PAGE_H * 0.62 - 21 * mm, "시계판의 바늘은 10시 반 — 필요한 것은 예측이 아니라 규율이다")
    canv.setFillColor(colors.HexColor("#9fb4ca")); canv.setFont("NG", 8.8)
    canv.drawString(ML, PAGE_H * 0.62 - 33 * mm,
                    "시장 전략 심층 보고서 · 2026년 7월 31일 · 데이터 기준일 2026년 7월 30일")
    canv.drawString(ML, PAGE_H * 0.62 - 39 * mm,
                    "본 자료는 정보 제공 목적의 일반 자료이며, 특정 금융투자상품의 매수·매도 권유가 아닙니다.")
    canv.setFillColor(colors.HexColor("#2c4a6e")); canv.setFont("NSQB", 9)
    canv.drawString(ML, 20 * mm, "MARKET STRATEGY IN-DEPTH · 2026.07")
    canv.restoreState()


def deco_part(canv, doc):
    canv.saveState()
    canv.setFillColor(NAVY)
    canv.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    canv.setStrokeColor(GOLD); canv.setLineWidth(1.6)
    canv.line(ML, PAGE_H * 0.30, ML + 34 * mm, PAGE_H * 0.30)
    canv.setFillColor(colors.HexColor("#2c4a6e")); canv.setFont("NSQB", 8.5)
    canv.drawRightString(PAGE_W - MR, 9.2 * mm, f"{canv.getPageNumber():02d}")
    canv.restoreState()


# ------------------------------------------------------------------ 블록 변환
FIG_NO = {"n": 0}
TBL_NO = {"n": 0}


def para_of_bullets(items):
    out = []
    for it in items:
        out.append(Paragraph(f'<bullet color="#c9a227">&#8226;</bullet> {it}',
                             S["bullet"]))
    return out


def make_stats(items):
    vals = [Paragraph(v, S["stat_v"]) for v, _ in items]
    lbls = [Paragraph(l, S["stat_l"]) for _, l in items]
    n = len(items)
    w = TEXT_W / n
    t = Table([vals, lbls], colWidths=[w] * n, rowHeights=None)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), TINT),
        ("TOPPADDING", (0, 0), (-1, 0), 9),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 8),
        ("TOPPADDING", (0, 1), (-1, 1), 1),
        ("LINEBELOW", (0, 1), (-1, 1), 2, GOLD),
        ("LINEAFTER", (0, 0), (-2, -1), 0.7, colors.white),
    ]))
    return [Spacer(1, 4), t, Spacer(1, 10)]


def make_table(headers, rows, ratios=None, note=None):
    TBL_NO["n"] += 1
    data = [[Paragraph(h, S["cell_h"]) for h in headers]]
    for r in rows:
        data.append([Paragraph(str(c), S["cell"] if i == 0 else S["cell_c"])
                     for i, c in enumerate(r)])
    if ratios:
        widths = [TEXT_W * x for x in ratios]
    else:
        widths = [TEXT_W / len(headers)] * len(headers)
    t = Table(data, colWidths=widths, repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5.2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5.2),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, 0), 1.4, GOLD),
        ("LINEBELOW", (0, -1), (-1, -1), 0.8, LINE),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style.append(("BACKGROUND", (0, i), (-1, i), TINT))
    t.setStyle(TableStyle(style))
    out = [Spacer(1, 3), t]
    if note:
        out.append(Paragraph(f"표 {TBL_NO['n']}. {note}", S["caption"]))
    else:
        out.append(Spacer(1, 8))
    return out


def make_callout(title, body):
    inner = [Paragraph(title, S["callout_t"]), Paragraph(body, S["callout_b"])]
    t = Table([[inner]], colWidths=[TEXT_W])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), TINT2),
        ("LINEBEFORE", (0, 0), (0, -1), 2.6, GOLD),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("LEFTPADDING", (0, 0), (-1, -1), 11),
        ("RIGHTPADDING", (0, 0), (-1, -1), 11),
    ]))
    return [Spacer(1, 7), t, Spacer(1, 11)]


def make_chart(fname, caption, scale=1.0):
    FIG_NO["n"] += 1
    path = os.path.join("charts", fname)
    from PIL import Image as PILImage
    with PILImage.open(path) as im:
        iw, ih = im.size
    w = TEXT_W * scale
    h = w * ih / iw
    img = Image(path, width=w, height=h)
    img.hAlign = "CENTER"
    cap = Paragraph(f"<b>그림 {FIG_NO['n']}.</b> {caption}", S["caption"])
    return [Spacer(1, 11), KeepTogether([img, cap])]


def build_story(blocks):
    story = []
    for b in blocks:
        kind = b[0]
        if kind == "part":
            _, no, title, subs = b
            story += [NextPageTemplate("part"), PageBreak(),
                      SetPart(""), Spacer(1, PAGE_H * 0.30),
                      Paragraph(f"PART {no}", S["part_no"]),
                      Paragraph(title, S["part_title"]),
                      Spacer(1, 10)]
            for s in subs:
                story.append(Paragraph(s, S["part_sub"]))
            story += [NextPageTemplate("body"), PageBreak(), SetPart(f"PART {no} · {title}")]
        elif kind == "h1":
            story.append(Paragraph(b[1], S["h1"]))
            story.append(HRule(color=GOLD, thick=1.1, pad=2))
            story.append(Spacer(1, 4))
        elif kind == "h2":
            story.append(Paragraph(b[1], S["h2"]))
        elif kind == "h3":
            story.append(Paragraph(b[1], S["h3"]))
        elif kind == "p":
            story.append(Paragraph(b[1], S["p"]))
        elif kind == "lead":
            story.append(Paragraph(b[1], S["lead"]))
        elif kind == "bullets":
            story += para_of_bullets(b[1])
            story.append(Spacer(1, 4))
        elif kind == "stats":
            story += make_stats(b[1])
        elif kind == "chart":
            story += make_chart(b[1], b[2], b[3] if len(b) > 3 else 1.0)
        elif kind == "table":
            story += make_table(b[1], b[2], b[3] if len(b) > 3 else None,
                                b[4] if len(b) > 4 else None)
        elif kind == "callout":
            story += make_callout(b[1], b[2])
        elif kind == "quote":
            story += [Spacer(1, 6), Paragraph(f"“{b[1]}”", S["quote"]),
                      Paragraph(f"— {b[2]}", S["quote_by"]), Spacer(1, 4)]
        elif kind == "kv":
            for term, desc in b[1]:
                story.append(Paragraph(term, S["kv_t"]))
                story.append(Paragraph(desc, S["kv_d"]))
        elif kind == "setpart":
            story.append(SetPart(b[1]))
        elif kind == "pagebreak":
            story.append(PageBreak())
        elif kind == "spacer":
            story.append(Spacer(1, b[1]))
        elif kind == "rule":
            story.append(HRule())
        else:
            raise ValueError(f"unknown block: {kind}")
    return story


def main():
    from content_intro import BLOCKS_FRONT, BLOCKS_SUMMARY, BLOCKS_P1
    from content_mid import BLOCKS_P2
    from content_end import BLOCKS_P3, BLOCKS_BACK
    from content_extra import EXTRA_BEFORE as E1, EXTRA_P3_TAIL
    from content_extra2 import EXTRA_BEFORE as E2, EXTRA_P3_TAIL2
    from content_extra3 import EXTRA_BEFORE3 as E3
    from content_extra4 import EXTRA_BEFORE4 as E4, SUMMARY_TAIL

    EXTRA = {}
    for src in (E1, E2, E3, E4):
        for k, v in src.items():
            if isinstance(v, tuple):        # 꼬리 콤마로 튜플화된 경우 방어
                v = list(v[0]) if len(v) == 1 and isinstance(v[0], list) else list(v)
            EXTRA.setdefault(k, []).extend(v)

    def splice(blocks):
        out = []
        for b in blocks:
            key = None
            if b[0] == "part":
                key = f"part:{b[1]}"
            elif b[0] == "h1":
                key = f"h1:{b[1]}"
            if key and key in EXTRA:
                out += EXTRA[key]
            out.append(b)
        return out

    doc = ReportDoc("output/SP500_시장위치_분석보고서_2026-07.pdf", pagesize=A4,
                    leftMargin=ML, rightMargin=MR, topMargin=MT, bottomMargin=MB,
                    title="S&P 500은 지금 어디에 서 있는가 — 2026년 7월 시장 위치 진단",
                    author="리서치 데스크")

    frame_body = Frame(ML, MB, TEXT_W, PAGE_H - MT - MB, id="f")
    frame_part = Frame(ML, MB, TEXT_W, PAGE_H - MT - MB, id="fp")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[frame_body], onPage=deco_cover),
        PageTemplate(id="plain", frames=[frame_body], onPageEnd=deco_plain),
        PageTemplate(id="body", frames=[frame_body], onPageEnd=deco_body),
        PageTemplate(id="part", frames=[frame_part], onPage=deco_part),
        PageTemplate(id="back", frames=[frame_part], onPage=deco_back),
    ])

    toc = TableOfContents()
    toc.levelStyles = TOC_STYLES
    toc.dotsMinLevel = 0

    P1s = splice(BLOCKS_P1)
    P2s = splice(BLOCKS_P2)
    P3s = splice(BLOCKS_P3) + EXTRA_P3_TAIL + EXTRA_P3_TAIL2
    BKs = splice(BLOCKS_BACK)

    # 그림 목록 (본문 차트 블록에서 자동 수집 — 번호는 본문 그림 번호와 동일 순서)
    figs = [b[2] for b in (P1s + P2s + P3s + BKs) if b[0] == "chart"]
    fig_rows = [[Paragraph(f"그림 {i}", S["cell_c"]),
                 Paragraph(cap.split(". ")[0] + ".", S["cell"])]
                for i, cap in enumerate(figs, 1)]
    fig_table = Table(fig_rows, colWidths=[TEXT_W * 0.12, TEXT_W * 0.88])
    fig_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE),
    ]))

    story = [NextPageTemplate("plain"), PageBreak()]        # 표지 → plain
    story += build_story(BLOCKS_FRONT)                       # 안내문
    story += [Paragraph("목차", S["toc_h"]),
              HRule(color=GOLD, thick=1.2, pad=3), Spacer(1, 8), toc,
              PageBreak(),
              Paragraph("그림 목록", S["toc_h"]),
              HRule(color=GOLD, thick=1.2, pad=3), Spacer(1, 6), fig_table,
              PageBreak()]
    story += build_story(BLOCKS_SUMMARY + SUMMARY_TAIL)      # 핵심 요약
    story += [NextPageTemplate("body")]
    story += build_story(P1s)
    story += build_story(P2s)
    story += build_story(P3s)
    story += build_story(BKs)
    story += [NextPageTemplate("back"), PageBreak(), Spacer(1, 10)]

    doc.multiBuild(story)
    print("PDF built:", doc.filename, "pages:", doc.page)


if __name__ == "__main__":
    main()
