import assert from 'node:assert/strict';
import fs from 'node:fs';
import service from '../services/KantorWilayahService.js';
import { createWilayahIndex } from '../services/KantorWilayahIndex.js';
import { fromSourceGeometry, containsPoint } from '../services/KantorWilayahGeometry.js';
const rows = JSON.parse(fs.readFileSync(new URL('../data/kantor-wilayah/wilayah.json', import.meta.url)));
const wilayah = createWilayahIndex(rows.map(([kode, nama]) => ({ kode, nama })));
const originalGetIndex = service.getIndex;
service.getIndex = async () => wilayah;
import KantorController from '../controllers/KantorController.js';
import DbConnection from '../config/DbConnection.js';

const child = (parent, name) => (wilayah.children.get(parent) || []).find(item => item.nama === name);
const banten = child(null, 'Banten');
assert.equal(banten?.kode, '36');
assert.ok((wilayah.children.get('36') || []).every(item => item.kode.startsWith('36.')));

const tangsel = child('36', 'Kota Tangerang Selatan');
assert.equal(tangsel?.kode, '36.74');
assert.ok((wilayah.children.get(tangsel.kode) || []).every(item => item.kode.startsWith('36.74.')));

const ciputatTimur = child('36.74', 'Ciputat Timur');
assert.equal(ciputatTimur?.kode, '36.74.05');
assert.ok((wilayah.children.get(ciputatTimur.kode) || []).every(item => item.kode.startsWith('36.74.05.')));

const cempakaPutih = child('36.74.05', 'Cempaka Putih');
assert.equal(cempakaPutih?.kode, '36.74.05.1001');
const office = { nopend: 'TEST-NOPEND', provinsi: 'Banten', kabupaten_kota: 'Kota Tangerang Selatan',
  kecamatan: 'Ciputat Timur', kelurahan: 'Cempaka Putih' };
const mapped = wilayah.resolveOffice(office);
assert.equal(mapped.kode, cempakaPutih.kode);
assert.ok(wilayah.isInside(mapped.kode, '36.74.05'));
assert.ok(wilayah.searchRegion(mapped, '36.74.05.1001'));
assert.equal(wilayah.resolveOffice({ nopend: 'TEST-UNMAPPED' }).status, 'Belum Terpetakan');
assert.equal(wilayah.resolveOffice({ provinsi: 'JAWA BARAT', kabupaten: 'KOTA BANDUNG',
  kecamatan: 'SUMUR BANDUNG', kelurahan: 'BRAGA' }).kode, '32.73.19.1001');
const single = fromSourceGeometry({ rings: [[0, 0], [0, 2], [2, 2], [2, 0]] });
assert.ok(containsPoint(single.geometry, 1, 1));
assert.equal(containsPoint(single.geometry, 3, 3), false);
const multipart = fromSourceGeometry({ rings: [[[0, 0], [0, 2], [2, 2], [2, 0]], [[5, 5], [5, 7], [7, 7], [7, 5]]] });
assert.ok(containsPoint(multipart.geometry, 6, 6));
assert.equal(containsPoint(multipart.geometry, 4, 4), false);
const originalGetDb = DbConnection.getDb;
const sampleOffices = [office, { nopend: 'OTHER-NOPEND', provinsi: 'Jawa Barat', kabupaten_kota: 'Kota Bandung' }];
DbConnection.getDb = async () => ({ collection: () => ({
  countDocuments: async () => sampleOffices.length,
  find: () => ({ sort: () => ({ toArray: async () => sampleOffices,
    skip: skip => ({ limit: limit => ({ toArray: async () => sampleOffices.slice(skip, skip + limit) }) }) }) })
}) });
async function runOfficeQuery(query) {
  let body;
  await KantorController.getAll({ query }, { json: value => { body = value; } });
  return body;
}
try {
  const byNopend = await runOfficeQuery({ search: 'TEST-NOPEND', page: 1, limit: 10 });
  assert.deepEqual(byNopend.data.map(item => item.nopend), ['TEST-NOPEND']);
  const byRegion = await runOfficeQuery({ wilayahKode: '36.74.05', page: 1, limit: 10 });
  assert.deepEqual(byRegion.data.map(item => item.nopend), ['TEST-NOPEND']);
  assert.equal(byRegion.data[0].wilayah.desaKelurahan.kode, cempakaPutih.kode);
  const page = await runOfficeQuery({ page: 2, limit: 1 });
  assert.deepEqual(page.data.map(item => item.nopend), ['OTHER-NOPEND']);
} finally {
  DbConnection.getDb = originalGetDb;
  service.getIndex = originalGetIndex;
}
console.log('Kantor wilayah hierarchy, conservative mapping, search, filter, and level 2 map: PASS');
