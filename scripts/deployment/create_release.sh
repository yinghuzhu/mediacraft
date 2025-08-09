#!/bin/bash
# MediaCraft Release Creation Script v2.0 - 支持自定义目录

echo "Creating MediaCraft Release Package v2.0"
echo "========================================"

# Set version
VERSION="2.5.4"
RELEASE_NAME="mediacraft-${VERSION}"

# Create release directory
mkdir -p releases
RELEASE_DIR="releases/${RELEASE_NAME}"
rm -rf $RELEASE_DIR
mkdir -p $RELEASE_DIR

echo "Building Next.js frontend..."
# Save current directory
CURRENT_DIR=$(pwd)
cd mediacraft-frontend
npm run build
# Return to original directory
cd "$CURRENT_DIR"

echo "Copying backend files..."
# Copy backend files
# Create models directory and copy files
echo "Creating models directory..."
mkdir -p $RELEASE_DIR/models
# Copy all models files
cp models/*.py $RELEASE_DIR/models/ 2>/dev/null || echo "  - No Python files found in models"

# Create processors directory and copy files
echo "Creating processors directory..."
mkdir -p $RELEASE_DIR/processors
# Copy all processors files
cp processors/*.py $RELEASE_DIR/processors/ 2>/dev/null || echo "  - No Python files found in processors"

# Create api directory and copy files
echo "Creating api directory..."
mkdir -p $RELEASE_DIR/api
cp api/*.py $RELEASE_DIR/api/ 2>/dev/null || echo "  - No Python files found in api"

if [ -d "static" ]; then
    echo "Copying static directory..."
    cp -r static/ $RELEASE_DIR/
else
    echo "WARNING: static directory not found!"
fi

cp requirements.txt $RELEASE_DIR/
cp README.md $RELEASE_DIR/

# Copy scripts directory with proper structure (excluding data files)
mkdir -p $RELEASE_DIR/core
# Copy core files but exclude data directory
cp scripts/core/*.py $RELEASE_DIR/core/ 2>/dev/null || true
# Copy additional core files from project root core directory
cp core/*.py $RELEASE_DIR/core/ 2>/dev/null || true

# Note: Data files will be created in separate data directory during installation

mkdir -p $RELEASE_DIR/launchers
cp -r scripts/launchers/* $RELEASE_DIR/launchers/

# Note: Storage and temp directories will be created in separate data directory during installation

# Create symbolic links for backward compatibility
(cd $RELEASE_DIR && \
ln -sf core/app.py app.py && \
ln -sf core/config.py config.py && \
ln -sf launchers/start_video_watermark.py start_video_watermark.py && \
ln -sf launchers/start_video_merger.py start_video_merger.py)

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

echo "Creating systemd service templates..."
# Create systemd service template for backend
cat > $RELEASE_DIR/mediacraft-backend.service.template << 'EOF'
[Unit]
Description=MediaCraft Backend Service
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=INSTALL_DIR_PLACEHOLDER
Environment=PATH=INSTALL_DIR_PLACEHOLDER/venv/bin
Environment=PYTHONPATH=INSTALL_DIR_PLACEHOLDER
EnvironmentFile=INSTALL_DIR_PLACEHOLDER/.env.production
ExecStart=INSTALL_DIR_PLACEHOLDER/venv/bin/python INSTALL_DIR_PLACEHOLDER/app.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=DATA_DIR_PLACEHOLDER INSTALL_DIR_PLACEHOLDER/logs

[Install]
WantedBy=multi-user.target
EOF

# Create systemd service template for frontend
cat > $RELEASE_DIR/mediacraft-frontend.service.template << 'EOF'
[Unit]
Description=MediaCraft Frontend Service
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=INSTALL_DIR_PLACEHOLDER/frontend
Environment=NODE_ENV=production
Environment=NEXT_PUBLIC_API_URL=http://127.0.0.1:50001
Environment=PORT=3000
Environment=HOSTNAME=127.0.0.1
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict

[Install]
WantedBy=multi-user.target
EOF

echo "Creating Nginx configuration template..."
# Create Nginx configuration template
cat > $RELEASE_DIR/nginx_mediacraft.conf.template << 'EOF'
# MediaCraft Nginx Configuration
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # File upload settings
    client_max_body_size 500M;
    
    # Backend API - 优先匹配
    location ^~ /api/ {
        proxy_pass http://localhost:50001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Improved timeout settings
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        
        # Handle large file uploads
        client_max_body_size 500M;
        proxy_request_buffering off;
        
        # Buffer settings
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
        
        # In case of errors, try the next upstream server (if configured)
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
    }
    
    # Static files from backend
    location ^~ /static/ {
        alias INSTALL_DIR_PLACEHOLDER/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Next.js static files
    location ^~ /_next/static/ {
        alias INSTALL_DIR_PLACEHOLDER/frontend/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Public files
    location ^~ /public/ {
        alias INSTALL_DIR_PLACEHOLDER/frontend/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Frontend (Next.js) - 默认路由，放在最后
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
        
        # Improved timeout settings
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        
        # Buffer settings
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
        
        # In case of errors, try the next upstream server (if configured)
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
    }
    
    # Logs
    access_log /var/log/nginx/mediacraft_access.log;
    error_log /var/log/nginx/mediacraft_error.log;
}

# HTTPS server (uncomment and configure after SSL setup)
# server {
#     listen 443 ssl;
#     server_name your-domain.com;
#     
#     # SSL configuration
#     ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
#     
#     # ... (same configuration as HTTP server above)
# }
EOF

echo "Copying installation and upgrade scripts..."
# Copy installation script from template
cp scripts/deployment/install.sh.template $RELEASE_DIR/install.sh
chmod +x $RELEASE_DIR/install.sh

# Copy environment configuration template
mkdir -p $RELEASE_DIR/scripts/deployment
cp scripts/deployment/.env.production.template $RELEASE_DIR/scripts/deployment/

# Copy additional scripts
mkdir -p $RELEASE_DIR/scripts
cp scripts/validate_config.py $RELEASE_DIR/scripts/
cp scripts/start_production.sh $RELEASE_DIR/scripts/
cp test_imports.py $RELEASE_DIR/
chmod +x $RELEASE_DIR/scripts/validate_config.py
chmod +x $RELEASE_DIR/scripts/start_production.sh
chmod +x $RELEASE_DIR/test_imports.py

# Create upgrade script template (simplified version)
cat > $RELEASE_DIR/upgrade.sh << 'EOF'
#!/bin/bash
# MediaCraft Upgrade Script v2.0

set -e

# Default directories
DEFAULT_INSTALL_DIR="/var/www/mediacraft"
DEFAULT_DATA_DIR="/var/lib/mediacraft"

# Parse command line arguments
show_help() {
    echo "MediaCraft Upgrade Script v2.0"
    echo "==============================="
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -i, --install-dir DIR    Program installation directory (default: $DEFAULT_INSTALL_DIR)"
    echo "  -d, --data-dir DIR       Data storage directory (default: $DEFAULT_DATA_DIR)"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                          # Use default directories"
    echo "  $0 -i /opt/mediacraft -d /data/mediacraft  # Custom directories"
    echo ""
}

# Initialize variables with defaults
INSTALL_DIR="$DEFAULT_INSTALL_DIR"
DATA_DIR="$DEFAULT_DATA_DIR"

# Parse arguments
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
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

echo "MediaCraft Upgrade Script v2.0"
echo "==============================="
echo ""
echo "Upgrade Configuration:"
echo "  Program Directory: $INSTALL_DIR"
echo "  Data Directory: $DATA_DIR"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit 1
fi

BACKUP_DIR="/var/backups/mediacraft-$(date +%Y%m%d-%H%M%S)"

echo "Program directory: $INSTALL_DIR"
echo "Data directory: $DATA_DIR"
echo "Backup directory: $BACKUP_DIR"

# Check if MediaCraft is already installed
if [ ! -d "$INSTALL_DIR" ]; then
    echo "MediaCraft is not installed at $INSTALL_DIR. Please run install.sh instead."
    exit 1
fi

# Confirm upgrade
read -p "Continue with upgrade? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Upgrade cancelled."
    exit 0
fi

# Stop services
echo "Stopping MediaCraft services..."
systemctl stop mediacraft-backend || true
systemctl stop mediacraft-frontend || true
echo "Services stopped"

# Create backup of current installation (program files only)
echo "Creating backup of current installation..."
mkdir -p $BACKUP_DIR
cp -r $INSTALL_DIR/* $BACKUP_DIR/
echo "Backup created at $BACKUP_DIR"

# Preserve data directory (it should already be separate)
if [ -L "$INSTALL_DIR/data" ]; then
    echo "Data directory symlink found - good!"
elif [ -d "$INSTALL_DIR/data" ]; then
    echo "Warning: Found old-style data directory. Migrating to separate data directory..."
    # Migrate old data to new location
    mkdir -p $DATA_DIR
    cp -r $INSTALL_DIR/data/* $DATA_DIR/
    rm -rf $INSTALL_DIR/data
    echo "Data migrated to $DATA_DIR"
fi

# Update program files (preserve data directory)
echo "Updating program files..."
# Remove old program files but keep data symlink
find $INSTALL_DIR -maxdepth 1 -type f -delete
find $INSTALL_DIR -maxdepth 1 -type d ! -name "data" -exec rm -rf {} + 2>/dev/null || true

# Copy new program files
cp -r * $INSTALL_DIR/
echo "Program files updated"

# Recreate data symlink if needed
if [ ! -L "$INSTALL_DIR/data" ]; then
    ln -sf $DATA_DIR $INSTALL_DIR/data
    echo "Recreated data directory symlink"
fi

# Update Python dependencies
echo "Updating Python dependencies..."
cd $INSTALL_DIR
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
echo "Python dependencies updated"

# Update Node.js dependencies
echo "Updating Node.js dependencies..."
cd $INSTALL_DIR/frontend
npm install --production
echo "Node.js dependencies updated"

# Set permissions
cd $INSTALL_DIR
chown -R www-data:www-data $INSTALL_DIR
chown -R www-data:www-data $DATA_DIR
chmod -R 755 $INSTALL_DIR
chmod -R 755 $DATA_DIR
echo "Permissions updated"

# Update systemd services
echo "Updating systemd services..."
# Generate backend service file from template
sed "s|INSTALL_DIR_PLACEHOLDER|$INSTALL_DIR|g; s|DATA_DIR_PLACEHOLDER|$DATA_DIR|g" \
    mediacraft-backend.service.template > /etc/systemd/system/mediacraft-backend.service

# Generate frontend service file from template
sed "s|INSTALL_DIR_PLACEHOLDER|$INSTALL_DIR|g; s|DATA_DIR_PLACEHOLDER|$DATA_DIR|g" \
    mediacraft-frontend.service.template > /etc/systemd/system/mediacraft-frontend.service

systemctl daemon-reload
echo "Systemd services updated"

# Update Nginx configuration
echo "Updating Nginx configuration..."
# Generate Nginx configuration from template
sed "s|INSTALL_DIR_PLACEHOLDER|$INSTALL_DIR|g; s|DATA_DIR_PLACEHOLDER|$DATA_DIR|g" \
    nginx_mediacraft.conf.template > /etc/nginx/sites-available/mediacraft

nginx -t && echo "Nginx configuration is valid" || echo "Warning: Nginx configuration has errors"

# Start services
echo "Starting MediaCraft services..."
systemctl start mediacraft-backend
systemctl start mediacraft-frontend
systemctl restart nginx
echo "Services started"

# Verify upgrade
echo "Verifying upgrade..."
sleep 5
if systemctl is-active --quiet mediacraft-backend && systemctl is-active --quiet mediacraft-frontend; then
    echo "✓ Upgrade completed successfully!"
    echo "✓ All services are running"
    echo ""
    echo "Backup location: $BACKUP_DIR"
    echo "You can remove the backup after confirming everything works correctly."
else
    echo "✗ Some services failed to start. Check logs:"
    echo "  systemctl status mediacraft-backend"
    echo "  systemctl status mediacraft-frontend"
    echo ""
    echo "To rollback, you can restore from: $BACKUP_DIR"
fi

echo ""
echo "MediaCraft upgrade completed!"
echo "Data directory (preserved): $DATA_DIR"
echo "Program directory (updated): $INSTALL_DIR"
EOF

chmod +x $RELEASE_DIR/upgrade.sh

# Create version file
echo "MediaCraft ${VERSION}" > $RELEASE_DIR/VERSION
echo "Built on: $(date)" >> $RELEASE_DIR/VERSION
echo "Frontend: Next.js" >> $RELEASE_DIR/VERSION
echo "Backend: Flask + FFmpeg" >> $RELEASE_DIR/VERSION
echo "Features: Configurable directories, data separation" >> $RELEASE_DIR/VERSION

# Create release archive
echo "Cleaning up unnecessary files..."
# Remove Python cache files
find $RELEASE_DIR -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find $RELEASE_DIR -name "*.pyc" -type f -delete 2>/dev/null || true

# Remove other unnecessary files
rm -rf $RELEASE_DIR/.git* 2>/dev/null || true
rm -rf $RELEASE_DIR/node_modules 2>/dev/null || true

# Remove video files that might have been copied
find $RELEASE_DIR -name "*.mp4" -type f -delete 2>/dev/null || true
find $RELEASE_DIR -name "*.avi" -type f -delete 2>/dev/null || true
find $RELEASE_DIR -name "*.mov" -type f -delete 2>/dev/null || true
find $RELEASE_DIR -name "*.mkv" -type f -delete 2>/dev/null || true

# Remove log files
find $RELEASE_DIR -name "*.log" -type f -delete 2>/dev/null || true

echo "Cleaned up unnecessary files"

echo "Creating release archive..."
(cd releases && tar -czf "${RELEASE_NAME}.tar.gz" ${RELEASE_NAME})

echo ""
echo "✓ Release package created: releases/${RELEASE_NAME}.tar.gz"
echo ""
echo "Package contents:"
echo "- Backend (Flask API)"
echo "- Frontend (Next.js build)"
echo "- Deployment scripts with configurable directories"
echo "- System service templates"
echo "- Nginx configuration template"
echo ""
echo "To deploy MediaCraft:"
echo ""
echo "🆕 New Installation:"
echo "1. Upload the release package to your server"
echo "2. Extract the package: tar -xzf ${RELEASE_NAME}.tar.gz"
echo "3. Navigate to the extracted directory: cd ${RELEASE_NAME}"
echo "4. Run the installation script:"
echo "   sudo ./install.sh                                    # Use default directories"
echo "   sudo ./install.sh -i /opt/mediacraft -d /data/mc     # Custom directories"
echo ""
echo "🔄 Upgrade Existing Installation:"
echo "1. Upload the release package to your server"
echo "2. Extract the package: tar -xzf ${RELEASE_NAME}.tar.gz"
echo "3. Navigate to the extracted directory: cd ${RELEASE_NAME}"
echo "4. Run the upgrade script:"
echo "   sudo ./upgrade.sh                                    # Use default directories"
echo "   sudo ./upgrade.sh -i /opt/mediacraft -d /data/mc     # Custom directories"
echo ""
echo "📁 Directory Structure (configurable):"
echo "- Program files: /var/www/mediacraft (default)"
echo "- Data files: /var/lib/mediacraft (default, preserved during upgrades)"
echo ""
echo "MediaCraft will be accessible after installation and configuration"