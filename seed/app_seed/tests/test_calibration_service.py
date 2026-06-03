"""Testes da calibragem de KPIs."""

from __future__ import annotations

from app_seed.services.calibration_service import (
    NOW,
    Bucket,
    CalibrationService,
    STATUS_COMPLETED,
    STATUS_ONGOING,
    STATUS_TODO,
)

svc = CalibrationService()


def test_buckets_cycle_over_eight_floors():
    buckets = [svc.bucket_for(i) for i in range(8)]
    # 2 de cada balde em 8 andares
    for bucket in Bucket:
        assert buckets.count(bucket) == 2


def test_concluido_has_past_window_and_completed_status():
    profile = svc.checklist_profile(0)  # índice 0 → CONCLUIDO
    assert profile.bucket is Bucket.CONCLUIDO
    assert profile.status == STATUS_COMPLETED
    assert profile.start_time is not None and profile.end_time is not None
    assert profile.end_time < NOW.strftime("%Y-%m-%dT%H:%M:%S.000Z")


def test_atrasado_is_overdue_and_not_completed():
    profile = svc.checklist_profile(3)  # índice 3 → ATRASADO
    assert profile.bucket is Bucket.ATRASADO
    assert profile.status != STATUS_COMPLETED
    assert profile.end_time is not None
    assert profile.end_time < NOW.strftime("%Y-%m-%dT%H:%M:%S.000Z")


def test_aberto_has_no_start_and_future_due():
    profile = svc.checklist_profile(2)  # índice 2 → ABERTO
    assert profile.bucket is Bucket.ABERTO
    assert profile.status == STATUS_TODO
    assert profile.start_time is None
    assert profile.end_time is not None
    assert profile.end_time > NOW.strftime("%Y-%m-%dT%H:%M:%S.000Z")


def test_em_andamento_is_ongoing_with_future_due():
    profile = svc.checklist_profile(1)  # índice 1 → EM_ANDAMENTO
    assert profile.bucket is Bucket.EM_ANDAMENTO
    assert profile.status == STATUS_ONGOING
    assert profile.end_time > NOW.strftime("%Y-%m-%dT%H:%M:%S.000Z")


def test_completed_checklist_items_are_completed():
    checklist = svc.checklist_profile(0)
    item = svc.item_profile(checklist, item_index=0, item_count=10)
    assert item.status == STATUS_COMPLETED


def test_aberto_items_are_todo():
    checklist = svc.checklist_profile(2)
    item = svc.item_profile(checklist, item_index=5, item_count=10)
    assert item.status == STATUS_TODO


def test_em_andamento_items_progress_by_position():
    checklist = svc.checklist_profile(1)
    statuses = {svc.item_profile(checklist, i, 10).status for i in range(10)}
    # deve haver mistura de status para exercitar os KPIs
    assert statuses == {STATUS_COMPLETED, STATUS_ONGOING, STATUS_TODO}


def test_determinism():
    a = svc.checklist_profile(5)
    b = CalibrationService().checklist_profile(5)
    assert a == b
