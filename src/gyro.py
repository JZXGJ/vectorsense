import numpy as np
import aocs_lab.utils.lib as lib
from scipy.spatial.transform import Rotation as R


def calc_earth_rotate(q_BL, latitude):
    # 坐标定义，当地东北天L，手机本体系B
    omega_L = lib.latitude_to_angular_velocity(latitude)

    A_BL = R.from_quat(q_BL).as_matrix()

    omega_B = A_BL.T @ omega_L
    
    return omega_B


if __name__ == '__main__':
    q_BL = np.array([0.707, 0.707, 0, 0])
    latitude = 30 * np.pi / 180

    omega_B = calc_earth_rotate(q_BL, latitude)

    print("omega_B:", omega_B)
    print("omega_B norm:", np.linalg.norm(omega_B))
