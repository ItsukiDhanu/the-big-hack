#!/usr/bin/env python3
"""Match shortlisted teams to their registration-form member names."""
import json
import posixpath
import re
import subprocess
import sys
import unicodedata
import zipfile
from xml.etree import ElementTree as ET

if len(sys.argv) != 3:
    raise SystemExit("Usage: extract-team-members.py REGISTRATION.xlsx FINAL_LISTS.pdf")

workbook_path, pdf_path = sys.argv[1:]
source = open("app/data/hack.ts", encoding="utf8").read()
list_block = re.search(r"export const PHASE_ONE_TEAMS = \[([\s\S]*?)\] as const;", source)
if not list_block:
    raise SystemExit("Could not find the Phase 1 list in app/data/hack.ts.")
public_names = re.findall(r'^\s*"((?:[^"\\]|\\.)*)",?\s*$', list_block.group(1), re.M)


def normalize(value):
    value = unicodedata.normalize("NFKD", value).casefold()
    return "".join(char for char in value if char.isalnum())


pdf_text = subprocess.check_output(["pdftotext", "-layout", pdf_path, "-"], text=True)
pdf_rows = []
for line in pdf_text.splitlines():
    match = re.match(r"^\s*(\d{1,2})\s{2,}(.*?)\s{2,}(.*?)\s{2,}([^\s@]+@[^\s]+)\s*$", line)
    if not match:
        continue
    if not 1 <= int(match[1]) <= 50:
        continue
    pdf_rows.append({
        "order": int(match[1]),
        "name": re.sub(r"[■□◆●†*]+$", "", match[2]).strip(),
        "email": match[4].strip().lower(),
    })
selected_pdf_rows = [row for index, row in enumerate(pdf_rows) if row["order"] == index + 1]
if len(public_names) != 50 or len(selected_pdf_rows) != 50:
    raise SystemExit(f"Expected 50 public and PDF shortlist entries; found {len(public_names)} and {len(selected_pdf_rows)}.")

namespace = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "relationships": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}
with zipfile.ZipFile(workbook_path) as archive:
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    rels = {item.attrib["Id"]: item.attrib["Target"] for item in relationships}
    shared = []
    if "xl/sharedStrings.xml" in archive.namelist():
        shared_root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
        shared = [
            "".join(node.text or "" for node in item.findall(".//main:t", namespace))
            for item in shared_root.findall("main:si", namespace)
        ]
    sheet = workbook.find("main:sheets/main:sheet", namespace)
    if sheet is None:
        raise SystemExit("The registration workbook has no worksheet.")
    target = rels[sheet.attrib["{" + namespace["relationships"] + "}id"]].lstrip("/")
    if not target.startswith("xl/"):
        target = posixpath.normpath(posixpath.join("xl", target))
    root = ET.fromstring(archive.read(target))

    def column_index(reference):
        letters = re.match(r"([A-Z]+)", reference).group(1)
        result = 0
        for letter in letters:
            result = result * 26 + ord(letter) - 64
        return result

    def cell_value(cell):
        kind = cell.attrib.get("t")
        if kind == "inlineStr":
            return "".join(node.text or "" for node in cell.findall(".//main:t", namespace)).strip()
        node = cell.find("main:v", namespace)
        if node is None:
            return ""
        return (shared[int(node.text)] if kind == "s" else node.text).strip()

    registrations = []
    for row in root.findall(".//main:sheetData/main:row", namespace):
        cells = {column_index(cell.attrib["r"]): cell_value(cell) for cell in row.findall("main:c", namespace)}
        team = cells.get(2, "").strip()
        if not team:
            continue
        registrations.append({
            "row": int(row.attrib["r"]),
            "team": team,
            "leader": cells.get(3, "").strip(),
            "leader_email": cells.get(4, "").strip().lower(),
            "team_size": cells.get(10, "").strip(),
            "members": [cells.get(index, "").strip() for index in (11, 13, 15)],
        })

result = []
slugs = set()
for index, (public_name, shortlist) in enumerate(zip(public_names, selected_pdf_rows), start=1):
    if shortlist["order"] != index or normalize(public_name) != normalize(shortlist["name"]):
        raise SystemExit(f"Shortlist mismatch at position {index}; no database changes were made.")
    slug = re.sub(r"[^a-z0-9]+", "-", unicodedata.normalize("NFKD", shortlist["name"]).casefold())
    slug = slug.strip("-") or "team"
    if slug in slugs:
        raise SystemExit(f"Duplicate team slug at position {index}.")
    slugs.add(slug)
    matches = [
        row for row in registrations
        if normalize(row["team"]) == normalize(shortlist["name"])
        and row["leader_email"] == shortlist["email"]
    ]
    if not matches:
        raise SystemExit(f"No original form row matches shortlisted team {index}; no database changes were made.")
    selected = matches[-1]
    if not selected["leader"]:
        raise SystemExit(f"The original form has no leader name for {shortlist['name']}.")
    members = [selected["leader"]] + [name for name in selected["members"] if name and name != "-"]
    size_match = re.match(r"^\s*(\d+)", selected["team_size"])
    result.append({
        "order": index,
        "slug": slug,
        "name": selected["team"],
        "members": members,
        "sourceRow": selected["row"],
        "matchingForms": len(matches),
        "declaredSize": int(size_match[1]) if size_match else None,
    })

print(json.dumps(result, ensure_ascii=False))
