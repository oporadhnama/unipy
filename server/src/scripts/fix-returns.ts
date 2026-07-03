import { Project, SyntaxKind, Node } from 'ts-morph';
import path from 'path';

const project = new Project({
  tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
});

const sourceFiles = project.getSourceFiles('src/**/*.ts');
let changed = false;

for (const sourceFile of sourceFiles) {
  let fileChanged = false;
  
  const funcs = [
    ...sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.FunctionExpression)
  ];

  for (const func of funcs) {
    if (func.isAsync()) {
      const rtNode = func.getReturnTypeNode();
      if (rtNode) {
        const text = rtNode.getText();
        if (!text.startsWith('Promise<') && text !== 'Promise') {
          func.setReturnType(`Promise<${text}>`);
          fileChanged = true;
        }
      }
    }
  }

  if (fileChanged) {
    console.log(`Fixed returns in ${sourceFile.getFilePath()}`);
    sourceFile.saveSync();
    changed = true;
  }
}
