# AGENTS.md

## Project Overview
- This repository is a Flask app for mobile sensor validation (gyro Earth-rotation vector and geomagnetic field) using phone orientation + GNSS data.
- Backend routes are in [mobile_sensors_app/app.py](mobile_sensors_app/app.py); core math lives in [mobile_sensors_app/gyro.py](mobile_sensors_app/gyro.py) and [mobile_sensors_app/mag.py](mobile_sensors_app/mag.py).
- Frontend sensor/permission flow is in [mobile_sensors_app/static/sensors.js](mobile_sensors_app/static/sensors.js), and UI markup is in [mobile_sensors_app/templates/index.html](mobile_sensors_app/templates/index.html).

## Run And Verification
- Run locally: `python3 mobile_sensors_app/app.py`
- Background run (from [README.md](README.md)): `nohup python3 mobile_sensors_app/app.py > service.log 2>&1 &`
- PM2 run (from [README.md](README.md)): `pm2 start mobile_sensors_app/app.py --name orientation_test --interpreter python3`

## Hard Requirements
- Keep HTTPS available at the public entrypoint (Nginx + valid certificate). Mobile browser sensor APIs require secure context.
- Do not remove iOS permission handling in [mobile_sensors_app/static/sensors.js](mobile_sensors_app/static/sensors.js) (`DeviceOrientationEvent.requestPermission` / `DeviceMotionEvent.requestPermission`).
- Preserve quaternion ordering across frontend/backend (`q_BL` as 4-element array used directly by `Rotation.from_quat`).

## Code Organization Rules
- Keep route handlers thin in [mobile_sensors_app/app.py](mobile_sensors_app/app.py): parse request, call calculation helpers, return JSON.
- Put numerical/coordinate-frame logic in [mobile_sensors_app/gyro.py](mobile_sensors_app/gyro.py) and [mobile_sensors_app/mag.py](mobile_sensors_app/mag.py), not in routes.
- Follow existing units:
  - `latitude` sent in degrees from frontend, converted as needed in backend.
  - `height` for `/api/calc_mag` is in kilometers.
  - `calc_mag` returns gauss (`nT * 1e-5`).

## Dependencies And Environment Notes
- Python dependencies implied by source:
  - `flask`, `numpy`, `scipy`, `pyOpenSSL`
  - `aocs_lab` (including `aocs_lab.utils.lib` and `aocs_lab.pyIGRF14.igrf`)
- If runtime errors mention `aocs_lab`, resolve environment/package availability before refactoring code.

## When Editing
- Keep Chinese UI copy/comments unless the task explicitly asks for localization changes.
- Prefer minimal diffs and preserve existing API response shapes used by frontend polling.
- Validate both API endpoints after backend changes:
  - `POST /api/calc_earth_rotate`
  - `POST /api/calc_mag`

## Reference
- Operational commands and service management notes: [README.md](README.md)