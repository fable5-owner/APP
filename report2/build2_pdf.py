# -*- coding: utf-8 -*-
"""2권 조립 엔진 — 미국 에디토리얼 + 웜 크림/테라코타 디자인.

1권 엔진과 동일한 블록 DSL을 쓰되, 지면·타이포그래피 체계를 교체:
크림 지면(#FAF7EF) 전면 도포, 세리프(나눔명조) 헤드라인, 테라코타 액센트,
테라코타 뒷표지. 목차는 multiBuild 2-pass.
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
    TableStyle, PageBreak, NextPageTemplate, KeepTogether, Flowable,
)
from reportlab.platypus.tableofcontents import TableOfContents

FD = "/usr/share/fonts/truetype/nanum"
pdfmetrics.registerFont(TTFont("NG", f"{FD}/NanumGothic.ttf"))
pdfmetrics.registerFont(TTFont("NGB", f"{FD}/NanumGothicBold.ttf"))
pdfmetrics.registerFont(TTFont("NSQ", f"{FD}/NanumSquareR.ttf"))
pdfmetrics.registerFont(TTFont("NSQB", f"{FD}/NanumSquareB.ttf"))
pdfmetrics.registerFont(TTFont("NMJ", f"{FD}/NanumMyeongjo.ttf"))
pdfmetrics.registerFont(TTFont("NMJB", f"{FD}/NanumMyeongjoBold.ttf"))
pdfmetrics.registerFontFamily("NG", normal="NG", bold="NGB", italic="NG",
                              boldItalic="NGB")
pdfmetrics.registerFontFamily("NMJ", normal="NMJ", bold="NMJB", italic="NMJ",
                              boldItalic="NMJB")

# ------------------------------------------------------------------ 팔레트
CREAM = colors.HexColor("#faf7ef")     # 지면
CREAM2 = colors.HexColor("#f2ecdd")    # 짙은 크림 (박스·표지)
CREAM3 = colors.HexColor("#f6f1e4")    # 표 지브라
TERRA = colors.HexColor("#cc785c")     # 테라코타 액센트
TERRA_D = colors.HexColor("#a05a41")   # 짙은 테라코타 (표 헤더·소제목)
INK = colors.HexColor("#191919")       # 웜 블랙
INK2 = colors.HexColor("#57534a")
MUTED = colors.HexColor("#8f8a7c")
LINE = colors.HexColor("#ddd5c2")
RED = colors.HexColor("#d03b3b")

PAGE_W, PAGE_H = A4
ML, MR, MT, MB = 22 * mm, 22 * mm, 20 * mm, 20 * mm
TEXT_W = PAGE_W - ML - MR


def st(name, **kw):
    base = dict(fontName="NG", fontSize=10.3, leading=19.2, textColor=INK,
                alignment=TA_JUSTIFY, spaceAfter=9.5, wordWrap="CJK")
    base.update(kw)
    return ParagraphStyle(name, **base)

S = {
    "part_no": st("part_no", fontName="NMJB", fontSize=58, leading=66,
                  textColor=TERRA, alignment=TA_LEFT, spaceAfter=8),
    "part_title": st("part_title", fontName="NMJB", fontSize=25, leading=35,
                     textColor=INK, alignment=TA_LEFT, spaceAfter=12),
    "part_sub": st("part_sub", fontName="NG", fontSize=10.5, leading=18,
                   textColor=INK2, alignment=TA_LEFT),
    "h1": st("h1", fontName="NMJB", fontSize=15.5, leading=22, textColor=INK,
             spaceBefore=21, spaceAfter=9, alignment=TA_LEFT),
    "h2": st("h2", fontName="NGB", fontSize=12, leading=17, textColor=TERRA_D,
             spaceBefore=14, spaceAfter=6, alignment=TA_LEFT),
    "h3": st("h3", fontName="NGB", fontSize=10.5, leading=15, textColor=TERRA_D,
             spaceBefore=8, spaceAfter=4, alignment=TA_LEFT),
    "p": st("p"),
    "lead": st("lead", fontName="NMJ", fontSize=11.3, leading=20.5,
               textColor=colors.HexColor("#2b2924")),
    "small": st("small", fontSize=8.3, leading=12.5, textColor=MUTED),
    "caption": st("caption", fontSize=8.5, leading=12.5, textColor=INK2,
                  alignment=TA_LEFT, spaceBefore=4, spaceAfter=13),
    "bullet": st("bullet", leftIndent=11, bulletIndent=2, spaceAfter=6.5),
    "quote": st("quote", fontName="NMJ", fontSize=11.8, leading=20,
                textColor=INK, alignment=TA_CENTER, spaceBefore=10, spaceAfter=2),
    "quote_by": st("quote_by", fontSize=8.5, leading=12, textColor=TERRA_D,
                   alignment=TA_CENTER, spaceAfter=10),
    "toc_h": st("toc_h", fontName="NMJB", fontSize=22, leading=30, textColor=INK,
                spaceAfter=14, alignment=TA_LEFT),
    "cell": st("cell", fontSize=8.8, leading=13, alignment=TA_LEFT, spaceAfter=0),
    "cell_c": st("cell_c", fontSize=8.8, leading=13, alignment=TA_CENTER, spaceAfter=0),
    "cell_h": st("cell_h", fontName="NGB", fontSize=9, leading=13,
                 textColor=CREAM, alignment=TA_CENTER, spaceAfter=0),
    "stat_v": st("stat_v", fontName="NMJB", fontSize=17, leading=21, textColor=INK,
                 alignment=TA_CENTER, spaceAfter=0),
    "stat_l": st("stat_l", fontSize=8.2, leading=11.5, textColor=INK2,
                 alignment=TA_CENTER, spaceAfter=0),
    "callout_t": st("callout_t", fontName="NGB", fontSize=10.5, leading=15,
                    textColor=TERRA_D, spaceAfter=3, alignment=TA_LEFT),
    "callout_b": st("callout_b", fontSize=9.5, leading=15.5, alignment=TA_JUSTIFY,
                    spaceAfter=0),
    "kv_t": st("kv_t", fontName="NGB", fontSize=9.8, leading=14, textColor=TERRA_D,
               spaceAfter=1, alignment=TA_LEFT),
    "kv_d": st("kv_d", fontSize=9.3, leading=15.2, spaceAfter=9,
               textColor=colors.HexColor("#3a3830")),
}

TOC_STYLES = [
    st("toc0", fontName="NMJB", fontSize=10.8, leading=22, textColor=INK,
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


REPORT_TITLE = "투자자의 마음 — 행동재무학 완전 가이드"
DATE_LABEL = "2026년 7월 31일"


def paint_bg(canv, color=CREAM):
    canv.saveState()
    canv.setFillColor(color)
    canv.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    canv.restoreState()


def bg_body(canv, doc):
    paint_bg(canv)


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
    canv.setFillColor(TERRA_D); canv.setFont("NMJB", 8.8)
    canv.drawRightString(PAGE_W - MR, 9.2 * mm, f"{canv.getPageNumber():02d}")
    canv.restoreState()


def deco_plain(canv, doc):
    canv.saveState()
    canv.setFont("NG", 7.5); canv.setFillColor(MUTED)
    canv.setStrokeColor(LINE); canv.setLineWidth(0.6)
    canv.line(ML, 13 * mm, PAGE_W - MR, 13 * mm)
    canv.drawString(ML, 9.2 * mm, DATE_LABEL)
    canv.setFillColor(TERRA_D); canv.setFont("NMJB", 8.8)
    canv.drawRightString(PAGE_W - MR, 9.2 * mm, f"{canv.getPageNumber():02d}")
    canv.restoreState()


def deco_cover(canv, doc):
    canv.saveState()
    paint_bg(canv, CREAM)
    canv.setFillColor(CREAM2)
    canv.rect(0, 0, PAGE_W, 52 * mm, stroke=0, fill=1)
    # 상단 소표제
    canv.setStrokeColor(TERRA); canv.setLineWidth(2.4)
    canv.line(ML, PAGE_H - 42 * mm, ML + 30 * mm, PAGE_H - 42 * mm)
    canv.setFillColor(TERRA_D); canv.setFont("NSQ", 11.5)
    canv.drawString(ML, PAGE_H - 52 * mm, "행동재무학 완전 가이드  |  THE INVESTOR'S MIND")
    # 표제 (세리프)
    canv.setFillColor(INK)
    canv.setFont("NMJB", 34)
    canv.drawString(ML - 0.5 * mm, PAGE_H - 70 * mm, "흔들리는 것은")
    canv.drawString(ML - 0.5 * mm, PAGE_H - 85 * mm, "시장이 아니라")
    canv.setFillColor(TERRA)
    canv.drawString(ML - 0.5 * mm, PAGE_H - 100 * mm, "마음이다")
    canv.setFillColor(INK2); canv.setFont("NG", 12)
    canv.drawString(ML, PAGE_H - 113 * mm, "손실의 기원과 규율의 설계 — 개인투자자를 위한 행동재무학")
    # 핵심 문장 밴드
    canv.setStrokeColor(LINE); canv.setLineWidth(0.8)
    canv.line(ML, PAGE_H - 126 * mm, PAGE_W - MR, PAGE_H - 126 * mm)
    canv.setFillColor(INK); canv.setFont("NMJ", 10.5)
    canv.drawString(ML, PAGE_H - 136 * mm, "“당신의 최대 리스크는 시장이 아니라, 시장을 바라보는 당신 자신이다.”")
    canv.setFillColor(MUTED); canv.setFont("NG", 8.5)
    canv.drawString(ML, PAGE_H - 143 * mm, "— 벤저민 그레이엄·존 보글·대니얼 카너먼의 통찰을 한 권으로 재구성")
    canv.line(ML, PAGE_H - 152 * mm, PAGE_W - MR, PAGE_H - 152 * mm)
    # 키워드
    canv.setFillColor(INK2); canv.setFont("NG", 9)
    kw = ["전망이론", "손실회피", "처분효과", "군중심리", "자동화", "투자정책서", "21일 프로그램"]
    canv.drawString(ML, PAGE_H - 162 * mm, "  ·  ".join(kw))
    # 하단
    canv.setFillColor(INK); canv.setFont("NMJB", 12)
    canv.drawString(ML, 38 * mm, "2026년 7월 31일")
    canv.setFillColor(INK2); canv.setFont("NG", 8.8)
    canv.drawString(ML, 31 * mm, "본서는 『S&P 500은 지금 어디에 서 있는가』(같은 날 발행)의 자매편 — 1권이 시장을 진단한다면, 2권은 투자자를 진단한다.")
    canv.drawString(ML, 25 * mm, "정보 제공 목적의 일반 자료이며 특정 상품의 매수·매도 권유가 아닙니다.")
    canv.setFillColor(TERRA_D); canv.setFont("NSQB", 9)
    canv.drawString(ML, 16 * mm, "100 PAGES  ·  11 PARTS  ·  30 FIGURES")
    canv.restoreState()


def deco_part(canv, doc):
    canv.saveState()
    paint_bg(canv, CREAM2)
    canv.setStrokeColor(TERRA); canv.setLineWidth(2)
    canv.line(ML, PAGE_H * 0.30, ML + 30 * mm, PAGE_H * 0.30)
    canv.setFillColor(MUTED); canv.setFont("NMJB", 8.8)
    canv.drawRightString(PAGE_W - MR, 9.2 * mm, f"{canv.getPageNumber():02d}")
    canv.restoreState()


def deco_back(canv, doc):
    canv.saveState()
    paint_bg(canv, TERRA)
    canv.setStrokeColor(CREAM); canv.setLineWidth(1.6)
    canv.line(ML, PAGE_H * 0.62, ML + 30 * mm, PAGE_H * 0.62)
    canv.setFillColor(CREAM); canv.setFont("NMJB", 20)
    canv.drawString(ML, PAGE_H * 0.62 - 12 * mm, "흔들리는 것은 시장이 아니라 마음이다")
    canv.setFont("NMJ", 11.5)
    canv.drawString(ML, PAGE_H * 0.62 - 20 * mm, "시장은 통제할 수 없다 — 그러나 반응은 설계할 수 있다.")
    canv.setFillColor(colors.HexColor("#f6e3da")); canv.setFont("NG", 8.8)
    canv.drawString(ML, PAGE_H * 0.62 - 31 * mm,
                    "행동재무학 완전 가이드 · 2026년 7월 31일 발행 · 자매편: S&P 500은 지금 어디에 서 있는가")
    canv.drawString(ML, PAGE_H * 0.62 - 37 * mm,
                    "본 자료는 정보 제공 목적의 일반 자료이며, 특정 금융투자상품의 매수·매도 권유가 아닙니다.")
    canv.setFillColor(CREAM2); canv.setFont("NSQB", 9)
    canv.drawString(ML, 20 * mm, "THE INVESTOR'S MIND · 2026.07")
    canv.restoreState()


FIG_NO = {"n": 0}
TBL_NO = {"n": 0}


def para_of_bullets(items):
    return [Paragraph(f'<bullet color="#cc785c">&#8226;</bullet> {it}', S["bullet"])
            for it in items]


def make_stats(items):
    vals = [Paragraph(v, S["stat_v"]) for v, _ in items]
    lbls = [Paragraph(l, S["stat_l"]) for _, l in items]
    n = len(items)
    t = Table([vals, lbls], colWidths=[TEXT_W / n] * n)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CREAM2),
        ("TOPPADDING", (0, 0), (-1, 0), 9),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 8),
        ("TOPPADDING", (0, 1), (-1, 1), 1),
        ("LINEBELOW", (0, 1), (-1, 1), 2, TERRA),
        ("LINEAFTER", (0, 0), (-2, -1), 0.7, CREAM),
    ]))
    return [Spacer(1, 6), t, Spacer(1, 12)]


def make_table(headers, rows, ratios=None, note=None):
    TBL_NO["n"] += 1
    data = [[Paragraph(h, S["cell_h"]) for h in headers]]
    for r in rows:
        data.append([Paragraph(str(c), S["cell"] if i == 0 else S["cell_c"])
                     for i, c in enumerate(r)])
    widths = [TEXT_W * x for x in ratios] if ratios else [TEXT_W / len(headers)] * len(headers)
    t = Table(data, colWidths=widths, repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), TERRA_D),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5.2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5.2),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, 0), 1.4, TERRA),
        ("LINEBELOW", (0, -1), (-1, -1), 0.8, LINE),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style.append(("BACKGROUND", (0, i), (-1, i), CREAM3))
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
        ("BACKGROUND", (0, 0), (-1, -1), CREAM2),
        ("LINEBEFORE", (0, 0), (0, -1), 2.6, TERRA),
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
            story.append(HRule(color=TERRA, thick=1.1, pad=2))
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
    from content2_a import BLOCKS_FRONT, BLOCKS_SUMMARY, BLOCKS_A
    from content2_b import BLOCKS_B
    from content2_c import BLOCKS_C, BLOCKS_BACK
    from content2_d import EXTRA_BEFORE as E1, EXTRA_TAIL
    from content2_e import EXTRA_BEFORE2 as E2, EXTRA_TAIL2, SUMMARY_TAIL
    from content2_f import EXTRA_BEFORE3 as E3, SUMMARY_TAIL2

    EXTRA = {}
    for src in (E1, E2, E3):
        for k, v in src.items():
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

    doc = ReportDoc("output/투자자의마음_행동재무학_2026-07.pdf", pagesize=A4,
                    leftMargin=ML, rightMargin=MR, topMargin=MT, bottomMargin=MB,
                    title="흔들리는 것은 시장이 아니라 마음이다 — 행동재무학 완전 가이드",
                    author="리서치 데스크")

    frame = Frame(ML, MB, TEXT_W, PAGE_H - MT - MB, id="f")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[frame], onPage=deco_cover),
        PageTemplate(id="plain", frames=[frame], onPage=bg_body, onPageEnd=deco_plain),
        PageTemplate(id="body", frames=[frame], onPage=bg_body, onPageEnd=deco_body),
        PageTemplate(id="part", frames=[frame], onPage=deco_part),
        PageTemplate(id="back", frames=[frame], onPage=deco_back),
    ])

    toc = TableOfContents()
    toc.levelStyles = TOC_STYLES
    toc.dotsMinLevel = 0

    BLOCKS_A2 = splice(BLOCKS_A)
    BLOCKS_B2 = splice(BLOCKS_B)
    BLOCKS_C2 = splice(BLOCKS_C) + EXTRA_TAIL + EXTRA_TAIL2
    BLOCKS_BACK2 = splice(BLOCKS_BACK)
    ALL = BLOCKS_A2 + BLOCKS_B2 + BLOCKS_C2 + BLOCKS_BACK2
    figs = [b[2] for b in ALL if b[0] == "chart"]
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

    story = [NextPageTemplate("plain"), PageBreak()]
    story += build_story(BLOCKS_FRONT)
    story += [Paragraph("목차", S["toc_h"]),
              HRule(color=TERRA, thick=1.2, pad=3), Spacer(1, 8), toc,
              PageBreak(),
              Paragraph("그림 목록", S["toc_h"]),
              HRule(color=TERRA, thick=1.2, pad=3), Spacer(1, 6), fig_table,
              PageBreak()]
    story += build_story(BLOCKS_SUMMARY + SUMMARY_TAIL + SUMMARY_TAIL2)
    story += [NextPageTemplate("body")]
    story += build_story(BLOCKS_A2)
    story += build_story(BLOCKS_B2)
    story += build_story(BLOCKS_C2)
    story += build_story(BLOCKS_BACK2)
    story += [NextPageTemplate("back"), PageBreak(), Spacer(1, 10)]

    doc.multiBuild(story)
    print("PDF built:", doc.filename, "pages:", doc.page)


if __name__ == "__main__":
    main()
