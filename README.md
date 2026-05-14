# 极性测试工具

后台运行服务

```
nohup python3 mobile_sensors_app/app.py > service.log 2>&1 &
```

pm2 管理

```
pm2 start mobile_sensors_app/app.py --name orientation_test --interpreter python3
```