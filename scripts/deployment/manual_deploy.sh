#!/bin/bash
# MediaCraft 手工部署辅助脚本
# 用于简化手工部署过程中的重复操作

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为 root 用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用 root 权限运行此脚本"
        exit 1
    fi
}

# 检测操作系统
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    else
        log_error "无法检测操作系统类型"
        exit 1
    fi
    log_info "检测到操作系统: $OS $VER"
}

# 安装系统依赖
install_dependencies() {
    log_info "安装系统依赖..."
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        apt update
        apt install -y \
            python3 python3-pip python3-venv python3-dev \
            build-essential curl wget git nginx ffmpeg \
            libgl1-mesa-glx libglib2.0-0 libsm6 libxrender1 libxext6
        
        # 安装 Node.js 18
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
        
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]] || [[ "$OS" == *"AlmaLinux"* ]]; then
        dnf update -y
        dnf install -y \
            python3 python3-pip python3-devel gcc gcc-c++ make \
            curl wget git nginx mesa-libGL glib2 libSM libXrender libXext
        
        # 安装 Node.js 18
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
        dnf install -y nodejs
        
        # 安装 FFmpeg
        dnf install -y epel-release
        dnf install -y https://download1.rpmfusion.org/free/el/rpmfusion-free-release-9.noarch.rpm || true
        dnf install -y ffmpeg
    else
        log_error "不支持的操作系统: $OS"
        exit 1
    fi
    
    log_success "系统依赖安装完成"
}

# 创建用户和目录
setup_user_and_directories() {
    log_info "创建用户和目录..."
    
    # 创建 mediacraft 用户
    if ! id "mediacraft" &>/dev/null; then
        useradd -r -s /bin/bash -d /var/www/mediacraft mediacraft
        log_success "创建用户 mediacraft"
    else
        log_warning "用户 mediacraft 已存在"
    fi
    
    # 创建目录
    mkdir -p /var/www/mediacraft
    chown mediacraft:mediacraft /var/www/mediacraft
    
    # 创建子目录
    sudo -u mediacraft mkdir -p /var/www/mediacraft/{storage,temp,logs}
    sudo -u mediacraft mkdir -p /var/www/mediacraft/storage/{uploads,results,tasks}
    sudo -u mediacraft mkdir -p /var/www/mediacraft/temp/{processing,merge_temp}
    
    log_success "用户和目录创建完成"
}

# 部署应用代码
deploy_application() {
    local release_file="$1"
    
    if [ -z "$release_file" ]; then
        log_error "请提供发布包路径"
        exit 1
    fi
    
    if [ ! -f "$release_file" ]; then
        log_error "发布包文件不存在: $release_file"
        exit 1
    fi
    
    log_info "部署应用代码..."
    
    # 解压到临时目录
    local temp_dir="/tmp/mediacraft-deploy-$$"
    mkdir -p "$temp_dir"
    tar -xzf "$release_file" -C "$temp_dir"
    
    # 找到解压后的目录
    local app_dir=$(find "$temp_dir" -maxdepth 1 -type d -name "mediacraft-*" | head -1)
    if [ -z "$app_dir" ]; then
        log_error "无法找到应用目录"
        exit 1
    fi
    
    # 备份现有部署 (如果存在)
    if [ -d "/var/www/mediacraft/app.py" ]; then
        local backup_dir="/backup/mediacraft-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$backup_dir"
        cp -r /var/www/mediacraft/* "$backup_dir/" 2>/dev/null || true
        log_info "已备份现有部署到: $backup_dir"
    fi
    
    # 复制新文件
    cp -r "$app_dir"/* /var/www/mediacraft/
    chown -R mediacraft:mediacraft /var/www/mediacraft
    
    # 清理临时文件
    rm -rf "$temp_dir"
    
    log_success "应用代码部署完成"
}

# 配置后端
setup_backend() {
    log_info "配置后端服务..."
    
    # 切换到 mediacraft 用户执行
    sudo -u mediacraft bash << 'EOF'
cd /var/www/mediacraft

# 创建虚拟环境
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# 激活虚拟环境并安装依赖
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 测试导入
python -c "import cv2, numpy, flask, flask_cors; print('后端依赖安装成功')"
EOF
    
    log_success "后端配置完成"
}

# 配置前端
setup_frontend() {
    log_info "配置前端服务..."
    
    sudo -u mediacraft bash << 'EOF'
cd /var/www/mediacraft/frontend

# 安装依赖
npm install --production --no-optional

# 验证安装
npm list --depth=0 > /dev/null
EOF
    
    log_success "前端配置完成"
}

# 创建系统服务
create_systemd_services() {
    log_info "创建系统服务..."
    
    # 后端服务
    cat > /etc/systemd/system/mediacraft-backend.service << 'EOF'
[Unit]
Description=MediaCraft Backend Service
After=network.target

[Service]
Type=simple
User=mediacraft
Group=mediacraft
WorkingDirectory=/var/www/mediacraft
Environment=PATH=/var/www/mediacraft/venv/bin
Environment=PYTHONPATH=/var/www/mediacraft
Environment=DEBUG=False
Environment=HOST=127.0.0.1
Environment=PORT=50001
ExecStart=/var/www/mediacraft/venv/bin/python /var/www/mediacraft/app.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# 安全设置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/var/www/mediacraft/storage /var/www/mediacraft/temp /var/www/mediacraft/logs

[Install]
WantedBy=multi-user.target
EOF

    # 前端服务
    cat > /etc/systemd/system/mediacraft-frontend.service << 'EOF'
[Unit]
Description=MediaCraft Frontend Service
After=network.target

[Service]
Type=simple
User=mediacraft
Group=mediacraft
WorkingDirectory=/var/www/mediacraft/frontend
Environment=NODE_ENV=production
Environment=NEXT_PUBLIC_API_URL=http://127.0.0.1:50001
Environment=PORT=3000
Environment=HOSTNAME=127.0.0.1
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# 安全设置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict

[Install]
WantedBy=multi-user.target
EOF

    # 重新加载并启用服务
    systemctl daemon-reload
    systemctl enable mediacraft-backend.service
    systemctl enable mediacraft-frontend.service
    
    log_success "系统服务创建完成"
}

# 配置 Nginx
setup_nginx() {
    local domain="$1"
    
    if [ -z "$domain" ]; then
        domain="localhost"
        log_warning "未指定域名，使用默认值: localhost"
    fi
    
    log_info "配置 Nginx (域名: $domain)..."
    
    cat > /etc/nginx/sites-available/mediacraft << EOF
# MediaCraft Nginx Configuration
server {
    listen 80;
    server_name $domain;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # 文件上传大小限制
    client_max_body_size 500M;
    
    # 后端 API 路由
    location ^~ /api/ {
        proxy_pass http://127.0.0.1:50001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # 超时设置
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        
        # 大文件上传
        proxy_request_buffering off;
        
        # 缓冲设置
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
    
    # 静态文件
    location ^~ /static/ {
        alias /var/www/mediacraft/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Next.js 静态文件
    location ^~ /_next/static/ {
        alias /var/www/mediacraft/frontend/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 前端应用 (默认路由)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # 超时设置
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
    
    # 日志
    access_log /var/log/nginx/mediacraft_access.log;
    error_log /var/log/nginx/mediacraft_error.log;
}
EOF

    # 启用站点
    ln -sf /etc/nginx/sites-available/mediacraft /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # 测试配置
    if nginx -t; then
        log_success "Nginx 配置完成"
    else
        log_error "Nginx 配置有误"
        exit 1
    fi
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    # 启动应用服务
    systemctl start mediacraft-backend.service
    systemctl start mediacraft-frontend.service
    
    # 重新加载 Nginx
    systemctl reload nginx
    
    # 检查服务状态
    sleep 5
    
    if systemctl is-active --quiet mediacraft-backend.service; then
        log_success "后端服务启动成功"
    else
        log_error "后端服务启动失败"
        journalctl -u mediacraft-backend.service -n 10
    fi
    
    if systemctl is-active --quiet mediacraft-frontend.service; then
        log_success "前端服务启动成功"
    else
        log_error "前端服务启动失败"
        journalctl -u mediacraft-frontend.service -n 10
    fi
    
    if systemctl is-active --quiet nginx.service; then
        log_success "Nginx 服务运行正常"
    else
        log_error "Nginx 服务异常"
    fi
}

# 验证部署
verify_deployment() {
    local domain="$1"
    if [ -z "$domain" ]; then
        domain="localhost"
    fi
    
    log_info "验证部署..."
    
    # 检查端口监听
    if netstat -tlnp | grep -q ":50001"; then
        log_success "后端端口 50001 监听正常"
    else
        log_error "后端端口 50001 未监听"
    fi
    
    if netstat -tlnp | grep -q ":3000"; then
        log_success "前端端口 3000 监听正常"
    else
        log_error "前端端口 3000 未监听"
    fi
    
    # 健康检查
    sleep 10
    if curl -f -s "http://127.0.0.1:50001/api/health" > /dev/null; then
        log_success "后端健康检查通过"
    else
        log_warning "后端健康检查失败，可能需要更多时间启动"
    fi
    
    if curl -f -s "http://127.0.0.1:3000" > /dev/null; then
        log_success "前端健康检查通过"
    else
        log_warning "前端健康检查失败，可能需要更多时间启动"
    fi
    
    echo ""
    log_success "部署完成！"
    echo ""
    echo "访问地址:"
    echo "  - 主应用: http://$domain"
    echo "  - 后端 API: http://$domain/api/health"
    echo ""
    echo "服务管理命令:"
    echo "  - 查看状态: systemctl status mediacraft-backend mediacraft-frontend"
    echo "  - 重启服务: systemctl restart mediacraft-backend mediacraft-frontend"
    echo "  - 查看日志: journalctl -u mediacraft-backend -f"
    echo ""
}

# 显示帮助信息
show_help() {
    echo "MediaCraft 手工部署辅助脚本"
    echo ""
    echo "用法:"
    echo "  $0 [选项] <发布包路径>"
    echo ""
    echo "选项:"
    echo "  -d, --domain DOMAIN    指定域名 (默认: localhost)"
    echo "  -h, --help            显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 releases/mediacraft-2.2.1.tar.gz"
    echo "  $0 -d mediacraft.example.com releases/mediacraft-2.2.1.tar.gz"
    echo ""
}

# 主函数
main() {
    local domain="localhost"
    local release_file=""
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--domain)
                domain="$2"
                shift 2
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            -*)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
            *)
                release_file="$1"
                shift
                ;;
        esac
    done
    
    if [ -z "$release_file" ]; then
        log_error "请提供发布包路径"
        show_help
        exit 1
    fi
    
    echo "MediaCraft 手工部署脚本"
    echo "======================="
    echo "域名: $domain"
    echo "发布包: $release_file"
    echo ""
    
    # 执行部署步骤
    check_root
    detect_os
    install_dependencies
    setup_user_and_directories
    deploy_application "$release_file"
    setup_backend
    setup_frontend
    create_systemd_services
    setup_nginx "$domain"
    start_services
    verify_deployment "$domain"
}

# 运行主函数
main "$@"