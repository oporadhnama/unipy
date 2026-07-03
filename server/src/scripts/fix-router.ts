import fs from 'fs';

let content = fs.readFileSync('src/services/router.ts', 'utf-8');

content = content.replace(
  `function weightsFor(strategy: RoutingStrategy): RoutingWeights | null {`,
  `async function weightsFor(strategy: RoutingStrategy): Promise<RoutingWeights | null> {`
);

content = content.replace(
  `if (strategy === 'custom') return getCustomWeights();`,
  `if (strategy === 'custom') return await getCustomWeights();`
);

content = content.replace(
  `function orderChain(chain: ChainRow[], strategy: RoutingStrategy): ChainRow[] {`,
  `async function orderChain(chain: ChainRow[], strategy: RoutingStrategy): Promise<ChainRow[]> {`
);

content = content.replace(
  `  const weights = weightsFor(strategy);`,
  `  const weights = await weightsFor(strategy);`
);

content = content.replace(
  `    return chain
      .map(e => ({ e, eff: e.priority + getPenalty(e.model_db_id) }))
      .sort((a, b) => a.eff - b.eff || a.e.priority - b.e.priority)
      .map(x => x.e);`,
  `    const effs = await Promise.all(chain.map(async e => ({ e, eff: e.priority + (await getPenalty(e.model_db_id)) })));
    return effs
      .sort((a, b) => a.eff - b.eff || a.e.priority - b.e.priority)
      .map(x => x.e);`
);

content = content.replace(
  `  return chain
    .map(e => ({ e, s: scoreChainEntry(e, weights, intelMin, intelMax, true).score }))
    // Higher score first; manual priority breaks ties so the chain still matters.
    .sort((a, b) => b.s - a.s || a.e.priority - b.e.priority)
    .map(x => x.e);`,
  `  const scored = await Promise.all(chain.map(async e => ({ e, s: (await scoreChainEntry(e, weights, intelMin, intelMax, true)).score })));
  return scored
    // Higher score first; manual priority breaks ties so the chain still matters.
    .sort((a, b) => b.s - a.s || a.e.priority - b.e.priority)
    .map(x => x.e);`
);

content = content.replace(
  `const strategy = getRoutingStrategy();`,
  `const strategy = await getRoutingStrategy();`
);
content = content.replace(
  `const strategy = getRoutingStrategy();`,
  `const strategy = await getRoutingStrategy();`
);

content = content.replace(
  `const sortedChain = orderChain(chain, strategy);`,
  `const sortedChain = await orderChain(chain, strategy);`
);

content = content.replace(
  `const weights = weightsFor(strategy) ?? BANDIT_PRESETS.balanced;`,
  `const weights = (await weightsFor(strategy)) ?? BANDIT_PRESETS.balanced;`
);

content = content.replace(
  `  const scores: RoutingScore[] = chain.map(async entry => {
    const scored = scoreChainEntry(entry, weights, intelMin, intelMax, false);
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
  }).sort((a, b) => b.score - a.score);`,
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

content = content.replace(
  `return { strategy, weights: weightsFor(strategy), scores };`,
  `return { strategy, weights: await weightsFor(strategy), scores };`
);

fs.writeFileSync('src/services/router.ts', content);
console.log('Fixed router.ts');
