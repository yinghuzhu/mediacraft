#!/bin/bash
# MediaCraft 后端测试脚本

echo "测试 MediaCraft 后端服务"
echo "========================"

BASE_URL="http://127.0.0.1:50001"

echo "1. 测试健康检查..."
if curl -s -f "$BASE_URL/api/health" > /dev/null; then
    echo "✓ 健康检查通过"
    curl -s "$BASE_URL/api/health" | python3 -m json.tool
else
    echo "✗ 健康检查失败 - 服务可能未启动"
    echo "请先运行: ./start_backend.sh"
    exit 1
fi

echo ""
echo "2. 测试系统信息..."
curl -s "$BASE_URL/api/system/info" | python3 -m json.tool

echo ""
echo "3. 测试任务队列状态..."
curl -s "$BASE_URL/api/tasks/status" | python3 -m json.tool

echo ""
echo "4. 测试会话创建..."
curl -s "$BASE_URL/api/session/create" | python3 -m json.tool

echo ""
echo "✓ 后端服务测试完成"