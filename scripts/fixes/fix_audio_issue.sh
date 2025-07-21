#!/bin/bash
# Script to fix audio issues in MediaCraft video processing

echo "MediaCraft Audio Fix Tool"
echo "========================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (sudo)"
  exit 1
fi

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "\n${YELLOW}Step 1: Checking if FFmpeg is installed...${NC}"
if command -v ffmpeg &> /dev/null; then
    echo -e "${GREEN}✓ FFmpeg is already installed${NC}"
    ffmpeg -version | head -n 1
else
    echo -e "${RED}✗ FFmpeg is not installed${NC}"
    echo "Installing FFmpeg..."
    
    # Detect Linux distribution
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    else
        echo "Cannot detect Linux distribution. Assuming CentOS/RHEL-like system."
        OS="Unknown"
    fi
    
    # Install FFmpeg based on distribution
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        echo "Detected $OS $VER"
        apt-get update
        apt-get install -y ffmpeg
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Fedora"* ]]; then
        echo "Detected $OS $VER"
        # For CentOS/RHEL, we need to enable EPEL repository
        if [[ "$OS" == *"CentOS"* ]] && [[ "$VER" == "7" ]]; then
            yum install -y epel-release
            yum localinstall -y --nogpgcheck https://download1.rpmfusion.org/free/el/rpmfusion-free-release-7.noarch.rpm
            yum install -y ffmpeg ffmpeg-devel
        elif [[ "$OS" == *"CentOS"* ]] && [[ "$VER" == "8" ]]; then
            dnf install -y epel-release
            dnf install -y https://download1.rpmfusion.org/free/el/rpmfusion-free-release-8.noarch.rpm
            dnf install -y ffmpeg ffmpeg-devel
        else
            # For Fedora and other RHEL derivatives
            dnf install -y ffmpeg ffmpeg-devel
        fi
    else
        echo "Unsupported distribution: $OS"
        echo "Please install FFmpeg manually according to your distribution's instructions."
        exit 1
    fi
    
    # Check if installation was successful
    if command -v ffmpeg &> /dev/null; then
        echo -e "${GREEN}✓ FFmpeg installed successfully${NC}"
        ffmpeg -version | head -n 1
    else
        echo -e "${RED}✗ Failed to install FFmpeg${NC}"
        echo "Please install FFmpeg manually according to your distribution's instructions."
        exit 1
    fi
fi

echo -e "\n${YELLOW}Step 2: Checking MediaCraft installation...${NC}"
MEDIACRAFT_DIR="/var/www/mediacraft"
if [ -d "$MEDIACRAFT_DIR" ]; then
    echo -e "${GREEN}✓ MediaCraft installation found at $MEDIACRAFT_DIR${NC}"
else
    echo -e "${RED}✗ MediaCraft installation not found at $MEDIACRAFT_DIR${NC}"
    echo "Please specify the MediaCraft installation directory:"
    read -p "MediaCraft directory: " MEDIACRAFT_DIR
    
    if [ ! -d "$MEDIACRAFT_DIR" ]; then
        echo -e "${RED}✗ Directory not found: $MEDIACRAFT_DIR${NC}"
        exit 1
    fi
fi

echo -e "\n${YELLOW}Step 3: Checking permissions...${NC}"
# Ensure FFmpeg is executable by the MediaCraft service user
FFMPEG_PATH=$(which ffmpeg)
if [ -n "$FFMPEG_PATH" ]; then
    echo "FFmpeg path: $FFMPEG_PATH"
    chmod +x "$FFMPEG_PATH"
    echo "Set executable permission on FFmpeg"
fi

# Ensure MediaCraft has proper permissions
if [ -d "$MEDIACRAFT_DIR" ]; then
    chown -R www-data:www-data "$MEDIACRAFT_DIR"
    echo "Updated MediaCraft directory permissions"
fi

echo -e "\n${YELLOW}Step 4: Restarting MediaCraft service...${NC}"
if systemctl is-active --quiet mediacraft; then
    systemctl restart mediacraft
    echo "MediaCraft service restarted"
else
    echo "MediaCraft service is not running, starting it..."
    systemctl start mediacraft
fi

echo -e "\n${GREEN}Audio fix completed!${NC}"
echo "The next video processed should now have audio."
echo "If you still experience issues, please check the MediaCraft logs for more details."