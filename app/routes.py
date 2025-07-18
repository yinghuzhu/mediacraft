#!/usr/bin/env python3
"""
Video Watermark Remover - Routes Module
"""

import sys
import os
import importlib.util

# 获取父目录路径
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)

# 直接从app.py文件导入Flask应用
spec = importlib.util.spec_from_file_location("app_module", os.path.join(parent_dir, "app.py"))
app_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app_module)

# 导入配置
import config

if __name__ == '__main__':
    print(f"Starting server at http://localhost:50001")
    print(f"Video watermark removal page: http://localhost:50001/video-watermark.html")
    app_module.app.run(debug=config.DEBUG, host=config.HOST, port=50001)  # 使用固定端口50001