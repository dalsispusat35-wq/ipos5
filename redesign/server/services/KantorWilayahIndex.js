// Pure hierarchy index shared by MongoDB service and validation tests.
export function createWilayahIndex(rows) {
  const byCode = new Map();
  const children = new Map();
  const nameIndex = new Map();
  const kabLookup = new Map();
  const counts = [0, 0, 0, 0];
  const key = (value) => String(value || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toUpperCase();

  for (const { kode, nama } of rows) {
    const level = kode.split('.').length;
    const parent = kode.includes('.') ? kode.slice(0, kode.lastIndexOf('.')) : null;
    const node = { kode, nama, level, parent };
    byCode.set(kode, node);
    counts[level - 1]++;
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push({ kode, nama });
    const indexKey = `${parent || ''}|${key(nama)}`;
    if (!nameIndex.has(indexKey)) nameIndex.set(indexKey, []);
    nameIndex.get(indexKey).push(node);

    if (level === 2) {
      const upper = key(nama);
      kabLookup.set(upper, node);
      const isKota = upper.startsWith('KOTA ');
      const stripped = upper.replace(/^(KABUPATEN|KOTA)\s+/, '').trim();
      // For twin names (like Bandung, Bogor, Bekasi, Cirebon), Kota takes priority for the bare name
      if (!kabLookup.has(stripped) || isKota) {
        kabLookup.set(stripped, node);
      }
    }
  }

  for (const nodes of children.values()) {
    nodes.sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
  }

  // Explicit Pos Indonesia KC/KCU and Kabupaten capitals
  kabLookup.set('SOREANG', byCode.get('32.04')); // KC Soreang -> Kab. Bandung
  kabLookup.set('KABUPATEN BANDUNG', byCode.get('32.04'));
  kabLookup.set('KAB. BANDUNG', byCode.get('32.04'));
  kabLookup.set('KAB BANDUNG', byCode.get('32.04'));

  kabLookup.set('CIMAHI', byCode.get('32.77')); // KC Cimahi -> Kota Cimahi
  kabLookup.set('KOTA CIMAHI', byCode.get('32.77'));

  kabLookup.set('BANDUNG', byCode.get('32.73')); // KCU Bandung -> Kota Bandung
  kabLookup.set('KOTA BANDUNG', byCode.get('32.73'));

  kabLookup.set('CIBINONG', byCode.get('32.01')); // Kab. Bogor
  kabLookup.set('KABUPATEN BOGOR', byCode.get('32.01'));
  kabLookup.set('KOTA BOGOR', byCode.get('32.71'));
  kabLookup.set('BOGOR', byCode.get('32.71'));

  kabLookup.set('CIKARANG', byCode.get('32.16')); // Kab. Bekasi
  kabLookup.set('KABUPATEN BEKASI', byCode.get('32.16'));
  kabLookup.set('KOTA BEKASI', byCode.get('32.75'));
  kabLookup.set('BEKASI', byCode.get('32.75'));

  kabLookup.set('TIGARAKSA', byCode.get('36.03')); // Kab. Tangerang
  kabLookup.set('KABUPATEN TANGERANG', byCode.get('36.03'));
  kabLookup.set('KOTA TANGERANG', byCode.get('36.71'));
  kabLookup.set('TANGERANG', byCode.get('36.71'));
  kabLookup.set('TANGERANG SELATAN', byCode.get('36.74'));
  kabLookup.set('TANGSEL', byCode.get('36.74'));

  kabLookup.set('JAKARTACENTRUM', byCode.get('31.71')); // Jakarta Centrum -> Jakarta Pusat
  kabLookup.set('JAKARTA PUSAT', byCode.get('31.71'));
  kabLookup.set('JAKARTAPUSAT', byCode.get('31.71'));
  kabLookup.set('JAKARTA BARAT', byCode.get('31.73'));
  kabLookup.set('JAKARTABARAT', byCode.get('31.73'));
  kabLookup.set('JAKARTA SELATAN', byCode.get('31.74'));
  kabLookup.set('JAKARTASELATAN', byCode.get('31.74'));
  kabLookup.set('JAKARTA TIMUR', byCode.get('31.75'));
  kabLookup.set('JAKARTATIMUR', byCode.get('31.75'));
  kabLookup.set('JAKARTA UTARA', byCode.get('31.72'));
  kabLookup.set('JAKARTAUTARA', byCode.get('31.72'));

  // Sort kabLookup entries by string length descending so longer/more specific names match first
  const sortedKabLookup = Array.from(kabLookup.entries()).sort((a, b) => b[0].length - a[0].length);

  function exactChild(parent, name) {
    if (!name || name === '-') return null;
    const matches = nameIndex.get(`${parent || ''}|${key(name)}`) || [];
    return matches.length === 1 ? matches[0] : null;
  }

  function chain(code) {
    const result = [null, null, null, null];
    let node = byCode.get(code);
    while (node) {
      result[node.level - 1] = { kode: node.kode, nama: node.nama };
      node = node.parent ? byCode.get(node.parent) : null;
    }
    return {
      provinsi: result[0],
      kabupatenKota: result[1],
      kecamatan: result[2],
      desaKelurahan: result[3],
      kode: code,
      status: 'Terpetakan'
    };
  }

  function resolveOffice(office) {
    // 1. Explicit Kemendagri code
    const codes = [
      office.wilayah_kode, office.kode_wilayah, office.kode_kemendagri,
      office.wilayah?.kode, office.wilayah?.desaKelurahan?.kode, office.wilayah?.kecamatan?.kode,
      office.wilayah?.kabupatenKota?.kode, office.wilayah?.provinsi?.kode
    ];
    for (const code of codes) {
      if (byCode.has(String(code || ''))) return chain(String(code));
    }

    // 2. Structured administrative text fields
    if (office.provinsi) {
      let node = exactChild(null, office.provinsi);
      if (node) {
        const names = [
          office.kabupaten_kota || office.kabupaten || office.kota,
          office.kecamatan,
          office.kelurahan || office.desa_kelurahan
        ];
        for (const name of names) {
          if (!name) break;
          const next = exactChild(node.kode, name);
          if (!next) break;
          node = next;
        }
        return chain(node.kode);
      }
    }

    // 3. Pos Indonesia administrative network mapping (KCU/KC, Regional, Nopend, Alamat)
    const directKcText = key(office.nama_kcu_kc);
    const parentKcuText = key(office.nama_kcu);
    const fullText = key(`${office.nama_nopend || ''} ${office.nama_kantor || ''} ${office.alamat || ''}`);

    let targetKabNode = null;

    // 3a. Direct branch KC (most specific locality, e.g. "KC Soreang 40900" -> Kab. Bandung)
    if (directKcText) {
      for (const [name, node] of sortedKabLookup) {
        if (name.length >= 4 && directKcText.includes(name)) {
          targetKabNode = node;
          break;
        }
      }
    }

    // 3b. Higher-level parent KCU
    if (!targetKabNode && parentKcuText) {
      for (const [name, node] of sortedKabLookup) {
        if (name.length >= 4 && parentKcuText.includes(name)) {
          targetKabNode = node;
          break;
        }
      }
    }

    // 3c. Fallback: check fullText for Kab/Kota names
    if (!targetKabNode) {
      for (const [name, node] of sortedKabLookup) {
        if (name.length >= 5 && fullText.includes(name)) {
          targetKabNode = node;
          break;
        }
      }
    }

    if (targetKabNode) {
      // Find matching Kecamatan under this Kabupaten/Kota
      const kecNodes = children.get(targetKabNode.kode) || [];
      let targetKecNode = null;
      for (const kec of kecNodes) {
        const kecName = key(kec.nama);
        if (kecName.length >= 4 && fullText.includes(kecName)) {
          targetKecNode = kec;
          break;
        }
      }

      // Check special area names like Cantilan in Kutawaringin
      if (!targetKecNode && targetKabNode.kode === '32.04' && fullText.includes('CANTILAN')) {
        targetKecNode = byCode.get('32.04.46'); // Kutawaringin
      }

      if (targetKecNode) {
        // Check matching Desa/Kelurahan under this Kecamatan
        const desaNodes = children.get(targetKecNode.kode) || [];
        let targetDesaNode = null;
        for (const desa of desaNodes) {
          const desaName = key(desa.nama);
          if (desaName.length >= 4 && fullText.includes(desaName)) {
            targetDesaNode = desa;
            break;
          }
        }
        if (!targetDesaNode && targetKecNode.kode === '32.04.46' && fullText.includes('CANTILAN')) {
          targetDesaNode = byCode.get('32.04.46.2001'); // Jelegong
        }

        if (targetDesaNode) return chain(targetDesaNode.kode);
        return chain(targetKecNode.kode);
      }

      return chain(targetKabNode.kode);
    }

    // 4. Regional office fallback
    const regText = key(office.nama_regional);
    if (regText.includes('REGIONAL III') || regText.includes('REGIONAL 3')) {
      return chain('32'); // Jawa Barat
    } else if (regText.includes('REGIONAL II') || regText.includes('REGIONAL 2')) {
      return chain('31'); // DKI Jakarta
    } else if (regText.includes('REGIONAL IV') || regText.includes('REGIONAL 4')) {
      return chain('33'); // Jawa Tengah
    } else if (regText.includes('REGIONAL V') || regText.includes('REGIONAL 5')) {
      return chain('35'); // Jawa Timur
    } else if (regText.includes('REGIONAL I') || regText.includes('REGIONAL 1')) {
      return chain('12'); // Sumatera Utara
    } else if (regText.includes('REGIONAL VI') || regText.includes('REGIONAL 6')) {
      return chain('73'); // Sulawesi Selatan
    }

    return {
      provinsi: null,
      kabupatenKota: null,
      kecamatan: null,
      desaKelurahan: null,
      kode: null,
      status: 'Belum Terpetakan'
    };
  }

  function isInside(officeCode, selectedCode) {
    if (!officeCode || !selectedCode) return false;
    return officeCode === selectedCode || officeCode.startsWith(`${selectedCode}.`);
  }

  function searchRegion(wilayah, phrase) {
    const term = key(phrase);
    if (!term) return false;
    return [wilayah.provinsi, wilayah.kabupatenKota, wilayah.kecamatan, wilayah.desaKelurahan]
      .some(node => node && (key(node.nama).includes(term) || node.kode.includes(term)));
  }

  return { byCode, children, counts, resolveOffice, isInside, searchRegion, chain };
}
