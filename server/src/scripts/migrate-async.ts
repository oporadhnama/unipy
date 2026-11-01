import { Project, SyntaxKind, Node } from 'ts-morph';
import path from 'path';

const project = new Project({
  tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
});

const sourceFiles = project.getSourceFiles('src/**/*.ts');

function ensureAsync(node: Node) {
  let parent = node.getParent();
  while (parent) {
    if (
      Node.isFunctionDeclaration(parent) ||
      Node.isMethodDeclaration(parent) ||
      Node.isArrowFunction(parent) ||
      Node.isFunctionExpression(parent)
    ) {
      if (!parent.isAsync()) {
        parent.setIsAsync(true);
      }
      return;
    }
    parent = parent.getParent();
  }
}

let changed = false;

for (const sourceFile of sourceFiles) {
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  let fileChanged = false;

  for (let i = callExpressions.length - 1; i >= 0; i--) {
    const callExpr = callExpressions[i];
    const expression = callExpr.getExpression();
    if (Node.isPropertyAccessExpression(expression)) {
      const name = expression.getName();
      const left = expression.getExpression();
      
      // Ignore Promise.all
      if (name === 'all' && left.getText() === 'Promise') {
        continue;
      }

      if (['run', 'get', 'all', 'exec'].includes(name)) {
        const parent = callExpr.getParent();
        if (!Node.isAwaitExpression(parent)) {
          ensureAsync(callExpr);
          callExpr.replaceWithText(`(await ${callExpr.getText()})`);
          fileChanged = true;
          continue;
        }
      }
    }
  }

  if (fileChanged) {
    console.log(`Modified ${sourceFile.getFilePath()}`);
    sourceFile.saveSync();
    changed = true;
  }
}

if (!changed) {
  console.log('No files modified.');
}
