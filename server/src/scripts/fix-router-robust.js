const fs = require('fs');

let content = fs.readFileSync('src/services/router.ts', 'utf-8');

// 1. Fix getPenalty return type
content = content.replace(
  /async function getPenalty\(modelDbId: number\): number \{/g,
  'async function getPenalty(modelDbId: number): Promise<number> {'
);

// 2. Fix refreshStatsCache db type and return type
content = content.replace(
  /export async function refreshStatsCache\(db: Database, force = false\): void \{/g,
  'export async function refreshStatsCache(db: any, force = false): Promise<void> {'
);

// 3. Fix scoreChainEntry return type
content = content.replace(
  /\): ScoredEntry \{/g,
  '): Promise<ScoredEntry> {'
);

// 4. Fix routeRequest return type
content = content.replace(
  /: RouteResult \{/g,
  ': Promise<RouteResult> {'
);

// 5. Fix getRoutingScores return type
content = content.replace(
  /export async function getRoutingScores\(\): \{ strategy: RoutingStrategy; weights: RoutingWeights \| null; scores: RoutingScore\[\] \} \{/g,
  'export async function getRoutingScores(): Promise<{ strategy: RoutingStrategy; weights: RoutingWeights | null; scores: RoutingScore[] }> {'
);

// 6. Fix hasEnabledVisionModel return type
content = content.replace(
  /export async function hasEnabledVisionModel\(\): boolean \{/g,
  'export async function hasEnabledVisionModel(): Promise<boolean> {'
);

// 7. Fix hasEnabledToolsModel return type
content = content.replace(
  /export async function hasEnabledToolsModel\(\): boolean \{/g,
  'export async function hasEnabledToolsModel(): Promise<boolean> {'
);

// 8. Fix weightsFor missing async
content = content.replace(
  /function weightsFor\(strategy: RoutingStrategy\): RoutingWeights \| null \{/g,
  'async function weightsFor(strategy: RoutingStrategy): Promise<RoutingWeights | null> {'
);
content = content.replace(
  /if \(strategy === 'custom'\) return getCustomWeights\(\);/g,
  "if (strategy === 'custom') return await getCustomWeights();"
);
content = content.replace(
  /const weights = weightsFor\(strategy\);/g,
  "const weights = await weightsFor(strategy);"
);
content = content.replace(
  /const weights = weightsFor\(strategy\) \?\? BANDIT_PRESETS\.balanced;/g,
  "const weights = (await weightsFor(strategy)) ?? BANDIT_PRESETS.balanced;"
);
content = content.replace(
  /return \{ strategy, weights: weightsFor\(strategy\), scores \};/g,
  "return { strategy, weights: await weightsFor(strategy), scores };"
);

// 9. Fix rateLimitFactor
content = content.replace(
  /const rl = rateLimitFactor\(getPenalty\(entry\.model_db_id\)\);/g,
  "const rl = rateLimitFactor(await getPenalty(entry.model_db_id));"
);

// 10. Fix orderChain map and Promise.all
content = content.replace(
  /function orderChain\(chain: ChainRow\[\], strategy: RoutingStrategy\): ChainRow\[\] \{/g,
  "async function orderChain(chain: ChainRow[], strategy: RoutingStrategy): Promise<ChainRow[]> {"
);
content = content.replace(
  /    return chain\n      \.map\(e => \(\{ e, eff: e\.priority \+ getPenalty\(e\.model_db_id\) \}\)\)\n      \.sort\(\(a, b\) => a\.eff - b\.eff \|\| a\.e\.priority - b\.e\.priority\)\n      \.map\(x => x\.e\);/g,
  `    const effs = await Promise.all(chain.map(async e => ({ e, eff: e.priority + (await getPenalty(e.model_db_id)) })));
    return effs
      .sort((a, b) => a.eff - b.eff || a.e.priority - b.e.priority)
      .map(x => x.e);`
);
content = content.replace(
  /  return chain\n    \.map\(e => \(\{ e, s: scoreChainEntry\(e, weights, intelMin, intelMax, true\)\.score \}\)\)\n    \/\/ Higher score first; manual priority breaks ties so the chain still matters\.\n    \.sort\(\(a, b\) => b\.s - a\.s \|\| a\.e\.priority - b\.e\.priority\)\n    \.map\(x => x\.e\);/g,
  `  const scored = await Promise.all(chain.map(async e => ({ e, s: (await scoreChainEntry(e, weights, intelMin, intelMax, true)).score })));
  return scored
    // Higher score first; manual priority breaks ties so the chain still matters.
    .sort((a, b) => b.s - a.s || a.e.priority - b.e.priority)
    .map(x => x.e);`
);

// 11. Fix getRoutingStrategy
content = content.replace(
  /const strategy = getRoutingStrategy\(\);/g,
  "const strategy = await getRoutingStrategy();"
);

// 12. Fix orderChain call
content = content.replace(
  /const sortedChain = orderChain\(chain, strategy\);/g,
  "const sortedChain = await orderChain(chain, strategy);"
);

// 13. Fix getRoutingScores Promise.all
content = content.replace(
  /  const scores: RoutingScore\[\] = chain\.map\(async entry => \{\n    const scored = scoreChainEntry\(entry, weights, intelMin, intelMax, false\);\n    const stats = \(await statsCache\?\.get\(`\$\{entry\.platform\}:\$\{entry\.model_id\}`\)\);\n    return \{\n      modelDbId: entry\.model_db_id,\n      platform: entry\.platform,\n      modelId: entry\.model_id,\n      displayName: entry\.display_name,\n      enabled: entry\.enabled === 1,\n      reliability: scored\.axes\.reliability,\n      speed: scored\.axes\.speed,\n      intelligence: scored\.axes\.intelligence,\n      headroom: scored\.headroom,\n      rateLimit: scored\.rateLimit,\n      score: scored\.score,\n      totalRequests: Math\.round\(\(stats\?\.successes \?\? 0\) \+ \(stats\?\.failures \?\? 0\)\),\n    \};\n  \}\)\.sort\(\(a, b\) => b\.score - a\.score\);/g,
  `  const unsortedScores = await Promise.all(chain.map(async entry => {
    const scored = await scoreChainEntry(entry, weights, intelMin, intelMax, false);
    const stats = (await statsCache?.get(\`\${entry.platform}:\${entry.model_id}\`));
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
  const scores: RoutingScore[] = unsortedScores.sort((a, b) => b.score - a.score);`
);

// 14. Fix better-sqlite3 Database import
content = content.replace(
  /import type \{ Database \} from 'better-sqlite3';\n/g,
  ''
);

// 15. Wait getProvider 
content = content.replace(
  /const provider = getProvider\(entry\.platform as any\);/g,
  'const provider = await getProvider(entry.platform as any);'
);

fs.writeFileSync('src/services/router.ts', content);
console.log('Fixed router.ts with robust js script!');
