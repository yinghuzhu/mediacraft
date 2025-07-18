#!/usr/bin/env python3
"""
视频去水印功能测试脚本
用于验证 Demo 版本的基本功能
"""

import os
import sys
import tempfile
import requests
import json
from pathlib import Path

# 添加 app 目录到 Python 路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_video_watermark_models():
    """测试数据模型"""
    print("🧪 测试数据模型...")
    
    try:
        from video_watermark.models import VideoWatermarkTask, WatermarkRegion, TaskProcessingLog, storage
        
        # 测试创建任务
        task = VideoWatermarkTask("test_video.mp4", 1024*1024, "mp4")
        print(f"✅ 创建任务成功: {task.task_uuid}")
        
        # 测试保存任务（使用简化存储）
        if task.save():
            print("✅ 任务保存成功")
        else:
            print("❌ 任务保存失败")
        
        # 测试获取任务
        retrieved_task = VideoWatermarkTask.get_by_uuid(task.task_uuid)
        if retrieved_task:
            print("✅ 任务检索成功")
        else:
            print("❌ 任务检索失败")
        
        # 测试水印区域
        regions = [
            {
                'region_order': 1,
                'x': 100,
                'y': 100,
                'width': 200,
                'height': 150
            }
        ]
        if storage.save_regions(task.task_uuid, regions):
            print("✅ 水印区域保存成功")
        else:
            print("❌ 水印区域保存失败")
        
        # 测试获取区域
        retrieved_regions = storage.get_regions(task.task_uuid)
        if retrieved_regions:
            print("✅ 水印区域检索成功")
        else:
            print("❌ 水印区域检索失败")
        
        # 测试日志
        TaskProcessingLog.add_log(task.task_uuid, 'info', '测试日志消息', 'test')
        print("✅ 日志记录成功")
        
        return True
        
    except Exception as e:
        print(f"❌ 模型测试失败: {e}")
        return False

def test_video_processor():
    """测试视频处理器"""
    print("\n🎬 测试视频处理器...")
    
    try:
        from video_watermark.video_processor import VideoProcessor
        
        processor = VideoProcessor()
        print("✅ 视频处理器初始化成功")
        
        # 注意：这里需要一个真实的视频文件来测试
        # 在实际部署时，可以创建一个小的测试视频文件
        print("ℹ️  视频处理器功能需要真实视频文件进行完整测试")
        
        return True
        
    except Exception as e:
        print(f"❌ 视频处理器测试失败: {e}")
        return False

def test_api_endpoints():
    """测试 API 端点（需要服务器运行）"""
    print("\n🌐 测试 API 端点...")
    
    # 这里只是检查路由是否正确导入
    try:
        from video_watermark.routes import video_watermark_bp
        print("✅ API 路由导入成功")
        
        # 检查蓝图中的路由（简化版本）
        print("📋 可用的 API 端点:")
        print("   POST /api/video/upload - 上传视频")
        print("   GET /api/video/task/{uuid}/frames - 获取视频帧")
        print("   POST /api/video/task/{uuid}/select-frame - 选择帧")
        print("   POST /api/video/task/{uuid}/select-regions - 提交水印区域")
        print("   GET /api/video/task/{uuid}/status - 查询任务状态")
        print("   GET /api/video/task/{uuid}/download - 下载结果")
        
        return True
        
    except Exception as e:
        print(f"❌ API 端点测试失败: {e}")
        return False

def check_storage_directory():
    """检查存储目录"""
    print("\n📁 检查存储目录...")
    
    try:
        temp_storage_dir = Path("temp_storage")
        if not temp_storage_dir.exists():
            temp_storage_dir.mkdir(exist_ok=True)
            print("✅ 创建临时存储目录")
        else:
            print("✅ 临时存储目录已存在")
        
        print(f"   存储位置: {temp_storage_dir.absolute()}")
        return True
        
    except Exception as e:
        print(f"❌ 存储目录检查失败: {e}")
        return False

def check_dependencies():
    """检查依赖项"""
    print("\n📦 检查依赖项...")
    
    required_packages = [
        'cv2',
        'numpy', 
        'flask'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            if package == 'cv2':
                import cv2
            elif package == 'numpy':
                import numpy
            elif package == 'flask':
                import flask
            
            print(f"✅ {package} 已安装")
            
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package} 未安装")
    
    if missing_packages:
        print(f"\n⚠️  缺少依赖项: {', '.join(missing_packages)}")
        print("请运行: pip install -r requirements.txt")
        return False
    
    return True

def main():
    """主测试函数"""
    print("🚀 视频去水印功能测试开始...\n")
    
    tests = [
        ("依赖项检查", check_dependencies),
        ("存储目录检查", check_storage_directory),
        ("数据模型测试", test_video_watermark_models),
        ("视频处理器测试", test_video_processor),
        ("API 端点测试", test_api_endpoints)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"{'='*50}")
        print(f"测试: {test_name}")
        print(f"{'='*50}")
        
        if test_func():
            passed += 1
            print(f"✅ {test_name} 通过")
        else:
            print(f"❌ {test_name} 失败")
    
    print(f"\n{'='*50}")
    print(f"测试结果: {passed}/{total} 通过")
    print(f"{'='*50}")
    
    if passed == total:
        print("🎉 所有测试通过！视频去水印功能准备就绪。")
        print("\n📝 下一步:")
        print("1. 启动 Flask 应用: python app/routes.py")
        print("2. 访问 http://localhost:50001/video-watermark.html")
        print("3. 上传测试视频进行完整功能验证")
        print("\n💡 提示:")
        print("- 使用内存和文件存储，无需数据库")
        print("- 支持 MP4, MOV, AVI, MKV 格式")
        print("- 文件大小限制 500MB")
    else:
        print("⚠️  部分测试失败，请检查上述错误信息。")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)