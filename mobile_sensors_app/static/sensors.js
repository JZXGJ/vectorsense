document.addEventListener('DOMContentLoaded', function() {
    const statusMessage = document.getElementById('status-message');
    
    // Check if the browser supports the required APIs
    if (!navigator.geolocation) {
        statusMessage.textContent = '您的浏览器不支持地理位置API';
        statusMessage.style.color = 'red';
        return;
    }
    
    // Override fetch to ignore HTTPS certificate validation for POST requests
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
        if (init && init.method === 'POST') {
            init.credentials = 'same-origin'; // Ensure cookies are sent with the request
        }
        return originalFetch(input, init);
    };

    // Request location permissions and start updating location data
    function startLocationTracking() {
        statusMessage.textContent = '正在获取位置信息...';
        
        const locationOptions = {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
        };
        
        navigator.geolocation.watchPosition(
            updateLocationData,
            locationError,
            locationOptions
        );
    }
    
    // Update location data in the UI
    function updateLocationData(position) {
        document.getElementById('latitude').textContent = position.coords.latitude.toFixed(6);
        document.getElementById('longitude').textContent = position.coords.longitude.toFixed(6);
        document.getElementById('accuracy').textContent = position.coords.accuracy.toFixed(2) + ' 米';
        
        // Some devices might not provide altitude or speed
        if (position.coords.altitude !== null) {
            document.getElementById('altitude').textContent = position.coords.altitude.toFixed(2) + ' 米';
        } else {
            document.getElementById('altitude').textContent = '不可用';
        }
        
        if (position.coords.speed !== null) {
            document.getElementById('speed').textContent = position.coords.speed.toFixed(2) + ' 米/秒';
        } else {
            document.getElementById('speed').textContent = '不可用';
        }
        
        statusMessage.textContent = '位置数据已更新 - ' + new Date().toLocaleTimeString();
    }
    
    // Handle location errors
    function locationError(error) {
        let errorMessage;
        switch(error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = '用户拒绝了位置请求';
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage = '位置信息不可用';
                break;
            case error.TIMEOUT:
                errorMessage = '获取位置请求超时';
                break;
            case error.UNKNOWN_ERROR:
                errorMessage = '发生未知错误';
                break;
        }
        statusMessage.textContent = '位置错误: ' + errorMessage;
        statusMessage.style.color = 'red';
    }
    
    let lastUpdateTime = 0; // Track the last update time
    const updateInterval = 1000; // Update interval in milliseconds

    let sensor;

    function setupSensorAPI() {
        if ('AbsoluteOrientationSensor' in window) {
            try {
                sensor = new AbsoluteOrientationSensor({ frequency: 60 });
                sensor.addEventListener('reading', () => {
                    const quaternion = sensor.quaternion;

                    // Display quaternion values
                    document.getElementById('q0').textContent = quaternion[0].toFixed(4);
                    document.getElementById('q1').textContent = quaternion[1].toFixed(4);
                    document.getElementById('q2').textContent = quaternion[2].toFixed(4);
                    document.getElementById('q3').textContent = quaternion[3].toFixed(4);
                });
                sensor.addEventListener('error', (event) => {
                    console.error('Sensor error:', event.error.name);
                });
                sensor.start();
            } catch (error) {
                console.error('Failed to initialize AbsoluteOrientationSensor:', error);
            }
        } else {
            console.warn('AbsoluteOrientationSensor is not supported on this device.');
        }
    }

    function quaternionToEuler(quaternion) {
        const [q0, q1, q2, q3] = quaternion;
        const alpha = Math.atan2(2 * (q0 * q3 + q1 * q2), 1 - 2 * (q2 * q2 + q3 * q3)) * (180 / Math.PI);
        const beta = Math.asin(2 * (q0 * q2 - q3 * q1)) * (180 / Math.PI);
        const gamma = Math.atan2(2 * (q0 * q1 + q2 * q3), 1 - 2 * (q1 * q1 + q2 * q2)) * (180 / Math.PI);
        return [alpha, beta, gamma];
    }

    function setupAllPossibleOrientationMethods() {
        setupSensorAPI();
    }
    
    // 简化权限请求和设置过程
    function setupSensors() {
        // 启动位置跟踪
        startLocationTracking();
        
        // 设备方向 - 处理 iOS 特有的权限请求
        if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS 13+ 需要请求权限
            
            // 请求设备方向权限
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        // 请求设备运动权限
                        if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
                            DeviceMotionEvent.requestPermission()
                                .then(motionState => {
                                    if (motionState === 'granted') {
                                        setupAllPossibleOrientationMethods();
                                    } else {
                                        // 即使没有运动权限，仍然尝试设备方向
                                        setupAllPossibleOrientationMethods();
                                    }
                                })
                                .catch(() => {
                                    // 即使没有运动权限，仍然尝试设备方向
                                    setupAllPossibleOrientationMethods();
                                });
                        } else {
                            // 如果设备不需要运动权限，直接设置所有方法
                            setupAllPossibleOrientationMethods();
                        }
                    }
                })
                .catch(() => {});
        } else {
            // 非 iOS 设备或旧版本 iOS - 直接尝试所有方法
            setupAllPossibleOrientationMethods();
        }
    }
    
    // 初始化请求权限按钮
    const permissionButton = document.createElement('button');
    permissionButton.textContent = '点击授权访问传感器';
    permissionButton.style.display = 'block';
    permissionButton.style.margin = '20px auto';
    permissionButton.style.padding = '10px 15px';
    permissionButton.style.backgroundColor = '#4285f4';
    permissionButton.style.color = 'white';
    permissionButton.style.border = 'none';
    permissionButton.style.borderRadius = '4px';
    permissionButton.style.cursor = 'pointer';
    
    permissionButton.addEventListener('click', function() {
        setupSensors();
        this.style.display = 'none';
    });
    
    document.querySelector('.container').insertBefore(permissionButton, document.querySelector('.sensor-section'));
    
    // 对于不需要明确权限的浏览器，自动启动（但保留按钮以便手动重试）
    if (!(typeof DeviceOrientationEvent.requestPermission === 'function') && 
        !(typeof DeviceMotionEvent.requestPermission === 'function')) {
        permissionButton.textContent = '重新尝试获取传感器权限';
        setupSensors();
    }

    function fetchEarthRotation() {
        console.log('fetchEarthRotation is being executed');

        // Get quaternion values from the front-end
        const q_BL = [
            parseFloat(document.getElementById('q0').textContent),
            parseFloat(document.getElementById('q1').textContent),
            parseFloat(document.getElementById('q2').textContent),
            parseFloat(document.getElementById('q3').textContent)
        ];
        console.log('Input quaternion (q_BL):', q_BL);

        // Get latitude value from the front-end
        const latitude = parseFloat(document.getElementById('latitude').textContent);
        console.log('Input latitude:', latitude);

        const dataToSend = {
            q_BL: q_BL,
            latitude: latitude
        };

        fetch('/api/calc_earth_rotate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend),
        })
        .then(response => response.json())
        .then(data => {
            console.log('API response:', data);
            const omega_B = data.omega_B;
            document.getElementById('omega-x').textContent = omega_B[0].toFixed(4);
            document.getElementById('omega-y').textContent = omega_B[1].toFixed(4);
            document.getElementById('omega-z').textContent = omega_B[2].toFixed(4);
        })
        .catch(error => {
            console.error('Error fetching earth rotation data:', error);
        });
    }

    function fetchMagneticField() {
        console.log('fetchMagneticField is being executed');

        // 获取四元数值
        const q_BL = [
            parseFloat(document.getElementById('q0').textContent),
            parseFloat(document.getElementById('q1').textContent),
            parseFloat(document.getElementById('q2').textContent),
            parseFloat(document.getElementById('q3').textContent)
        ];
        
        // 获取位置信息
        const latitude = parseFloat(document.getElementById('latitude').textContent);
        const longitude = parseFloat(document.getElementById('longitude').textContent);
        // 将海拔高度从米转换为千米
        const altitude = parseFloat(document.getElementById('altitude').textContent) / 1000;
        
        // 验证数据是否有效
        if (isNaN(latitude) || isNaN(longitude) || isNaN(altitude)) {
            console.error('位置数据无效或不完整');
            return;
        }
        
        console.log('位置数据:', { latitude, longitude, altitude: altitude + ' km' });
        
        const dataToSend = {
            q_BL: q_BL,
            latitude: latitude,
            longitude: longitude,
            height: altitude
        };

        fetch('/api/calc_mag', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend),
        })
        .then(response => response.json())
        .then(data => {
            console.log('磁场API响应:', data);
            const mag_B = data.mag_B;
            
            // 显示磁场分量
            document.getElementById('mag-x').textContent = mag_B[0].toFixed(2);
            document.getElementById('mag-y').textContent = mag_B[1].toFixed(2);
            document.getElementById('mag-z').textContent = mag_B[2].toFixed(2);
            
            // 计算并显示磁场总强度
            const intensity = Math.sqrt(
                mag_B[0] * mag_B[0] + 
                mag_B[1] * mag_B[1] + 
                mag_B[2] * mag_B[2]
            );
            document.getElementById('mag-intensity').textContent = intensity.toFixed(2);
        })
        .catch(error => {
            console.error('获取磁场数据时出错:', error);
        });
    }

    // Automatically execute fetchEarthRotation every second
    setInterval(fetchEarthRotation, 1000);

    // Automatically execute fetchMagneticField every second
    setInterval(fetchMagneticField, 1000);
});