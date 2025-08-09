#!/usr/bin/env python3
"""
系统功能测试脚本
"""
import os
import sys
import json
import requests
import time

def test_system():
    """测试系统基础功能"""
    base_url = "http://localhost:5000"
    
    print("🚀 开始测试MediaCraft异步任务系统...")
    
    # 测试1: 系统状态
    print("\n1. 测试系统状态...")
    try:
        response = requests.get(f"{base_url}/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 系统运行正常: {data.get('name')}")
        else:
            print(f"❌ 系统状态异常: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到服务器，请确保Flask应用正在运行")
        print("   运行命令: python3 app.py")
        return False
    
    # 测试2: 会话初始化
    print("\n2. 测试会话初始化...")
    try:
        response = requests.get(f"{base_url}/api/session/init")
        if response.status_code == 200:
            data = response.json()
            sid = data.get('sid')
            print(f"✅ 会话创建成功: {sid[:8]}...")
            
            # 保存cookies用于后续请求
            cookies = response.cookies
        else:
            print(f"❌ 会话创建失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 会话测试失败: {e}")
        return False
    
    # 测试3: 会话验证
    print("\n3. 测试会话验证...")
    try:
        response = requests.get(f"{base_url}/api/session/validate", cookies=cookies)
        if response.status_code == 200:
            data = response.json()
            if data.get('valid'):
                print("✅ 会话验证成功")
            else:
                print("❌ 会话验证失败")
                return False
        else:
            print(f"❌ 会话验证请求失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 会话验证测试失败: {e}")
        return False
    
    # 测试4: 任务列表
    print("\n4. 测试任务列表...")
    try:
        response = requests.get(f"{base_url}/api/tasks/list", cookies=cookies)
        if response.status_code == 200:
            data = response.json()
            tasks = data.get('tasks', [])
            print(f"✅ 任务列表获取成功，当前任务数: {len(tasks)}")
        else:
            print(f"❌ 任务列表获取失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 任务列表测试失败: {e}")
        return False
    
    # 测试5: 系统状态API
    print("\n5. 测试系统状态API...")
    try:
        response = requests.get(f"{base_url}/api/system/status")
        if response.status_code == 200:
            data = response.json()
            queue_status = data.get('queue', {})
            print(f"✅ 系统状态获取成功")
            print(f"   - 活跃任务: {queue_status.get('active_tasks', 0)}")
            print(f"   - 队列任务: {queue_status.get('queued_tasks', 0)}")
            print(f"   - 最大并发: {queue_status.get('max_concurrent', 0)}")
        else:
            print(f"❌ 系统状态获取失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 系统状态测试失败: {e}")
        return False
    
    # 测试6: 文件列表
    print("\n6. 测试文件列表...")
    try:
        response = requests.get(f"{base_url}/api/files/list", cookies=cookies)
        if response.status_code == 200:
            data = response.json()
            files = data.get('files', [])
            print(f"✅ 文件列表获取成功，当前文件数: {len(files)}")
        else:
            print(f"❌ 文件列表获取失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 文件列表测试失败: {e}")
        return False
    
    print("\n🎉 所有基础功能测试通过！")
    print("\n📋 测试总结:")
    print("   ✅ 系统启动正常")
    print("   ✅ 会话管理功能正常")
    print("   ✅ API接口响应正常")
    print("   ✅ 任务队列系统就绪")
    print("   ✅ 文件管理功能正常")
    
    return True

def test_data_persistence():
    """测试数据持久化"""
    print("\n🗄️  测试数据持久化...")
    
    data_files = [
        'data/sessions.json',
        'data/tasks.json',
        'data/config.json'
    ]
    
    for file_path in data_files:
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                print(f"✅ {file_path} 格式正确")
            except json.JSONDecodeError:
                print(f"❌ {file_path} JSON格式错误")
                return False
        else:
            print(f"❌ {file_path} 文件不存在")
            return False
    
    print("✅ 数据持久化测试通过")
    return True

if __name__ == "__main__":
    print("MediaCraft异步任务系统 - 功能测试")
    print("=" * 50)
    
    # 测试数据持久化
    if not test_data_persistence():
        sys.exit(1)
    
    # 测试系统功能
    if not test_system():
        sys.exit(1)
    
    print("\n🎊 所有测试完成！系统运行正常。")