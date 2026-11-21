// Generates a typed TypeScript client (Kit-native) from the Anchor IDL.
// Usage: npm run codama   (after `anchor build`)
import { readFileSync } from 'node:fs';
import { createFromRoot } from 'codama';
import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { renderVisitor } from '@codama/renderers-js';

const idl = JSON.parse(readFileSync(new URL('../../target/idl/solana_vote.json', import.meta.url), 'utf8'));
const codama = createFromRoot(rootNodeFromAnchor(idl));
await codama.accept(renderVisitor(new URL('../src/generated', import.meta.url).pathname, { generatedFolder: '.', deleteFolderBeforeRendering: true, syncPackageJson: false }));
console.log('Client generated in app/src/generated');
