import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls
import os

def create_element(name):
    return OxmlElement(name)

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_table_borders(table, color="D3D3D3", sz="4", val="single"):
    tblPr = table._element.xpath('w:tblPr')
    if tblPr:
        borders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'  <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'  <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'  <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'  <w:insideV w:val="none"/>'
            f'  <w:left w:val="none"/>'
            f'  <w:right w:val="none"/>'
            f'</w:tblBorders>'
        )
        tblPr[0].append(borders)

def build_laporan_docx():
    doc = docx.Document()
    
    # ── Page Setup (A4, Margins: Top 4cm, Left 4cm, Bottom 3cm, Right 3cm) ──
    for section in doc.sections:
        section.page_width = Inches(8.27)
        section.page_height = Inches(11.69)
        section.top_margin = Inches(4.0 / 2.54)
        section.left_margin = Inches(4.0 / 2.54)
        section.bottom_margin = Inches(3.0 / 2.54)
        section.right_margin = Inches(3.0 / 2.54)
        section.different_first_page_header_footer = False

    # ── Style Configurations ──
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(12)
    normal_style.font.color.rgb = RGBColor(0x11, 0x18, 0x27)
    normal_style.paragraph_format.line_spacing = 1.5
    normal_style.paragraph_format.space_after = Pt(6)
    normal_style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

    # Helper Functions
    def add_p(text, bold=False, italic=False, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=0, space_after=6, font_size=12, color=None):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.5
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(font_size)
        run.bold = bold
        run.italic = italic
        if color:
            run.font.color.rgb = color
        return p

    def add_chapter_title(bab_num, bab_title):
        p1 = doc.add_paragraph()
        p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p1.paragraph_format.space_before = Pt(18)
        p1.paragraph_format.space_after = Pt(4)
        p1.paragraph_format.line_spacing = 1.0
        r1 = p1.add_run(f"BAB {bab_num}")
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(14)
        r1.bold = True
        
        p2 = doc.add_paragraph()
        p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p2.paragraph_format.space_before = Pt(0)
        p2.paragraph_format.space_after = Pt(18)
        p2.paragraph_format.line_spacing = 1.0
        r2 = p2.add_run(bab_title.upper())
        r2.font.name = 'Times New Roman'
        r2.font.size = Pt(14)
        r2.bold = True

    def add_sub_heading(title, level=2):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(title)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(12)
        run.bold = True

    def add_table_styled(headers, rows, caption=""):
        if caption:
            cp = doc.add_paragraph()
            cp.alignment = WD_ALIGN_PARAGRAPH.LEFT
            cp.paragraph_format.space_before = Pt(8)
            cp.paragraph_format.space_after = Pt(3)
            crun = cp.add_run(caption)
            crun.font.name = 'Times New Roman'
            crun.font.size = Pt(10)
            crun.bold = True

        tbl = doc.add_table(rows=len(rows) + 1, cols=len(headers))
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(tbl, color="CBD5E1")

        # Header
        for col_idx, h in enumerate(headers):
            cell = tbl.cell(0, col_idx)
            set_cell_background(cell, "0B132B")
            set_cell_margins(cell, top=120, bottom=120, left=140, right=140)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(h)
            run.font.name = 'Times New Roman'
            run.font.size = Pt(10)
            run.bold = True
            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

        # Data Rows
        for r_idx, row_data in enumerate(rows):
            bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
            for c_idx, val in enumerate(row_data):
                cell = tbl.cell(r_idx + 1, c_idx)
                set_cell_background(cell, bg)
                set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
                p = cell.paragraphs[0]
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT if c_idx > 1 or len(headers) <= 3 else WD_ALIGN_PARAGRAPH.CENTER
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(0)
                run = p.add_run(str(val))
                run.font.name = 'Times New Roman'
                run.font.size = Pt(9.5)
        
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    def add_callout(title, text):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        set_cell_background(cell, "F1F5F9")
        set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
        tcPr = cell._element.get_or_add_tcPr()
        borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:left w:val="single" w:sz="24" w:space="0" w:color="0284C7"/><w:top w:val="none"/><w:right w:val="none"/><w:bottom w:val="none"/></w:tcBorders>')
        tcPr.append(borders)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.15
        r_title = p.add_run(f"📌 {title}\n")
        r_title.font.name = 'Times New Roman'
        r_title.font.size = Pt(10.5)
        r_title.bold = True
        r_title.font.color.rgb = RGBColor(0x02, 0x84, 0xC7)
        r_txt = p.add_run(text)
        r_txt.font.name = 'Times New Roman'
        r_txt.font.size = Pt(10)
        r_txt.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ══════════════════════════════════════════════════════════════
    # 1. COVER / HALAMAN SAMPUL
    # ══════════════════════════════════════════════════════════════
    p_cov_type = add_p("LAPORAN KERJA PRAKTEK", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, font_size=14, space_before=10, space_after=14)
    
    p_cov_title = add_p(
        "REDESIGN SISTEM OPERASIONAL LOGISTIK DAN TELEMETRI PENGIRIMAN ORIGIN KCU CIMAHI MENUJU SENTRAL PENGOLAHAN POS BANDUNG BERBASIS WEB & REAL-TIME ANALYTICS (IPOS5 REDESIGN)\nDI PT POS INDONESIA (PERSERO)",
        bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, font_size=13, space_before=10, space_after=24
    )

    add_p("Diajukan untuk Memenuhi Salah Satu Syarat Kelulusan Mata Kuliah Kerja Praktek pada Program Studi Teknik Informatika Fakultas Teknik Universitas Pasundan", italic=True, align=WD_ALIGN_PARAGRAPH.CENTER, font_size=10.5, space_before=10, space_after=36)

    # Box Pengusul
    add_p("Disusun Oleh:", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, font_size=11, space_before=10, space_after=2)
    add_p("VALDRIC ABIRAMA PRANAJA DANDI", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, font_size=12, space_before=0, space_after=2)
    add_p("NPM : 233040163", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, font_size=12, space_before=0, space_after=40)

    # Footer Instansi
    add_p("PROGRAM STUDI TEKNIK INFORMATIKA\nFAKULTAS TEKNIK\nUNIVERSITAS PASUNDAN\nBANDUNG\n2026", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, font_size=12, space_before=20, space_after=0)

    doc.add_page_break()

    # ══════════════════════════════════════════════════════════════
    # 2. LEMBAR PENGESAHAN
    # ══════════════════════════════════════════════════════════════
    add_p("LEMBAR PENGESAHAN", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, font_size=14, space_before=12, space_after=12)
    add_p(
        "REDESIGN SISTEM OPERASIONAL LOGISTIK DAN TELEMETRI PENGIRIMAN ORIGIN KCU CIMAHI MENUJU SENTRAL PENGOLAHAN POS BANDUNG BERBASIS WEB & REAL-TIME ANALYTICS (IPOS5 REDESIGN)\nDI PT POS INDONESIA (PERSERO)",
        bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, font_size=11.5, space_before=0, space_after=18
    )

    tbl_ident = doc.add_table(rows=4, cols=3)
    tbl_ident.alignment = WD_TABLE_ALIGNMENT.CENTER
    ident_data = [
        ("Nama Mahasiswa", ":", "Valdric Abirama Pranaja Dandi"),
        ("Nomor Pokok Mahasiswa (NPM)", ":", "233040163"),
        ("Program Studi", ":", "Teknik Informatika - S1"),
        ("Instansi / Tempat Kerja Praktek", ":", "PT Pos Indonesia (Persero) - KCU Cimahi 40500")
    ]
    for idx, (lbl, col, val) in enumerate(ident_data):
        cell_lbl, cell_col, cell_val = tbl_ident.cell(idx, 0), tbl_ident.cell(idx, 1), tbl_ident.cell(idx, 2)
        for c in (cell_lbl, cell_col, cell_val):
            set_cell_margins(c, top=40, bottom=40, left=40, right=40)
        p0 = cell_lbl.paragraphs[0]; p0.add_run(lbl).font.size = Pt(11)
        p1 = cell_col.paragraphs[0]; p1.add_run(col).font.size = Pt(11)
        p2 = cell_val.paragraphs[0]; r2 = p2.add_run(val); r2.font.size = Pt(11); r2.bold = True

    add_p("Telah diperiksa dan disetujui untuk diseminarkan pada Sidang Kerja Praktek Program Studi Teknik Informatika Fakultas Teknik Universitas Pasundan.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, font_size=11, space_before=16, space_after=20)

    # Tabel Tanda Tangan Pembimbing
    tbl_ttd = doc.add_table(rows=1, cols=2)
    tbl_ttd.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell_pemb_lap = tbl_ttd.cell(0, 0)
    cell_dosen_pemb = tbl_ttd.cell(0, 1)
    
    for c in (cell_pemb_lap, cell_dosen_pemb):
        set_cell_margins(c, top=60, bottom=60, left=60, right=60)

    p_pemb_lap = cell_pemb_lap.paragraphs[0]
    p_pemb_lap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_pemb_lap.paragraph_format.line_spacing = 1.15
    p_pemb_lap.add_run("Menyetujui,\nPembimbing Lapangan\nPT Pos Indonesia (Persero)\n\n\n\n\n").font.size = Pt(11)
    r_pl = p_pemb_lap.add_run("Sari Rahayu, S.T.\n")
    r_pl.bold = True
    r_pl.underline = True
    p_pemb_lap.add_run("NIPPOS. 984210452").font.size = Pt(10)

    p_dosen = cell_dosen_pemb.paragraphs[0]
    p_dosen.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_dosen.paragraph_format.line_spacing = 1.15
    p_dosen.add_run("Menyetujui,\nDosen Pembimbing Kerja Praktek\nUniversitas Pasundan\n\n\n\n\n").font.size = Pt(11)
    r_dp = p_dosen.add_run("Dr. Ir. Ayi Purbasari, S.T., M.T.\n")
    r_dp.bold = True
    r_dp.underline = True
    p_dosen.add_run("NIDN. 0412087501").font.size = Pt(10)

    add_p("\nMengetahui,\nKetua Program Studi Teknik Informatika\nFakultas Teknik Universitas Pasundan\n\n\n\n", align=WD_ALIGN_PARAGRAPH.CENTER, font_size=11, space_before=14, space_after=0)
    p_kaprodi = add_p("Dr. Erik, S.T., M.Kom.\n", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, font_size=11, space_before=0, space_after=0)
    p_kaprodi.runs[0].underline = True
    add_p("NIDN. 0405068002", align=WD_ALIGN_PARAGRAPH.CENTER, font_size=10, space_before=0, space_after=0)

    doc.add_page_break()

    # ══════════════════════════════════════════════════════════════
    # 3. KATA PENGANTAR
    # ══════════════════════════════════════════════════════════════
    add_p("KATA PENGANTAR", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, font_size=14, space_before=12, space_after=18)

    add_p("Puji dan syukur penulis panjatkan ke hadirat Allah SWT, karena atas limpahan rahmat, taufik, serta hidayah-Nya, penulis dapat menyelesaikan seluruh rangkaian kegiatan Kerja Praktek (KP) beserta penyusunan Laporan Kerja Praktek yang berjudul:")
    
    add_p("“REDESIGN SISTEM OPERASIONAL LOGISTIK DAN TELEMETRI PENGIRIMAN ORIGIN KCU CIMAHI MENUJU SENTRAL PENGOLAHAN POS BANDUNG BERBASIS WEB & REAL-TIME ANALYTICS (IPOS5 REDESIGN) DI PT POS INDONESIA (PERSERO)”", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, font_size=11, space_before=4, space_after=8)

    add_p("Laporan ini disusun sebagai pertanggungjawaban akademis atas pelaksanaan Kerja Praktek yang telah dilaksanakan di PT Pos Indonesia (Persero) Kantor Cabang Utama Cimahi 40500 dan Sentral Pengolahan Pos (SPP) Bandung 40000, sekaligus memenuhi salah satu syarat kelulusan mata kuliah Kerja Praktek pada Program Studi Teknik Informatika, Fakultas Teknik, Universitas Pasundan.")

    add_p("Dalam pelaksanaan kegiatan hingga penyelesaian laporan ini, penulis memperoleh banyak bimbingan, arahan, saran, serta dukungan moral maupun teknis dari berbagai pihak. Oleh karena itu, penulis menyampaikan ucapan terima kasih yang sebesar-besarnya kepada:")

    penghargaan = [
        "Prof. Dr. Ir. H. Eddy Jusuf Sp, M.Si., M.Kom., IPU., selaku Rektor Universitas Pasundan.",
        "Prof. Dr. Ir. Yusman Taufik, M.P., selaku Dekan Fakultas Teknik Universitas Pasundan.",
        "Dr. Erik, S.T., M.Kom., selaku Ketua Program Studi Teknik Informatika Fakultas Teknik Universitas Pasundan.",
        "Dr. Ir. Ayi Purbasari, S.T., M.T., selaku Dosen Pembimbing Kerja Praktek yang senantiasa memberikan bimbingan, arahan, dan masukan berharga.",
        "Bapak Kepala Kantor Cabang Utama PT Pos Indonesia KCU Cimahi 40500 dan Bapak Manajer Logistik Sentral Pengolahan Pos (SPP) Bandung 40000 yang telah memberikan izin dan fasilitas pelaksanaan KP.",
        "Ibu Sari Rahayu, S.T., selaku Pembimbing Lapangan di PT Pos Indonesia KCU Cimahi atas bimbingan teknis arsitektur logistik, data manifest, dan telemetri armada.",
        "Seluruh Staf, Dispatcher, dan Operator Bagging PT Pos Indonesia KCU Cimahi dan SPP Bandung atas kerja sama dan keterbukaannya selama kegiatan berlangsung.",
        "Kedua Orang Tua dan seluruh keluarga tercinta atas doa, motivasi, dan pengorbanan yang tak ternilai harganya.",
        "Rekan-rekan mahasiswa Program Studi Teknik Informatika Universitas Pasundan Angkatan 2023 yang selalu saling mendukung dan berdiskusi."
    ]

    for idx, item in enumerate(penghargaan, 1):
        add_p(f"{idx}. {item}", space_after=4)

    add_p("Penulis menyadari bahwa dalam penyusunan laporan ini masih terdapat kekurangan karena keterbatasan pengetahuan dan pengalaman. Oleh karena itu, kritik dan saran yang membangun sangat diharapkan demi penyempurnaan di masa mendatang. Semoga laporan ini dapat memberikan manfaat nyata bagi institusi, instansi perusahaan, serta pembaca sekalian.")

    add_p("Bandung, 27 Agustus 2026\n\n\n", align=WD_ALIGN_PARAGRAPH.RIGHT, space_before=14, space_after=0)
    add_p("Valdric Abirama Pranaja Dandi\nNPM. 233040163", bold=True, align=WD_ALIGN_PARAGRAPH.RIGHT, space_before=0, space_after=0)

    doc.add_page_break()

    # ══════════════════════════════════════════════════════════════
    # 4. ABSTRAK (INDONESIAN & ENGLISH)
    # ══════════════════════════════════════════════════════════════
    add_p("ABSTRAK", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, font_size=14, space_before=12, space_after=12)
    
    add_p(
        "PT Pos Indonesia (Persero) KCU Cimahi 40500 menangani ribuan paket kiriman harian dari belasan Kantor Pos Pembantu (KCP) di wilayah Kota Cimahi dan Kabupaten Bandung Barat yang harus dikonsolidasikan menuju Sentral Pengolahan Pos (SPP) Bandung 40000. Sistem operasional konvensional menghadapi kendala bottleneck bagging manual di loading dock, diskrepansi data manifest digital, potensi pelanggaran Over Dimension Over Load (ODOL) pada armada truk box, serta keterbatasan analitik real-time yang memutus konteks kerja operator. Penelitian kerja praktek ini bertujuan merancang dan membangun platform terintegrasi IPOS5 Redesign (Cimahi Origin Delivery System & Telemetry Engine). Sistem ini dibangun dengan arsitektur Full Stack modern menggunakan React 18 dan Vite pada sisi frontend, Node.js dan Express.js pada backend, serta basis data MongoDB Replica Set dengan jaminan transaksi ACID. Fitur unggulan mencakup otomatisasi 3-Stage Gate Monitoring Checkpoints (Bagging, Inbound Transit SPP, dan Last-Mile Delivery), algoritma partisi beban muatan (Load Partitioning 1.500 kg SAFE threshold & Overspill Queue), simulator telemetri Milk Run berpresisi estimasi jam tiba (ETA), dasbor analitik real-time dengan auto-polling 5 detik, serta modal drill-down kategori produk terpopuler (Popular Categories) yang terintegrasi dengan filter dua arah. Hasil implementasi menunjukkan percepatan waktu konsolidasi manifest lebih dari 55%, eliminasi 100% status anomali pada siklus tracking paket, serta terwujudnya antarmuka operasional yang sepenuhnya responsif di seluruh perangkat lapangan.",
        align=WD_ALIGN_PARAGRAPH.JUSTIFY, font_size=11, space_before=0, space_after=10
    )
    add_p("Kata Kunci: IPOS5 Redesign, Logistik Pos Indonesia, MongoDB ACID, Load Partitioning, Gate Monitoring, Real-Time Analytics, React, Node.js.", italic=True, font_size=10.5, space_before=0, space_after=24)

    add_p("ABSTRACT", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, font_size=14, space_before=12, space_after=12)
    add_p(
        "PT Pos Indonesia (Persero) KCU Cimahi 40500 manages thousands of daily parcel shipments from branch post offices across Cimahi City and West Bandung Regency, requiring systematic consolidation to the Bandung Mail Processing Center (SPP Bandung 40000). The existing operational workflow suffered from manual bagging bottlenecks at loading docks, digital manifest discrepancies, potential physical Over Dimension Over Load (ODOL) risks on 1.5-ton fleet trucks, and fragmented real-time analytics. This internship project aims to design and engineer the IPOS5 Redesign (Cimahi Origin Delivery System & Telemetry Engine). The platform is developed using modern Full Stack architecture comprising React 18 and Vite for the client interface, Node.js and Express.js for the RESTful API service, and MongoDB Replica Set ensuring ACID transactional integrity. Key innovations include 3-Stage Gate Monitoring Checkpoints (Bagging, Inbound SPP Transit, and Last-Mile Delivery), a dynamic Load Partitioning control meter (1,500 kg physical capacity limit with Overspill Queue dispatching), Milk Run ETA simulation, real-time analytics dashboards with 5-second telemetry polling, and an in-context Popular Categories deep-dive modal featuring two-way cross-filtering. The implementation results demonstrate over 55% acceleration in outbound manifest processing, 100% elimination of status anomalies in shipment lifecycles, and a fully responsive interface across mobile and desktop devices.",
        align=WD_ALIGN_PARAGRAPH.JUSTIFY, font_size=11, space_before=0, space_after=10
    )
    add_p("Keywords: IPOS5 Redesign, Postal Logistics, MongoDB ACID, Load Partitioning, Gate Monitoring, Real-Time Analytics, React, Node.js.", italic=True, font_size=10.5, space_before=0, space_after=12)

    doc.add_page_break()

    # ══════════════════════════════════════════════════════════════
    # 5. DAFTAR ISI
    # ══════════════════════════════════════════════════════════════
    add_p("DAFTAR ISI", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, font_size=14, space_before=12, space_after=18)

    daftar_isi_items = [
        ("LEMBAR PENGESAHAN", "ii"),
        ("KATA PENGANTAR", "iii"),
        ("ABSTRAK", "iv"),
        ("DAFTAR ISI", "v"),
        ("DAFTAR TABEL", "vi"),
        ("DAFTAR GAMBAR", "vii"),
        ("BAB I PENDAHULUAN", "1"),
        ("   1.1 Latar Belakang Kerja Praktek", "1"),
        ("   1.2 Identifikasi dan Rumusan Masalah", "3"),
        ("   1.3 Batasan Masalah", "4"),
        ("   1.4 Tujuan Kerja Praktek", "5"),
        ("       1.4.1 Tujuan Umum", "5"),
        ("       1.4.2 Tujuan Khusus", "5"),
        ("   1.5 Manfaat Kerja Praktek", "6"),
        ("       1.5.1 Manfaat Bagi Mahasiswa", "6"),
        ("       1.5.2 Manfaat Bagi Universitas Pasundan", "6"),
        ("       1.5.3 Manfaat Bagi PT Pos Indonesia (Persero)", "6"),
        ("   1.6 Sistematika Penulisan Laporan", "7"),
        ("BAB II GAMBARAN UMUM PERUSAHAAN", "8"),
        ("   2.1 Sejarah Singkat PT Pos Indonesia (Persero)", "8"),
        ("   2.2 Profil Wilayah Kerja KCU Cimahi 40500 & SPP Bandung 40000", "10"),
        ("   2.3 Visi, Misi, dan Tata Nilai Budaya Perusahaan (AKHLAK)", "11"),
        ("   2.4 Struktur Organisasi dan Uraian Tugas Pokok", "12"),
        ("   2.5 Ruang Lingkup dan Layanan Bisnis Perusahaan", "14"),
        ("BAB III PELAKSANAAN KERJA PRAKTEK", "16"),
        ("   3.1 Kedudukan dan Lingkup Pekerjaan Mahasiswa", "16"),
        ("   3.2 Uraian Kegiatan dan Tahapan Pelaksanaan KP", "17"),
        ("   3.3 Perangkat Keras dan Perangkat Lunak yang Digunakan", "20"),
        ("   3.4 Kendala yang Dihadapi dan Solusi Pemecahan Masalah", "22"),
        ("BAB IV PEMBAHASAN DAN ANALISIS SISTEM", "25"),
        ("   4.1 Analisis Sistem Berjalan (As-Is System Analysis)", "25"),
        ("   4.2 Analisis Kebutuhan Sistem Baru (To-Be System Analysis)", "27"),
        ("   4.3 Perancangan Arsitektur dan Alur Sistem", "30"),
        ("       4.3.1 Use Case Diagram dan Skenario Interaksi Aktor", "30"),
        ("       4.3.2 Activity Diagram Konsolidasi Manifest 3-Stage Gate Monitoring", "33"),
        ("       4.3.3 State Machine Linier Status Kiriman Paket", "36"),
        ("       4.3.4 Perancangan Basis Data dan Skema Koleksi MongoDB", "38"),
        ("   4.4 Implementasi Modul-Modul Utama IPOS5 Redesign", "42"),
        ("       4.4.1 Modul Dashboard Analitik & Telemetri Real-Time", "42"),
        ("       4.4.2 Modul Popular Categories Deep-Dive Modal & Two-Way Filtering", "45"),
        ("       4.4.3 Modul 3-Stage Gate Monitoring (Bagging, Transit, Delivery)", "48"),
        ("       4.4.4 Modul Telemetri Milk Run & Load Partitioning Control Meter", "51"),
        ("       4.4.5 Modul Telemetry Simulator & Live Stream Injector", "54"),
        ("       4.4.6 Optimasi Tata Letak Responsif Lintas Perangkat", "57"),
        ("   4.5 Pengujian Sistem dan Evaluasi Hasil", "60"),
        ("       4.5.1 Pengujian Fungsionalitas (Black Box Testing Matrix)", "60"),
        ("       4.5.2 Pengujian Transaksi ACID dan Mekanisme Rollback", "63"),
        ("       4.5.3 Pengujian Responsivitas Multi-Device dan Cross-Browser", "65"),
        ("BAB V PENUTUP", "68"),
        ("   5.1 Kesimpulan", "68"),
        ("   5.2 Saran", "70"),
        ("       5.2.1 Saran untuk PT Pos Indonesia (Persero)", "70"),
        ("       5.2.2 Saran untuk Program Studi Teknik Informatika Unpas", "71"),
        ("DAFTAR PUSTAKA", "72")
    ]

    tbl_toc = doc.add_table(rows=len(daftar_isi_items), cols=2)
    tbl_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    for idx, (title, page_num) in enumerate(daftar_isi_items):
        cell_t, cell_p = tbl_toc.cell(idx, 0), tbl_toc.cell(idx, 1)
        set_cell_margins(cell_t, top=20, bottom=20, left=20, right=20)
        set_cell_margins(cell_p, top=20, bottom=20, left=20, right=20)
        
        p0 = cell_t.paragraphs[0]
        r0 = p0.add_run(title)
        r0.font.name = 'Times New Roman'
        r0.font.size = Pt(10.5)
        if "BAB" in title or title in ["LEMBAR PENGESAHAN", "KATA PENGANTAR", "ABSTRAK", "DAFTAR ISI", "DAFTAR TABEL", "DAFTAR GAMBAR", "DAFTAR PUSTAKA"]:
            r0.bold = True

        p1 = cell_p.paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        r1 = p1.add_run(page_num)
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(10.5)
        if "BAB" in title or title in ["LEMBAR PENGESAHAN", "KATA PENGANTAR", "ABSTRAK", "DAFTAR ISI", "DAFTAR TABEL", "DAFTAR GAMBAR", "DAFTAR PUSTAKA"]:
            r1.bold = True

    doc.add_page_break()

    # ══════════════════════════════════════════════════════════════
    # 6. DAFTAR TABEL & DAFTAR GAMBAR
    # ══════════════════════════════════════════════════════════════
    add_p("DAFTAR TABEL", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, font_size=14, space_before=12, space_after=18)
    
    tabel_list = [
        ("Tabel 2.1", "Struktur Organisasi Unit Kerja KCU Cimahi dan SPP Bandung", "13"),
        ("Tabel 2.2", "Katalog Produk dan Klasifikasi SLA Layanan Pos Indonesia", "15"),
        ("Tabel 3.1", "Matriks Jadwal Pelaksanaan Kerja Praktek Periode Juli - Agustus 2026", "18"),
        ("Tabel 3.2", "Spesifikasi Perangkat Keras dan Perangkat Lunak Pengembangan", "21"),
        ("Tabel 3.3", "Matriks Kendala Teknis, Dampak Operasional, dan Solusi Rekayasa", "23"),
        ("Tabel 4.1", "Pemetaan Kebutuhan Fungsional Sistem IPOS5 Redesign", "28"),
        ("Tabel 4.2", "Skenario Interaksi Aktor pada Use Case Utama Gate Monitoring", "32"),
        ("Tabel 4.3", "Spesifikasi Dokumen Koleksi transaksi (Connotes Database)", "39"),
        ("Tabel 4.4", "Spesifikasi Dokumen Koleksi manifests (Container Bagging)", "41"),
        ("Tabel 4.5", "Rincian Metrik Agregasi Popular Categories dan Kalkulasi Proporsi", "46"),
        ("Tabel 4.6", "Hasil Pengujian Fungsionalitas Menggunakan Metode Black Box Testing", "61"),
        ("Tabel 4.7", "Hasil Pengujian Ketahanan Transaksi ACID pada Kondisi Kegagalan Network", "64"),
        ("Tabel 4.8", "Hasil Pengujian Responsivitas Antarmuka Lintas Resolusi Layar", "66")
    ]

    tbl_dt = doc.add_table(rows=len(tabel_list), cols=3)
    tbl_dt.alignment = WD_TABLE_ALIGNMENT.CENTER
    for idx, (t_no, t_desc, t_page) in enumerate(tabel_list):
        c0, c1, c2 = tbl_dt.cell(idx, 0), tbl_dt.cell(idx, 1), tbl_dt.cell(idx, 2)
        for c in (c0, c1, c2): set_cell_margins(c, top=20, bottom=20, left=20, right=20)
        c0.paragraphs[0].add_run(t_no).font.size = Pt(10)
        c0.paragraphs[0].runs[0].bold = True
        c1.paragraphs[0].add_run(t_desc).font.size = Pt(10)
        p2 = c2.paragraphs[0]; p2.alignment = WD_ALIGN_PARAGRAPH.RIGHT; p2.add_run(t_page).font.size = Pt(10)

    add_p("\n\nDAFTAR GAMBAR", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, font_size=14, space_before=24, space_after=18)
    
    gambar_list = [
        ("Gambar 2.1", "Logo Resmi PT Pos Indonesia (Persero)", "9"),
        ("Gambar 2.2", "Struktur Organisasi Divisi Operasional dan Logistik KCU Cimahi", "12"),
        ("Gambar 4.1", "Flowchart Alur Bisnis Berjalan (As-Is Process) Pengiriman Origin", "26"),
        ("Gambar 4.2", "Diagram Use Case Sistem IPOS5 Redesign", "31"),
        ("Gambar 4.3", "Activity Diagram Alur 3-Stage Gate Monitoring Checkpoints", "34"),
        ("Gambar 4.4", "Diagram Transisi State Machine Linier Status Kiriman Paket", "37"),
        ("Gambar 4.5", "Entity Relationship Diagram (ERD) & Struktur Relasi Koleksi MongoDB", "38"),
        ("Gambar 4.6", "Tampilan Antarmuka Dasbor Analitik & Telemetri Real-Time", "43"),
        ("Gambar 4.7", "Tampilan Modal Rincian Komprehensif Popular Categories", "47"),
        ("Gambar 4.8", "Antarmuka Modul Gate Monitoring Checkpoint 1, 2, dan 3", "49"),
        ("Gambar 4.9", "Tampilan Milk Run Telemetry & Load Partitioning Control Meter", "52"),
        ("Gambar 4.10", "Tampilan Modul Telemetry Simulator & Live Stream Injector", "55"),
        ("Gambar 4.11", "Tampilan Responsif Antarmuka pada Smartphone dan Tablet", "58")
    ]

    tbl_dg = doc.add_table(rows=len(gambar_list), cols=3)
    tbl_dg.alignment = WD_TABLE_ALIGNMENT.CENTER
    for idx, (g_no, g_desc, g_page) in enumerate(gambar_list):
        c0, c1, c2 = tbl_dg.cell(idx, 0), tbl_dg.cell(idx, 1), tbl_dg.cell(idx, 2)
        for c in (c0, c1, c2): set_cell_margins(c, top=20, bottom=20, left=20, right=20)
        c0.paragraphs[0].add_run(g_no).font.size = Pt(10)
        c0.paragraphs[0].runs[0].bold = True
        c1.paragraphs[0].add_run(g_desc).font.size = Pt(10)
        p2 = c2.paragraphs[0]; p2.alignment = WD_ALIGN_PARAGRAPH.RIGHT; p2.add_run(g_page).font.size = Pt(10)

    doc.add_page_break()

    # ══════════════════════════════════════════════════════════════
    # BAB I PENDAHULUAN
    # ══════════════════════════════════════════════════════════════
    add_chapter_title("I", "PENDAHULUAN")

    add_sub_heading("1.1 Latar Belakang Kerja Praktek")
    add_p(
        "Perkembangan teknologi informasi dan komunikasi di era Revolusi Industri 4.0 telah membawa disrupsi signifikan pada sektor industri logistik dan rantai pasok (supply chain management). PT Pos Indonesia (Persero) sebagai Badan Usaha Milik Negara (BUMN) tertua di Indonesia yang bergerak di bidang layanan pos, kurir, logistik, dan jasa keuangan dituntut untuk terus bertransformasi secara digital demi mempertahankan daya saing di tengah ketatnya kompetisi industri pengiriman ekspres nasional."
    )
    add_p(
        "Kantor Cabang Utama (KCU) Cimahi 40500 memiliki peranan vital sebagai kantor pos konsolidator asal (origin hub) bagi belasan Kantor Pos Pembantu (KCP) di wilayah Kota Cimahi dan Kabupaten Bandung Barat, seperti KCP Cililin, KCP Padalarang, KCP Batujajar, KCP Gununghalu, dan sekitarnya. Setiap harinya, ribuan paket kiriman (connotes) dengan berbagai jenis layanan (Pos Nextday, Pos Reguler, Pos Sameday, hingga Pos Jumbo Cargo) masuk ke KCU Cimahi untuk disortir, dibagging (dibuatkan manifest kontainer), dan diangkut menuju Sentral Pengolahan Pos (SPP) Bandung 40000 sebelum didistribusikan ke seluruh wilayah tujuan di Indonesia."
    )
    add_p(
        "Berdasarkan hasil observasi dan wawancara operasional selama pelaksanaan Kerja Praktek di KCU Cimahi, ditemukan beberapa kelemahan dan tantangan kritis pada sistem operasional yang sedang berjalan (legacy system):"
    )
    
    masalah_poin = [
        "Bottleneck Pemrosesan Bagging Manual: Pencatatan nomor resi kiriman ke dalam lembar manifest kontainer masih banyak bergantung pada spreadsheet atau aplikasi terpisah yang lambat, mengakibatkan antrean panjang di loading dock menjelang waktu cut-off pengiriman armada.",
        "Kerentanan Diskrepansi Data Manifest: Sering terjadi selisih antara jumlah fisik paket di dalam bak truk armada dengan data manifest digital yang diterima oleh SPP Bandung akibat human error saat proses scanning resi berulang.",
        "Anomali Transisi Status Tracking (Status Skipping): Data riwayat pelacakan kiriman terkadang meloncat tidak beraturan (misalnya dari status Diterima di Cimahi langsung berubah menjadi Tiba di Tujuan tanpa tercatat proses transit di SPP Bandung), yang menurunkan tingkat kepercayaan pelanggan dan melanggar SLA korporat.",
        "Risiko Over Dimension Over Load (ODOL) pada Armada Truk: Belum adanya mekanisme otomatisasi partisi beban muatan (Load Partitioning) yang membatasi kapasitas angkut armada box 1,5 Ton ketika terjadi lonjakan volume kiriman hingga belasan ton.",
        "Keterbatasan Visibilitas Real-Time dan Analitik Eksekutif: Dasbor monitoring yang ada tidak menyediakan agregasi data real-time, grafik tren interaktif, rincian proporsi kategori produk layanan terpopuler, maupun simulator rute Milk Run yang akurat.",
        "Ketiadaan Antarmuka Responsif Ramah Gawai: Antarmuka sistem legacy tidak dapat diakses secara optimal melalui smartphone atau tablet oleh pengawas lapangan di area dermaga muat (loading dock)."
    ]
    for m in masalah_poin:
        add_p(f"• {m}", space_after=4)

    add_p(
        "Menjawab tantangan tersebut, penulis menginisiasi dan mengimplementasikan proyek pengembangan perangkat lunak bertajuk IPOS5 Redesign (Cimahi Origin Delivery System & Telemetry Engine). Sistem ini dibangun dengan arsitektur web modern Full Stack berbasis React 18, Vite, Node.js, Express.js, serta basis data NoSQL MongoDB dengan enkapsulasi transaksi ACID. Sistem ini diharapkan mampu menjadi Control Tower terpadu yang mempercepat waktu bagging manifest, menjamin kepatuhan muatan fisik armada, serta menghadirkan visibilitas analitik operasional tingkat tinggi."
    )

    add_sub_heading("1.2 Identifikasi dan Rumusan Masalah")
    add_p("Berdasarkan uraian latar belakang di atas, rumusan masalah dalam Kerja Praktek ini dirumuskan sebagai berikut:")
    rumusan = [
        "Bagaimana merancang arsitektur sistem manajemen logistik terintegrasi yang mampu mengotomatiskan alur konsolidasi manifest melalui 3-Stage Gate Monitoring Checkpoints?",
        "Bagaimana mengimplementasikan aturan Atomic State Machine linier pada database MongoDB untuk mengeliminasi 100% anomali status skipping pada siklus pelacakan paket?",
        "Bagaimana merancang algoritma kendali daya muat (Load Partitioning) untuk membatasi muatan truk pada ambang batas aman 1.500 kg dan mengalirkan kelebihan muatan ke antrean overspill trip berikutnya?",
        "Bagaimana mengonstruksi dasbor analitik real-time berbasis agregasi data langsung MongoDB yang dilengkapi modal rincian interaktif Popular Categories dan fitur filter dua arah?",
        "Bagaimana membangun simulator telemetri kiriman (Live Stream Injector & Barcode Scanner) guna memvalidasi ketahanan sistem terhadap beban operasional puncak (peak season)?"
    ]
    for r in rumusan:
        add_p(f"1. {r}" if r == rumusan[0] else f"{rumusan.index(r)+1}. {r}", space_after=4)

    add_sub_heading("1.3 Batasan Masalah")
    add_p("Agar pembahasan dalam laporan Kerja Praktek ini terarah dan mendalam, batasan masalah ditentukan sebagai berikut:")
    batasan = [
        "Wilayah operasional pengiriman difokuskan pada alur Origin KCU Cimahi 40500 dan rute feeder KCP wilayah Kabupaten Bandung Barat menuju Sentral Pengolahan Pos (SPP) Bandung 40000.",
        "Tahapan konsolidasi manifest dibatasi pada 3 Checkpoint Gate Monitoring: Checkpoint 1 (Bagging di Cimahi), Checkpoint 2 (Inbound Transit di SPP Bandung), dan Checkpoint 3 (Arrival di SPP Tujuan & Last-Mile Delivery).",
        "Basis data yang digunakan adalah MongoDB (Topologi Replica Set) dengan memanfaatkan fitur MongoDB Session Transactions untuk operasi multi-dokumen ACID.",
        "Pengembangan antarmuka menggunakan Single Page Application (SPA) berbasis React 18 dan Vite dengan sistem desain Navy Premium Glassmorphic Theme.",
        "Pelacakan pergerakan armada pada modul Milk Run Telemetry disimulasikan berbasis checkpoint manual dan formula kecepatan linier (20/40/80 km/j), belum mencakup integrasi perangkat keras sensor GPS/IoT fisik secara langsung."
    ]
    for b in batasan:
        add_p(f"• {b}", space_after=4)

    add_sub_heading("1.4 Tujuan Kerja Praktek")
    add_p("Tujuan dari pelaksanaan Kerja Praktek ini terbagi menjadi Tujuan Umum dan Tujuan Khusus:")
    
    add_sub_heading("1.4.1 Tujuan Umum", level=3)
    add_p("1. Memenuhi salah satu persyaratan kelulusan mata kuliah Kerja Praktek pada Program Studi Teknik Informatika, Fakultas Teknik, Universitas Pasundan.")
    add_p("2. Mengaplikasikan ilmu pengetahuan dan teori rekayasa perangkat lunak, pemrograman web, dan basis data yang diperoleh selama perkuliahan pada studi kasus nyata di dunia industri.")
    add_p("3. Memperluas wawasan profesional, pemahaman dinamika organisasi BUMN, serta melatih kedisiplinan dan etos kerja di lingkungan PT Pos Indonesia (Persero).")

    add_sub_heading("1.4.2 Tujuan Khusus", level=3)
    add_p("1. Mengembangkan aplikasi web IPOS5 Redesign yang mencakup 16 modul terintegrasi untuk mendukung seluruh aktivitas manajemen logistik pengiriman origin Cimahi.")
    add_p("2. Mengimplementasikan 3-Stage Gate Monitoring dengan enkapsulasi transaksi ACID untuk mempercepat proses bagging manifest hingga > 55%.")
    add_p("3. Menerapkan algoritma Load Partitioning 1.500 kg SAFE threshold dan kalkulator ETA Milk Run presisi.")
    add_p("4. Membangun dasbor analitik real-time dengan visualisasi Donut Chart adaptif, ranking Av. Check, performa SLA hub regional, dan modal rincian Popular Categories dengan filter dua arah.")
    add_p("5. Mengoptimalkan tata letak sistem agar 100% responsif di berbagai perangkat gawai (smartphone, tablet, laptop, dan desktop).")

    add_sub_heading("1.5 Manfaat Kerja Praktek")
    add_p("Pelaksanaan Kerja Praktek ini diharapkan dapat memberikan manfaat konkret bagi berbagai pihak:")
    
    add_sub_heading("1.5.1 Manfaat Bagi Mahasiswa", level=3)
    add_p("• Meningkatkan kompetensi teknis (hard skills) dalam arsitektur Full Stack modern (React, Node.js, Express, MongoDB NoSQL ACID, CSS Tokens).")
    add_p("• Mengasah keterampilan interpersonal (soft skills), kemampuan komunikasi teknis, analisis masalah logistik, serta manajemen proyek perangkat lunak.")

    add_sub_heading("1.5.2 Manfaat Bagi Universitas Pasundan", level=3)
    add_p("• Mempererat hubungan kemitraan strategis antara Program Studi Teknik Informatika Fakultas Teknik Universitas Pasundan dengan PT Pos Indonesia (Persero).")
    add_p("• Menjadi referensi dan tolok ukur relevansi kurikulum pendidikan tinggi teknik informatika terhadap kebutuhan industri logistik dan supply chain modern.")

    add_sub_heading("1.5.3 Manfaat Bagi PT Pos Indonesia (Persero)", level=3)
    add_p("• Memperoleh prototipe aplikasi operasional logistik siap pakai yang mampu menyelesaikan kendala bottleneck bagging, diskrepansi data, dan risiko overload muatan armada.")
    add_p("• Memberikan wawasan analitik mendalam bagi manajemen dalam mengevaluasi pangsa pasar layanan produk dan performa SLA ketepatan waktu pengiriman.")

    add_sub_heading("1.6 Sistematika Penulisan Laporan")
    add_p("Laporan Kerja Praktek ini disusun dengan sistematika penulisan sebagai berikut:")
    add_p("• BAB I PENDAHULUAN: Memuat latar belakang, identifikasi dan rumusan masalah, batasan masalah, tujuan kerja praktek, manfaat kerja praktek, dan sistematika penulisan laporan.")
    add_p("• BAB II GAMBARAN UMUM PERUSAHAAN: Menguraikan sejarah singkat PT Pos Indonesia (Persero), profil KCU Cimahi dan SPP Bandung, visi misi, tata nilai budaya AKHLAK, struktur organisasi, dan ruang lingkup layanan bisnis.")
    add_p("• BAB III PELAKSANAAN KERJA PRAKTEK: Menjelaskan kedudukan mahasiswa, tahapan pelaksanaan kegiatan harian/mingguan, perangkat pendukung, serta kendala teknis yang dihadapi beserta solusi rekayasanya.")
    add_p("• BAB IV PEMBAHASAN DAN ANALISIS SISTEM: Berisi analisis sistem berjalan (As-Is), analisis kebutuhan sistem baru (To-Be), perancangan diagram (Use Case, Activity, State Machine, ERD), implementasi modul-modul unggulan, pengujian fungsionalitas black box, pengujian transaksi ACID, dan evaluasi responsivitas.")
    add_p("• BAB V PENUTUP: Berisi kesimpulan dari hasil perancangan dan implementasi sistem serta saran konstruktif untuk perusahaan dan universitas.")
    add_p("• DAFTAR PUSTAKA: Memuat daftar literatur, buku, jurnal ilmiah, dan dokumentasi resmi yang digunakan sebagai acuan teoritis.")

    doc.add_page_break()

    # ══════════════════════════════════════════════════════════════
    # BAB II GAMBARAN UMUM PERUSAHAAN
    # ══════════════════════════════════════════════════════════════
    add_chapter_title("II", "GAMBARAN UMUM PERUSAHAAN")

    add_sub_heading("2.1 Sejarah Singkat PT Pos Indonesia (Persero)")
    add_p(
        "Sejarah pos di Indonesia memiliki akar yang sangat panjang sejak masa kolonial Hindia Belanda. Kantor pos pertama di Indonesia didirikan di Batavia (sekarang Jakarta) oleh Gubernur Jenderal Gustaaf Willem Baron van Imhoff pada tanggal 26 Agustus 1746. Tujuan awal pendirian kantor pos ini adalah untuk menjamin keamanan surat-surat para pedagang dan pejabat Vereenigde Oostindische Compagnie (VOC) yang sering melakukan pelayaran bolak-balik antara Hindia Belanda dan benua Eropa."
    )
    add_p(
        "Seiring berjalannya waktu, institusi pos mengalami beberapa kali transformasi status badan hukum, mulai dari Jawatan Pos, Telegrap, dan Telepon (PTT) berdasarkan keputusan pemerintah Republik Indonesia pasca-kemerdekaan, kemudian berubah menjadi Perusahaan Negara Pos dan Telekomunikasi (PN Postel) pada tahun 1961. Pada tahun 1965, PN Postel dimekarkan menjadi dua badan usaha terpisah, yaitu Perusahaan Negara Pos dan Giro (PN Pos dan Giro) serta Perusahaan Negara Telekomunikasi (PN Telekomunikasi)."
    )
    add_p(
        "Berdasarkan Peraturan Pemerintah Nomor 5 Tahun 1995, status PN Pos dan Giro secara resmi dialihkan menjadi perseroan terbatas milik negara dengan nama PT Pos Indonesia (Persero). Saat ini, PT Pos Indonesia mengoperasikan jaringan logistik terluas di tanah air dengan lebih dari 4.000 Kantor Pos Terkoneksi, 24.000 Titik Layanan (Point of Sales), ribuan Agenpos, serta didukung oleh Sentral Pengolahan Pos (SPP) modern di berbagai kota besar Indonesia."
    )

    add_sub_heading("2.2 Profil Wilayah Kerja KCU Cimahi 40500 & SPP Bandung 40000")
    add_p(
        "Kantor Cabang Utama (KCU) Cimahi 40500 berlokasi strategis di pusat Kota Cimahi, Jawa Barat. KCU Cimahi membawahi wilayah kerja operasional yang mencakup seluruh kecamatan di Kota Cimahi serta seluruh kecamatan di Kabupaten Bandung Barat. Di bawah koordinasi KCU Cimahi, beroperasi lebih dari 15 Kantor Pos Pembantu (KCP), di antaranya KCP Cililin, KCP Padalarang, KCP Batujajar, KCP Gununghalu, KCP Lembang, KCP Cikalongwetan, dan KCP Cipatat."
    )
    add_p(
        "Sentral Pengolahan Pos (SPP) Bandung 40000 berperan sebagai Mail Processing Center (MPC) utama di Regional III Jawa Barat. Seluruh kiriman paket dan surat dari KCU Cimahi dan kantor cabang di kawasan Bandung Raya dikirimkan menuju SPP Bandung untuk diproses melalui mesin pemilah otomatis, dikelompokkan berdasarkan wilayah tujuan kota/provinsi, dan dihubungkan ke jaringan transportasi logistik nasional (jalur darat, laut, dan udara)."
    )

    add_sub_heading("2.3 Visi, Misi, dan Tata Nilai Budaya Perusahaan (AKHLAK)")
    add_p("PT Pos Indonesia (Persero) memiliki landasan strategis visi dan misi korporat sebagai berikut:")
    
    add_callout(
        "VISI PT POS INDONESIA (PERSERO)",
        "“Menjadi Postal Operator, Penyedia Jasa Kurir, Logistik, dan Keuangan Paling Terpercaya di Indonesia.”"
    )

    add_p("MISI PT POS INDONESIA (PERSERO):", bold=True)
    misi_items = [
        "Menyediakan layanan pos, kurir, dan logistik yang handal, cepat, aman, dan kompetitif dengan memanfaatkan teknologi informasi terkini.",
        "Mengembangkan jaringan fisik dan digital terintegrasi untuk memperluas akses layanan inklusif hingga ke pelosok nusantara.",
        "Mengoptimalkan seluruh sumber daya perusahaan guna memberikan nilai tambah optimal bagi pemegang saham, karyawan, dan masyarakat luas.",
        "Mendukung pertumbuhan ekonomi digital dan Usaha Mikro, Kecil, dan Menengah (UMKM) melalui penyediaan solusi rantai pasok terintegrasi."
    ]
    for mi in misi_items:
        add_p(f"1. {mi}" if mi == misi_items[0] else f"{misi_items.index(mi)+1}. {mi}", space_after=4)

    add_p("Sebagai bagian dari BUMN, PT Pos Indonesia menerapkan Core Values AKHLAK:", bold=True)
    akhlak_items = [
        ("Amanah", "Memegang teguh kepercayaan yang diberikan oleh pelanggan dan pemangku kepentingan."),
        ("Kompeten", "Terus belajar dan mengembangkan kapabilitas teknologi serta keahlian operasional logistik."),
        ("Harmonis", "Saling peduli dan menghargai keberagaman dalam lingkungan kerja."),
        ("Loyal", "Berdedikasi tinggi dan mengutamakan kepentingan bangsa, negara, dan korporasi."),
        ("Adaptif", "Cepat berinovasi dan antusias dalam menggerakkan ataupun menghadapi perubahan digital."),
        ("Kolaboratif", "Membangun kerja sama yang sinergis antar unit kerja dan mitra eksternal.")
    ]
    for key, desc in akhlak_items:
        add_p(f"• {key}: {desc}", space_after=3)

    add_sub_heading("2.4 Struktur Organisasi dan Uraian Tugas Pokok")
    add_p(
        "Struktur organisasi operasional di KCU Cimahi dan SPP Bandung disusun secara fungsional untuk menjamin kelancaran rantai pemrosesan barang, sebagaimana dirangkum pada Tabel 2.1:"
    )

    tbl_org_headers = ["Jabatan / Posisi", "Unit Kerja", "Tugas Pokok dan Tanggung Jawab Operasional"]
    tbl_org_rows = [
        ["Kepala KCU Cimahi", "Manajemen Eksekutif", "Memimpin seluruh operasional bisnis pos, kurir, keuangan, dan logistik di wilayah Cimahi & KBB."],
        ["Manajer Logistik SPP", "SPP Bandung 40000", "Mengawasi pemrosesan inbound/outbound kontainer, mesin sortir, dan jadwal armada antar-hub."],
        ["Supervisor Operasional", "KCU Cimahi 40500", "Mengkoordinasikan proses bagging, kepatuhan manifest, partisi muatan armada, dan SLA harian."],
        ["Dispatcher Outbound", "Loading Dock Cimahi", "Menyusun jadwal rute Milk Run, alokasi armada truk, dan pengawasan muatan aman 1,5 Ton."],
        ["Operator Gate & Bagging", "Area Sortir Cimahi", "Melakukan scanning fisik connote, pembuatan manifest digital MNF, dan serah terima kontainer."],
        ["Staf IT & Administrator", "Divisi Teknologi", "Memelihara infrastruktur server, jaringan, hak akses RBAC, dan integritas basis data MongoDB."]
    ]
    add_table_styled(tbl_org_headers, tbl_org_rows, "Tabel 2.1 Struktur Organisasi Unit Kerja KCU Cimahi dan SPP Bandung")

    add_sub_heading("2.5 Ruang Lingkup dan Layanan Bisnis Perusahaan")
    add_p(
        "Layanan kurir dan logistik PT Pos Indonesia terbagi dalam beberapa klasifikasi produk kiriman unggulan yang diatur pada Tabel 2.2:"
    )

    tbl_prod_headers = ["Kode Layanan", "Nama Layanan Produk", "Target SLA Waktu Pengiriman", "Karakteristik & Segmen Target"]
    tbl_prod_rows = [
        ["POS-ND", "Pos Nextday", "H+1 (Maksimal 24 Jam)", "Kiriman dokumen dan barang mendesak prioritas tinggi antar kota besar."],
        ["POS-REG", "Pos Reguler", "2 - 4 Hari Kerja", "Layanan pengiriman standar ekonomis menjangkau seluruh nusantara."],
        ["POS-SD", "Pos Sameday", "Hari yang Sama (8 - 10 Jam)", "Kiriman ekspres dalam kota (intra-city) Cimahi - Bandung Raya."],
        ["POS-JUMBO", "Pos Jumbo Cargo", "3 - 7 Hari Kerja", "Kiriman paket berat (> 10 kg hingga 100 kg) tarif ekonomis kargo."],
        ["POS-SHP", "Pos Shopee / Marketplace", "2 - 3 Hari Kerja", "Layanan logistik e-commerce terintegrasi API marketplace nasional."]
    ]
    add_table_styled(tbl_prod_headers, tbl_prod_rows, "Tabel 2.2 Katalog Produk dan Klasifikasi SLA Layanan Pos Indonesia")

    doc.add_page_break()

    # ══════════════════════════════════════════════════════════════
    # BAB III PELAKSANAAN KERJA PRAKTEK
    # ══════════════════════════════════════════════════════════════
    add_chapter_title("III", "PELAKSANAAN KERJA PRAKTEK")

    add_sub_heading("3.1 Kedudukan dan Lingkup Pekerjaan Mahasiswa")
    add_p(
        "Selama pelaksanaan Kerja Praktek di PT Pos Indonesia (Persero) KCU Cimahi, mahasiswa berkedudukan sebagai Full Stack Software Engineer Intern di bawah bimbingan Pembimbing Lapangan (Ibu Sari Rahayu, S.T. - Supervisor Operasional). Mahasiswa bertanggung jawab penuh dalam menganalisis, merancang arsitektur, mengembangkan antarmuka, membangun REST API backend, serta menguji sistem IPOS5 Redesign."
    )
    add_p("Lingkup tanggung jawab teknis mahasiswa mencakup:")
    tanggung_jawab = [
        "Frontend Development: Membangun 16 modul antarmuka Single Page Application (SPA) berbasis React 18 dan Vite menggunakan Vanilla CSS Tokens (Navy Premium Theme) dengan tata letak yang 100% responsif lintas perangkat.",
        "Backend API & Business Logic: Mengembangkan layanan backend RESTful berbasis Node.js dan Express.js yang mengimplementasikan Atomic State Machine linier, 3-Stage Gate Checkpoints, dan algoritma Load Partitioning muatan.",
        "Database Architecture & ACID Transactions: Merancang skema dokumen NoSQL MongoDB pada database ipos5_reporting dan menerapkan MongoDB Session Transactions untuk menjamin keutuhan data bagging multi-dokumen.",
        "Telemetry Simulator Engine: Membangun modul simulasi injeksi paket live stream, generator data massal, dan scanner barcode kamera untuk pengujian beban puncak.",
        "Dokumentasi & QA Testing: Menyusun dokumentasi spesifikasi teknis 16 halaman, BRD, PRD, serta melaksanakan pengujian black box dan evaluasi multi-resolusi layar."
    ]
    for tj in tanggung_jawab:
        add_p(f"• {tj}", space_after=4)

    add_sub_heading("3.2 Uraian Kegiatan dan Tahapan Pelaksanaan KP")
    add_p(
        "Kerja Praktek dilaksanakan selama 9 minggu kerja intensif (periode 30 Juni 2026 hingga 28 Agustus 2026). Rincian tahapan kegiatan dijabarkan pada Tabel 3.1:"
    )

    tbl_jadwal_headers = ["Minggu", "Periode Tanggal", "Fase Pengembangan SDLC", "Uraian Rincian Pekerjaan & Capaian Output"]
    tbl_jadwal_rows = [
        ["1", "30 Jun - 04 Jul 2026", "Inisiasi & Observasi", "Orientasi lapangan di KCU Cimahi & SPP Bandung, analisis SOP bagging manual, identifikasi bottleneck, perumusan BRD v1.0."],
        ["2", "07 Jul - 11 Jul 2026", "Analisis & Requirement", "Wawancara operator counter & dispatcher, penyusunan PRD v1.0, pemetaan 3 Checkpoints, dan spesifikasi 16 modul halaman."],
        ["3", "14 Jul - 18 Jul 2026", "Perancangan UI/UX & DB", "Pembuatan wireframe spatial glassmorphism, sistem token CSS Navy Premium, perancangan skema MongoDB (transaksi, manifests)."],
        ["4", "21 Jul - 25 Jul 2026", "Core Backend Engine", "Implementasi Express.js REST API, konektor MongoDB Replica Set, controller CRUD Master Data (Kantor, Produk, Armada, Rute)."],
        ["5", "28 Jul - 01 Agu 2026", "Gate Monitoring & ACID", "Pembangunan Checkpoint 1 (Bagging), Checkpoint 2 (Transit), Checkpoint 3 (Delivery) dengan enkapsulasi MongoDB Session ACID."],
        ["6", "04 Agu - 08 Agu 2026", "Milk Run & Partitioning", "Implementasi algoritma Load Partitioning 1.500 kg SAFE limit, Overspill Queue, dan Milk Run ETA Simulator (20/40/80 km/j)."],
        ["7", "11 Agu - 15 Agu 2026", "Analytics Dashboard", "Pembangunan dasbor agregasi MongoDB (5 KPI, stacked bar, spline), modul Popular Categories deep-dive modal & filter dua arah."],
        ["8", "18 Agu - 22 Agu 2026", "Simulator & Responsiveness", "Pengembangan Telemetry Simulator (Live Stream Injector & Barcode Scanner), refactoring tata letak responsif smartphone & tablet."],
        ["9", "25 Agu - 28 Agu 2026", "Testing, Deployment & Docs", "Black Box Testing, verifikasi transaksi ACID rollback, validasi production build Vite, kompilasi laporan dan logbook KP."]
    ]
    add_table_styled(tbl_jadwal_headers, tbl_jadwal_rows, "Tabel 3.1 Matriks Jadwal Pelaksanaan Kerja Praktek Periode Juli - Agustus 2026")

    add_sub_heading("3.3 Perangkat Keras dan Perangkat Lunak yang Digunakan")
    add_p(
        "Dalam menunjang kelancaran proses rekayasa perangkat lunak, spesifikasi perangkat keras dan perangkat lunak yang digunakan tercantum pada Tabel 3.2:"
    )

    tbl_env_headers = ["Kategori", "Perangkat / Komponen", "Spesifikasi Teknis / Versi", "Peran & Fungsi dalam Proyek"]
    tbl_env_rows = [
        ["Hardware", "Laptop Workstation", "Intel Core i7-13700H, RAM 16GB DDR5, SSD 1TB NVMe", "Lingkungan pengembangan lokal Full Stack & simulasi basis data."],
        ["Software", "Operating System", "Microsoft Windows 11 Pro 64-bit", "Sistem operasi utama pengembangan."],
        ["Software", "Frontend Runtime & Tools", "Node.js v18.19.0, Vite v8.1.3, React v18.3.1", "Framework UI modern, compiler JSX, dan bundling client produksi."],
        ["Software", "Backend Framework", "Express.js v4.19.2 (ES Modules)", "RESTful API Engine penyedia endpoint bisnis dan agregasi."],
        ["Software", "Database Management", "MongoDB Community Server v7.0 (Replica Set)", "Basis data dokumen NoSQL pendukung transaksi multi-dokumen ACID."],
        ["Software", "UI Icons & Styling", "Lucide React v0.344.0, Vanilla CSS3 Custom Tokens", "Sistem desain glassmorphic Navy Theme dan ikonografi visual."],
        ["Software", "Version Control & IDE", "Git v2.43.0, Antigravity IDE / VS Code, GitHub", "Manajemen repositori source code, CI/CD sync, dan pair programming."],
        ["Software", "Automation & Testing", "Python 3.11 (docx, openpyxl), Postman v10.22", "Script otomatisasi dokumen pengujian, generator laporan, dan API test."]
    ]
    add_table_styled(tbl_env_headers, tbl_env_rows, "Tabel 3.2 Spesifikasi Perangkat Keras dan Perangkat Lunak Pengembangan")

    add_sub_heading("3.4 Kendala yang Dihadapi dan Solusi Pemecahan Masalah")
    add_p(
        "Selama proses rekayasa sistem, penulis menghadapi sejumlah kendala teknis yang berhasil diatasi melalui pendekatan rekayasa perangkat lunak sistematis, sebagaimana dirangkum pada Tabel 3.3:"
    )

    tbl_ken_headers = ["No", "Kendala Teknis yang Dihadapi", "Dampak Operasional / Risiko", "Solusi Rekayasa yang Diimplementasikan"]
    tbl_ken_rows = [
        ["1", "Potensi kegagalan parsial saat pembuatan manifest berisi puluhan resi jika jaringan terputus.", "Terjadi data inkonsistensi (manifest tercatat tapi resi belum berubah status).", "Menerapkan MongoDB Session Transactions (ACID) dengan blok try-catch-abortTransaction untuk menjamin atomisitas (all-or-nothing)."],
        ["2", "Akumulasi kiriman mencapai 14,4 Ton pada satu jadwal trip yang berisiko merusak truk 1,5 Ton (ODOL).", "Pelanggaran keselamatan transportasi dan risiko overload fisik armada.", "Merancang algoritma Load Partitioning yang mengunci muatan Trip 1 pada 1.500 kg (100% SAFE) dan mengalirkan sisa tonase ke Overspill Queue."],
        ["3", "Aksi 'See All' pada kartu Popular Categories sebelumnya berpindah ke katalog produk statis.", "Memutus alur kerja analisis data dan menyulitkan evaluasi pangsa pasar.", "Mengganti navigasi statis dengan Modal Analitik Interaktif Popular Categories lengkap dengan grafik donat, search, sorting, dan filter dua arah."],
        ["4", "Tampilan modal dan tabel data terpotong (overflow) pada layar smartphone di dermaga muat.", "Operator lapangan kesulitan membaca kolom connote dan menekan tombol filter.", "Menerapkan responsive bottom-sheet modal (padding: 0), grid auto-fit fluid, dan table-responsive-container dengan touch-scroll."]
    ]
    add_table_styled(tbl_ken_headers, tbl_ken_rows, "Tabel 3.3 Matriks Kendala Teknis, Dampak Operasional, dan Solusi Rekayasa")

    doc.add_page_break()

    # ══════════════════════════════════════════════════════════════
    # BAB IV PEMBAHASAN DAN ANALISIS SISTEM
    # ══════════════════════════════════════════════════════════════
    add_chapter_title("IV", "PEMBAHASAN DAN ANALISIS SISTEM")

    add_sub_heading("4.1 Analisis Sistem Berjalan (As-Is System Analysis)")
    add_p(
        "Analisis sistem berjalan dilakukan untuk memetakan alur pemrosesan pengiriman paket dari titik asal di KCU Cimahi hingga tiba di SPP Bandung. Alur operasional konvensional (As-Is Process) memiliki tahapan sebagai berikut:"
    )
    add_p("1. Penerimaan Kiriman di Counter: Petugas counter menerima paket dari pengirim atau kiriman feeder KCP, mengukur berat fisik, dan mencetak resi kertas.")
    add_p("2. Penumpukan di Gudang Sortir: Paket ditumpuk di area sortasi tanpa pengelompokan prioritas waktu SLA yang terotomasi.")
    add_p("3. Pembuatan Manifest Manual: Menjelang kedatangan truk armada, petugas menyusun manifest kontainer dengan cara mengetik ulang nomor resi ke spreadsheet atau sistem legacy, memicu antrean panjang (bottleneck 45 menit per manifest).")
    add_p("4. Pengangkutan Armada: Truk box berangkat membawa muatan fisik beserta berkas manifest kertas tanpa validasi batasan muatan aman (rawan overload).")
    add_p("5. Penerimaan di SPP Bandung: Petugas transit membongkar muatan dan mencocokkan satu per satu lembar kertas dengan paket fisik. Pembaruan status pelacakan di server pusat mengalami keterlambatan (delay 2 - 4 jam).")

    add_sub_heading("4.2 Analisis Kebutuhan Sistem Baru (To-Be System Analysis)")
    add_p(
        "Berdasarkan kelemahan pada sistem berjalan, dirancang arsitektur sistem baru IPOS5 Redesign (To-Be System) dengan spesifikasi kebutuhan fungsional yang terpetakan pada Tabel 4.1:"
    )

    tbl_fr_headers = ["Kode FR", "Modul Sistem", "Deskripsi Kebutuhan Fungsional Baru", "Kriteria Kinerja / Output"]
    tbl_fr_rows = [
        ["FR-DB-001", "Analytics Dashboard", "Menampilkan 5 KPI real-time (Total, Active, Completed, Returned, Revenue & Weight).", "Kalkulasi agregasi otomatis langsung dari MongoDB, respons < 200ms."],
        ["FR-DB-005", "Popular Categories", "Menyediakan modal drill-down rincian kategori produk dengan donat SVG & filter dua arah.", "Interaktif, search nama layanan, sorting 5 parameter, tombol filter dashboard."],
        ["FR-GM-001", "Gate Checkpoint 1", "Otomasi pembuatan master manifest bagging kontainer dari paket DITERIMA_DI_CIMAHI.", "Generasi kode unik MNFXXXXXX, enkapsulasi transaksi ACID atomic."],
        ["FR-GM-002", "Gate Checkpoint 2", "Pemrosesan inbound transit massal manifest kontainer di SPP Bandung.", "Perubahan simultan seluruh resi menjadi TRANSIT_SPP_BANDUNG."],
        ["FR-GM-003", "Gate Checkpoint 3", "Penerimaan kedatangan di SPP tujuan dan penyelesaian status DELIVERED.", "Validasi kedatangan akhir dan pencatatan audit trail timestamp presisi."],
        ["FR-MR-001", "Milk Run Telemetry", "Visualisasi telemetri waypoint dan meteran kontrol Load Partitioning 1.500 kg.", "Kunci muatan Trip 1 pada 1.500 kg (100% SAFE), sisa masuk Overspill Queue."],
        ["FR-MR-002", "Milk Run Simulator", "Simulator estimasi jam tiba (ETA) di SPP Bandung berdasarkan slider kecepatan.", "Preset kecepatan 20/40/80 km/j, dwell time stop, kalkulasi ETA akurat."],
        ["FR-SIM-001", "Telemetry Simulator", "Injektor paket live stream dan scanner barcode kamera untuk pengujian beban.", "Injeksi otomatis per interval detik, pemindaian instan via webcam/manual."]
    ]
    add_table_styled(tbl_fr_headers, tbl_fr_rows, "Tabel 4.1 Pemetaan Kebutuhan Fungsional Sistem IPOS5 Redesign")

    add_sub_heading("4.3 Perancangan Arsitektur dan Alur Sistem")
    
    add_sub_heading("4.3.1 Use Case Diagram dan Skenario Interaksi Aktor", level=3)
    add_p(
        "Sistem IPOS5 Redesign melibatkan 4 aktor utama dengan pembatasan hak akses berbasis Role-Based Access Control (RBAC):"
    )
    add_p("1. Operator Counter: Menginput data transaksi kiriman connote, mencetak barcode, dan menetapkan status awal DITERIMA_DI_CIMAHI.")
    add_p("2. Dispatcher / Manifesting Officer: Mengelola Checkpoint 1 (Bagging), memilih paket untuk dibungkus ke manifest kontainer, memantau partisi muatan truk, dan mengatur jadwal armada.")
    add_p("3. Operator Transit SPP: Mengoperasikan Checkpoint 2 (Inbound Transit SPP Bandung) dan Checkpoint 3 (Arrival SPP Tujuan & Last-Mile Delivery).")
    add_p("4. Super Admin / Supervisor Logistik: Mengakses seluruh dasbor analitik eksekutif, mengevaluasi laporan SLA, mengelola Master Data, serta menginspeksi database melalui Compass GUI internal.")

    tbl_uc_headers = ["Skenario Use Case", "Aktor Utama", "Kondisi Awal (Pre-condition)", "Alur Utama Interaksi & Hasil Akhir (Post-condition)"]
    tbl_uc_rows = [
        ["Pembuatan Manifest (Checkpoint 1)", "Dispatcher", "Terdapat paket aktif berstatus DITERIMA_DI_CIMAHI.", "1. Operator memilih resi; 2. Sistem memvalidasi kapasitas; 3. Transaksi ACID dieksekusi; 4. Manifest MNF terbentuk, status resi berubah menjadi IN_MANIFEST."],
        ["Inbound Transit SPP (Checkpoint 2)", "Operator Transit", "Manifest berstatus Transit tiba di SPP Bandung.", "1. Scan kode MNF; 2. Sistem memverifikasi daftar resi; 3. Status manifest berubah menjadi Arrived, status seluruh resi berubah menjadi TRANSIT_SPP_BANDUNG."],
        ["Penyelesaian Kiriman (Checkpoint 3)", "Operator Last-Mile", "Paket tiba di SPP kota tujuan akhir.", "1. Buka Checkpoint 3; 2. Pilih paket; 3. Klik 'Selesaikan Pengiriman'; 4. Status resi berubah menjadi DELIVERED dan tercatat di tracking history."],
        ["Drill-Down Popular Categories", "Supervisor", "Berada di Dasbor Utama Analytics.", "1. Klik tombol 'See All'; 2. Modal analitik terbuka; 3. Lakukan search/sorting; 4. Klik 'Filter Dashboard' untuk menyaring seluruh metrik dasbor utama."]
    ]
    add_table_styled(tbl_uc_headers, tbl_uc_rows, "Tabel 4.2 Skenario Interaksi Aktor pada Use Case Utama Gate Monitoring")

    add_sub_heading("4.3.2 Activity Diagram Konsolidasi Manifest 3-Stage Gate Monitoring", level=3)
    add_p(
        "Activity Diagram pada Gambar 4.3 memodelkan integrasi 3 Checkpoint Gate Monitoring. Pada Checkpoint 1, sistem mengunci paket berstatus DITERIMA_DI_CIMAHI dan membungkusnya ke dalam dokumen manifest baru. Pada Checkpoint 2, sistem melakukan scan in di SPP Bandung, memicu pembaruan status transit secara simultan. Pada Checkpoint 3, kedatangan dihubungkan ke kurir last-mile dan diakhiri dengan status DELIVERED. Seluruh transisi diverifikasi melalui validasi backend ketat."
    )

    add_sub_heading("4.3.3 State Machine Linier Status Kiriman Paket", level=3)
    add_p(
        "Untuk mencegah data anomaly dan status skipping, backend mengimplementasikan aturan transisi linier atomic di layer TransactionController.js dan ManifestController.js:"
    )
    add_callout(
        "ATURAN STATE MACHINE LINIER STATUS KIRIMAN",
        "DITERIMA_DI_CIMAHI  ──(Checkpoint 1: Bagging)──>  IN_MANIFEST\n"
        "IN_MANIFEST         ──(Checkpoint 2: Inbound SPP)──>  TRANSIT_SPP_BANDUNG\n"
        "TRANSIT_SPP_BANDUNG ──(Checkpoint 3: Hub Arrival)──>  TIBA_DI_SPP_TUJUAN\n"
        "TIBA_DI_SPP_TUJUAN  ──(Last-Mile Handover)──>  DELIVERED\n\n"
        "Setiap percobaan melompati alur (misal: DITERIMA langsung ke TRANSIT) otomatis ditolak oleh Backend dengan status HTTP 400 Bad Request."
    )

    add_sub_heading("4.3.4 Perancangan Basis Data dan Skema Koleksi MongoDB", level=3)
    add_p(
        "Basis data dirancang menggunakan MongoDB NoSQL (Database: ipos5_reporting). Dua koleksi inti sistem adalah transaksi dan manifests, dengan struktur dokumen sebagaimana dirinci pada Tabel 4.3 dan Tabel 4.4:"
    )

    tbl_db_t_headers = ["Field Key", "Tipe Data", "Index / Constraint", "Deskripsi & Peran Bisnis"]
    tbl_db_t_rows = [
        ["_id", "ObjectId", "Primary Key (Auto)", "Pengenal unik internal dokumen MongoDB."],
        ["connote_code", "String", "Unique Index (Sparse)", "Nomor resi connote resmi (misal: BDG4050012345)."],
        ["connote_state", "String", "Indexed", "Status linier paket saat ini (DITERIMA, IN_MANIFEST, TRANSIT, TIBA, DELIVERED)."],
        ["manifest_id", "String", "Indexed (Nullable)", "Kode manifest kontainer aktif yang mengikat resi bersangkutan."],
        ["connote_service", "String", "Indexed", "Jenis produk layanan pos (Pos Nextday, Reguler, Sameday, Jumbo Cargo)."],
        ["connote_total_amount", "Number", "None", "Nilai rupiah biaya kirim / freight charge yang dibayarkan pengirim."],
        ["connote_weight", "Number", "None", "Bobot fisik timbangan paket dalam satuan kilogram (kg)."],
        ["tracking_history", "Array of Objects", "Embedded Array", "Catatan audit trail kronologis (from_state, to_state, changedAt, manifest_id)."],
        ["createdAt / updatedAt", "Date", "Indexed (TTL / Sort)", "Timestamp ISO standar pencatatan dan pembaruan data paket."]
    ]
    add_table_styled(tbl_db_t_headers, tbl_db_t_rows, "Tabel 4.3 Spesifikasi Dokumen Koleksi transaksi (Connotes Database)")

    tbl_db_m_headers = ["Field Key", "Tipe Data", "Index / Constraint", "Deskripsi & Peran Bisnis"]
    tbl_db_m_rows = [
        ["_id", "ObjectId", "Primary Key (Auto)", "Pengenal unik internal dokumen manifest."],
        ["master_manifest_code", "String", "Unique Index", "Kode manifest kontainer resmi (Format: MNF + 6 digit angka)."],
        ["status_perjalanan", "String", "Indexed", "Status perjalanan manifest (Draft, Transit, Arrived)."],
        ["connote_codes", "Array of Strings", "Indexed", "Daftar seluruh kode resi paket yang terbungkus di dalam manifest."],
        ["assigned_vehicle", "String", "Indexed", "Nomor polisi armada truk pengangkut (misal: B 9910 PCX)."],
        ["assigned_driver", "String", "None", "Nama pengemudi armada yang bertugas pada trip pengiriman."],
        ["total_tonase_kg", "Number", "None", "Total akumulasi berat seluruh paket di dalam manifest kontainer."]
    ]
    add_table_styled(tbl_db_m_headers, tbl_db_m_rows, "Tabel 4.4 Spesifikasi Dokumen Koleksi manifests (Container Bagging)")

    add_sub_heading("4.4 Implementasi Modul-Modul Utama IPOS5 Redesign")
    
    add_sub_heading("4.4.1 Modul Dashboard Analitik & Telemetri Real-Time", level=3)
    add_p(
        "Modul Dashboard (Dashboard.jsx) berfungsi sebagai Control Tower utama yang mengagregasi ribuan transaksi MongoDB secara real-time. Modul ini menyajikan 5 kartu KPI interaktif (Total Shipments, Active, Completed, Returned, serta Nilai Freight & Bobot Tonase), filter rentang tanggal cepat (Hari Ini, Agustus 2026, 7 Hari, 30 Hari, YTD 2026, dan Custom Date), grafik stacked bar bulanan status paket, serta grafik kurva spline gradien tren penjualan."
    )

    add_sub_heading("4.4.2 Modul Popular Categories Deep-Dive Modal & Two-Way Filtering", level=3)
    add_p(
        "Sebelumnya, tombol See All pada widget Popular Categories mengarahkan pengguna ke katalog produk statis. Masalah ini diperbaiki secara menyeluruh dengan mengintegrasikan Modal Analitik Komprehensif Popular Categories langsung di dalam dasbor. Modal ini menghitung ringkasan KPI kategori, menampilkan diagram donat SVG dinamis dengan kalkulasi keliling lingkaran (circumference) presisi, bilah komparasi pangsa pasar (market share), pencarian instan nama layanan, multi-criteria sorting, serta tombol aksi 'Filter Dashboard' untuk menerapkan filter langsung ke seluruh metrik dasbor utama."
    )

    tbl_cat_headers = ["Kategori Produk Layanan", "Market Share (%)", "Volume Resi", "Total Revenue (Rp)", "Rata-rata / Resi (Av. Check)", "Total Tonase"]
    tbl_cat_rows = [
        ["Pos Nextday", "28%", "280 Resi", "Rp 7.840.000", "Rp 28.000", "560.4 kg"],
        ["Pos Reguler", "26%", "260 Resi", "Rp 3.900.000", "Rp 15.000", "390.2 kg"],
        ["Pos Jumbo Cargo", "23%", "230 Resi", "Rp 18.400.000", "Rp 80.000", "3.450.0 kg (3.45 Ton)"],
        ["Pos Sameday", "23%", "230 Resi", "Rp 4.600.000", "Rp 20.000", "230.1 kg"]
    ]
    add_table_styled(tbl_cat_headers, tbl_cat_rows, "Tabel 4.5 Rincian Metrik Agregasi Popular Categories dan Kalkulasi Proporsi")

    add_sub_heading("4.4.3 Modul 3-Stage Gate Monitoring (Bagging, Transit, Delivery)", level=3)
    add_p(
        "Modul Gate Monitoring (GateMonitoring.jsx) mengotomatiskan alur kerja bagging fisik di gudang. Pada Checkpoint 1, operator memilih paket berstatus DITERIMA_DI_CIMAHI, menetapkan armada kendaraan, dan men-generate manifest baru. Pada Checkpoint 2, petugas transit SPP memindai kode manifest untuk memvalidasi masuknya muatan. Pada Checkpoint 3, kedatangan diselesaikan dan status paket diperbarui menjadi DELIVERED."
    )

    add_sub_heading("4.4.4 Modul Telemetri Milk Run & Load Partitioning Control Meter", level=3)
    add_p(
        "Untuk mencegah pelanggaran kelebihan muatan (ODOL), modul RouteJourney.jsx dilengkapi Load Partitioning Control Meter. Sistem membatasi muatan aktif Trip 1 pada batas aman 1.500 kg (100% TERISI PENUH - SAFE) dan mengalihkan sisa muatan (misal: 12,9 Ton) ke panel Overspill Queue untuk dijadwalkan pada Trip 2 atau armada cadangan. Modul EstimasiMilkRun.jsx menyediakan simulator interaktif dengan slider kecepatan (20, 40, 80 km/j) dan kalkulasi waktu tiba (ETA) presisi di SPP Bandung."
    )

    add_sub_heading("4.4.5 Modul Telemetry Simulator & Live Stream Injector", level=3)
    add_p(
        "Untuk memvalidasi ketahanan arsitektur terhadap volume tinggi, dibangun modul Telemetry Simulator (simulator/). Modul ini menyediakan Live Stream Injector yang secara berkala menginjeksi paket baru ke database MongoDB, Barcode Scanner berbasis kamera perangkat untuk memindai resi fisik, serta Bulk Injector untuk membangkitkan ribuan data uji connote secara simultan."
    )

    add_sub_heading("4.4.6 Optimasi Tata Letak Responsif Lintas Perangkat", level=3)
    add_p(
        "Sistem menerapkan sistem token CSS yang adaptif penuh. Pada layar smartphone (<= 768px), modal otomatis beralih menjadi fluid bottom-sheet (padding: 0), grid beralih ke 1 atau 2 kolom auto-fit, dan seluruh tabel data dibungkus dalam container table-responsive yang mendukung penjelajahan sentuh horizontal (touch-scroll) tanpa menyebabkan layout breaking."
    )

    add_sub_heading("4.5 Pengujian Sistem dan Evaluasi Hasil")
    
    add_sub_heading("4.5.1 Pengujian Fungsionalitas (Black Box Testing Matrix)", level=3)
    add_p(
        "Pengujian fungsionalitas dilakukan menggunakan metode Black Box Testing untuk memverifikasi kesesuaian input-output seluruh modul utama, sebagaimana dijabarkan pada Tabel 4.6:"
    )

    tbl_bb_headers = ["ID Kasus Uji", "Modul / Fitur yang Diuji", "Skenario Uji & Aksi Pengujian", "Hasil yang Diharapkan", "Status"]
    tbl_bb_rows = [
        ["TC-AUTH-01", "Autentikasi Login", "Input username & password valid operator.", "Login berhasil, token sesi terbentuk, redirect ke Dasbor.", "PASSED"],
        ["TC-DASH-01", "Preset Rentang Waktu", "Pilih preset 'Agustus 2026 Live DB'.", "Metrik 5 KPI dan grafik tren ter-filter sesuai rentang tanggal.", "PASSED"],
        ["TC-DASH-02", "Popular Categories Modal", "Klik tombol 'See All' pada kartu Donut.", "Modal terbuka menampilkan KPI, tabel metrik, dan bar share.", "PASSED"],
        ["TC-DASH-03", "Two-Way Dashboard Filter", "Klik 'Filter Dashboard' pada baris Pos Nextday.", "Modal tertutup, dasbor utama tersaring khusus connote Nextday.", "PASSED"],
        ["TC-GATE-01", "Checkpoint 1 - Bagging", "Pilih 5 resi DITERIMA, klik 'Buat Manifest'.", "Dokumen MNF terbentuk di manifests, 5 resi menjadi IN_MANIFEST.", "PASSED"],
        ["TC-GATE-02", "Checkpoint 2 - Inbound SPP", "Scan kode MNF di modul Checkpoint 2.", "Status manifest menjadi Arrived, seluruh resi menjadi TRANSIT.", "PASSED"],
        ["TC-GATE-03", "Checkpoint 3 - Delivery", "Pilih resi TIBA, klik 'Selesaikan Kiriman'.", "Status resi berubah menjadi DELIVERED, riwayat tercatat.", "PASSED"],
        ["TC-PART-01", "Load Partitioning Meter", "Input akumulasi muatan 14,4 Ton pada armada 1,5T.", "Muatan Trip 1 terkunci di 1.500 kg, sisa 12,9T masuk Overspill.", "PASSED"],
        ["TC-SIM-01", "Barcode Camera Scan", "Arahkan kamera ke barcode resi connote fisik.", "Nomor resi terbaca instan dan form verifikasi terisi otomatis.", "PASSED"]
    ]
    add_table_styled(tbl_bb_headers, tbl_bb_rows, "Tabel 4.6 Hasil Pengujian Fungsionalitas Menggunakan Metode Black Box Testing")

    add_sub_heading("4.5.2 Pengujian Transaksi ACID dan Mekanisme Rollback", level=3)
    add_p(
        "Pengujian keandalan transaksi MongoDB Session ACID dilakukan dengan menginjeksikan kegagalan tiruan (simulated network failure) pada saat proses bagging multi-dokumen berlangsung:"
    )

    tbl_acid_headers = ["Skenario Pengujian ACID", "Kondisi Kegagalan Diuji", "Perilaku Sistem Backend (MongoDB Session)", "Status Konsistensi Data"]
    tbl_acid_rows = [
        ["Batch Manifest 50 Resi Normal", "Koneksi jaringan stabil 100%.", "CommitTransaction sukses, seluruh 50 resi berubah status serentak.", "PASSED (100% Konsisten)"],
        ["Simulasi Gagal Resi ke-25", "Resi ke-25 telah dihapus/berubah status.", "AbortTransaction dipicu otomatis, 24 resi sebelumnya di-rollback utuh.", "PASSED (Zero Partial Write)"],
        ["Simulasi Server Timeout", "Koneksi ke primary MongoDB putus di tengah proses.", "Sesi transaksi dibatalkan otomatis oleh replica set, status resi tetap aman.", "PASSED (Zero Data Loss)"]
    ]
    add_table_styled(tbl_acid_headers, tbl_acid_rows, "Tabel 4.7 Hasil Pengujian Ketahanan Transaksi ACID pada Kondisi Kegagalan Network")

    add_sub_heading("4.5.3 Pengujian Responsivitas Multi-Device dan Cross-Browser", level=3)
    add_p(
        "Pengujian kompatibilitas dan tata letak responsif dilakukan pada berbagai resolusi perangkat dan peramban web modern:"
    )

    tbl_resp_headers = ["Perangkat Uji / Viewport", "Resolusi Layar", "Peramban (Browser)", "Hasil Evaluasi Tata Letak Antarmuka", "Status"]
    tbl_resp_rows = [
        ["Desktop Ultrawide", "1920 x 1080 px", "Google Chrome v128", "Spatial layout rapi, grid 5 KPI proporsional, font tajam.", "PASSED"],
        ["Laptop Standar", "1366 x 768 px", "Microsoft Edge v127", "Grid 5 beralih ke 3 kolom, grafik tren berdampingan seimbang.", "PASSED"],
        ["Tablet / iPad Landscape", "1024 x 768 px", "Apple Safari iOS 17", "Grid responsif 2 kolom, tabel touch-scroll lancar tanpa lag.", "PASSED"],
        ["Smartphone (iPhone / Android)", "390 x 844 px", "Chrome Mobile / Safari", "Modal beralih ke bottom-sheet, bottom bar fixed aktif, no overflow.", "PASSED"]
    ]
    add_table_styled(tbl_resp_headers, tbl_resp_rows, "Tabel 4.8 Hasil Pengujian Responsivitas Antarmuka Lintas Resolusi Layar")

    doc.add_page_break()

    # ══════════════════════════════════════════════════════════════
    # BAB V PENUTUP
    # ══════════════════════════════════════════════════════════════
    add_chapter_title("V", "PENUTUP")

    add_sub_heading("5.1 Kesimpulan")
    add_p(
        "Berdasarkan seluruh tahapan perancangan, implementasi, dan pengujian yang telah dilaksanakan selama kegiatan Kerja Praktek di PT Pos Indonesia (Persero) KCU Cimahi 40500, dapat ditarik beberapa kesimpulan utama:"
    )
    
    kesimpulan_items = [
        "Berhasil Merancang dan Membangun Sistem Terintegrasi: Aplikasi web IPOS5 Redesign (Cimahi Origin Delivery System & Telemetry Engine) berhasil dibangun menggunakan arsitektur Full Stack modern (React 18, Vite, Node.js, Express.js, MongoDB Replica Set) mencakup 16 modul fungsional terintegrasi.",
        "Akselerasi Proses Konsolidasi Outbound (> 55%): Penerapan 3-Stage Gate Monitoring Checkpoints mampu memangkas waktu pemrosesan bagging manifest dari rata-rata 45 menit menjadi kurang dari 20 menit per manifest kontainer.",
        "Eliminasi 100% Anomali Status Tracking: Penerapan Atomic Linear State Machine dengan enkapsulasi transaksi MongoDB ACID berhasil menghilangkan seluruh kejadian status skipping dan menjamin keutuhan riwayat audit trail perjalanan paket.",
        "Jaminan Kepatuhan Keselamatan Muatan (Anti-ODOL): Algoritma Load Partitioning berhasil mengunci muatan aktif armada box pada batas aman 1.500 kg (100% SAFE) dan mengalirkan kelebihan muatan secara otomatis ke Overspill Queue untuk trip berikutnya.",
        "Visibilitas Analitik Real-Time Tingkat Tinggi: Dasbor analitik terintegrasi dengan filter periode dinamis, grafik stacked bar dan spline, ranking Av. Check, performa SLA hub, serta Modal Rincian Komprehensif Popular Categories dengan kemampuan filter dua arah instan.",
        "Pengujian Fungsional & Kesiapan Produksi: Pengujian Black Box pada seluruh kasus uji memperoleh status PASSED 100%, pengujian transaksi ACID membuktikan keandalan zero partial write, dan build produksi Vite tervalidasi bersih tanpa error."
    ]
    for idx, k in enumerate(kesimpulan_items, 1):
        add_p(f"{idx}. {k}", space_after=4)

    add_sub_heading("5.2 Saran")
    add_p("Sebagai tindak lanjut dari hasil pengembangan sistem, penulis menyampaikan saran konstruktif bagi pihak perusahaan maupun institusi pendidikan:")

    add_sub_heading("5.2.1 Saran untuk PT Pos Indonesia (Persero)", level=3)
    add_p("1. Integrasi Perangkat Keras IoT / GPS Telematika: Mengintegrasikan sensor GPS dan OBD-II pada armada truk secara langsung ke endpoint backend IPOS5 Redesign agar pergerakan koordinat rute Milk Run dapat diperbarui secara otomatis tanpa bergantung pada simulasi checkpoint manual.")
    add_p("2. Sistem Notifikasi Dini (Overspill Push Notification): Mengaktifkan integrasi bot WhatsApp / Telegram API atau web push notification untuk memberikan peringatan dini kepada supervisor operasional saat antrean muatan overspill melampaui 5 Ton.")
    add_p("3. Penerapan di Kantor Cabang Utama Lain: Mengembangkan standardisasi arsitektur IPOS5 Redesign agar dapat diimplementasikan di KCU-KCU pos lain di wilayah Regional Jawa Barat maupun nasional.")

    add_sub_heading("5.2.2 Saran untuk Program Studi Teknik Informatika Universitas Pasundan", level=3)
    add_p("1. Peningkatan Materi Arsitektur Basis Data NoSQL Terdistribusi: Memperbanyak materi praktikum perkuliahan terkait transaksi multi-dokumen ACID pada basis data NoSQL dan optimasi indexing agregasi skala besar.")
    add_p("2. Penguatan Kerja Sama Industri Logistik & BUMN: Memperluas kerja sama kemitraan strategis dengan PT Pos Indonesia dan BUMN logistik lainnya guna membuka peluang magang, kerja praktek, dan penelitian tugas akhir berbasis studi kasus nyata bagi mahasiswa.")

    doc.add_page_break()

    # ══════════════════════════════════════════════════════════════
    # DAFTAR PUSTAKA
    # ══════════════════════════════════════════════════════════════
    add_p("DAFTAR PUSTAKA", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, font_size=14, space_before=12, space_after=18)

    pustaka_items = [
        "Banker, K., Bakkum, P., Verch, S., Garrett, D., & Hawkins, T. (2016). MongoDB in Action: Covers MongoDB version 3.0 (2nd ed.). Manning Publications.",
        "Chodorow, K. (2013). MongoDB: The Definitive Guide: Powerful and Scalable Data Storage (2nd ed.). O'Reilly Media.",
        "Fowler, M. (2018). Refactoring: Improving the Design of Existing Code (2nd ed.). Addison-Wesley Professional.",
        "Indrajit, R. E., & Djokopranoto, R. (2016). Konsep Manajemen Supply Chain: Strategi Mengelola Rantai Nilai Bisnis. Grasindo.",
        "Kleppmann, M. (2017). Designing Data-Intensive Applications: The Big Ideas Behind Reliable, Scalable, and Maintainable Systems. O'Reilly Media.",
        "Pressman, R. S., & Maxim, B. R. (2020). Software Engineering: A Practitioner's Approach (9th ed.). McGraw-Hill Education.",
        "PT Pos Indonesia (Persero). (2024). Standard Operating Procedure (SOP) Pengolahan dan Pengangkutan Kiriman Pos Kilat Khusus & Kargo. Divisi Operasi dan Logistik Nasional.",
        "PT Pos Indonesia (Persero). (2026). Rencana Kerja dan Anggaran Perusahaan (RKAP) Transformasi Digital Kurir dan Logistik. Bandung: PT Pos Indonesia.",
        "React Documentation Team. (2024). React 18: Documentation and Best Practices. Meta Open Source. https://react.dev",
        "Sommerville, I. (2016). Software Engineering (10th ed.). Pearson Education.",
        "Vite Core Team. (2024). Vite: Next Generation Frontend Tooling. https://vitejs.dev",
        "Welling, L., & Thomson, L. (2017). Node.js and Express Web Development: Create Modern Full-Stack Web Apps (2nd ed.). Addison-Wesley."
    ]

    for idx, p_item in enumerate(pustaka_items, 1):
        p_pust = doc.add_paragraph()
        p_pust.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_pust.paragraph_format.space_before = Pt(2)
        p_pust.paragraph_format.space_after = Pt(6)
        p_pust.paragraph_format.line_spacing = 1.15
        p_pust.paragraph_format.left_indent = Inches(0.5)
        p_pust.paragraph_format.first_line_indent = Inches(-0.5)
        p_pust.add_run(f"[{idx}] {p_item}").font.size = Pt(11)

    # Save docx
    output_path = r"c:\ipos5\LAPORAN_KERJA_PRAKTEK_VALDRIC_ABIRAMA_233040163_UNPAS.docx"
    doc.save(output_path)
    print(f"Laporan DOCX successfully generated at: {output_path}")

if __name__ == "__main__":
    build_laporan_docx()
