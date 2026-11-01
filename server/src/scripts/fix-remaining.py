import re
import os

files_to_fix = [
    'src/providers/cloudflare.ts',
    'src/providers/cohere.ts',
    'src/providers/google.ts',
    'src/providers/openai-compat.ts',
]

for path in files_to_fix:
    if not os.path.exists(path):
        continue
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    text = text.replace(
        'options?: CompletionOptions,\n  ): Promise<AsyncGenerator<ChatCompletionChunk>> {',
        'options?: CompletionOptions,\n  ): AsyncGenerator<ChatCompletionChunk> {'
    )
    text = text.replace(
        'catch (e) {',
        'catch (e: any) {'
    )
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

# 3. Fix proxy.ts
path = 'src/routes/proxy.ts'
if os.path.exists(path):
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    text = text.replace(
        'const rr = routeRequest(',
        'const rr = await routeRequest('
    )
    text = text.replace(
        'const rInfo = routeRequest(',
        'const rInfo = await routeRequest('
    )
    text = text.replace(
        'const route = routeRequest(',
        'const route = await routeRequest('
    )
    text = text.replace(
        'const rr = await await routeRequest(',
        'const rr = await routeRequest('
    )
    text = text.replace(
        'const route = await await routeRequest(',
        'const route = await routeRequest('
    )
    text = re.sub(
        r'const calls: ChatToolCall\[\] = \(await Promise\.all\(\(req\.body\.tools \?\? \[\]\)\.map\(async \(t: any, i: number\) => \(\{',
        r'''const calls: ChatToolCall[] = (req.body.tools ?? []).map((t: any, i: number) => ({''',
        text
    )
    text = re.sub(
        r'const calls: ChatToolCall\[\] = \(req\.body\.tools \?\? \[\]\)\.map\(async \(t: any, i: number\) => \(\{',
        r'''const calls: ChatToolCall[] = (req.body.tools ?? []).map((t: any, i: number) => ({''',
        text
    )
    text = re.sub(r'\}\)\);', r'}));', text)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

# 4. Fix responses.ts
path = 'src/routes/responses.ts'
if os.path.exists(path):
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    text = text.replace(
        'const route = routeRequest(',
        'const route = await routeRequest('
    )
    text = text.replace(
        'const route = await await routeRequest(',
        'const route = await routeRequest('
    )
    text = re.sub(
        r'const toolCalls = await Promise\.all\(tools\.map\(async \(t: any, i: number\) => \(\{',
        r'''const toolCalls = tools.map((t: any, i: number) => ({''',
        text
    )
    text = re.sub(
        r'const toolCalls = tools\.map\(async \(t: any, i: number\) => \(\{',
        r'''const toolCalls = tools.map((t: any, i: number) => ({''',
        text
    )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

# 5. Fix health.ts
path = 'src/services/health.ts'
if os.path.exists(path):
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    # health.ts(72,28): error TS2339: Property 'catch' does not exist on type 'void'.
    # This happens when a function now returns void instead of Promise, but we still .catch() it.
    # We should just remove the .catch() if it's returning void.
    # Wait, `refreshStatsCache(db)` returns Promise<void>! So we CAN catch it.
    # But wait, in `health.ts` we call it like `refreshStatsCache(db).catch(err => { ... })`
    # If it says .catch doesn't exist on `void`, that means `refreshStatsCache` is still typed as returning `void` in health.ts?
    # No, TS infers the type from the import. 
    # Ah! `import { refreshStatsCache } from './router.js'`
    # We fixed `router.ts` to return `Promise<void>`. Maybe health.ts has another function?
    # Let's fix `.catch(err =>` to `.catch((err: any) =>` first and see.
    text = text.replace(
        '.catch(err => {',
        '.catch((err: any) => {'
    )
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

# Remove unused imports for better-sqlite3 in index.ts and crypto.ts
for p in ['src/db/model-pricing.ts', 'src/lib/crypto.ts']:
    if os.path.exists(p):
        with open(p, 'r', encoding='utf-8') as f:
            t = f.read()
        t = re.sub(r"import type \{ Database \} from 'better-sqlite3';\n", '', t)
        with open(p, 'w', encoding='utf-8') as f:
            f.write(t)

print("Second round of Python fixes applied")
