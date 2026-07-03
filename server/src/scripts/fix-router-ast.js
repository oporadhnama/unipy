const { Project, SyntaxKind } = require('ts-morph');

const project = new Project({ tsConfigFilePath: './tsconfig.json' });
const sourceFile = project.getSourceFileOrThrow('src/services/router.ts');

// 1. Fix explicit return types of async functions that tsc complained about
const funcsToFix = [
  { name: 'getPenalty', type: 'Promise<number>' },
  { name: 'refreshStatsCache', type: 'Promise<void>' },
  { name: 'scoreChainEntry', type: 'Promise<ScoredEntry>' },
  { name: 'routeRequest', type: 'Promise<RouteResult>' },
  { name: 'getRoutingScores', type: 'Promise<{ strategy: RoutingStrategy; weights: RoutingWeights | null; scores: RoutingScore[] }>' },
  { name: 'hasEnabledVisionModel', type: 'Promise<boolean>' },
  { name: 'hasEnabledToolsModel', type: 'Promise<boolean>' },
];
for (const f of funcsToFix) {
  const func = sourceFile.getFunction(f.name);
  if (func) func.setReturnType(f.type);
}

// 2. Fix weightsFor missing async
const weightsFor = sourceFile.getFunction('weightsFor');
if (weightsFor) {
  weightsFor.setIsAsync(true);
  weightsFor.setReturnType('Promise<RoutingWeights | null>');
  weightsFor.getDescendantsOfKind(SyntaxKind.ReturnStatement).forEach(ret => {
    if (ret.getText().includes('getCustomWeights()')) {
      ret.replaceWithText(`return await getCustomWeights();`);
    }
  });
}

// 3. Fix un-awaited calls
sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration).forEach(decl => {
  const name = decl.getName();
  const init = decl.getInitializer();
  if (!init) return;

  if (name === 'weights' && init.getText().includes('weightsFor(strategy)')) {
    if (init.getKind() === SyntaxKind.CallExpression) {
      init.replaceWithText(`await weightsFor(strategy)`);
    } else if (init.getKind() === SyntaxKind.BinaryExpression) {
      init.replaceWithText(`(await weightsFor(strategy)) ?? BANDIT_PRESETS.balanced`);
    }
  }

  if (name === 'strategy' && init.getText().includes('getRoutingStrategy()')) {
    init.replaceWithText(`await getRoutingStrategy()`);
  }
  
  if (name === 'sortedChain' && init.getText().includes('orderChain')) {
    init.replaceWithText(`await orderChain(chain, strategy)`);
  }

  if (name === 'rl' && init.getText().includes('rateLimitFactor(getPenalty')) {
    init.replaceWithText(`rateLimitFactor(await getPenalty(entry.model_db_id))`);
  }
});

// 4. Fix orderChain map and Promise.all
const orderChain = sourceFile.getFunction('orderChain');
if (orderChain) {
  orderChain.setIsAsync(true);
  orderChain.setReturnType('Promise<ChainRow[]>');
  const body = orderChain.getBodyText();
  if (body) {
    let newBody = body.replace(
      /return chain\s*\.map\(e => \(\{ e, eff: e\.priority \+ getPenalty\(e\.model_db_id\) \}\)\)\s*\.sort\(\(a, b\) => a\.eff \- b\.eff \|\| a\.e\.priority \- b\.e\.priority\)\s*\.map\(x => x\.e\);/,
      `const effs = await Promise.all(chain.map(async e => ({ e, eff: e.priority + (await getPenalty(e.model_db_id)) })));
    return effs
      .sort((a, b) => a.eff - b.eff || a.e.priority - b.e.priority)
      .map(x => x.e);`
    );
    newBody = newBody.replace(
      /return chain\s*\.map\(e => \(\{ e, s: scoreChainEntry\(e, weights, intelMin, intelMax, true\)\.score \}\)\)\s*\/\/[^\n]*\n\s*\.sort\(\(a, b\) => b\.s \- a\.s \|\| a\.e\.priority \- b\.e\.priority\)\s*\.map\(x => x\.e\);/,
      `const scored = await Promise.all(chain.map(async e => ({ e, s: (await scoreChainEntry(e, weights, intelMin, intelMax, true)).score })));
  return scored
    // Higher score first; manual priority breaks ties so the chain still matters.
    .sort((a, b) => b.s - a.s || a.e.priority - b.e.priority)
    .map(x => x.e);`
    );
    orderChain.setBodyText(newBody);
  }
}

// 5. Fix getRoutingScores map and Promise.all
const getRoutingScores = sourceFile.getFunction('getRoutingScores');
if (getRoutingScores) {
  const body = getRoutingScores.getBodyText();
  if (body) {
    let newBody = body.replace(
      /const scores: RoutingScore\[\] = chain\.map\(async entry => \{[\s\S]*?\}\)\.sort\(\(a, b\) => b\.score \- a\.score\);/,
      `const unsortedScores = await Promise.all(chain.map(async entry => {
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
  const scores = unsortedScores.sort((a, b) => b.score - a.score);`
    );
    newBody = newBody.replace(
      /return \{ strategy, weights: weightsFor\(strategy\), scores \};/,
      `return { strategy, weights: await weightsFor(strategy), scores };`
    );
    getRoutingScores.setBodyText(newBody);
  }
}

// 6. Fix routeRequest getProvider and getRoutingStrategy and weightsFor
const routeRequest = sourceFile.getFunction('routeRequest');
if (routeRequest) {
  routeRequest.getDescendantsOfKind(SyntaxKind.VariableDeclaration).forEach(decl => {
    const name = decl.getName();
    if (name === 'provider') {
      const init = decl.getInitializer();
      if (init && init.getText().includes('getProvider')) {
        init.replaceWithText(`await getProvider(entry.platform as any)`);
      }
    }
  });
}

// 7. Fix Database import
const imports = sourceFile.getImportDeclarations();
for (const imp of imports) {
  if (imp.getModuleSpecifierValue() === 'better-sqlite3') {
    imp.remove();
  }
}

sourceFile.saveSync();
console.log('Fixed router.ts via AST js');
