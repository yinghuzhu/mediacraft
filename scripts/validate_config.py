#!/usr/bin/env python3
"""
MediaCraft 配置验证脚本
验证环境配置是否正确
"""
import os
import sys
import logging
from pathlib import Path

# 添加项目根目录到 Python 路径
if __name__ == '__main__':
    # 如果作为脚本运行，添加父目录到路径
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    sys.path.insert(0, str(project_root))
else:
    # 如果作为模块导入，添加当前目录到路径
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def validate_config():
    """验证配置"""
    print("MediaCraft 配置验证")
    print("=" * 50)
    
    try:
        # 尝试导入配置
        from core.env_config import get_config
        config = get_config()
        
        print(f"✓ 配置加载成功")
        print(f"  环境文件: {config.env_loader.env_file}")
        print(f"  调试模式: {config.DEBUG}")
        print(f"  服务地址: {config.HOST}:{config.PORT}")
        print()
        
        # 验证目录
        print("目录验证:")
        directories = {
            'DATA_DIR': config.DATA_DIR,
            'TEMP_DIR': config.TEMP_DIR,
            'UPLOAD_DIR': config.UPLOAD_DIR,
            'RESULTS_DIR': config.RESULTS_DIR,
            'STORAGE_DIR': config.STORAGE_DIR,
        }
        
        for name, path in directories.items():
            if os.path.exists(path):
                print(f"  ✓ {name}: {path}")
            else:
                print(f"  ✗ {name}: {path} (不存在)")
        print()
        
        # 验证关键配置
        print("关键配置:")
        print(f"  SECRET_KEY: {'已设置' if config.SECRET_KEY != 'dev-secret-key-change-in-production' else '使用默认值（不安全）'}")
        print(f"  最大并发任务: {config.MAX_CONCURRENT_TASKS}")
        print(f"  队列大小: {config.MAX_QUEUE_SIZE}")
        print(f"  文件大小限制: {config.MAX_CONTENT_LENGTH / 1024 / 1024:.0f}MB")
        print(f"  日志级别: {config.LOG_LEVEL}")
        print(f"  日志文件: {config.LOG_FILE}")
        print()
        
        # 验证安全配置
        print("安全配置:")
        print(f"  CORS启用: {config.ENABLE_CORS}")
        print(f"  CORS来源: {config.CORS_ORIGINS}")
        print(f"  Cookie安全: {config.SESSION_COOKIE_SECURE}")
        print(f"  Cookie HttpOnly: {config.SESSION_COOKIE_HTTPONLY}")
        print()
        
        # 验证依赖
        print("依赖验证:")
        try:
            import flask
            print(f"  ✓ Flask: {flask.__version__}")
        except ImportError:
            print("  ✗ Flask: 未安装")
        
        try:
            import cv2
            print(f"  ✓ OpenCV: {cv2.__version__}")
        except ImportError:
            print("  ✗ OpenCV: 未安装")
        
        try:
            import numpy
            print(f"  ✓ NumPy: {numpy.__version__}")
        except ImportError:
            print("  ✗ NumPy: 未安装")
        
        print()
        print("✓ 配置验证完成")
        return True
        
    except Exception as e:
        print(f"✗ 配置验证失败: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = validate_config()
    sys.exit(0 if success else 1)