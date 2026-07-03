import { Project, SyntaxKind, Node, TypeFormatFlags } from 'ts-morph';
import path from 'path';
const project = new Project({
    tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
});
const sourceFiles = project.getSourceFiles('src/**/*.ts');
let changed = false;
function ensureAsync(node) {
    let parent = node.getParent();
    while (parent) {
        if (Node.isFunctionDeclaration(parent) ||
            Node.isMethodDeclaration(parent) ||
            Node.isArrowFunction(parent) ||
            Node.isFunctionExpression(parent)) {
            if (!parent.isAsync()) {
                parent.setIsAsync(true);
                const rtNode = parent.getReturnTypeNode();
                if (rtNode) {
                    const text = rtNode.getText();
                    if (!text.startsWith('Promise<') && text !== 'Promise') {
                        parent.setReturnType(`Promise<${text}>`);
                    }
                }
            }
            return;
        }
        parent = parent.getParent();
    }
}
// Find all CallExpressions returning a Promise that are NOT awaited
for (const sourceFile of sourceFiles) {
    let fileChanged = false;
    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    for (let i = calls.length - 1; i >= 0; i--) {
        const call = calls[i];
        // Skip if already awaited
        const parent = call.getParent();
        if (Node.isAwaitExpression(parent))
            continue;
        // Skip if it's not returning a Promise.
        const returnType = call.getReturnType();
        const typeText = returnType.getText(call, TypeFormatFlags.NoTruncation);
        // Check if the type is a Promise
        if (typeText.startsWith('Promise<') || typeText === 'Promise' ||
            // sometimes typeText is like `Promise<...>` or `import("...").Promise<...>`
            typeText.includes('.Promise<') ||
            returnType.getSymbol()?.getName() === 'Promise') {
            // We found an unawaited promise! Wait, some Promises are INTENTIONALLY unawaited 
            // (like floating promises or returned directly).
            // If it's being returned directly (e.g. `return foo()`), `await` is not strictly necessary 
            // but adding it doesn't hurt and makes stack traces better.
            // But if it's a floating promise (e.g. tracking analytics), we might break it? No, we want it awaited.
            ensureAsync(call);
            call.replaceWithText(`(await ${call.getText()})`);
            fileChanged = true;
        }
    }
    if (fileChanged) {
        console.log(`Propagated await in ${sourceFile.getFilePath()}`);
        sourceFile.saveSync();
        changed = true;
    }
}
if (!changed) {
    console.log('No files modified.');
}
