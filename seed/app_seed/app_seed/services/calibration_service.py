"""Calibragem dos campos operacionais (status, startTime, endTime) por balde de KPI.

O app (SPEC.md) deriva os baldes Atrasado / Aberto / Em andamento / Concluído a partir
de `status` + `startTime`/`endTime`. Aqui distribuímos as 8 Checklists (1 por andar)
entre os 4 baldes (2 cada) de forma DETERMINÍSTICA, e damos aos ChecklistItems status
coerentes com a sua Checklist, para que o painel exiba todos os baldes de forma realista.

`Atrasado` não é um status armazenado — é derivado (endTime no passado e não concluído).
Por isso uma Checklist "atrasada" é gravada como status="Ongoing"/"To Do" com endTime vencido.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from enum import Enum

from app_seed.domain.timestamps import to_iso

# Referência temporal fixa (= data atual do projeto) → saída 100% determinística.
NOW = datetime(2026, 6, 3, 12, 0, 0, tzinfo=timezone.utc)

STATUS_TODO = "To Do"
STATUS_ONGOING = "Ongoing"
STATUS_COMPLETED = "Completed"


class Bucket(str, Enum):
    CONCLUIDO = "Concluído"
    EM_ANDAMENTO = "Em andamento"
    ABERTO = "Aberto"
    ATRASADO = "Atrasado"


_BUCKET_CYCLE = (
    Bucket.CONCLUIDO,
    Bucket.EM_ANDAMENTO,
    Bucket.ABERTO,
    Bucket.ATRASADO,
)


def _days(n: float) -> timedelta:
    return timedelta(days=n)


@dataclass(frozen=True)
class TimingProfile:
    """Status + janela temporal resolvidos para um node."""

    status: str
    start_time: str | None
    end_time: str | None
    bucket: Bucket


class CalibrationService:
    """Gera perfis de status/prazo determinísticos por índice de Checklist."""

    def __init__(self, *, now: datetime = NOW) -> None:
        self._now = now

    def bucket_for(self, checklist_index: int) -> Bucket:
        return _BUCKET_CYCLE[checklist_index % len(_BUCKET_CYCLE)]

    def checklist_profile(self, checklist_index: int) -> TimingProfile:
        bucket = self.bucket_for(checklist_index)
        # `spread` separa as duas Checklists de cada balde (0 e 1).
        spread = checklist_index // len(_BUCKET_CYCLE)
        now = self._now

        if bucket is Bucket.CONCLUIDO:
            return TimingProfile(
                status=STATUS_COMPLETED,
                start_time=to_iso(now - _days(12 + spread)),
                end_time=to_iso(now - _days(7 + spread)),
                bucket=bucket,
            )
        if bucket is Bucket.EM_ANDAMENTO:
            return TimingProfile(
                status=STATUS_ONGOING,
                start_time=to_iso(now - _days(2 + spread)),
                end_time=to_iso(now + _days(5 - spread)),
                bucket=bucket,
            )
        if bucket is Bucket.ABERTO:
            return TimingProfile(
                status=STATUS_TODO,
                start_time=None,
                end_time=to_iso(now + _days(6 + spread)),
                bucket=bucket,
            )
        # ATRASADO: vencido e não concluído.
        return TimingProfile(
            status=STATUS_ONGOING,
            start_time=to_iso(now - _days(6 + spread)),
            end_time=to_iso(now - _days(1 + spread)),
            bucket=bucket,
        )

    def item_profile(
        self, checklist: TimingProfile, item_index: int, item_count: int
    ) -> TimingProfile:
        """Status do item coerente com o da Checklist pai."""
        now = self._now
        bucket = checklist.bucket

        if bucket is Bucket.CONCLUIDO:
            return TimingProfile(
                status=STATUS_COMPLETED,
                start_time=checklist.start_time,
                end_time=checklist.end_time,
                bucket=bucket,
            )
        if bucket is Bucket.ABERTO:
            return TimingProfile(
                status=STATUS_TODO, start_time=None, end_time=None, bucket=bucket
            )

        # EM_ANDAMENTO / ATRASADO: progressão por posição (concluído → em curso → a fazer).
        ratio = (item_index + 1) / max(item_count, 1)
        if ratio <= 0.4:
            return TimingProfile(
                status=STATUS_COMPLETED,
                start_time=to_iso(now - _days(2)),
                end_time=to_iso(now - _days(1)),
                bucket=bucket,
            )
        if ratio <= 0.75:
            end = None if bucket is Bucket.EM_ANDAMENTO else to_iso(now - _days(1))
            return TimingProfile(
                status=STATUS_ONGOING,
                start_time=to_iso(now - _days(1)),
                end_time=end,
                bucket=bucket,
            )
        return TimingProfile(
            status=STATUS_TODO, start_time=None, end_time=None, bucket=bucket
        )
