#!/usr/bin/env python3
"""
视频去水印功能快速启动脚本
"""

import os
import sys
import subprocess
import webbrowser
import time

def check_dependencies():
    """检查依赖项"""
    print("🔍 检查依赖项...")
    
    try:
        import cv2
        import numpy
        import flask
        print("✅ 所有依赖项已安装")
        return True
    except ImportError as e:
        print(f"❌ 缺少依赖项: {e}")
        print("请运行: pip3 install -r video_watermark_requirements.txt")
        return False

def run_tests():
    """运行测试"""
    print("\n🧪 运行功能测试...")
    
    try:
        result = subprocess.run([sys.executable, "test_video_watermark.py"], 
                              capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print("✅ 所有测试通过")
            return True
        else:
            print("❌ 部分测试失败")
            print(result.stdout)
            return False
    except Exception as e:
        print(f"❌ 测试运行失败: {e}")
        return False

def start_server():
    """启动服务器"""
    print("\n🚀 启动视频去水印服务...")
    
    try:
        # 启动 Flask 应用
        print("启动服务器在 http://localhost:50001")
        print("视频去水印页面: http://localhost:50001/")
        print("\n按 Ctrl+C 停止服务器")
        
        # 延迟打开浏览器
        def open_browser():
            time.sleep(2)
            webbrowser.open("http://localhost:50001/")
        
        import threading
        browser_thread = threading.Thread(target=open_browser)
        browser_thread.daemon = True
        browser_thread.start()
        
        # 启动 Flask 应用
        os.chdir(os.path.dirname(os.path.abspath(__file__)))
        subprocess.run([sys.executable, "app/routes.py"])
        
    except KeyboardInterrupt:
        print("\n👋 服务器已停止")
    except Exception as e:
        print(f"❌ 启动服务器失败: {e}")

def main():
    """主函数"""
    print("🎬 视频去水印功能启动器")
    print("=" * 50)
    
    # 检查依赖
    if not check_dependencies():
        return
    
    # 运行测试
    if not run_tests():
        print("\n⚠️  测试失败，但仍可以尝试启动服务器")
        response = input("是否继续启动服务器？(y/N): ")
        if response.lower() != 'y':
            return
    
    # 启动服务器
    start_server()

if __name__ == "__main__":
    main()