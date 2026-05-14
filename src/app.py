from flask import Flask, render_template, request, jsonify
import gyro
import numpy as np
from gyro import calc_earth_rotate
from mag import calc_mag
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/calc_earth_rotate', methods=['POST'])
def api_calc_earth_rotate():
    data = request.json
    q_BL = np.array(data['q_BL'])  # Get quaternion from request
    latitude = data['latitude']  # Get latitude from request

    omega_B = calc_earth_rotate(q_BL, np.deg2rad(latitude))
    omega_B_deg = np.rad2deg(omega_B)  # Convert to degrees
    return jsonify({'omega_B': omega_B_deg.tolist()})  # Return as JSON


@app.route('/api/calc_mag', methods=['POST'])
def api_calc_mag():
    data = request.json
    q_BL = np.array(data['q_BL'])  # 获取四元数
    latitude = data['latitude']    # 获取纬度
    longitude = data['longitude']  # 获取经度
    height = data['height']        # 获取高度，单位为千米

    mag_B = calc_mag(q_BL, latitude, longitude, height)
    return jsonify({'mag_B': mag_B.tolist()})  # 返回JSON格式的磁场向量

if __name__ == '__main__':
    host = os.getenv('APP_HOST', '0.0.0.0')
    port = int(os.getenv('APP_PORT', '5100'))
    debug = os.getenv('FLASK_DEBUG', '0') in ('1', 'true', 'True')
    use_ssl = os.getenv('APP_USE_SSL', '1') in ('1', 'true', 'True')

    if use_ssl:
        cert_file = os.getenv('SSL_CERT_FILE', 'ssl/cert.pem')
        key_file = os.getenv('SSL_KEY_FILE', 'ssl/key.pem')
        if os.path.exists(cert_file) and os.path.exists(key_file):
            app.run(host=host, port=port, ssl_context=(cert_file, key_file), debug=debug)
        else:
            app.run(host=host, port=port, debug=debug)
    else:
        app.run(host=host, port=port, debug=debug)
