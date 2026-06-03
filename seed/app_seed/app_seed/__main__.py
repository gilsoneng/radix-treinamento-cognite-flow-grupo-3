"""Permite `python -m app_seed [generate|populate]`."""

import sys

from app_seed.cli import main

if __name__ == "__main__":
    sys.exit(main())
