"""Copy only the public site's reviewed files. Never publish legacy admin/backend files."""
from pathlib import Path
import shutil
import subprocess
root = Path(__file__).resolve().parent
out = root / 'public'
if out.exists(): shutil.rmtree(out)
out.mkdir()
for name in ('index.html', 'gallery.html', 'thank-you.html', 'script.js', 'gallery.js', 'auth-redirect.js', 'styles.css'):
    shutil.copy2(root/name, out/name)
shutil.copytree(root/'admin', out/'admin', ignore=shutil.ignore_patterns('*.src.js'))
subprocess.run(['./node_modules/.bin/esbuild','admin/admin.src.js','--bundle','--minify','--platform=browser','--format=esm','--outfile=public/admin/admin.js'], cwd=root,check=True,stdout=subprocess.DEVNULL)
for name in ('images', 'transparentdb'):
    shutil.copytree(root/name, out/name, ignore=shutil.ignore_patterns('contacts.json') if name == 'transparentdb' else None)
