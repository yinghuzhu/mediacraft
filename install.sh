#!/bin/bash
# MediaCraft Installation Script

# Exit on error
set -e

echo "MediaCraft Installation Script"
echo "=============================="

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
    echo "Cannot detect Linux distribution. Assuming CentOS/RHEL-like system."
    OS="Unknown"
fi

echo "Detected OS: $OS $VER"

# Install system dependencies
echo "Installing system dependencies..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    echo "Installing dependencies using apt..."
    apt-get update
    # OpenCV dependencies
    apt-get install -y libgl1-mesa-glx libglib2.0-0 libsm6 libxrender1 libxext6
    # FFmpeg for audio processing
    apt-get install -y ffmpeg
    # Python and pip
    apt-get install -y python3 python3-pip python3-venv
    # Other utilities
    apt-get install -y curl wget
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Fedora"* ]] || [[ "$OS" == *"Rocky"* ]] || [[ "$OS" == *"AlmaLinux"* ]]; then
    echo "Installing dependencies using yum/dnf..."
    # OpenCV dependencies
    if [[ "$OS" == *"CentOS"* ]] && [[ "$VER" == "7" ]]; then
        yum install -y mesa-libGL.x86_64 glib2 libSM libXrender libXext
        # Install EPEL for FFmpeg
        yum install -y epel-release
        yum localinstall -y --nogpgcheck https://download1.rpmfusion.org/free/el/rpmfusion-free-release-7.noarch.rpm
        yum install -y ffmpeg ffmpeg-devel
        yum install -y python3 python3-pip
    elif [[ "$OS" == *"CentOS"* ]] && [[ "$VER" == "8" ]]; then
        dnf install -y mesa-libGL.x86_64 glib2 libSM libXrender libXext
        dnf install -y epel-release
        dnf install -y https://download1.rpmfusion.org/free/el/rpmfusion-free-release-8.noarch.rpm
        dnf install -y ffmpeg ffmpeg-devel
        dnf install -y python3 python3-pip
    else
        # For Fedora, Rocky Linux, AlmaLinux and other RHEL derivatives
        echo "Using dnf package manager for $OS $VER"
        dnf install -y mesa-libGL.x86_64 glib2 libSM libXrender libXext
        # Install EPEL and RPM Fusion for FFmpeg
        dnf install -y epel-release
        if [[ "$OS" == *"Rocky"* ]] || [[ "$OS" == *"AlmaLinux"* ]]; then
            # For Rocky Linux and AlmaLinux 9.x
            if [[ "$VER" == "9"* ]]; then
                dnf install -y https://download1.rpmfusion.org/free/el/rpmfusion-free-release-9.noarch.rpm
            else
                dnf install -y https://download1.rpmfusion.org/free/el/rpmfusion-free-release-8.noarch.rpm
            fi
        fi
        dnf install -y ffmpeg ffmpeg-devel
        dnf install -y python3 python3-pip
    fi
else
    echo "Unsupported distribution: $OS"
    echo "Please install the following packages manually:"
    echo "- OpenCV dependencies: libGL, glib2, libSM, libXrender, libXext"
    echo "- FFmpeg for audio processing"
    echo "- Python 3 and pip"
    exit 1
fi

echo "System dependencies installed successfully"

# Set installation directory
INSTALL_DIR="/var/www/mediacraft"
echo "Installing MediaCraft to $INSTALL_DIR"

# Create installation directory
mkdir -p $INSTALL_DIR
echo "Created installation directory"

# Copy files
cp -r * $INSTALL_DIR/
echo "Copied application files"

# Set permissions
chown -R www-data:www-data $INSTALL_DIR
chmod -R 755 $INSTALL_DIR
echo "Set file permissions"

# Install Python dependencies
echo "Installing Python dependencies..."
pip3 install -r $INSTALL_DIR/requirements.txt
echo "Python dependencies installed"

# Install systemd service
cp $INSTALL_DIR/mediacraft.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable mediacraft.service
echo "Systemd service installed and enabled"

# Install Nginx configuration
if [ -d "/etc/nginx/sites-available" ]; then
  # Use the fixed configuration if available, otherwise use the default one
  if [ -f "$INSTALL_DIR/nginx_mediacraft_fixed.conf" ]; then
    cp $INSTALL_DIR/nginx_mediacraft_fixed.conf /etc/nginx/sites-available/mediacraft
    echo "Nginx configuration installed (using fixed version)"
  else
    cp $INSTALL_DIR/nginx_mediacraft.conf /etc/nginx/sites-available/mediacraft
    echo "Nginx configuration installed"
  fi
  ln -sf /etc/nginx/sites-available/mediacraft /etc/nginx/sites-enabled/
  
  # Test Nginx configuration
  if nginx -t; then
    echo "Nginx configuration is valid"
  else
    echo "Warning: Nginx configuration has errors. Please check manually."
  fi
else
  echo "Nginx sites-available directory not found. Please manually install the Nginx configuration."
  if [ -f "$INSTALL_DIR/nginx_mediacraft_fixed.conf" ]; then
    echo "Fixed configuration file is at: $INSTALL_DIR/nginx_mediacraft_fixed.conf"
  else
    echo "Configuration file is at: $INSTALL_DIR/nginx_mediacraft.conf"
  fi
fi

# Create logs directory
mkdir -p $INSTALL_DIR/logs
chown www-data:www-data $INSTALL_DIR/logs
echo "Created logs directory"

# Verify installation
echo "Verifying installation..."

# Check if FFmpeg is working
if command -v ffmpeg &> /dev/null; then
    echo "✓ FFmpeg is installed and accessible"
else
    echo "✗ FFmpeg installation failed"
fi

# Check if Python dependencies are installed
if python3 -c "import cv2, numpy, flask" 2>/dev/null; then
    echo "✓ Python dependencies are installed"
else
    echo "✗ Some Python dependencies are missing"
fi

echo ""
echo "MediaCraft installation completed!"
echo ""
echo "Next steps:"
echo "1. Start the MediaCraft service:"
echo "   systemctl start mediacraft"
echo ""
echo "2. Check the service status:"
echo "   systemctl status mediacraft"
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