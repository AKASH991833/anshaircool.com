"""Copy only the public site's reviewed files. Never publish legacy admin/backend files."""
from pathlib import Path
import shutil
root = Path(__file__).resolve().parent
out = root / 'public'
if out.exists(): shutil.rmtree(out)
out.mkdir()
for name in ('index.html', 'gallery.html', 'thank-you.html', 'script.js', 'styles.css'):
    shutil.copy2(root/name, out/name)
for name in ('images', 'transparentdb'):
    shutil.copytree(root/name, out/name)
