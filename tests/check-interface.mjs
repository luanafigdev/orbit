import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const read = path => readFileSync(join(root, path), 'utf8');
const aeon = read('aeon/index.html');
const app = read('aeon/app.js');
const css = read('aeon/styles.css');

for (const [path, title] of [
  ['aeon/index.html', 'ÆON'],
  ['alunar/index.html', 'ALUNAR'],
  ['noctis/index.html', 'NOCTIS']
]) {
  const content = read(path);
  assert.ok(content.includes(title));
  assert.doesNotMatch(content, new RegExp(`${title}<span[^>]*>\\.</span>`));
}

assert.ok(read('js/app.js').includes('<h1 class="hero-title">ORBIT</h1>'));
assert.ok(read('aeon/orbit-link.js').includes('<h2 id="aeon-orbit-heading">ÆON</h2>'));
for (const id of ['constantStar', 'lateStar', 'dockPeek', 'contemplationCopy', 'contemplationEraCue']) {
  assert.ok(aeon.includes(`id="${id}"`));
}
assert.ok(app.includes("find('lateStar').hidden=state.intro||index!==4"));
assert.ok(app.includes('setDockExpanded(false)'));
assert.ok(app.includes('showContemplationCue(true)'));
assert.ok(css.includes('.control-dock.contemplating.dock-open'));
assert.ok(css.includes('.late-star-spark'));
assert.ok(aeon.includes('Há uma beleza agridoce em receber a luz'));
assert.ok(aeon.includes('Talvez o infinito não seja aquilo que nunca termina'));

console.log('Interfaces: títulos, contemplação e estrelas conferidos.');
