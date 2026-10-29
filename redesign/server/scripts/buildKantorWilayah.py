"""Copy only the administrative reference needed by /kantor from wilayah-master.

Run with: python scripts/buildKantorWilayah.py
The source SQL files are read only. Generated JSON is committed with the app.
"""
import json
import re
from collections import Counter
from pathlib import Path

SOURCE = Path(r"C:\Users\Asus\Documents\POSIND\wilayah-master\db")
DEST = Path(__file__).resolve().parents[1] / "data" / "kantor-wilayah"
ROW = re.compile(r"^\('([0-9.]+)','((?:''|[^'])*)'\)[,;]?$")
GEO_HEAD = re.compile(r"^\('([0-9.]+)','(?:''|[^'])*','(?:''|[^'])*',\s*([^,]+),\s*([^,]+),")
GEO_PATH = re.compile(r",\s*'(\[\[.*\]\])',\s*(?:[0-9]+|NULL)\);?$")


def parent(code):
    return code.rsplit('.', 1)[0] if '.' in code else None


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    rows = []
    seen = set()
    duplicates = []
    for line in (SOURCE / "wilayah.sql").open(encoding="utf-8-sig"):
        match = ROW.match(line.strip())
        if not match:
            continue
        code, name = match.groups()
        if code in seen:
            duplicates.append(code)
        seen.add(code)
        rows.append([code, name.replace("''", "'")])

    codes = {code for code, _ in rows}
    names = {}
    for code, name in rows:
        names.setdefault(name.casefold(), []).append(code)
    duplicate_names = {name: values for name, values in names.items() if len(values) > 1}
    orphan = [code for code, _ in rows if parent(code) and parent(code) not in codes]
    counts = Counter(len(code.split('.')) for code, _ in rows)
    if duplicates or orphan or set(counts) != {1, 2, 3, 4}:
        raise ValueError(f"Invalid hierarchy: duplicates={duplicates[:5]}, orphans={orphan[:5]}, levels={counts}")

    geo = {}
    invalid_coordinates = []
    for line in (SOURCE / "wilayah_level_1_2.sql").open(encoding="utf-8-sig"):
        head = GEO_HEAD.match(line)
        if not head:
            continue
        code, lat, lng = head.groups()
        if code not in codes or len(code.split('.')) > 2:
            continue
        try:
            lat, lng = float(lat), float(lng)
            if not (-90 <= lat <= 90 and -180 <= lng <= 180):
                raise ValueError()
        except ValueError:
            invalid_coordinates.append(code)
            lat = lng = None
        path = GEO_PATH.search(line.strip())
        geo[code] = {"lat": lat, "lng": lng}
        if path:
            try:
                geo[code]["rings"] = json.loads(path.group(1))
            except json.JSONDecodeError:
                pass

    (DEST / "wilayah.json").write_text(json.dumps(rows, ensure_ascii=False, separators=(',', ':')), encoding="utf-8")
    (DEST / "geometry.json").write_text(json.dumps(geo, ensure_ascii=False, separators=(',', ':')), encoding="utf-8")
    report = {"source": "wilayah-master/db/wilayah.sql; wilayah_level_1_2.sql", "counts": counts,
              "duplicates": duplicates, "orphans": orphan, "invalidCoordinates": invalid_coordinates,
              "duplicateNameGroups": len(duplicate_names), "duplicateNameExamples": dict(list(duplicate_names.items())[:5]),
              "geometryEntries": len(geo), "boundaryEntries": sum('rings' in value for value in geo.values()),
              "missingBoundaries": [code for code, value in geo.items() if 'rings' not in value]}
    (DEST / "validation.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(report)


if __name__ == "__main__":
    main()
