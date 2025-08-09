#!/bin/bash
# MediaCraft 生产环境启动脚本

echo "启动 MediaCraft 生产环境服务..."
echo "=================================="

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    echo "生产环境需要 root 权限"
    exit 1
fi

# 默认安装目录
INSTALL_DIR="/var/www/mediacraft"
DATA_DIR="/var/lib/mediacraft"

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -i|--install-dir)
            INSTALL_DIR="$2"
            shift 2
            ;;
        -d|--data-dir)
            DATA_DIR="$2"
            shift 2
            ;;
        -h|--help)
            echo "用法: $0 [选项]"
            echo "选项:"
            echo "  -i, --install-dir DIR    程序安装目录 (默认: $INSTALL_DIR)"
            echo "  -d, --data-dir DIR       数据存储目录 (默认: $DATA_DIR)"
            echo "  -h, --help              显示帮助信息"
            exit 0
            ;;
        *)
            echo "未知选项: $1"
            exit 1
            ;;
    esac
done

echo "程序目录: $INSTALL_DIR"
echo "数据目录: $DATA_DIR"

# 检查安装目录
if [ ! -d "$INSTALL_DIR" ]; then
    echo "错误: 程序目录不存在: $INSTALL_DIR"
    echo "请先运行安装脚本"
    exit 1
fi

# 检查配置文件
if [ ! -f "$INSTALL_DIR/.env.production" ]; then
    echo "错误: 生产环境配置文件不存在: $INSTALL_DIR/.env.production"
    echo "请先运行安装脚本"
    exit 1
fi

# 验证配置
echo "验证配置..."
cd "$INSTALL_DIR"
source venv/bin/activate
python scripts/validate_config.py || {
    echo "配置验证失败，请检查配置文件"
    exit 1
}

echo ""
echo "启动服务..."

# 启动 systemd 服务
systemctl start mediacraft-backend
systemctl start mediacraft-frontend

# 检查服务状态
sleep 3
if systemctl is-active --quiet mediacraft-backend; then
    echo "✓ 后端服务启动成功"
else
    echo "✗ 后端服务启动失败"
    systemctl status mediacraft-backend
fi

if systemctl is-active --quiet mediacraft-frontend; then
    echo "✓ 前端服务启动成功"
else
    echo "✗ 前端服务启动失败"
    systemctl status mediacraft-frontend
fi

# 重新加载 Nginx
systemctl reload nginx

echo ""
echo "服务状态:"
echo "- 后端服务: $(systemctl is-active mediacraft-backend)"
echo "- 前端服务: $(systemctl is-active mediacraft-frontend)"
echo "- Nginx: $(systemctl is-active nginx)"
echo ""
echo "日志查看:"
echo "- 后端日志: journalctl -u mediacraft-backend -f"
echo "- 前端日志: journalctl -u mediacraft-frontend -f"
echo "- 应用日志: tail -f $DATA_DIR/logs/app.log"