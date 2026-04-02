# File: pubchem_service.py
#
# Endpoints:
# - GET /autocomplete?q=niac
# - GET /search?q=niacinamide  -> results in your schema:
#   { name, normalizedName, riskLevel, riskScore, reviewBucket, category, description, source, aliases, concerns }
#
# Setup:
#   python3 -m venv .venv
#   source .venv/bin/activate
#   pip install -U fastapi uvicorn httpx
#
# Run:
#   uvicorn pubchem_service:app --host 0.0.0.0 --port 8000
#
# Try
#   curl "http://localhost:8000/autocomplete?q=niac&limit=8"
#   curl "http://localhost:8000/search?q=niacinamide&limit=3"

from __future__ import annotations

import asyncio
import re
from typing import Any, Dict, List
from urllib.parse import quote

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

PUBCHEM_BASE = "https://pubchem.ncbi.nlm.nih.gov"
DEFAULT_TIMEOUT_S = 30.0

app = FastAPI(title="PubChem Search Service", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later
    allow_methods=["GET"],
    allow_headers=["*"],
)


def _norm_ws(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip())


def normalize_name(name: str) -> str:
    s = (name or "").lower()
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return _norm_ws(s)


async def _get_json(client: httpx.AsyncClient, url: str) -> Dict[str, Any]:
    r = await client.get(url)
    r.raise_for_status()
    return r.json()


async def pubchem_autocomplete(client: httpx.AsyncClient, q: str, limit: int) -> List[str]:
    url = f"{PUBCHEM_BASE}/rest/autocomplete/compound/{quote(q)}/json?limit={limit}"
    data = await _get_json(client, url)

    terms = (data.get("dictionary_terms") or data.get("DictionaryTerms") or {})
    compound_terms = terms.get("compound") or terms.get("Compound") or []
    if compound_terms:
        return [_norm_ws(x) for x in compound_terms if _norm_ws(x)]

    results = data.get("results") or data.get("Results") or []
    out: List[str] = []
    for item in results:
        if isinstance(item, str):
            out.append(item)
        elif isinstance(item, dict):
            out.append(item.get("text") or item.get("name") or "")
    return [_norm_ws(x) for x in out if _norm_ws(x)]


async def name_to_cids(client: httpx.AsyncClient, q: str) -> List[int]:
    url = f"{PUBCHEM_BASE}/rest/pug/compound/name/{quote(q)}/cids/JSON"
    data = await _get_json(client, url)
    cids = data.get("IdentifierList", {}).get("CID", [])
    return [int(x) for x in cids]


async def cid_synonyms(client: httpx.AsyncClient, cid: int) -> List[str]:
    url = f"{PUBCHEM_BASE}/rest/pug/compound/cid/{cid}/synonyms/JSON"
    data = await _get_json(client, url)
    info = (data.get("InformationList", {}).get("Information") or [])
    if not info:
        return []
    syns = info[0].get("Synonym") or []
    return [_norm_ws(s) for s in syns if _norm_ws(s)]


def _pugview_to_text(node: Any) -> str:
    parts: List[str] = []

    def walk(x: Any) -> None:
        if x is None:
            return
        if isinstance(x, str):
            t = _norm_ws(x)
            if t:
                parts.append(t)
            return
        if isinstance(x, list):
            for i in x:
                walk(i)
            return
        if isinstance(x, dict):
            for k in ("TOCHeading", "Heading", "Name", "Value", "String", "Description", "Text"):
                if k in x:
                    walk(x[k])

            if "StringWithMarkup" in x and isinstance(x["StringWithMarkup"], list):
                for item in x["StringWithMarkup"]:
                    if isinstance(item, dict) and "String" in item:
                        walk(item["String"])

            for k in ("Record", "Section", "Information", "Data", "Reference", "Table", "Row", "Cell"):
                if k in x:
                    walk(x[k])
            return

    walk(node)

    cleaned: List[str] = []
    for p in parts:
        if not cleaned or cleaned[-1] != p:
            cleaned.append(p)

    text = "\n".join(cleaned)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text


async def cid_heading_text(client: httpx.AsyncClient, cid: int, heading: str) -> str:
    url = (
        f"{PUBCHEM_BASE}/rest/pug_view/data/compound/{cid}/JSON/"
        f"?heading={quote(heading)}&response_type=display"
    )
    data = await _get_json(client, url)
    return _pugview_to_text(data)


async def cid_description_text(client: httpx.AsyncClient, cid: int) -> str:
    try:
        text = await cid_heading_text(client, cid, "Description")
        return text
    except httpx.HTTPStatusError as e:
        if e.response.status_code in (400, 404):
            return ""
        raise


async def cid_toxicity_text(client: httpx.AsyncClient, cid: int) -> str:
    headings = [
        "Toxicity",
        "Toxicological Information",
        "Toxicity Summary",
        "Safety and Hazards",
        "Hazards Identification",
        "GHS Classification",
    ]
    for h in headings:
        try:
            text = await cid_heading_text(client, cid, h)
            if text:
                return text
        except httpx.HTTPStatusError as e:
            if e.response.status_code in (400, 404):
                continue
            raise
    return ""


def extract_toxicity_tags(toxicity_text: str, *, max_items: int = 12) -> List[str]:
    t = (toxicity_text or "").lower()
    tags = []
    keywords = [
        ("carcin", "carcinogenicity"),
        ("mutagen", "mutagenicity"),
        ("reprotox", "reproductive_toxicity"),
        ("teratogen", "developmental_toxicity"),
        ("endocrine", "endocrine_disruption"),
        ("sensit", "skin_sensitization"),
        ("irrit", "irritation"),
        ("acute toxicity", "acute_toxicity"),
        ("chronic", "chronic_toxicity"),
    ]
    for needle, tag in keywords:
        if needle in t:
            tags.append(tag)

    out = []
    seen = set()
    for x in tags:
        if x in seen:
            continue
        seen.add(x)
        out.append(x)
        if len(out) >= max_items:
            break
    return out


def to_record(*, cid: int, preferred_name: str, synonyms: List[str], description: str, toxicity_text: str) -> Dict[str, Any]:
    display_name = preferred_name or f"CID {cid}"

    concerns: List[Dict[str, Any]] = []
    if toxicity_text:
        concerns.append({"type": "toxicity_text", "text": toxicity_text})
    for tag in extract_toxicity_tags(toxicity_text):
        concerns.append({"type": "tag", "tag": tag})

    return {
        "name": display_name,
        "normalizedName": normalize_name(display_name),
        "riskLevel": None,
        "riskScore": None,
        "reviewBucket": None,
        "category": None,
        "description": description or "",
        "source": "PUBCHEM",
        "aliases": synonyms[:200],
        "concerns": concerns,
    }


@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/autocomplete")
async def autocomplete(
    q: str = Query(..., min_length=1),
    limit: int = Query(8, ge=1, le=20),
) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT_S) as client:
        results = await pubchem_autocomplete(client, q, limit)
        return {"query": q, "results": results}


@app.get("/search")
async def search(
    q: str = Query(..., min_length=1),
    limit: int = Query(3, ge=1, le=10),
) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT_S) as client:
        try:
            cids = await name_to_cids(client, q)
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=502, detail=f"PubChem error: {e.response.status_code}") from e
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"PubChem request failed: {e}") from e

        if not cids:
            return {"query": q, "results": []}

        cids = cids[:limit]

        async def build(cid: int) -> Dict[str, Any]:
            syns_task = asyncio.create_task(cid_synonyms(client, cid))
            desc_task = asyncio.create_task(cid_description_text(client, cid))
            tox_task = asyncio.create_task(cid_toxicity_text(client, cid))

            synonyms = await syns_task
            description = await desc_task
            toxicity_text = await tox_task

            preferred_name = synonyms[0] if synonyms else f"CID {cid}"
            return to_record(
                cid=cid,
                preferred_name=preferred_name,
                synonyms=synonyms,
                description=description,
                toxicity_text=toxicity_text,
            )

        results = await asyncio.gather(*(build(cid) for cid in cids))
        return {"query": q, "results": results}
