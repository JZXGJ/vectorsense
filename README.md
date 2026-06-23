# 极性测试工具

本工具通过手机姿态和位置，获取角速度和磁场的理论值，可用来辅助卫星测试

## 快速启动（手动）

`
cd /root/orientation
. .venv/bin/activate
python src/app.py
`

## PM2 管理（可选）

`
cd /root/orientation
pm2 start .venv/bin/python --name orientation_test -- src/app.py
`

## systemd 部署（推荐）

1. 写入服务文件 /etc/systemd/system/orientation.service

`
[Unit]
Description=Orientation Flask Service (HTTP behind Nginx TLS)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/orientation
Environment=APP_HOST=127.0.0.1
Environment=APP_PORT=5100
Environment=APP_USE_SSL=0
Environment=FLASK_DEBUG=0
ExecStart=/root/orientation/.venv/bin/python /root/orientation/src/app.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
`

2. 启用并启动服务

`
sudo systemctl daemon-reload
sudo systemctl enable --now orientation
`

3. 查看状态和日志

`
sudo systemctl status orientation
sudo journalctl -u orientation -f
`

## 修改代码后的重加载方式

当前生产配置默认不启用热加载。修改代码后请手动重启服务：

`
cd /root/orientation
sudo systemctl restart orientation
`

常用命令：

`
sudo systemctl status orientation
sudo journalctl -u orientation -n 100 --no-pager
`

如果你改的是 service 文件本身（/etc/systemd/system/orientation.service），需要额外执行：

`
sudo systemctl daemon-reload
sudo systemctl restart orientation
`

## 国内服务器部署提示

国内服务器下载 Python 依赖时，建议使用清华镜像源以加快速度：

`
uv pip install -e . -i https://pypi.tuna.tsinghua.edu.cn/simple
`

其他可用镜像源：
- 阿里云：https://mirrors.aliyun.com/pypi/simple/
- 豆瓣：https://pypi.douban.com/simple/
- 中科大：https://pypi.mirrors.ustc.edu.cn/simple/
