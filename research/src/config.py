"""Shared paths and constants for the DCA-schedule backtest."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
INTERIM = ROOT / "data" / "interim"
FIGURES = ROOT / "figures"
RESULTS = ROOT / "results"

for _d in (RAW, INTERIM, FIGURES, RESULTS):
    _d.mkdir(parents=True, exist_ok=True)

# --- Question parameters -------------------------------------------------
# Deployment schedules under test (months over which the lump sum is spread).
N_GRID = [0, 3, 6, 9, 12, 18, 24, 36]

# Evaluation horizon in months, measured from the first deployment month.
# The whole sum is invested by month N in every strategy, then held.
HORIZON_MONTHS = 120

# Drawdown-acceleration trigger levels for S2: (drawdown, fraction of the
# *remaining* uninvested balance to deploy). Each level fires at most once.
S2_TRIGGERS = [(-0.10, 1 / 3), (-0.20, 1 / 2), (-0.30, 1.0)]

# Risk aversion levels for CRRA certainty equivalents.
GAMMAS = [1, 3, 5, 10]

# Stationary bootstrap (Politis-Romano) mean block length in months.
BOOTSTRAP_BLOCK = 30
BOOTSTRAP_DRAWS = 2000
BOOTSTRAP_SEED = 20260725

# Sample start dates used to demonstrate that results are not cherry-picked.
START_YEARS = [1926, 1950, 1970, 1990]

# Korean investor overlay.
KRW_TAX_RATE = 0.22           # 해외주식 양도소득세 (지방소득세 포함)
KRW_TAX_DEDUCTION = 2_500_000  # 연간 기본공제 (KRW)
KRW_PRINCIPAL = 10_000_000_000  # 100억원

# The decision point the project must ultimately answer.
CURRENT_CAPE = 41.37
CURRENT_RF_ANNUAL = 0.036

# Named crash episodes used for leave-one-out robustness.
EPISODES = {
    "1929": ("1929-01", "1932-12"),
    "2000": ("2000-01", "2002-12"),
    "2008": ("2007-06", "2009-06"),
    "2020": ("2020-01", "2020-12"),
}
