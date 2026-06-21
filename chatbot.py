from flask import Blueprint, request, jsonify
from google import genai
import os

chatbot_bp = Blueprint('chatbot', __name__)

SYSTEM_PROMPT = """Saya SaCo, asisten ternak terpercaya Anda.
HANYA jawab seputar masa kesuburan, siklus reproduksi, tanda estrus, dan waktu IB sapi betina.
Tolak topik lain dengan sopan dalam Bahasa Indonesia sederhana."""

client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))
response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)

@chatbot_bp.route('/api/chat', methods=['POST'])
def chat():
    data     = request.get_json()
    prompt   = f"{SYSTEM_PROMPT}\n\nUser: {data.get('message')}"
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(max_output_tokens=1000)
    )
    return jsonify({'reply': response.text})