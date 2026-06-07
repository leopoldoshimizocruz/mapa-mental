import sys
from pathlib import Path

# Garante que `import main`, `import storage` etc. funcionem nos testes.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
