import KantorModel from '../models/KantorModel.js';

const normalizeName = (value = '') => value.toString().toLowerCase().trim().replace(/[._/\\-]+/g, ' ').replace(/\s+/g, ' ');

const normalizeOfficeName = (office) => {
  const normalizedName = normalizeName(office.nama_nopend);
  const normalizedCode = normalizeName(office.nopend);
  if (normalizedCode && normalizedName.endsWith(` ${normalizedCode}`)) return normalizedName.slice(0, -(normalizedCode.length + 1)).trim();
  return normalizedName;
};

const extractOfficeCode = (candidate) => candidate.match(/\b\d{5}\b/)?.[0] || null;

export class PickupOfficeResolver {
  constructor(aliasCodes = {}) {
    this.aliasCodes = new Map(Object.entries(aliasCodes).map(([name, code]) => [normalizeName(name), code]));
    this.offices = [];
  }

  async loadOffices() {
    this.offices = await KantorModel.find({ $or: [{ status: 'AKTIF' }, { status: { $exists: false } }] });
  }

  findByCode(code) {
    return this.offices.find(office => normalizeName(office.nopend) === normalizeName(code));
  }

  resolveOfficeFromMaster(candidate) {
    const candidateName = normalizeName(candidate);
    const candidateCode = extractOfficeCode(candidate);
    if (candidateCode) {
      const office = this.findByCode(candidateCode);
      if (office) return { found: true, office, matchedBy: 'CODE', matchedValue: candidateCode };
    }
    const exactOffice = this.offices.find(office => normalizeName(office.nama_nopend) === candidateName);
    if (exactOffice) return { found: true, office: exactOffice, matchedBy: 'EXACT_NAME', matchedValue: candidate };
    const normalizedOffices = this.offices.filter(office => normalizeOfficeName(office) === candidateName);
    if (normalizedOffices.length === 1) {
      return { found: true, office: normalizedOffices[0], matchedBy: 'NORMALIZED_NAME', matchedValue: candidateName };
    }
    const aliasCode = this.aliasCodes.get(candidateName);
    if (aliasCode) {
      const office = this.findByCode(aliasCode);
      if (office) return { found: true, office, matchedBy: 'ALIAS_CODE', matchedValue: aliasCode };
    }
    return { found: false, candidate };
  }
}
