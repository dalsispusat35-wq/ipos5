import Db from '../config/DbConnection.js';
import KantorWilayah from '../services/KantorWilayahService.js';

async function main() {
  const profile = Db.loadConnections()[0];
  await Db.connect(profile);

  for (const code of ['32.04.46', '32.04.46.2001']) {
    console.log(`\nTesting fetch for ${code}...`);
    const res = await fetch(`https://wilayah.cahyadsn.com/apps/inc/geo_ajax.php?id=${encodeURIComponent(code)}&geo=1`);
    const json = await res.json();
    console.log('Response:', {
      status: json.status,
      kode: json.data?.kode,
      nama: json.data?.nama,
      lat: json.data?.lat,
      lng: json.data?.lng,
      pathLength: json.data?.path?.length
    });

    const raw = JSON.parse(json.data.path);
    let rings = raw;
    if (!Array.isArray(rings[0][0])) {
      rings = [rings];
    }
    const coords = rings.map(ring => ring.map(([lat, lng]) => [Number(lng), Number(lat)]));
    console.log(`Converted to GeoJSON MultiPolygon with ${coords[0].length} points.`);
  }

  await Db.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
