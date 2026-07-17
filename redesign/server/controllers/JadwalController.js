import BaseController from './BaseController.js';
import JadwalModel from '../models/JadwalModel.js';
import TemplateModel from '../models/TemplateModel.js';

class JadwalController extends BaseController {
  constructor() {
    super(JadwalModel, 'jadwal_id');
  }

  getSearchFilter(search) {
    const regex = { $regex: search, $options: 'i' };
    return {
      $or: [
        { jadwal_id: regex },
        { route_id: regex },
        { kendaraan_id: regex },
        { nama_kendaraan: regex },
        { asal_nopen: regex },
        { asal_nama: regex },
        { tujuan_nopen: regex },
        { tujuan_nama: regex }
      ]
    };
  }

  async generate(req, res) {
    try {
      const { bulan, tahun, template_id, lewati_minggu } = req.body;
      
      if (!bulan || !tahun || !template_id) {
        return res.status(400).json({ success: false, message: 'Bulan, tahun, dan template_id diperlukan' });
      }

      const template = await TemplateModel.findOne({ template_id, status: 'AKTIF' });
      if (!template) {
        return res.status(404).json({ success: false, message: 'Template tidak ditemukan atau tidak aktif' });
      }

      const requiredTemplateFields = [
        'route_id', 'kendaraan_id', 'asal_nopen', 'asal_nama',
        'tujuan_nopen', 'tujuan_nama', 'moda', 'nama_moda',
        'jam_berangkat', 'jam_tiba', 'cut_off'
      ];
      const missingFields = requiredTemplateFields.filter(field =>
        template[field] === undefined || template[field] === null || template[field] === ''
      );
      if (missingFields.length) {
        return res.status(422).json({
          success: false,
          message: `Template belum lengkap: ${missingFields.join(', ')}. Jadwal tidak dibuat dengan nilai dummy.`
        });
      }

      let hariOperasi = template.hari_operasi || [];
      if (typeof hariOperasi === 'string') {
        hariOperasi = [hariOperasi];
      }
      // Standardize to uppercase
      hariOperasi = hariOperasi.map(h => h.toUpperCase());

      const hariMapping = {
        0: 'MINGGU',
        1: 'SENIN',
        2: 'SELASA',
        3: 'RABU',
        4: 'KAMIS',
        5: 'JUMAT',
        6: 'SABTU'
      };

      const monthGenerate = `${tahun}-${String(bulan).padStart(2, '0')}`;
      const totalDays = new Date(tahun, bulan, 0).getDate(); // Number of days in the month
      
      let totalDates = 0;
      let totalCreated = 0;
      let totalSkippedExisting = 0;
      let totalSkippedHari = 0;

      for (let day = 1; day <= totalDays; day++) {
        const dateObj = new Date(tahun, bulan - 1, day);
        const dayOfWeek = dateObj.getDay();
        const namaHari = hariMapping[dayOfWeek];
        
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const tanggalStr = `${yyyy}-${mm}-${dd}`;

        totalDates++;

        // Skip Sunday if lewati_minggu is set
        if (lewati_minggu && namaHari === 'MINGGU') {
          totalSkippedHari++;
          continue;
        }

        // Check if this day is in operating days
        if (!hariOperasi.includes(namaHari)) {
          totalSkippedHari++;
          continue;
        }

        // Check if already exists — use tanggal_berangkat to match actual DB schema
        const existing = await this.model.findOne({
          tanggal_berangkat: tanggalStr,
          template_id: template.template_id,
          kendaraan_id: template.kendaraan_id,
          jam_berangkat: template.jam_berangkat
        });

        if (existing) {
          totalSkippedExisting++;
          continue;
        }

        // Calculate arrival date/day (handle overnight trips using lintas_hari / tambah_hari_tiba)
        const tambahHariTiba = template.tambah_hari_tiba || 0;
        const tanggalTibaObj = new Date(dateObj);
        tanggalTibaObj.setDate(tanggalTibaObj.getDate() + tambahHariTiba);
        const yyyyT = tanggalTibaObj.getFullYear();
        const mmT = String(tanggalTibaObj.getMonth() + 1).padStart(2, '0');
        const ddT = String(tanggalTibaObj.getDate()).padStart(2, '0');
        const tanggalTibaStr = `${yyyyT}-${mmT}-${ddT}`;
        const hariTibaStr = hariMapping[tanggalTibaObj.getDay()];

        // Generate schedule ID: JD + YYYYMMDD + padded counter (e.g. JD202607010001)
        const dateIdPart = `${yyyy}${mm}${dd}`;
        const existingOnDateCount = await this.model.count({ tanggal_berangkat: tanggalStr });
        const counterStr = String(existingOnDateCount + totalCreated + 1).padStart(4, '0');
        const jadwalId = `JD${dateIdPart}${counterStr}`;

        const doc = {
          jadwal_id: jadwalId,
          template_id: template.template_id,
          detail_route_id: template.detail_route_id || '',
          route_id: template.route_id || '',
          tanggal_berangkat: tanggalStr,
          hari_berangkat: namaHari,
          tanggal_tiba: tanggalTibaStr,
          hari_tiba: hariTibaStr,
          asal_nopen: template.asal_nopen || '',
          asal_nama: template.asal_nama || '',
          tujuan_nopen: template.tujuan_nopen || '',
          tujuan_nama: template.tujuan_nama || '',
          kendaraan_id: template.kendaraan_id || '',
          nama_kendaraan: template.nama_kendaraan || '',
          moda: template.moda,
          nama_moda: template.nama_moda,
          jam_berangkat: template.jam_berangkat,
          jam_tiba: template.jam_tiba,
          cut_off: template.cut_off,
          estimasi_jam: template.estimasi_jam || 0,
          lintas_hari: tambahHariTiba > 0,
          status: 'AKTIF',
          keterangan: `JADWAL ${template.nama_moda || 'DARAT'} ${template.asal_nopen || ''} KE ${template.tujuan_nopen || ''}`,
          sumber_generate: 'GENERATE_BULANAN',
          bulan_generate: monthGenerate
        };

        try {
          await this.model.insertOne(doc);
          totalCreated++;
        } catch (e) {
          console.error('Error generating document:', e);
          totalSkippedExisting++;
        }
      }

      res.json({
        success: true,
        message: `Generate jadwal untuk ${monthGenerate} selesai!`,
        summary: {
          bulan: monthGenerate,
          template: template.template_id,
          template_route: template.route_id || '-',
          total_dates: totalDates,
          total_created: totalCreated,
          total_skipped_existing: totalSkippedExisting,
          total_skipped_hari: totalSkippedHari
        }
      });
    } catch (error) {
      console.error('Error in generating schedule:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new JadwalController();
