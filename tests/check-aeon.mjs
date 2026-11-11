import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const source = (name) => readFileSync(join(root, name), 'utf8');
for(const file of ['aeon/app.js','aeon/data.js','aeon/universe.js','aeon/orbit-link.js']) {
  execFileSync(process.execPath, ['--check', join(root,file)],{stdio:'pipe'});
}
const html=source('aeon/index.html');
for(const id of [
  'cosmos','constantStar','intro','experience','contemplation','controlDock',
  'timeRange','contemplateToggle','lateModal','starModal','helpModal','referenceLinks'
]) {
  assert.ok(html.includes(`id="${id}"`),`Elemento ausente: ${id}`);
}
const data=source('aeon/data.js');
assert.equal((data.match(/index: '\d\d'/g)||[]).length,6);
assert.ok(data.includes('Hidrogênio')&&data.includes('Carbono'));
assert.ok(html.includes('Há uma beleza agridoce em receber a luz'));
assert.ok(html.includes('Talvez o infinito não seja aquilo que nunca termina'));
assert.ok(existsSync(join(root,'aeon/assets/spiral.webp')));
assert.ok(source('aeon/orbit-link.js').includes('data-aeon-link'));
assert.ok(source('index.html').includes('src="aeon/orbit-link.js"'));
for (const p of ['alunar/index.html','noctis/index.html','js/app.js']) assert.ok(existsSync(join(root,p)));
console.log('ÆON: estrutura, texto e sintaxe verificados.');
