import hashlib
import json
import re
from pathlib import Path


def prepare_rules():
    base_dir = Path(__file__).resolve().parent.parent.parent
    source_path = base_dir / "resourses" / "traffic_rules" / "1306-2001-п.md"
    output_dir = base_dir / "backend" / "data" / "traffic_rules"
    output_dir.mkdir(parents=True, exist_ok=True)

    with open(source_path, "r", encoding="utf-8") as f:
        raw_content = f.read()

    sha256 = hashlib.sha256(raw_content.encode("utf-8")).hexdigest()

    rules_pos = raw_content.find("ПРАВИЛА ДОРОЖНЬОГО РУХУ")
    end_pos = raw_content.find("ПЕРЕЛІК\\")
    if end_pos == -1:
        end_pos = raw_content.find("ПЕРЕЛІК\n")
    if end_pos == -1:
        end_pos = len(raw_content)

    body = raw_content[rules_pos:end_pos]

    # Очистка технических артефактов HTML и Pandoc
    body = re.sub(r"\[\]\{#n\d+\}", "", body)
    body = re.sub(r"\\([\'\"#\*\-_])", r"\1", body)
    body = re.sub(r"\[([^\]]+)\]\(/go/[^\)]+\)", r"\1", body)
    body = re.sub(r"\[([^\]]+)\]\(#[^\)]+\)", r"\1", body)
    body = re.sub(r"\[\\\[ image \\\]\]", "", body)
    body = re.sub(r"\\\[ image \\\]", "", body)
    body = re.sub(r"<div[^>]*>", "", body)
    body = re.sub(r"</div>", "", body)
    body = re.sub(r":::[^\n]*", "", body)
    body = re.sub(r"\+[-+]+\+", "", body)  # удаление границ таблиц +---+

    # Поиск разделов 1..34
    section_indices = []
    for i in range(1, 35):
        pattern = r"(?:^|\n)(" + str(i) + r"\.\s+[^\n]+)"
        m = re.search(pattern, body)
        if m:
            section_indices.append((i, m.start(1), m.group(1).strip()))

    section_indices.sort(key=lambda x: x[1])

    md_lines = ["# Правила дорожнього руху України\n"]
    total_points_count = 0
    sections_data = []

    for idx, (sec_num, start_idx, title_line) in enumerate(section_indices):
        next_start = (
            section_indices[idx + 1][1]
            if idx + 1 < len(section_indices)
            else len(body)
        )
        sec_content = body[start_idx:next_start]

        title_match = re.match(r"^\d+\.\s+(.*)$", title_line)
        sec_title = title_match.group(1).strip() if title_match else title_line
        sec_title = sec_title.rstrip("*").strip()

        md_lines.append(f"\n## Розділ {sec_num}. {sec_title}\n")

        content_after_title = sec_content[len(title_line) :].strip()

        sec_info = {
            "number": sec_num,
            "title": sec_title,
            "points": [],
        }

        if sec_num in [33, 34]:
            # Разделы знаков и дорожной разметки
            md_lines.append(content_after_title + "\n")
            sec_info["description"] = content_after_title
        else:
            point_pattern = re.compile(
                r"(?:^|\n)("
                + str(sec_num)
                + r"\.\d{1,2}(?:\.\d{1,2})?\.?)(?=\s+[А-Яа-яІіЇїЄєA-Za-z0-9\"\'«])",
                re.MULTILINE,
            )
            p_matches = list(point_pattern.finditer(content_after_title))

            if p_matches:
                preamble = content_after_title[: p_matches[0].start()].strip()
                if preamble:
                    md_lines.append(preamble + "\n")

                for p_idx, p_m in enumerate(p_matches):
                    total_points_count += 1
                    p_num_str = p_m.group(1).rstrip(".").strip()
                    p_start = p_m.start()
                    p_end = (
                        p_matches[p_idx + 1].start()
                        if p_idx + 1 < len(p_matches)
                        else len(content_after_title)
                    )
                    p_text = content_after_title[p_start:p_end].strip()

                    p_body = re.sub(
                        r"^" + re.escape(p_m.group(1)) + r"\s*", "", p_text
                    ).strip()

                    md_lines.append(
                        f"\n### Пункт {p_num_str}\n\n{p_body}\n"
                    )
                    sec_info["points"].append(
                        {
                            "number": p_num_str,
                            "text": p_body,
                        }
                    )
            else:
                md_lines.append(content_after_title + "\n")

        sections_data.append(sec_info)

    clean_md = "\n".join(md_lines)
    clean_md = re.sub(r"\n{3,}", "\n\n", clean_md)

    md_file = output_dir / "traffic_rules.md"
    with open(md_file, "w", encoding="utf-8") as f:
        f.write(clean_md)

    metadata = {
        "title": "Правила дорожнього руху України",
        "document_number": "1306",
        "document_type": "Постанова Кабінету Міністрів України",
        "adoption_date": "2001-10-10",
        "edition_date": "2022-02-16",
        "fetch_date": "2026-11-23",
        "source_url": "https://zakon.rada.gov.ua/laws/show/1306-2001-%D0%BF#Text",
        "status": "Чинний",
        "sha256_original": sha256,
        "sections_count": len(section_indices),
        "numbered_points_count": total_points_count,
        "file_path": "backend/data/traffic_rules/traffic_rules.md",
    }

    with open(output_dir / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    print("Success: Markdown and metadata generated.")
    print(f"Sections parsed: {len(section_indices)}")
    print(f"Numbered points parsed: {total_points_count}")
    print(f"Markdown size: {len(clean_md)} characters")


if __name__ == "__main__":
    prepare_rules()
