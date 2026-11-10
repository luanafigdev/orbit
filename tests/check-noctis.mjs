import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = new URL('../noctis/', import.meta.url);
const context = vm.createContext({Date,Intl,Math});
for(const name of ['data.js','sky.js']) vm.runInContext(fs.readFileSync(new URL(name,root),'utf8'),context,{filename:name});
const {NoctisData,NoctisSky} = context;
const {stars,deep,locations} = NoctisData;

assert.ok(stars.length >= 35);
assert.equal(new Set(stars.map(s=>s.id)).size,stars.length);
for(const star of stars) {
  assert.ok(star.ra>=0 && star.ra<24 && star.dec>=-90 && star.dec<=90);
  assert.ok(Number.isFinite(star.mag) && star.distance>0);
}
assert.equal(deep.length,6);
assert.equal(Object.keys(locations).length,9);
assert.ok(Math.abs(NoctisSky.julianDay(new Date('2000-01-01T12:00:00Z'))-2451545)<1e-6);
assert.ok(NoctisSky.siderealDegrees(new Date('2026-11-10T00:00:00Z'),-38.5)>=0);
const date=new Date('2026-11-10T00:00:00Z');
const zenithRa=NoctisSky.siderealDegrees(date,0)/15;
const zenith=NoctisSky.altAz(zenithRa,0,0,0,date);
assert.ok(Math.abs(zenith.alt-90)<1e-5);
const opposite=NoctisSky.altAz((zenithRa+12)%24,0,0,0,date);
assert.ok(opposite.alt < -89.9999);
const western=NoctisSky.altAz((zenithRa+22)%24,0,0,0,date);
assert.ok(western.az>180 && western.az<360);
for(const city of Object.values(locations)){
  const value='2026-11-10T21:00';
  const utc=NoctisSky.zonedToUTC(value,city.tz);
  assert.ok(utc instanceof Date && !Number.isNaN(utc.valueOf()),`${city.name} falhou`);
  assert.equal(NoctisSky.zonedInput(utc,city.tz),value,`${city.name}: fuso incorreto`);
}
assert.equal(NoctisSky.zonedToUTC('2026-03-08T02:30','America/New_York'),null);
assert.equal(NoctisSky.wrap360(-40),320);
assert.equal(NoctisSky.planetPositions(date,locations.salvador).length,0);
for(const file of ['index.html','noctis.css','app.js','sky.js','data.js','orbit-link.js','orbit-link.css'])assert.ok(fs.existsSync(new URL(file,root)));
console.log('NOCTIS: catálogo, coordenadas, fusos, horizonte e arquivos básicos: OK');
