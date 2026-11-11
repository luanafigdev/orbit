import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const entries = [
  ['aeon', 'const url=', 'aeon/orbit-link.js'],
  ['alunar', 'const DESTINATION =', 'alunar/orbit-link.js'],
  ['noctis', 'const destination =', 'noctis/orbit-link.js'],
];
for (const [name, assignment, file] of entries) {
  const source = readFileSync(join(root, file), 'utf8');
  const assignmentLine = source.split('\n').find(line => line.includes(assignment));
  assert.ok(assignmentLine, `${name}: link não encontrado`);
  const destination = assignmentLine.split(assignment)[1].trim().replace(/;$/, '').replaceAll(' ', '');
  assert.equal(destination, `'${name}/'`);
  for (const port of [5176, 58201]) {
    const base = `http://127.0.0.1:${port}/`;
    assert.equal(new URL(`${name}/`, base).href, `${base}${name}/`);
  }
  assert.equal(new URL(`${name}/`, 'https://example.netlify.app/').href, `https://example.netlify.app/${name}/`);
  console.log(`${name.toUpperCase()}: caminho relativo, porta automática e Netlify OK`);
}
for (const sub of ['aeon','alunar','noctis']) {
  const source = readFileSync(join(root,sub,'index.html'),'utf8');
  assert.ok(source.includes('href="../"'), `${sub}: link de retorno ausente`);
}
const html = readFileSync(join(root, 'index.html'),'utf8');
assert.ok(html.includes("location.protocol === 'file:'"));
assert.ok(html.includes('ABRIR_ORBIT.bat'));
console.log('Aviso para abertura por arquivo e retornos: OK');
