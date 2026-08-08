import base64
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from mizan_ai.core.config import settings

class VisionService:
    def __init__(self):
        api_key = settings.GROQ_API_KEY or "dummy_key"
        self.vision_llm = ChatGroq(
            api_key=api_key,
            model_name="llama-3.2-90b-vision-preview",
            temperature=0.1
        )

    def extract_urdu_facts(self, base64_image: str) -> str:
        """
        Reads an Urdu Nastaliq image (like an FIR or Police Diary), translates it to English,
        and extracts the core material facts and penal codes.
        """
        # Ensure the base64 string doesn't have the data URL prefix
        if "," in base64_image:
            base64_image = base64_image.split(",")[1]
            
        prompt = """You are an expert Pakistani Legal Translator and Analyst.
Look at this uploaded image containing an Urdu First Information Report (FIR) or Katchery document (often in Nastaliq or handwritten).
1. Read the Urdu text accurately.
2. Translate the core material facts of the case into English.
3. Extract any specific Pakistan Penal Code (PPC) sections referenced (e.g., PPC 302, 324, 489-F).
4. Output a clean, structured English summary of the facts that can be used for legal analysis.
Focus only on material facts, dates, and penal codes. Do not include boilerplate text.
"""
        
        try:
            message = HumanMessage(
                content=[
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"},
                    },
                ]
            )
            response = self.vision_llm.invoke([message])
            return response.content
        except Exception as e:
            print(f"Vision Service Error: {e}")
            return "Failed to process image. Please ensure the image is clear."

vision_service = VisionService()
