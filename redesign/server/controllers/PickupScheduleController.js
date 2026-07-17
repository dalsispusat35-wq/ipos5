import { PickupOfficeResolver } from '../services/PickupOfficeResolver.js';

const SLIDE_2_NIGHT_ROUTES = [
  { vehicle: 'B 9910 PCX', category: 'MALAM', groups: [{ id: 'PICK_UP_AGP', name: 'PICK UP AGP', startTime: '16.00', endTime: '21.00', candidates: ['AGP ONG', 'AGP Arvinet', 'AGP Cicalengka', 'AGP Ciparay', 'AGP Majalaya', 'KCP Majalaya', 'AGP Omega', 'AGP Cileunyi', 'AGP Cinunuk Permata Biru'] }] },
  { vehicle: 'B 9945 PCY', category: 'MALAM', groups: [
    { id: 'PICK_UP_1', name: 'PICK UP 1', startTime: '18.00', endTime: '21.30', candidates: ['KCU BD 40000', 'UNPAR', 'AGP Siliwangi', 'AGP Dago', 'KCP Cihapit', 'AGP Gatsu'] },
    { id: 'PICK_UP_2', name: 'PICK UP 2', startTime: '22.00', endTime: '24.00', candidates: ['KC Ujung Berung 40100', 'AGP Artajati', 'AGP Ciskul'] }
  ] }
];

// Alias eksplisit ini sudah diverifikasi terhadap kode asli di master_kantor.
const OFFICE_ALIAS_CODES = {
  'AGP Arvinet': '40395C1', 'AGP Cicalengka': '40395U1', 'AGP Ciparay': '40381U2',
  'AGP Majalaya': '40382U1', 'KCP Majalaya': '40382B2', 'AGP Cileunyi': '40393U3',
  'AGP Cinunuk Permata Biru': '40393S8', 'KCU BD 40000': '40000', UNPAR: '40141C3',
  'AGP Dago': '40135U1', 'KCP Cihapit': '40114A', 'AGP Gatsu': '40263C2',
  'KC Ujung Berung 40100': '40100'
};

class PickupScheduleController {
  async getSlide2Night(req, res) {
    try {
      const resolver = new PickupOfficeResolver(OFFICE_ALIAS_CODES);
      await resolver.loadOffices();
      const routes = SLIDE_2_NIGHT_ROUTES.map(route => ({
        vehicle: route.vehicle,
        category: route.category,
        groups: route.groups.map(group => {
          const stops = [];
          const skipped = [];
          for (const candidate of group.candidates) {
            const result = resolver.resolveOfficeFromMaster(candidate);
            if (!result.found) {
              console.log(`[${route.vehicle}] ${candidate} → NOT FOUND → SKIPPED`);
              skipped.push({ candidate, reason: 'Tidak ditemukan di database master_kantor' });
              continue;
            }
            
            if (result.matchedBy === 'CODE') {
              console.log(`[${route.vehicle}] ${candidate}`);
              console.log(`→ MATCHED BY CODE ${result.matchedValue}`);
              console.log(`→ ${result.office.nama_nopend}`);
            } else {
              console.log(`[${route.vehicle}] ${candidate} → FOUND`);
            }
            
            stops.push(result.office);
          }
          return { id: group.id, name: group.name, startTime: group.startTime, endTime: group.endTime, stops, skipped };
        })
      }));
      res.json({ success: true, data: { source: 'PPT_SLIDE_2', category: 'MALAM', routes } });
    } catch (error) {
      console.error('Error resolving slide 2 night pickup routes:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new PickupScheduleController();
