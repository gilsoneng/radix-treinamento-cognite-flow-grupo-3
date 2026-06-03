"""Interface de linha de comando do app_seed.

Comandos:
  generate   Lê o CSV da rota e (re)gera o JSON de seed (forma cdf_apm, com edges).
  populate   Lê o JSON e popula o CDF. DRY-RUN por padrão; use --apply para escrever.

Exemplos:
  python -m app_seed generate
  python -m app_seed populate            # valida + plano, sem escrever
  python -m app_seed populate --apply    # escreve no CDF (idempotente)
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from app_seed.config.settings import AppSettings
from app_seed.injectors.container import Container
from app_seed.services.seed_populator_service import PopulateReport


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="app_seed",
        description="Gera e popula o seed OEC (Route 1) no data model cdf_apm.ApmAppData:v13.",
    )
    parser.add_argument("--space", help="Override do space de instâncias.")
    parser.add_argument("--env", type=Path, help="Caminho do .env (default: raiz do repo).")
    sub = parser.add_subparsers(dest="command", required=True)

    gen = sub.add_parser("generate", help="(Re)gera o JSON de seed a partir do CSV.")
    gen.add_argument("--csv", type=Path, help="Override do caminho do CSV.")
    gen.add_argument("--out", type=Path, help="Override do caminho de saída do JSON.")

    pop = sub.add_parser("populate", help="Popula o CDF a partir do JSON (dry-run por padrão).")
    pop.add_argument("--in", dest="json_in", type=Path, help="Override do JSON de entrada.")
    pop.add_argument(
        "--apply",
        action="store_true",
        help="Executa a escrita no CDF. Sem esta flag, apenas valida e mostra o plano.",
    )
    return parser


def _make_container(args: argparse.Namespace) -> Container:
    space = args.space or AppSettings.load().instance_space
    settings = AppSettings.load(
        env_path=args.env,
        instance_space=space,
    )
    return Container(settings)


def _cmd_generate(container: Container, args: argparse.Namespace) -> int:
    settings = container.settings
    csv_path = args.csv or settings.csv_path
    out_path = args.out or settings.seed_json_path

    route = container.csv_reader().read(csv_path)
    bundle = container.seed_builder().build(route)
    container.json_repository().save(bundle, out_path)

    stats = bundle.meta.get("stats", {})
    print(f"✓ JSON de seed gerado: {out_path}")
    print(f"  fonte: {csv_path.name}")
    print("  modelo: cdf_apm.ApmAppData:v13 (edges referenceChecklistItems/referenceMeasurements)")
    print(f"  stats: {stats}")
    return 0


def _cmd_populate(container: Container, args: argparse.Namespace) -> int:
    settings = container.settings
    json_path = args.json_in or settings.seed_json_path

    bundle = container.json_repository().load(json_path)
    populator = container.seed_populator()
    report = populator.populate(
        bundle,
        instance_space=settings.instance_space,
        required_views=Container.required_views(),
        apply=args.apply,
    )
    _print_report(report, json_path)
    return 0 if report.ok else 2


def _print_report(report: PopulateReport, json_path: Path) -> None:
    mode = "DRY-RUN (nenhuma escrita)" if report.dry_run else "APPLY"
    print(f"== populate [{mode}] ==")
    print(f"  arquivo: {json_path}")
    print(f"  space: {report.instance_space}")
    print(f"  nodes: {report.node_count} | edges: {report.edge_count}")
    print(f"  nodes por view: {report.nodes_by_view}")
    print(f"  edges por tipo: {report.edges_by_type}")

    if report.missing_views:
        missing = ", ".join(f"{v.space}:{v.external_id}/{v.version}" for v in report.missing_views)
        print(f"  ✗ VIEWS AUSENTES no projeto: {missing}")
        print("    Abortado: o modelo de destino não existe. Nada foi escrito.")
        return

    print("  ✓ todas as views exigidas existem")
    if report.space_existed is not None:
        print(f"  space existente: {report.space_existed}")

    if report.dry_run:
        print("  → plano válido. Re-execute com --apply para escrever no CDF.")
        return

    if report.space_created:
        print(f"  + space '{report.instance_space}' criado")
    if report.node_result:
        r = report.node_result
        print(f"  ✓ nodes upsert: {r.written} escritos, {r.unchanged} inalterados (total {r.total})")
    if report.edge_result:
        r = report.edge_result
        print(f"  ✓ edges upsert: {r.written} escritos, {r.unchanged} inalterados (total {r.total})")
    print("  concluído.")


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    container = _make_container(args)

    if args.command == "generate":
        return _cmd_generate(container, args)
    if args.command == "populate":
        return _cmd_populate(container, args)
    parser.error(f"comando desconhecido: {args.command}")


if __name__ == "__main__":
    sys.exit(main())
