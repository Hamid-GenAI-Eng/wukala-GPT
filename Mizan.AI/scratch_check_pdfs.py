import fitz
import glob

def check_pdfs():
    path = r"c:\My working\HamidTech_Ventures\My_products\Wukala-GPT\Mizan.AI\Legal drafting templates\**\*.pdf"
    pdfs = glob.glob(path, recursive=True)
    text_pdfs = 0
    img_pdfs = 0
    for p in pdfs[:20]:
        try:
            doc = fitz.open(p)
            txt = doc[0].get_text()
            if len(txt) > 100:
                text_pdfs += 1
            else:
                img_pdfs += 1
        except Exception as e:
            print(f"Error on {p}: {e}")
    print(f"Total checked: {len(pdfs[:20])}")
    print(f"Text PDFs: {text_pdfs}, Image PDFs: {img_pdfs}")

if __name__ == "__main__":
    check_pdfs()
