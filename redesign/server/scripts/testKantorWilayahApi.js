import assert from 'node:assert/strict';

const base = process.env.KANTOR_TEST_API || 'http://127.0.0.1:5002/api/kantor';
async function get(path) {
  const response = await fetch(base + path);
  const body = await response.json();
  assert.equal(response.status, 200, `${path}: ${body.message}`);
  assert.equal(body.success, true);
  return body;
}
const root = await get('/wilayah');
assert.deepEqual(root.counts, [38, 514, 7285, 83762]);
assert.equal(root.data.length, 38);
const banten = await get('/wilayah?parent=36');
assert.equal(banten.data.length, 8);
assert.ok(banten.data.every(item => item.kode.startsWith('36.')));
const tangsel = await get('/wilayah?parent=36.74');
assert.equal(tangsel.data.length, 7);
const ciputat = await get('/wilayah?parent=36.74.05');
assert.equal(ciputat.data.length, 6);
assert.equal(ciputat.data.find(item => item.nama === 'Cempaka Putih')?.kode, '36.74.05.1001');
const scene = await get('/wilayah/map?kode=36');
assert.equal(scene.data.features.length, 9);
const villageScene = await get('/wilayah/map?kode=36.74.05.1001');
assert.equal(villageScene.data.selected.kode, '36.74.05.1001');
assert.equal(villageScene.data.boundaryAvailable, false);
assert.equal(villageScene.data.boundaryCode, '36.74');
const overlap = await get('/wilayah/reverse?lat=-6.321567965040671&lng=106.70774205743535');
assert.equal(overlap.data.kode, null);
assert.ok(overlap.data.matches.some(item => item.kode === '36.74'));
const outside = await get('/wilayah/reverse?lat=0&lng=0');
assert.equal(outside.data, null);
const offices = await get('?search=40000&limit=100');
assert.ok(offices.data.some(office => office.nopend === '40000'));
const filtered = await get('?wilayahKode=32.73.19.1001&limit=100');
assert.ok(filtered.data.length > 0);
assert.ok(filtered.data.every(office => office.wilayah.kode === '32.73.19.1001'));
console.log('LIVE MongoDB API PASS: counts, cascade, map, overlap handling, NOPEND search, office region filter.');
