"""Data acquisition and parsing.

Every loader is cache-first: if the raw file already exists it is not
re-downloaded.  Parsers locate columns *by name*, never by fixed position,
because the Shiller workbook moves its header row and sheet layout between
vintages.
"""
from __future__ import annotations

import io
import zipfile
from dataclasses import dataclass

import numpy as np
import pandas as pd
import requests

from config import RAW

SHILLER_URL = (
    "https://img1.wsimg.com/blobby/go/e5e77e0b-59d1-44d9-ab25-4763ac982e53/"
    "downloads/165d8a6e-26bf-44ec-a26c-a35f7f993480/ie_data.xls"
)
FRENCH_BASE = "https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/"
FRED_BASE = "https://fred.stlouisfed.org/graph/fredgraph.csv?id="
JST_URL = "https://www.macrohistory.net/app/download/9834512569/JSTdatasetR6.xlsx"


def _download(url: str, dest_name: str, timeout: int = 300) -> "object":
    """Download `url` into data/raw/<dest_name> unless it is already there."""
    dest = RAW / dest_name
    if dest.exists() and dest.stat().st_size > 0:
        return dest
    resp = requests.get(url, timeout=timeout)
    resp.raise_for_status()
    dest.write_bytes(resp.content)
    return dest


# --------------------------------------------------------------------------
# Shiller
# --------------------------------------------------------------------------
def _shiller_month_index(raw_dates: pd.Series) -> pd.PeriodIndex:
    """Convert Shiller's YYYY.MM float dates to monthly periods.

    Shiller writes October as ``1871.1``, so naive string handling silently
    turns October into January.  Formatting to two decimals restores the
    intended ``.10``.
    """
    out = []
    for v in raw_dates:
        s = f"{float(v):.2f}"
        year, month = s.split(".")
        out.append(pd.Period(f"{int(year)}-{int(month):02d}", freq="M"))
    return pd.PeriodIndex(out, freq="M")


def load_shiller() -> pd.DataFrame:
    """Monthly Shiller series: price, dividend, earnings, CPI, GS10, CAPE."""
    path = _download(SHILLER_URL, "ie_data_current.xls")
    book = pd.ExcelFile(path)
    sheet = next((s for s in book.sheet_names if s.strip().lower() == "data"),
                 book.sheet_names[-1])
    raw = pd.read_excel(book, sheet_name=sheet, header=None)

    # Locate the header row by looking for the cell that literally says "Date".
    header_row = None
    for i in range(min(30, len(raw))):
        if str(raw.iloc[i, 0]).strip().lower() == "date":
            header_row = i
            break
    if header_row is None:
        raise RuntimeError("Could not locate the Shiller header row")

    # Column names are split across several stacked header rows; join them so
    # that e.g. "Real"/"Total"/"Return"/"Price" becomes one searchable label.
    labels = []
    for col in range(raw.shape[1]):
        parts = [
            str(raw.iloc[r, col]).strip()
            for r in range(max(0, header_row - 6), header_row + 1)
            if str(raw.iloc[r, col]).strip() not in ("nan", "")
        ]
        labels.append(" ".join(parts))

    body = raw.iloc[header_row + 1:].copy()
    body.columns = labels
    # Drop the trailing footnote rows (they have no parsable date).
    date_col = labels[0]
    body = body[pd.to_numeric(body[date_col], errors="coerce").notna()]

    def pick(*needles: str, exclude: tuple = ()) -> str:
        """Find the single column whose label contains all needles."""
        cands = [
            lab for lab in labels
            if all(n.lower() in lab.lower() for n in needles)
            and not any(x.lower() in lab.lower() for x in exclude)
        ]
        if not cands:
            raise KeyError(f"No Shiller column matching {needles}")
        return min(cands, key=len)

    out = pd.DataFrame(index=_shiller_month_index(body[date_col]))
    out["price"] = pd.to_numeric(body[pick("S&P", "Comp", "P")].values, errors="coerce")
    out["dividend"] = pd.to_numeric(body[pick("Dividend", "D")].values, errors="coerce")
    out["earnings"] = pd.to_numeric(body[pick("Earnings", "E")].values, errors="coerce")
    out["cpi"] = pd.to_numeric(body[pick("Consumer", "Price", "Index")].values, errors="coerce")
    out["gs10"] = pd.to_numeric(body[pick("Long", "Interest", "Rate")].values, errors="coerce")
    out["real_price"] = pd.to_numeric(body[pick("Real", "Price", exclude=("Total", "Index"))].values, errors="coerce")
    out["real_tr_price"] = pd.to_numeric(body[pick("Real", "Total", "Return", "Price")].values, errors="coerce")
    out["real_earnings"] = pd.to_numeric(body[pick("Real", "Earnings", exclude=("Scaled",))].values, errors="coerce")
    out["cape"] = pd.to_numeric(body[pick("CAPE", exclude=("TR", "Yield"))].values, errors="coerce")

    # Optional columns present only in recent vintages.
    for name, needles in [("tr_cape", ("TR CAPE",)),
                          ("excess_cape_yield", ("Excess", "CAPE", "Yield")),
                          ("bond_tr_nominal", ("Monthly", "Total", "Bond", "Returns"))]:
        try:
            out[name] = pd.to_numeric(body[pick(*needles)].values, errors="coerce")
        except KeyError:
            out[name] = np.nan

    return out.sort_index()


# --------------------------------------------------------------------------
# Ken French
# --------------------------------------------------------------------------
def _parse_french_monthly(text: str) -> pd.DataFrame:
    """Extract the monthly block from a Fama-French CSV.

    The files begin with prose, then a monthly block keyed by YYYYMM, then an
    annual block keyed by YYYY.  We keep only rows with a 6-digit key.
    """
    rows, header = [], None
    for line in text.splitlines():
        cells = [c.strip() for c in line.split(",")]
        if header is None:
            if len(cells) > 2 and any("Mkt-RF" in c for c in cells):
                header = [c for c in cells[1:] if c]
            continue
        key = cells[0]
        if len(key) == 6 and key.isdigit():
            vals = [pd.to_numeric(c, errors="coerce") for c in cells[1:1 + len(header)]]
            rows.append([key] + vals)
    if header is None:
        raise RuntimeError("Could not find the Fama-French header row")

    df = pd.DataFrame(rows, columns=["ym"] + header)
    df.index = pd.PeriodIndex(
        [pd.Period(f"{k[:4]}-{k[4:]}", freq="M") for k in df["ym"]], freq="M")
    df = df.drop(columns=["ym"])
    # French publishes percentages; -99.99 and -999 are missing codes.
    df = df.mask(df <= -99.0)
    return df / 100.0


def load_french_factors() -> pd.DataFrame:
    """US Mkt-RF / SMB / HML / RF, monthly decimals from 1926-07."""
    path = _download(FRENCH_BASE + "F-F_Research_Data_Factors_CSV.zip",
                     "F-F_Research_Data_Factors_CSV.zip")
    with zipfile.ZipFile(path) as zf:
        name = next(n for n in zf.namelist() if n.lower().endswith(".csv"))
        text = zf.read(name).decode("latin-1")
    return _parse_french_monthly(text)


def load_french_japan() -> pd.DataFrame:
    """Japan Mkt-RF / RF, monthly decimals from 1990-07 (USD, US risk-free)."""
    path = _download(FRENCH_BASE + "Japan_3_Factors_CSV.zip", "Japan_3_Factors_CSV.zip")
    with zipfile.ZipFile(path) as zf:
        name = next(n for n in zf.namelist() if n.lower().endswith(".csv"))
        text = zf.read(name).decode("latin-1")
    return _parse_french_monthly(text)


# --------------------------------------------------------------------------
# FRED
# --------------------------------------------------------------------------
def load_fred(series_id: str) -> pd.Series:
    path = _download(FRED_BASE + series_id, f"FRED_{series_id}.csv")
    df = pd.read_csv(path)
    date_col, val_col = df.columns[0], df.columns[1]
    df[val_col] = pd.to_numeric(df[val_col], errors="coerce")
    df[date_col] = pd.to_datetime(df[date_col])
    return df.set_index(date_col)[val_col].dropna().rename(series_id)


# --------------------------------------------------------------------------
# Jorda-Schularick-Taylor Macrohistory
# --------------------------------------------------------------------------
def load_jst() -> pd.DataFrame:
    """Annual cross-country returns: equity TR, bill rate, CPI, div/price."""
    path = _download(JST_URL, "JSTdatasetR6.xlsx")
    book = pd.ExcelFile(path)
    sheet = next((s for s in book.sheet_names if "data" in s.lower()),
                 book.sheet_names[0])
    return pd.read_excel(book, sheet_name=sheet)


# --------------------------------------------------------------------------
# Provenance reporting
# --------------------------------------------------------------------------
@dataclass
class SourceReport:
    name: str
    rows: int
    start: str
    end: str
    missing: str

    def as_row(self) -> list:
        return [self.name, self.rows, self.start, self.end, self.missing]


def describe(name: str, obj) -> SourceReport:
    """Row count, date range and missingness for a loaded source."""
    if isinstance(obj, pd.Series):
        obj = obj.to_frame()
    idx = obj.index
    start, end = str(idx.min()), str(idx.max())
    miss = ", ".join(
        f"{c}={int(obj[c].isna().sum())}"
        for c in obj.columns if obj[c].isna().any()
    ) or "none"
    return SourceReport(name, len(obj), start, end, miss)
