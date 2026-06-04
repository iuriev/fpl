"""Normalize football-data / vaastav team names to a stable slug."""

from __future__ import annotations

FD_TO_SLUG: dict[str, str] = {
    "Arsenal": "arsenal",
    "Aston Villa": "aston-villa",
    "Bournemouth": "bournemouth",
    "Brentford": "brentford",
    "Brighton": "brighton",
    "Burnley": "burnley",
    "Chelsea": "chelsea",
    "Crystal Palace": "crystal-palace",
    "Everton": "everton",
    "Fulham": "fulham",
    "Ipswich": "ipswich",
    "Leeds": "leeds",
    "Leicester": "leicester",
    "Liverpool": "liverpool",
    "Luton": "luton",
    "Man City": "man-city",
    "Man United": "man-united",
    "Manchester City": "man-city",
    "Manchester United": "man-united",
    "Newcastle": "newcastle",
    "Nott'm Forest": "nottm-forest",
    "Norwich": "norwich",
    "Sheffield United": "sheffield-utd",
    "Southampton": "southampton",
    "Spurs": "spurs",
    "Sunderland": "sunderland",
    "Tottenham": "spurs",
    "Watford": "watford",
    "West Brom": "west-brom",
    "West Ham": "west-ham",
    "Wolves": "wolves",
}

VAASTAV_TO_SLUG: dict[str, str] = {
    "Arsenal": "arsenal",
    "Aston Villa": "aston-villa",
    "Bournemouth": "bournemouth",
    "Brentford": "brentford",
    "Brighton": "brighton",
    "Burnley": "burnley",
    "Chelsea": "chelsea",
    "Crystal Palace": "crystal-palace",
    "Everton": "everton",
    "Fulham": "fulham",
    "Ipswich": "ipswich",
    "Leeds": "leeds",
    "Leicester": "leicester",
    "Liverpool": "liverpool",
    "Man City": "man-city",
    "Man Utd": "man-united",
    "Newcastle": "newcastle",
    "Nott'm Forest": "nottm-forest",
    "Sheffield Utd": "sheffield-utd",
    "Southampton": "southampton",
    "Spurs": "spurs",
    "Sunderland": "sunderland",
    "Tottenham": "spurs",
    "Watford": "watford",
    "West Brom": "west-brom",
    "West Ham": "west-ham",
    "Wolves": "wolves",
}


def slug_from_fd(name: str) -> str | None:
    key = name.strip()
    return FD_TO_SLUG.get(key)


def slug_from_vaastav(name: str) -> str | None:
    if isinstance(name, str):
        return VAASTAV_TO_SLUG.get(name.strip())
    return None
