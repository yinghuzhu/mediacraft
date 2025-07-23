#!/bin/bash
# MediaCraft Release Creation Script

echo "Creating MediaCraft Release Package"
echo "=================================="

# Set version
VERSION="2.0.0"
RELEASE_NAME="mediacraft-${VERSION}"

# Create release directory
mkdir -p releases
RELEASE_DIR="releases/${RELEASE_NAME}"
rm -rf $RELEASE_DIR
mkdir -p $RELEASE_DIR

echo "Building Next.js frontend..."
cd mediacraft-frontend
npm run build
cd ..

echo "Copying backend files..."
# Copy backend files
cp -r models/ $RELEASE_DIR/
cp -r processors/ $RELEASE_DIR/
cp -r scripts/ $RELEASE_DIR/
cp -r static/ $RELEASE_DIR/
cp requirements.txt $RELEASE_DIR/
cp README.md $RELEASE_DIR/

# Create empty directories for storage and temp (don't copy existing content)
mkdir -p $RELEASE_DIR/storage/tasks
mkdir -p $RELEASE_DIR/storage/uploads
mkdir -p $RELEASE_DIR/storage/merge_tasks
mkdir -p $RELEASE_DIR/temp

# Create symbolic links for backward compatibility
(cd $RELEASE_DIR && \
ln -sf scripts/core/app.py app.py && \
ln -sf scripts/core/config.py config.py && \
ln -sf scripts/launchers/start_video_watermark.py start_video_watermark.py && \
ln -sf scripts/launchers/start_video_merger.py start_video_merger.py)

echo "Copying frontend build..."
# Copy frontend build
mkdir -p $RELEASE_DIR/frontend

# Copy .next directory but exclude cache
cp -r mediacraft-frontend/.next $RELEASE_DIR/frontend/
rm -rf $RELEASE_DIR/frontend/.next/cache

# Copy other frontend files
cp -r mediacraft-frontend/public $RELEASE_DIR/frontend/
cp mediacraft-frontend/package.json $RELEASE_DIR/frontend/
cp mediacraft-frontend/next.config.js $RELEASE_DIR/frontend/
cp mediacraft-frontend/next-i18next.config.js $RELEASE_DIR/frontend/

echo "Copying additional files..."
# Copy additional files that might be needed
cp -r docs/ $RELEASE_DIR/ 2>/dev/null || true

echo "Creating systemd service files..."
# Create systemd service for backend
cat > $RELEASE_DIR/mediacraft-backend.service << 'EOF'
[Unit]
Description=MediaCraft Backend Service
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/mediacraft
Environment=PATH=/var/www/mediacraft/venv/bin
ExecStart=/var/www/mediacraft/venv/bin/python /var/www/mediacraft/scripts/core/app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create systemd service for frontend
cat > $RELEASE_DIR/mediacraft-frontend.service << 'EOF'
[Unit]
Description=MediaCraft Frontend Service
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/mediacraft/frontend
Environment=NODE_ENV=production
Environment=NEXT_PUBLIC_API_URL=http://localhost:50001
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo "Creating Nginx configuration..."
# Create updated Nginx configuration
cat > $RELEASE_DIR/nginx_mediacraft.conf << 'EOF'
# MediaCraft Nginx Configuration
server {
    listen 80;
    server_name mediacraft.yzhu.name;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:50001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        
        # Handle large file uploads
        client_max_body_size 500M;
        proxy_request_buffering off;
    }
    
    # Static files
    location /static/ {
        alias /var/www/mediacraft/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Logs
    access_log /var/log/nginx/mediacraft_access.log;
    error_log /var/log/nginx/mediacraft_error.log;
}
EOF

echo "Creating installation script..."
# Create updated installation script
cat > $RELEASE_DIR/install.sh << 'EOF'
#!/bin/bash
# MediaCraft Installation Script v2.0

set -e

echo "MediaCraft Installation Script v2.0"
echo "===================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit 1
fi

# Detect Linux distribution
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    echo "Cannot detect Linux distribution. Assuming Ubuntu/Debian-like system."
    OS="Ubuntu"
fi

echo "Detected OS: $OS $VER"

# Install system dependencies
echo "Installing system dependencies..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    echo "Installing dependencies using apt..."
    apt-get update
    
    # Install Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    # Python and system dependencies
    apt-get install -y python3 python3-pip python3-venv
    apt-get install -y libgl1-mesa-glx libglib2.0-0 libsm6 libxrender1 libxext6
    apt-get install -y ffmpeg
    apt-get install -y nginx
    apt-get install -y curl wget
    
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Fedora"* ]] || [[ "$OS" == *"Rocky"* ]] || [[ "$OS" == *"AlmaLinux"* ]]; then
    echo "Installing dependencies using dnf/yum..."
    
    # Install Node.js 18.x
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    if command -v dnf &> /dev/null; then
        dnf install -y nodejs
        dnf install -y python3 python3-pip
        dnf install -y mesa-libGL.x86_64 glib2 libSM libXrender libXext
        dnf install -y nginx
        dnf install -y epel-release
        dnf install -y https://download1.rpmfusion.org/free/el/rpmfusion-free-release-9.noarch.rpm || true
        dnf install -y ffmpeg || echo "Warning: FFmpeg installation failed"
    else
        yum install -y nodejs
        yum install -y python3 python3-pip
        yum install -y mesa-libGL.x86_64 glib2 libSM libXrender libXext
        yum install -y nginx
        yum install -y epel-release
        yum install -y ffmpeg || echo "Warning: FFmpeg installation failed"
    fi
else
    echo "Unsupported distribution: $OS"
    exit 1
fi

echo "System dependencies installed successfully"

# Set installation directory
INSTALL_DIR="/var/www/mediacraft"
echo "Installing MediaCraft to $INSTALL_DIR"

# Create installation directory
mkdir -p $INSTALL_DIR
rm -rf $INSTALL_DIR/*

# Copy files
cp -r * $INSTALL_DIR/
echo "Copied application files"

# Create Python virtual environment
echo "Creating Python virtual environment..."
cd $INSTALL_DIR
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
echo "Python virtual environment created and dependencies installed"

# Install Node.js dependencies for frontend
echo "Installing Node.js dependencies..."
cd $INSTALL_DIR/frontend
npm install --production
echo "Node.js dependencies installed"

# Set permissions
cd $INSTALL_DIR
chown -R www-data:www-data $INSTALL_DIR
chmod -R 755 $INSTALL_DIR
echo "Set file permissions"

# Install systemd services
echo "Installing systemd services..."
cp mediacraft-backend.service /etc/systemd/system/
cp mediacraft-frontend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable mediacraft-backend.service
systemctl enable mediacraft-frontend.service
echo "Systemd services installed and enabled"

# Install Nginx configuration
echo "Installing Nginx configuration..."
cp nginx_mediacraft.conf /etc/nginx/sites-available/mediacraft
ln -sf /etc/nginx/sites-available/mediacraft /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
if nginx -t; then
    echo "Nginx configuration is valid"
else
    echo "Warning: Nginx configuration has errors. Please check manually."
fi

# Create necessary directories
mkdir -p $INSTALL_DIR/storage/merge_tasks
mkdir -p $INSTALL_DIR/temp/merge_temp
mkdir -p $INSTALL_DIR/logs
chown -R www-data:www-data $INSTALL_DIR/storage
chown -R www-data:www-data $INSTALL_DIR/temp
chown -R www-data:www-data $INSTALL_DIR/logs
echo "Created necessary directories"

# Verify installation
echo "Verifying installation..."

# Check Node.js
if command -v node &> /dev/null; then
    echo "✓ Node.js $(node --version) is installed"
else
    echo "✗ Node.js installation failed"
fi

# Check FFmpeg
if command -v ffmpeg &> /dev/null; then
    echo "✓ FFmpeg is installed and accessible"
else
    echo "✗ FFmpeg installation failed"
fi

# Check Python dependencies
if $INSTALL_DIR/venv/bin/python -c "import cv2, numpy, flask, flask_cors" 2>/dev/null; then
    echo "✓ Python dependencies are installed"
else
    echo "✗ Some Python dependencies are missing"
fi

echo ""
echo "MediaCraft installation completed!"
echo ""
echo "Next steps:"
echo "1. Start the MediaCraft services:"
echo "   systemctl start mediacraft-backend"
echo "   systemctl start mediacraft-frontend"
echo ""
echo "2. Check the service status:"
echo "   systemctl status mediacraft-backend"
echo "   systemctl status mediacraft-frontend"
echo ""
echo "3. Restart Nginx:"
echo "   systemctl restart nginx"
echo ""
echo "4. (Optional) Configure SSL certificates using Let's Encrypt:"
echo "   certbot --nginx -d mediacraft.yzhu.name"
echo ""
echo "MediaCraft should now be accessible at:"
echo "- HTTP: http://mediacraft.yzhu.name"
echo "- HTTPS: https://mediacraft.yzhu.name (if SSL is configured)"
echo ""
echo "Services:"
echo "- Frontend (Next.js): http://localhost:3000"
echo "- Backend (Flask): http://localhost:50001"
EOF

chmod +x $RELEASE_DIR/install.sh

# Create version file
echo "MediaCraft ${VERSION}" > $RELEASE_DIR/VERSION
echo "Built on: $(date)" >> $RELEASE_DIR/VERSION
echo "Frontend: Next.js" >> $RELEASE_DIR/VERSION
echo "Backend: Flask + FFmpeg" >> $RELEASE_DIR/VERSION

# Create release archive
echo "Cleaning up unnecessary files..."
# Remove Python cache files
find $RELEASE_DIR -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find $RELEASE_DIR -name "*.pyc" -type f -delete 2>/dev/null || true

# Remove other unnecessary files
rm -rf $RELEASE_DIR/.git* 2>/dev/null || true
rm -rf $RELEASE_DIR/node_modules 2>/dev/null || true

echo "Creating release archive..."
(cd releases && tar -czf "${RELEASE_NAME}.tar.gz" ${RELEASE_NAME})

echo ""
echo "✓ Release package created: releases/${RELEASE_NAME}.tar.gz"
echo ""
echo "Package contents:"
echo "- Backend (Flask API)"
echo "- Frontend (Next.js build)"
echo "- Deployment scripts"
echo "- System service configurations"
echo "- Nginx configuration"
echo ""
echo "To deploy MediaCraft:"
echo "1. Upload the release package to your server"
echo "2. Extract the package: tar -xzf ${RELEASE_NAME}.tar.gz"
echo "3. Navigate to the extracted directory: cd ${RELEASE_NAME}"
echo "4. Run the installation script: sudo ./install.sh"
echo ""
echo "MediaCraft will be accessible at https://mediacraft.yzhu.name after installation"