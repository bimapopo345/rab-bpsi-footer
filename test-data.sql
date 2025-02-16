-- Test data untuk AHS
INSERT INTO ahs (user_id, kelompok, kode_ahs, ahs, satuan) 
VALUES 
(1, 'PEKERJAAN TANAH', 'A.1.01.a1', '1 m2 Pembersihan dan pengupasan permukaan tanah', 'm2'),
(1, 'PEKERJAAN TANAH', 'A.1.01.b1.1', '1 m3 Galian tanah sedalam 0 s.d. 1 m', 'm3');

-- Test data untuk materials
INSERT INTO materials (user_id, category, kode, name, unit, price)
VALUES
(1, 'TENAGA', 'L.01', 'Mandor', 'OH', 89250),
(1, 'TENAGA', 'L.02', 'Kepala Tukang', 'OH', 84000),
(1, 'TENAGA', 'L.03', 'Pekerja', 'OH', 73500),
(1, 'ALAT', 'E.01', 'Jack Hammer', 'jam', 150000);

-- Test data untuk pricing
INSERT INTO pricing (user_id, ahs_id, material_id, koefisien)
SELECT 1, a.id, m.id, 
  CASE 
    WHEN m.category = 'TENAGA' THEN 0.05
    ELSE 0.02
  END
FROM ahs a 
CROSS JOIN materials m 
WHERE a.user_id = 1 AND m.user_id = 1;
