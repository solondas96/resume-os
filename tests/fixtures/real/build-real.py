"""
Builds the real-world fixtures.

Each resume is written as a DOCX with python-docx, then converted to PDF by LibreOffice (soffice).
That makes the PDFs LibreOffice Writer exports. The names, companies and contact details are invented.
Run: python3 tests/fixtures/real/build-real.py   (needs python-docx, Pillow and soffice on PATH)

The expected JSON is written from the same data, with dates already in canonical form
("Mar 2019 – Present"), so scoring does not depend on the date parser being right.
"""
import json, os, subprocess, tempfile
from docx import Document
from docx.shared import Mm, Pt, Inches
from docx.enum.section import WD_ORIENT
from PIL import Image, ImageDraw, ImageFont
from real_specs import SPECS

HERE = os.path.dirname(os.path.abspath(__file__))
PDF_DIR = os.path.join(HERE, 'pdf')
EXP_DIR = os.path.join(HERE, 'expected')
SRC_DIR = os.path.join(HERE, 'src')
os.makedirs(PDF_DIR, exist_ok=True)
os.makedirs(EXP_DIR, exist_ok=True)
os.makedirs(SRC_DIR, exist_ok=True)


def make_docx(spec, path):
    doc = Document()
    size = spec.get('page', 'A4')
    sec = doc.sections[0]
    if size == 'Letter':
        sec.page_width, sec.page_height = Inches(8.5), Inches(11)
    else:
        sec.page_width, sec.page_height = Mm(210), Mm(297)
    for side in ('left_margin', 'right_margin', 'top_margin', 'bottom_margin'):
        setattr(sec, side, Mm(18))
    style = doc.styles['Normal']
    style.font.name = 'Calibri'
    style.font.size = Pt(10.5)

    if spec.get('photo'):
        doc.add_picture(os.path.join(HERE, spec['photo']), width=Mm(28))

    doc.add_heading(spec['name'], level=1)
    if spec.get('headline'):
        doc.add_paragraph(spec['headline'])
    doc.add_paragraph(spec['contact'])
    for line in spec.get('personal', []):
        doc.add_paragraph(line)

    for section in spec['sections']:
        doc.add_heading(section['title'], level=2)
        for block in section['blocks']:
            kind = block[0]
            if kind == 'p':
                doc.add_paragraph(block[1])
            elif kind == 'entry':
                _, head, meta = block
                p = doc.add_paragraph()
                run = p.add_run(head)
                run.bold = True
                if meta:
                    doc.add_paragraph(meta)
            elif kind == 'bullet':
                doc.add_paragraph(block[1], style='List Bullet')
    if spec.get('three_page_filler'):
        for i in range(spec['three_page_filler']):
            doc.add_paragraph(f'Filler line {i}: additional detail kept so the document spans several pages.')
    doc.save(path)


def soffice_works():
    try:
        r = subprocess.run(['soffice', '--version'], capture_output=True, timeout=30)
        return r.returncode == 0
    except (OSError, subprocess.TimeoutExpired):
        return False


def convert(docx_path, out_dir):
    subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', '--outdir', out_dir, docx_path],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=180)
    return os.path.join(out_dir, os.path.splitext(os.path.basename(docx_path))[0] + '.pdf')


def make_scanned(spec, path):
    """An image-only PDF: the text is pixels, with no text layer"""
    img = Image.new('RGB', (1240, 1754), 'white')
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 30)
    except OSError:
        font = ImageFont.load_default()
    y = 80
    for line in [spec['name'], spec['contact']] + [l for s in spec['sections'] for l in [s['title']] + [b[1] if b[0] == 'p' else b[1] for b in s['blocks'] if b[0] != 'entry'] + [b[1] for b in s['blocks'] if b[0] == 'entry']]:
        draw.text((80, y), line, fill='black', font=font)
        y += 60
    img.save(path, 'PDF', resolution=150.0)


def expected_of(spec):
    exp = {
        'id': spec['id'],
        'kind': spec.get('kind', 'text'),
        'name': spec['name'],
        'email': spec.get('email'),
        'phone': spec.get('phone'),
        'sections': [s['title'] for s in spec['sections']],
        'experience': spec.get('experience', []),
        'education': spec.get('education', []),
        'skills': spec.get('skills', []),
    }
    return exp


def main():
    can_convert = soffice_works()
    if not can_convert:
        print('LibreOffice (soffice) is not usable here: DOCX sources are written; export the PDFs by hand (see MISSING.md)')
    for spec in SPECS:
        sid = spec['id']
        if spec.get('kind') == 'scanned':
            make_scanned(spec, os.path.join(PDF_DIR, f'{sid}.pdf'))
        else:
            docx = os.path.join(SRC_DIR, f'{sid}.docx')
            make_docx(spec, docx)
            if can_convert:
                produced = convert(docx, tempfile.mkdtemp())
                os.replace(produced, os.path.join(PDF_DIR, f'{sid}.pdf'))
        with open(os.path.join(EXP_DIR, f'{sid}.json'), 'w') as f:
            json.dump(expected_of(spec), f, indent=2, ensure_ascii=False)
    print(f'wrote {len(SPECS)} fixtures')


if __name__ == '__main__':
    main()
