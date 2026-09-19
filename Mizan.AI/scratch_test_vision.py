import os
import fitz
import base64
import requests
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def test_groq_vision():
    # Render first page of a PDF to an image
    pdf_path = r"c:\My working\HamidTech_Ventures\My_products\Wukala-GPT\Mizan.AI\Legal drafting templates\Affidavit\English\affidavit-for-cnic-loss-english.pdf"
    doc = fitz.open(pdf_path)
    page = doc[0]
    pix = page.get_pixmap()
    img_data = pix.tobytes("jpeg")
    b64_img = base64.b64encode(img_data).decode("utf-8")

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama-3.2-11b-vision-preview",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Extract all the text with blanks '_________' from this document. Then identify the purpose of each blank."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{b64_img}"
                        }
                    }
                ]
            }
        ],
        "temperature": 0.1,
        "max_tokens": 1024
    }

    try:
        response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
        print(response.json())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_groq_vision()
