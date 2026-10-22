"""Compatibility entry point for the active V2 artwork checks."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('validate-avatar-v2-art.py')), run_name='__main__')
