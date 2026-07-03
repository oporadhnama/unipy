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

# Fix Database.Database
fix_file('src/db/model-pricing.ts', [
    (r'Database\.Database', 'Database')
])
fix_file('src/lib/crypto.ts', [
    (r'Database\.Database', 'Database')
])

# Providers - fix `catch (e) {` to `catch (e: any) {`
for p in ['cloudflare', 'cohere', 'google', 'openai-compat']:
    fix_file(f'src/providers/{p}.ts', [
        (r'catch \(e\) \{', r'catch (e: any) {')
    ])

# Proxy.ts
fix_file('src/routes/proxy.ts', [
    (r'const route = routeRequest\(', r'const route = await routeRequest('),
    (r'const calls: ChatToolCall\[\] = \(req\.body\.tools \?\? \[\]\)\.map\(async \(t: any, i: number\) => \(\{',
     r'''const calls: ChatToolCall[] = await Promise.all((req.body.tools ?? []).map(async (t: any, i: number) => ({'''),
    (r'\}\)\);', r'})));'),
])
# Because replacing `}));` to `})));` might hit multiple places, I'll just do a precise replace for proxy.ts tool calls.
with open('src/routes/proxy.ts', 'r', encoding='utf-8') as f:
    text = f.read()
text = re.sub(
    r'const calls: ChatToolCall\[\] = \(req\.body\.tools \?\? \[\]\)\.map\(async \(t: any, i: number\) => \(\{\n([^\n]+)\n([^\n]+)\n([^\n]+)\n(\s*)\}\)\);',
    r'const calls: ChatToolCall[] = await Promise.all((req.body.tools ?? []).map(async (t: any, i: number) => ({\n\1\n\2\n\3\n\4})));',
    text
)
with open('src/routes/proxy.ts', 'w', encoding='utf-8') as f:
    f.write(text)

# Responses.ts
fix_file('src/routes/responses.ts', [
    (r'const route = routeRequest\(', r'const route = await routeRequest('),
])
with open('src/routes/responses.ts', 'r', encoding='utf-8') as f:
    text = f.read()
text = re.sub(
    r'const toolCalls = tools\.map\(async \(t: any, i: number\) => \(\{\n([^\n]+)\n([^\n]+)\n([^\n]+)\n(\s*)\}\)\);',
    r'const toolCalls = await Promise.all(tools.map(async (t: any, i: number) => ({\n\1\n\2\n\3\n\4})));',
    text
)
with open('src/routes/responses.ts', 'w', encoding='utf-8') as f:
    f.write(text)

# Routing-sim.ts
fix_file('src/scripts/routing-sim.ts', [
    (r'const route = routeRequest\(', r'const route = await routeRequest('),
    (r'const \{ strategy, weights, scores \} = getRoutingScores\(\);', r'const { strategy, weights, scores } = await getRoutingScores();')
])

print("Fix final applied")
