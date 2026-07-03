import re

with open('src/services/router.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Fix missing return types
text = text.replace(
    'async function getPenalty(modelDbId: number): number {',
    'async function getPenalty(modelDbId: number): Promise<number> {'
)
text = text.replace(
    'export async function refreshStatsCache(db: Database, force = false): void {',
    'export async function refreshStatsCache(db: any, force = false): Promise<void> {'
)
text = text.replace(
    '): ScoredEntry {',
    '): Promise<ScoredEntry> {'
)
text = text.replace(
    '): RouteResult {',
    '): Promise<RouteResult> {'
)
text = text.replace(
    'export async function getRoutingScores(): { strategy: RoutingStrategy; weights: RoutingWeights | null; scores: RoutingScore[] } {',
    'export async function getRoutingScores(): Promise<{ strategy: RoutingStrategy; weights: RoutingWeights | null; scores: RoutingScore[] }> {'
)
text = text.replace(
    'export async function hasEnabledVisionModel(): boolean {',
    'export async function hasEnabledVisionModel(): Promise<boolean> {'
)
text = text.replace(
    'export async function hasEnabledToolsModel(): boolean {',
    'export async function hasEnabledToolsModel(): Promise<boolean> {'
)

# 2. Fix weightsFor missing async
text = text.replace(
    'function weightsFor(strategy: RoutingStrategy): RoutingWeights | null {',
    'async function weightsFor(strategy: RoutingStrategy): Promise<RoutingWeights | null> {'
)
text = text.replace(
    "if (strategy === 'custom') return getCustomWeights();",
    "if (strategy === 'custom') return await getCustomWeights();"
)

# 3. Fix unawaited calls
text = text.replace(
    'const weights = weightsFor(strategy);',
    'const weights = await weightsFor(strategy);'
)
text = text.replace(
    'const weights = weightsFor(strategy) ?? BANDIT_PRESETS.balanced;',
    'const weights = (await weightsFor(strategy)) ?? BANDIT_PRESETS.balanced;'
)
text = text.replace(
    'const strategy = getRoutingStrategy();',
    'const strategy = await getRoutingStrategy();'
)
text = text.replace(
    'const sortedChain = orderChain(chain, strategy);',
    'const sortedChain = await orderChain(chain, strategy);'
)
text = text.replace(
    'const rl = rateLimitFactor(getPenalty(entry.model_db_id));',
    'const rl = rateLimitFactor(await getPenalty(entry.model_db_id));'
)
text = text.replace(
    'return { strategy, weights: weightsFor(strategy), scores };',
    'return { strategy, weights: await weightsFor(strategy), scores };'
)

# 4. Fix orderChain
text = text.replace(
    'function orderChain(chain: ChainRow[], strategy: RoutingStrategy): ChainRow[] {',
    'async function orderChain(chain: ChainRow[], strategy: RoutingStrategy): Promise<ChainRow[]> {'
)
text = re.sub(
    r'return chain\s*\.map\(e => \(\{ e, eff: e\.priority \+ getPenalty\(e\.model_db_id\) \}\)\)\s*\.sort\(\(a, b\) => a\.eff \- b\.eff \|\| a\.e\.priority \- b\.e\.priority\)\s*\.map\(x => x\.e\);',
    '''const effs = await Promise.all(chain.map(async e => ({ e, eff: e.priority + (await getPenalty(e.model_db_id)) })));
    return effs
      .sort((a, b) => a.eff - b.eff || a.e.priority - b.e.priority)
      .map(x => x.e);''',
    text,
    flags=re.MULTILINE
)
text = re.sub(
    r'return chain\s*\.map\(e => \(\{ e, s: scoreChainEntry\(e, weights, intelMin, intelMax, true\)\.score \}\)\)\s*\/\/ Higher score first; manual priority breaks ties so the chain still matters\.\s*\.sort\(\(a, b\) => b\.s - a\.s \|\| a\.e\.priority - b\.e\.priority\)\s*\.map\(x => x\.e\);',
    '''const scored = await Promise.all(chain.map(async e => ({ e, s: (await scoreChainEntry(e, weights, intelMin, intelMax, true)).score })));
  return scored
    // Higher score first; manual priority breaks ties so the chain still matters.
    .sort((a, b) => b.s - a.s || a.e.priority - b.e.priority)
    .map(x => x.e);''',
    text,
    flags=re.MULTILINE
)

# 5. Fix getRoutingScores
text = re.sub(
    r'const scores: RoutingScore\[\] = chain\.map\(async entry => \{[\s\S]*?\}\)\.sort\(\(a, b\) => b\.score \- a\.score\);',
    '''const unsortedScores = await Promise.all(chain.map(async entry => {
    const scored = await scoreChainEntry(entry, weights, intelMin, intelMax, false);
    const stats = (await statsCache?.get(`${entry.platform}:${entry.model_id}`));
    return {
      modelDbId: entry.model_db_id,
      platform: entry.platform,
      modelId: entry.model_id,
      displayName: entry.display_name,
      enabled: entry.enabled === 1,
      reliability: scored.axes.reliability,
      speed: scored.axes.speed,
      intelligence: scored.axes.intelligence,
      headroom: scored.headroom,
      rateLimit: scored.rateLimit,
      score: scored.score,
      totalRequests: Math.round((stats?.successes ?? 0) + (stats?.failures ?? 0)),
    };
  }));
  const scores: RoutingScore[] = unsortedScores.sort((a, b) => b.score - a.score);''',
    text,
    flags=re.MULTILINE
)

# 6. Fix getProvider in routeRequest
text = text.replace(
    'const provider = getProvider(entry.platform as any);',
    'const provider = await getProvider(entry.platform as any);'
)

# 7. Remove better-sqlite3 import
text = re.sub(r"import type \{ Database \} from 'better-sqlite3';\n", '', text)

with open('src/services/router.ts', 'w', encoding='utf-8') as f:
    f.write(text)

print("Python regex replace done.")
