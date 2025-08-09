#!/usr/bin/env python3
"""
测试导入脚本 - 验证所有模块是否能正确导入
"""
import os
import sys

# 添加脚本所在目录到Python路径
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)

# 切换到脚本所在目录
original_cwd = os.getcwd()
os.chdir(script_dir)

def test_imports():
    """测试所有关键模块的导入"""
    print("测试 MediaCraft 模块导入")
    print("=" * 40)
    
    # 测试核心模块
    try:
        from core.env_config import get_config
        print("✓ core.env_config 导入成功")
    except ImportError as e:
        print(f"✗ core.env_config 导入失败: {e}")
        return False
    
    try:
        from core.storage import FileStorageManager
        from core.session import SessionManager
        from core.task_queue import TaskQueueManager
        from core.config_manager import ConfigManager
        from core.user_manager import UserManager
        print("✓ 所有 core 模块导入成功")
    except ImportError as e:
        print(f"✗ core 模块导入失败: {e}")
        return False
    
    # 测试 API 模块
    try:
        from api.session import session_bp
        from api.tasks import tasks_bp
        from api.files import files_bp
        from api.user import user_bp
        print("✓ 所有 API 模块导入成功")
    except ImportError as e:
        print(f"✗ API 模块导入失败: {e}")
        return False
    
    # 测试处理器模块
    try:
        from processors.watermark import WatermarkProcessor
        from processors.merger import VideoMerger
        print("✓ 所有 processors 模块导入成功")
    except ImportError as e:
        print(f"✗ processors 模块导入失败: {e}")
        return False
    
    # 测试模型模块
    try:
        from models.user import User
        from models.task import VideoWatermarkTask
        from models.merge_task import VideoMergeTask
        print("✓ 所有 models 模块导入成功")
    except ImportError as e:
        print(f"✗ models 模块导入失败: {e}")
        return False
    
    # 测试应用创建
    try:
        from app import create_app
        app = create_app()
        print("✓ 应用创建成功")
        print(f"  - 调试模式: {app.config.get('DEBUG')}")
        print(f"  - 数据目录: {app.config.get('DATA_DIR')}")
        print(f"  - 蓝图数量: {len(app.blueprints)}")
    except Exception as e:
        print(f"✗ 应用创建失败: {e}")
        return False
    
    print("\n✓ 所有模块导入测试通过！")
    return True

if __name__ == '__main__':
    try:
        success = test_imports()
        sys.exit(0 if success else 1)
    finally:
        # 恢复原始工作目录
        os.chdir(original_cwd)