import aocs_lab.pyIGRF14.igrf as igrf
from scipy.spatial.transform import Rotation as R
from datetime import datetime
import aocs_lab.utils.lib as lib
import numpy as np

def calc_mag(q_BL, latitude, longitude, height):
    # 获取当前年份（包含小数部分表示一年中的时间）
    current_date = datetime.now()
    current_year = current_date.year + (current_date.month - 1) / 12 + (current_date.day - 1) / 365.25
    
    # 坐标定义，当地北东地M，当地东北天L，手机本体系B
    mag_M = igrf.get_mag_field(
        date=current_year,  # 使用当前年份
        lon=longitude,  # Longitude in degrees
        lat=latitude,  # Latitude in degrees
        alt=height,  # Height in km
    )

    A_LM = lib.rotate_z(np.deg2rad(-90)) @ lib.rotate_x(np.deg2rad(180))
    
    A_BL = R.from_quat(q_BL).as_matrix()

    mag_B = A_BL.T @ A_LM @ mag_M

    return mag_B * 1e-5  # Convert to gauss (1 nT = 1e-5 gauss)
