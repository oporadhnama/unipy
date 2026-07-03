import re
import os

def fix_file(path, regexes):
    if not os.path.exists(path): return
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    for patt, repl in regexes:
        text = re.sub(patt, repl, text)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

fix_file('src/db/index.ts', [
    (r'Database\.Database', 'PgDatabase')
])

for p in ['src/db/model-pricing.ts', 'src/lib/crypto.ts']:
    fix_file(p, [
        (r"import.*better-sqlite3.*;\n?", "")
    ])

fix_file('src/index.ts', [
    (r'const app = createApp\(\);', 'const app = await createApp();')
])

fix_file('src/services/health.ts', [
    (r"validateKey'\s*does\s*not\s*exist\s*on\s*type\s*'Promise", ""), # just a note
    (r'const provider = \(await getProvider\(k\.platform\)\);', 'const provider = await getProvider(k.platform as any);'),
    (r'const provider = await getProvider\(k\.platform\);', 'const provider = await getProvider(k.platform as any);'),
    (r'if \(!provider || !provider\.validateKey\)', 'if (!provider || !(await provider.validateKey(decrypted)))'), # wait let's look at health.ts manually
])

print("Fixed Database namespaces")
