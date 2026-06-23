from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3, os, json, numpy as np, torch, torch.nn as nn
from datetime import datetime
from flask import send_from_directory

app = Flask(__name__)
CORS(app)
DB_PATH = 'meternak.db'

# ─── LOAD MODELS ─────────────────────────────────────────────────────────────
try:
    import cv2
    yolo_net = cv2.dnn.readNetFromONNX('best.onnx')
    print("YOLO loaded")
except Exception as e:
    yolo_net = None; print(f"YOLO: {e}")

class LSTMModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.lstm = nn.LSTM(3,128,2,batch_first=True,dropout=.4)
        self.fc   = nn.Sequential(nn.Linear(128,64),nn.ReLU(),nn.Dropout(.3),
                                  nn.Linear(64,4),nn.Softmax(dim=-1))
    def forward(self,x): return self.fc(self.lstm(x)[0][:,-1,:])

lstm_model = LSTMModel()
try:
    lstm_model.load_state_dict(torch.load('LSTM.pth', map_location='cpu'))
    lstm_model.eval(); print("LSTM loaded")
except Exception as e:
    lstm_model = None; print(f"LSTM: {e}")

try:
    import joblib
    rf_model = joblib.load('rf_model.pkl')
    print("RF loaded")
except Exception as e:
    rf_model = None; print(f"RF: {e}")

NAMES        = ['Day1','Day2','Day3','Kuning']
MAX_LEN      = 5
MUCUS_LABELS = {0:'transparant',1:'darah',2:'putih',3:'kuning'}

# ─── DATABASE ─────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH); conn.row_factory = sqlite3.Row; return conn

def init_db():
    conn = get_db()
    conn.execute('''CREATE TABLE IF NOT EXISTS tracking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cattle_id TEXT, farmer_name TEXT,
        mucus_type INTEGER, mucus_color TEXT, confidence REAL,
        temperature REAL, resistance INTEGER,
        lstm_result TEXT, decision TEXT, recorded_at TEXT)''')
    conn.execute('''CREATE TABLE IF NOT EXISTS esp32_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        resistance INTEGER, recorded_at TEXT)''')
    conn.commit(); conn.close()

# ─── HELPERS ─────────────────────────────────────────────────────────────────
def detect_yolo(image_bytes):
    if yolo_net is None: return None, 0.0
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        blob  = cv2.dnn.blobFromImage(img,1/255.,(640,640),swapRB=True)
        yolo_net.setInput(blob)
        out  = yolo_net.forward()
        best = out[0][np.argmax(out[0][:,4])]
        conf = float(best[4])
        if conf < 0.50: return None, conf
        return (int(best[5]) if len(best)>5 else 0), conf
    except Exception as e:
        print(f"YOLO detect error: {e}"); return None, 0.0

def predict_lstm(seq):
    if lstm_model is None: return {'predicted':'Unknown','window_remaining':None,
        'p_day1':0,'p_day2':0,'p_day3':0,'p_kuning':0}
    try:
        s = [[x[0]/3.,x[1]/72.,x[2]] for x in seq]
        s = [[0,0,0]]*(MAX_LEN-len(s))+s
        x = torch.tensor([s[-MAX_LEN:]], dtype=torch.float32)
        with torch.no_grad(): p = lstm_model(x).cpu().squeeze().numpy()
        idx = int(np.argmax(p))
        return {'predicted':NAMES[idx],
                'window_remaining':max(0,3-idx) if idx<3 else None,
                'p_day1':round(float(p[0]),3),'p_day2':round(float(p[1]),3),
                'p_day3':round(float(p[2]),3),'p_kuning':round(float(p[3]),3)}
    except Exception as e:
        print(f"LSTM error: {e}"); return {'predicted':'Unknown','window_remaining':None,
            'p_day1':0,'p_day2':0,'p_day3':0,'p_kuning':0}

def predict_rf(lstm_out, temperature, resistance, mucus_type, confidence):
    if rf_model:
        try:
            features = [[mucus_type or 0, confidence or 0,
                         lstm_out['p_day1'],lstm_out['p_day2'],
                         lstm_out['p_day3'],lstm_out['p_kuning'],
                         temperature or 0, resistance or 0]]
            return rf_model.predict(features)[0]
        except Exception as e:
            print(f"RF error: {e}")
    if lstm_out['predicted'] == 'Kuning': return 'JANGAN_IB'
    if lstm_out['predicted'] in ['Day2','Day3'] and temperature and 38.2<=temperature<=39.5:
        return 'IB_SEKARANG'
    return 'STANDBY'

# ─── ENDPOINTS ───────────────────────────────────────────────────────────────
@app.route('/health')
def health():
    return jsonify({'status':'ok','yolo':yolo_net is not None,
                    'lstm':lstm_model is not None,'rf':rf_model is not None})

@app.route('/api/esp32', methods=['POST'])
def esp32():
    data       = request.get_json()
    resistance = data.get('resistance')
    if resistance is None: return jsonify({'error':'resistance wajib'}), 400
    conn = get_db()
    conn.execute('INSERT INTO esp32_log (resistance,recorded_at) VALUES (?,?)',
                 (resistance, datetime.now().isoformat()))
    conn.commit(); conn.close()
    return jsonify({'status':'ok','resistance':resistance}), 201

@app.route('/api/detect', methods=['POST'])
def detect():
    cattle_id   = request.form.get('cattle_id')
    farmer_name = request.form.get('farmer_name','')
    temperature = request.form.get('temperature', type=float)
    dt_hours    = request.form.get('dt_hours', 0, type=float)
    image       = request.files.get('image')

    if not cattle_id: return jsonify({'error':'cattle_id wajib'}), 400
    if not image:     return jsonify({'error':'image wajib'}), 400

    mucus_type, confidence = detect_yolo(image.read())
    if mucus_type is None:
        return jsonify({'error':'Lendir tidak terdeteksi, coba foto ulang',
                        'confidence': confidence}), 422

    mucus_color = MUCUS_LABELS.get(mucus_type,'unknown')

    conn = get_db()
    rows = conn.execute('SELECT mucus_type,confidence FROM tracking WHERE cattle_id=? ORDER BY recorded_at DESC LIMIT 4',(cattle_id,)).fetchall()
    esp  = conn.execute('SELECT resistance FROM esp32_log ORDER BY recorded_at DESC LIMIT 1').fetchone()
    conn.close()

    resistance = esp['resistance'] if esp else None
    seq = [[r['mucus_type'], dt_hours, r['confidence']] for r in reversed(rows)]
    seq.append([mucus_type, dt_hours, confidence])

    lstm_out = predict_lstm(seq)
    decision = predict_rf(lstm_out, temperature, resistance, mucus_type, confidence)

    conn = get_db()
    conn.execute('''INSERT INTO tracking
        (cattle_id,farmer_name,mucus_type,mucus_color,confidence,temperature,resistance,lstm_result,decision,recorded_at)
        VALUES (?,?,?,?,?,?,?,?,?,?)''',
        (cattle_id,farmer_name,mucus_type,mucus_color,confidence,
         temperature,resistance,json.dumps(lstm_out),decision,datetime.now().isoformat()))
    conn.commit(); conn.close()

    return jsonify({'cattle_id':cattle_id,'mucus_color':mucus_color,
                    'confidence':confidence,'temperature':temperature,
                    'resistance':resistance,'lstm':lstm_out,'decision':decision})

@app.route('/api/tracking/<cattle_id>')
def riwayat(cattle_id):
    conn = get_db()
    rows = conn.execute('SELECT * FROM tracking WHERE cattle_id=? ORDER BY recorded_at DESC LIMIT 50',(cattle_id,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/')
def index():
    return send_from_directory('.', 'MeTernak (yolo).html')

@app.route('/<path:filename>')        
def static_files(filename):
    return send_from_directory('.', filename)
with app.app_context():
    init_db()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)