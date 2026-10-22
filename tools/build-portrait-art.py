"""Compatibility entry point for the full-colour V2 artwork compiler.

The former RGB-mask/quantisation compiler has been replaced. Source drawings,
registration and grading are in tools/build-avatar-v2-art.py.
"""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('build-avatar-v2-art.py')), run_name='__main__')
