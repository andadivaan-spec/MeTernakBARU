from flask import Blueprint, request, jsonify
from google import genai
import os

chatbot_bp = Blueprint('chatbot', __name__)

SYSTEM_PROMPT = """Saya SaCo, asisten ternak terpercaya Anda.
HANYA jawab seputar masa kesuburan, siklus reproduksi, tanda estrus, dan waktu IB sapi betina.
Tolak topik lain dengan sopan dalam Bahasa Indonesia sederhana."""

@chatbot_bp.route('/api/chat', methods=['POST'])
def chat():
    data     = request.get_json()
    client   = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        config={"system_instruction": SYSTEM_PROMPT},
        contents=data.get('message')
    )
    return jsonify({'reply': response.text})