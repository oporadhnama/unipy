import os
import re

def rep(path, old, new):
    if not os.path.exists(path): return
    with open(path, 'r', encoding='utf-8') as f:
        t = f.read()
    t = t.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(t)

# 1. Database.Database
rep('src/db/model-pricing.ts', 'Database.Database', 'Database')
rep('src/lib/crypto.ts', 'Database.Database', 'Database')

# 2. Providers catch(e) -> catch(e: any)
for p in ['cloudflare', 'cohere', 'google', 'openai-compat']:
    rep(f'src/providers/{p}.ts', 'catch (e) {', 'catch (e: any) {')

# 3. proxy.ts
rep('src/routes/proxy.ts', 'const route = routeRequest(', 'const route = await routeRequest(')
with open('src/routes/proxy.ts', 'r', encoding='utf-8') as f:
    text = f.read()
text = re.sub(
    r'const calls: ChatToolCall\[\] = \(req\.body\.tools \?\? \[\]\)\.map\(async \(t: any, i: number\) => \(\{\n([^\n]+)\n([^\n]+)\n([^\n]+)\n(\s*)\}\)\);',
    r'const calls: ChatToolCall[] = await Promise.all((req.body.tools ?? []).map(async (t: any, i: number) => ({\n\1\n\2\n\3\n\4})));',
    text
)
with open('src/routes/proxy.ts', 'w', encoding='utf-8') as f:
    f.write(text)

# 4. responses.ts
rep('src/routes/responses.ts', 'const route = routeRequest(', 'const route = await routeRequest(')
with open('src/routes/responses.ts', 'r', encoding='utf-8') as f:
    text = f.read()
text = re.sub(
    r'const toolCalls = tools\.map\(async \(t: any, i: number\) => \(\{\n([^\n]+)\n([^\n]+)\n([^\n]+)\n(\s*)\}\)\);',
    r'const toolCalls = await Promise.all(tools.map(async (t: any, i: number) => ({\n\1\n\2\n\3\n\4})));',
    text
)
with open('src/routes/responses.ts', 'w', encoding='utf-8') as f:
    f.write(text)

# 5. routing-sim.ts
rep('src/scripts/routing-sim.ts', 'const route = routeRequest(', 'const route = await routeRequest(')
rep('src/scripts/routing-sim.ts', 'const { strategy, weights, scores } = getRoutingScores();', 'const { strategy, weights, scores } = await getRoutingScores();')

print("do_fix applied")
