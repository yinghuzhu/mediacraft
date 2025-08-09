#!/usr/bin/env python3
"""
测试用户身份管理系统
"""
import sys
import os
import requests
import json

# 添加当前目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_user_system():
    """测试用户系统的基本功能"""
    base_url = "http://localhost:50001"
    
    print("🧪 测试用户身份管理系统")
    print("=" * 50)
    
    # 创建会话对象以保持Cookie
    session = requests.Session()
    
    try:
        # 1. 测试会话初始化
        print("\n1. 测试会话初始化...")
        response = session.get(f"{base_url}/api/session/init")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 会话初始化成功: {data.get('sid')[:8]}...")
            print(f"   新会话: {data.get('created')}")
        else:
            print(f"❌ 会话初始化失败: {response.status_code}")
            return False
        
        # 2. 测试用户信息获取
        print("\n2. 测试用户信息获取...")
        response = session.get(f"{base_url}/api/user/info")
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                user_info = data.get('data', {})
                print(f"✅ 用户信息获取成功:")
                print(f"   用户ID: {user_info.get('user_id', '')[:8]}...")
                print(f"   创建时间: {user_info.get('created_at')}")
                print(f"   任务数量: {user_info.get('task_count', 0)}")
            else:
                print(f"❌ 用户信息获取失败: {data.get('message')}")
                return False
        else:
            print(f"❌ 用户信息获取失败: {response.status_code}")
            return False
        
        # 3. 测试用户任务列表
        print("\n3. 测试用户任务列表...")
        response = session.get(f"{base_url}/api/user/tasks")
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                tasks_data = data.get('data', {})
                print(f"✅ 用户任务列表获取成功:")
                print(f"   任务总数: {tasks_data.get('total_count', 0)}")
                print(f"   状态统计: {tasks_data.get('status_stats', {})}")
            else:
                print(f"❌ 用户任务列表获取失败: {data.get('message')}")
                return False
        else:
            print(f"❌ 用户任务列表获取失败: {response.status_code}")
            return False
        
        # 4. 测试用户统计信息
        print("\n4. 测试用户统计信息...")
        response = session.get(f"{base_url}/api/user/stats")
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                stats = data.get('data', {})
                print(f"✅ 用户统计信息获取成功:")
                print(f"   用户ID: {stats.get('user_id', '')[:8]}...")
                print(f"   注册时间: {stats.get('member_since')}")
                print(f"   最后活跃: {stats.get('last_active')}")
                print(f"   总任务数: {stats.get('total_tasks', 0)}")
            else:
                print(f"❌ 用户统计信息获取失败: {data.get('message')}")
                return False
        else:
            print(f"❌ 用户统计信息获取失败: {response.status_code}")
            return False
        
        # 5. 测试会话验证
        print("\n5. 测试会话验证...")
        response = session.get(f"{base_url}/api/session/validate")
        if response.status_code == 200:
            data = response.json()
            if data.get('valid'):
                print(f"✅ 会话验证成功:")
                print(f"   会话ID: {data.get('sid', '')[:8]}...")
                print(f"   活跃状态: {data.get('session_info', {}).get('is_active')}")
            else:
                print(f"❌ 会话验证失败: {data.get('message')}")
                return False
        else:
            print(f"❌ 会话验证失败: {response.status_code}")
            return False
        
        # 6. 测试系统状态
        print("\n6. 测试系统状态...")
        response = session.get(f"{base_url}/api/system/status")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 系统状态获取成功:")
            print(f"   系统状态: {data.get('status')}")
            print(f"   队列状态: {data.get('queue', {})}")
            print(f"   会话统计: {data.get('sessions', {})}")
        else:
            print(f"❌ 系统状态获取失败: {response.status_code}")
        
        print("\n" + "=" * 50)
        print("🎉 用户身份管理系统测试完成！")
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到服务器，请确保应用正在运行")
        print("   启动命令: python app.py")
        return False
    except Exception as e:
        print(f"❌ 测试过程中出现错误: {e}")
        return False

if __name__ == "__main__":
    success = test_user_system()
    sys.exit(0 if success else 1)