import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=50, bottom=50, left=100, right=100):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_box_borders(table, color="000000", sz="4"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:right w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideH w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def set_horizontal_rule_borders(table, color="4F81BD", sz="14"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'<w:insideH w:val="none"/>'
        f'<w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def build_cover_page(output_filename, dual_sdg=False):
    doc = docx.Document()
    section = doc.sections[0]
    section.page_width = Inches(8.27)
    section.page_height = Inches(11.69)
    section.top_margin = Inches(0.4)
    section.bottom_margin = Inches(0.4)
    section.left_margin = Inches(0.9)
    section.right_margin = Inches(0.9)
    section.different_first_page_header_footer = False

    # Header exactly as original
    header = section.header
    hp = header.paragraphs[0]
    hp.text = "VESIT | Department of Computer Engineering | Micro Project Report"
    hp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    hp.runs[0].font.name = "Times New Roman"
    hp.runs[0].font.size = Pt(8.5)
    hp.runs[0].font.color.rgb = RGBColor(100, 100, 100)

    # Empty gap
    p_gap = doc.add_paragraph()
    p_gap.paragraph_format.space_before = Pt(0)
    p_gap.paragraph_format.space_after = Pt(4)

    # Top Banner Table (VESIT logo on left, 3 lines of title on right, between 2 blue rules)
    banner_table = doc.add_table(rows=1, cols=2)
    banner_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_horizontal_rule_borders(banner_table, color="4F81BD", sz="14")
    
    cell_logo = banner_table.cell(0, 0)
    cell_title = banner_table.cell(0, 1)
    cell_logo.width = Inches(0.9)
    cell_title.width = Inches(5.5)

    p_l = cell_logo.paragraphs[0]
    p_l.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_l.paragraph_format.space_before = Pt(4)
    p_l.paragraph_format.space_after = Pt(4)
    if os.path.exists("screenshots/cover_img_0.png"):
        p_l.add_run().add_picture("screenshots/cover_img_0.png", width=Inches(0.65))

    p_t1 = cell_title.paragraphs[0]
    p_t1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_t1.paragraph_format.space_before = Pt(4)
    p_t1.paragraph_format.space_after = Pt(2)
    r1 = p_t1.add_run("VIVEKANAND EDUCATION SOCIETY’S INSTITUTE OF\nTECHNOLOGY")
    r1.font.name = "Cambria"
    r1.font.size = Pt(13.5)
    r1.font.bold = True
    r1.font.color.rgb = RGBColor(11, 83, 148)

    p_t2 = cell_title.add_paragraph()
    p_t2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_t2.paragraph_format.space_before = Pt(2)
    p_t2.paragraph_format.space_after = Pt(2)
    r2 = p_t2.add_run("DEPARTMENT OF COMPUTER ENGINEERING")
    r2.font.name = "Cambria"
    r2.font.size = Pt(12.5)
    r2.font.bold = True
    r2.font.color.rgb = RGBColor(11, 83, 148)

    p_t3 = cell_title.add_paragraph()
    p_t3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_t3.paragraph_format.space_before = Pt(2)
    p_t3.paragraph_format.space_after = Pt(4)
    r3 = p_t3.add_run("MICRO PROJECT REPORT")
    r3.font.name = "Cambria"
    r3.font.size = Pt(13.5)
    r3.font.bold = True
    r3.font.color.rgb = RGBColor(11, 83, 148)

    # Project Title
    p_proj = doc.add_paragraph()
    p_proj.paragraph_format.space_before = Pt(10)
    p_proj.paragraph_format.space_after = Pt(4)
    r_pt1 = p_proj.add_run("Project Title : ")
    r_pt1.font.name = "Arial"
    r_pt1.font.size = Pt(12)
    r_pt1.font.bold = True
    r_pt2 = p_proj.add_run("CareNex: Smart Healthcare Appointment & Patient Management System")
    r_pt2.font.name = "Arial"
    r_pt2.font.size = Pt(12)
    r_pt2.font.bold = True

    # SDG Alignment text
    p_sdg = doc.add_paragraph()
    p_sdg.paragraph_format.space_before = Pt(2)
    p_sdg.paragraph_format.space_after = Pt(4)
    
    if dual_sdg:
        r_sdg = p_sdg.add_run("SDG Aligned & Logo : SDG 3 - Good Health and Well-Being\n& SDG 9 - Industry, Innovation and Infrastructure")
    else:
        r_sdg = p_sdg.add_run("SDG Aligned & Logo : SDG 3 - Good Health and Well-Being")
        
    r_sdg.font.name = "Arial"
    r_sdg.font.size = Pt(11)
    r_sdg.font.bold = True

    # SDG Logos Table
    if dual_sdg:
        tbl_sdg = doc.add_table(rows=1, cols=2)
        tbl_sdg.alignment = WD_TABLE_ALIGNMENT.LEFT
        for c in tbl_sdg.rows[0].cells:
            tcPr = c._tc.get_or_add_tcPr()
            borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/></w:tcBorders>')
            tcPr.append(borders)
        
        c_s1, c_s2 = tbl_sdg.rows[0].cells
        c_s1.width = Inches(1.1)
        c_s2.width = Inches(1.1)

        p_s1 = c_s1.paragraphs[0]
        p_s1.paragraph_format.space_before = Pt(0)
        p_s1.paragraph_format.space_after = Pt(2)
        sdg3_path = "screenshots/sdg3_official.png" if os.path.exists("screenshots/sdg3_official.png") else "screenshots/sdg3_health.png"
        p_s1.add_run().add_picture(sdg3_path, width=Inches(0.95))

        p_s2 = c_s2.paragraphs[0]
        p_s2.paragraph_format.space_before = Pt(0)
        p_s2.paragraph_format.space_after = Pt(2)
        if os.path.exists("screenshots/cover_img_1.png"):
            p_s2.add_run().add_picture("screenshots/cover_img_1.png", width=Inches(0.95))
    else:
        # Single SDG 3 icon
        tbl_sdg = doc.add_table(rows=1, cols=1)
        tbl_sdg.alignment = WD_TABLE_ALIGNMENT.LEFT
        c_s1 = tbl_sdg.rows[0].cells[0]
        tcPr = c_s1._tc.get_or_add_tcPr()
        borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/></w:tcBorders>')
        tcPr.append(borders)
        c_s1.width = Inches(1.2)

        p_s1 = c_s1.paragraphs[0]
        p_s1.paragraph_format.space_before = Pt(0)
        p_s1.paragraph_format.space_after = Pt(2)
        sdg3_path = "screenshots/sdg3_official.png" if os.path.exists("screenshots/sdg3_official.png") else "screenshots/sdg3_health.png"
        p_s1.add_run().add_picture(sdg3_path, width=Inches(1.05))

    # Spacer
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(0)
    p_sp.paragraph_format.space_after = Pt(4)

    # Project / Course Details Table
    course_headers = ["Project / Course Details", "To be filled by students"]
    course_data = [
        ["Course / Subject Name", "Software Engineering And Architecture"],
        ["Course Code / Semester / Academic Year", "26CMPC52 / V / 2026-27"],
        ["Faculty Incharge / Project Mentor", "Mrs. Manisha Mathur"],
        ["Project Group No. (if applicable)", ""],
        ["Submission Date", ""]
    ]

    tbl_course = doc.add_table(rows=len(course_data) + 1, cols=2)
    tbl_course.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_box_borders(tbl_course, color="000000", sz="4")

    for i, title in enumerate(course_headers):
        cell = tbl_course.cell(0, i)
        cell.text = title
        set_cell_background(cell, "D9EAF7")
        set_cell_margins(cell, top=50, bottom=50, left=100, right=100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for r in p.runs:
            r.font.name = "Arial"
            r.font.size = Pt(11)
            r.font.bold = True
            r.font.color.rgb = RGBColor(0, 0, 0)

    for r_idx, row in enumerate(course_data):
        cell_l = tbl_course.cell(r_idx + 1, 0)
        cell_r = tbl_course.cell(r_idx + 1, 1)
        cell_l.text = row[0]
        cell_r.text = row[1]
        set_cell_margins(cell_l, top=40, bottom=40, left=100, right=100)
        set_cell_margins(cell_r, top=40, bottom=40, left=100, right=100)
        for c in [cell_l, cell_r]:
            p = c.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for r in p.runs:
                r.font.name = "Arial"
                r.font.size = Pt(10)
                r.font.color.rgb = RGBColor(0, 0, 0)

    for row in tbl_course.rows:
        row.cells[0].width = Inches(2.7)
        row.cells[1].width = Inches(3.7)

    # Team Title
    p_team_title = doc.add_paragraph()
    p_team_title.paragraph_format.space_before = Pt(8)
    p_team_title.paragraph_format.space_after = Pt(4)
    r_tt = p_team_title.add_run("Project Team Details")
    r_tt.font.name = "Arial"
    r_tt.font.size = Pt(11.5)
    r_tt.font.bold = True

    # Team Table
    team_headers = ["Student Name", "Roll No.", "Class / Division", "Institute Email ID"]
    team_data = [
        ["Piyush Kandhari", "22", "D12A", "2024.piyush.kandhari@ves.ac.in"],
        ["James Lijo", "28", "D12A", "2024.james.lijo@ves.ac.in"],
        ["Shantanu Mokal", "38", "D12A", "2024.shantanu.mokal@ves.ac.in"]
    ]

    tbl_team = doc.add_table(rows=len(team_data) + 1, cols=4)
    tbl_team.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_box_borders(tbl_team, color="000000", sz="4")

    for i, title in enumerate(team_headers):
        cell = tbl_team.cell(0, i)
        cell.text = title
        set_cell_background(cell, "D9EAF7")
        set_cell_margins(cell, top=50, bottom=50, left=80, right=80)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for r in p.runs:
            r.font.name = "Arial"
            r.font.size = Pt(10.5)
            r.font.bold = True
            r.font.color.rgb = RGBColor(0, 0, 0)

    for r_idx, row in enumerate(team_data):
        for c_idx, val in enumerate(row):
            cell = tbl_team.cell(r_idx + 1, c_idx)
            cell.text = val
            set_cell_margins(cell, top=40, bottom=40, left=80, right=80)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for r in p.runs:
                r.font.name = "Arial"
                r.font.size = Pt(9.5)
                r.font.color.rgb = RGBColor(0, 0, 0)

    col_widths_team = [Inches(1.8), Inches(0.8), Inches(1.3), Inches(2.5)]
    for row in tbl_team.rows:
        for c_idx, w in enumerate(col_widths_team):
            row.cells[c_idx].width = w

    # Bottom Department Text
    p_dept = doc.add_paragraph()
    p_dept.paragraph_format.space_before = Pt(8)
    p_dept.paragraph_format.space_after = Pt(1)
    r_d = p_dept.add_run("Department of Computer Engineering")
    r_d.font.name = "Arial"
    r_d.font.size = Pt(11.5)
    r_d.font.bold = True
    r_d.font.color.rgb = RGBColor(46, 116, 181)

    p_ay = doc.add_paragraph()
    p_ay.paragraph_format.space_before = Pt(0)
    p_ay.paragraph_format.space_after = Pt(0)
    r_ay = p_ay.add_run("Academic Year: 2026-2027")
    r_ay.font.name = "Arial"
    r_ay.font.size = Pt(11)
    r_ay.font.color.rgb = RGBColor(0, 0, 0)

    doc.save(output_filename)
    print(f"Saved: {output_filename}")

if __name__ == "__main__":
    # 1. Primary: Single correct SDG (SDG 3: Good Health and Well-Being)
    build_cover_page("CareNex_Cover_Page.docx", dual_sdg=False)
    # 2. Dual SDG variant: SDG 3 + SDG 9
    build_cover_page("CareNex_Cover_Page_Dual_SDG.docx", dual_sdg=True)
