"""Testes da política de nomes (externalIds)."""

from __future__ import annotations

from app_seed.domain.naming import Namer, slugify

namer = Namer("_group_3")


def test_slugify():
    assert slugify("7th Floor") == "7th-floor"
    assert slugify("OK / Not OK") == "ok-not-ok"
    assert slugify("#1 Backflush Tank") == "1-backflush-tank"


def test_ids_match_validated_scheme():
    assert namer.checklist_id("7th Floor") == "eq-7th-floor_group_3"
    assert (
        namer.item_id("7th Floor", "Diffuser Scraper", 1, 1)
        == "eq-7th-floor-diffuser-scraper-1-check-1_group_3"
    )
    assert namer.asset_id("7th Floor", "Diffuser Scraper", 1) == "asset-7th-floor-diffuser-scraper-1_group_3"
    assert namer.measurement_id("OK / Not OK") == "measurement-ok-not-ok_group_3"
    assert namer.user_id("supervisor") == "cdf-user-supervisor-seed_group_3"


def test_suffix_is_idempotent():
    once = namer.checklist_id("7th Floor")
    assert namer.with_suffix(once) == once  # não duplica o sufixo


def test_edge_ids_unique_per_item():
    base = namer.item_base("7th Floor", "Diffuser Scraper", 1, 1)
    assert namer.edge_checklist_item_id(base) == "rci-eq-7th-floor-diffuser-scraper-1-check-1_group_3"
    assert namer.edge_measurement_id(base) == "rms-eq-7th-floor-diffuser-scraper-1-check-1_group_3"
