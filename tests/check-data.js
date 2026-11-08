/* Testes básicos sem bibliotecas: node tests/check-data.js */
const assert=require('node:assert/strict');
global.window={};require('../js/data.js');
const {planetas,curiosidades,missoes,linhaTempo,fontes}=window.ORBIT_DATA;
assert.equal(planetas.length,8,'Oito planetas');
assert.equal(curiosidades.length,24,'24 curiosidades');
assert.equal(missoes.length,10,'10 missões');
assert.equal(linhaTempo.length,14,'14 eventos históricos');
assert.equal(new Set(planetas.map(p=>p.id)).size,8,'IDs de planetas únicos');
assert.equal(new Set(curiosidades.map(f=>f.id)).size,24,'IDs de curiosidades únicos');
assert.equal(new Set(missoes.map(m=>m.id)).size,10,'IDs de missões únicos');
assert.ok(planetas.some(p=>p.id==='saturno'));
for(const p of planetas){
  assert.ok(p.diametro>0&&p.ano>0&&p.distancia>0,'Valores numéricos positivos');
  assert.ok(p.fatos.length===3,'3 fatos por planeta');
  assert.ok(/^https:\/\//.test(p.fonte),'Fonte do planeta');
}
for(const c of curiosidades)assert.ok(planetas.some(p=>p.id===c.planeta),'Curiosidade aponta a um planeta válido');
for(const m of missoes)assert.ok(m.ano>1950&&m.ano<2100 && /^https:\/\//.test(m.fonte),'Dados de missão válidos');
assert.ok(fontes.length>=3,'Fontes externas documentadas');
console.log('✔ ORBIT: 8 planetas, 24 curiosidades, 10 missões, 14 marcos e referências validados.');
