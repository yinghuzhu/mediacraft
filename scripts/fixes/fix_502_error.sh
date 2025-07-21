#!/bin/bash
# Script to diagnose and fix 502 Bad Gateway errors with MediaCraft

echo "MediaCraft 502 Bad Gateway Diagnostic Tool"
echo "=========================================="

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

# Define paths
MEDIACRAFT_DIR="/var/www/mediacraft"
NGINX_CONF="/etc/nginx/sites-available/mediacraft"
SYSTEMD_SERVICE="/etc/systemd/system/mediacraft.service"

echo -e "\n${YELLOW}Step 1: Checking if MediaCraft service is running...${NC}"
if systemctl is-active --quiet mediacraft; then
    echo -e "${GREEN}✓ MediaCraft service is running${NC}"
else
    echo -e "${RED}✗ MediaCraft service is not running${NC}"
    echo "Attempting to start MediaCraft service..."
    systemctl start mediacraft
    sleep 2
    
    if systemctl is-active --quiet mediacraft; then
        echo -e "${GREEN}✓ Successfully started MediaCraft service${NC}"
    else
        echo -e "${RED}✗ Failed to start MediaCraft service${NC}"
        echo "Checking service logs for errors:"
        journalctl -u mediacraft -n 20
    fi
fi

echo -e "\n${YELLOW}Step 2: Checking if port 50001 is listening...${NC}"
if netstat -tuln | grep -q ":50001 "; then
    echo -e "${GREEN}✓ Port 50001 is open and listening${NC}"
else
    echo -e "${RED}✗ Port 50001 is not listening${NC}"
    echo "This indicates the Flask application is not running correctly."
    echo "Checking if Python process is running:"
    ps aux | grep "python.*start_production.py" | grep -v grep
fi

echo -e "\n${YELLOW}Step 3: Checking Nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}✓ Nginx configuration is valid${NC}"
else
    echo -e "${RED}✗ Nginx configuration has errors${NC}"
    echo "Attempting to fix Nginx configuration..."
    
    # Check if our fixed config exists
    if [ -f "$MEDIACRAFT_DIR/nginx_mediacraft_fixed.conf" ]; then
        echo "Found fixed Nginx configuration, installing it..."
        cp "$MEDIACRAFT_DIR/nginx_mediacraft_fixed.conf" "$NGINX_CONF"
        
        if nginx -t; then
            echo -e "${GREEN}✓ Fixed Nginx configuration is valid${NC}"
            systemctl reload nginx
            echo "Nginx reloaded with new configuration"
        else
            echo -e "${RED}✗ Fixed Nginx configuration still has errors${NC}"
        fi
    else
        echo "Fixed configuration not found. Please check Nginx configuration manually."
    fi
fi

echo -e "\n${YELLOW}Step 4: Checking connectivity between Nginx and Flask...${NC}"
if curl -s http://localhost:50001/ > /dev/null; then
    echo -e "${GREEN}✓ Flask application is responding locally${NC}"
else
    echo -e "${RED}✗ Cannot connect to Flask application locally${NC}"
    echo "This indicates the Flask application is not running or is crashing."
    echo "Checking application logs:"
    if [ -d "$MEDIACRAFT_DIR/logs" ]; then
        ls -la "$MEDIACRAFT_DIR/logs"
        echo "Latest log entries:"
        find "$MEDIACRAFT_DIR/logs" -type f -name "*.log" -exec tail -n 20 {} \;
    else
        echo "No logs directory found."
    fi
fi

echo -e "\n${YELLOW}Step 5: Checking permissions...${NC}"
if [ -d "$MEDIACRAFT_DIR" ]; then
    echo "MediaCraft directory permissions:"
    ls -ld "$MEDIACRAFT_DIR"
    echo "Checking if www-data user has proper permissions:"
    if [ "$(stat -c '%U' "$MEDIACRAFT_DIR")" = "www-data" ]; then
        echo -e "${GREEN}✓ Directory is owned by www-data${NC}"
    else
        echo -e "${RED}✗ Directory is not owned by www-data${NC}"
        echo "Fixing permissions..."
        chown -R www-data:www-data "$MEDIACRAFT_DIR"
        echo "Permissions updated"
    fi
else
    echo -e "${RED}✗ MediaCraft directory not found at $MEDIACRAFT_DIR${NC}"
fi

echo -e "\n${YELLOW}Step 6: Restarting services...${NC}"
echo "Restarting MediaCraft service..."
systemctl restart mediacraft
echo "Restarting Nginx..."
systemctl restart nginx

echo -e "\n${YELLOW}Step 7: Final check...${NC}"
sleep 3
if curl -s -o /dev/null -w "%{http_code}" http://localhost:50001/ | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✓ MediaCraft is now responding correctly${NC}"
    echo "Please try accessing https://mediacraft.yzhu.name/ again."
else
    echo -e "${RED}✗ MediaCraft is still not responding correctly${NC}"
    echo "Additional troubleshooting may be required."
    echo "Please check the following:"
    echo "1. Python dependencies are installed correctly"
    echo "2. The application has proper permissions to access files"
    echo "3. There are no firewall rules blocking connections"
    echo "4. The Flask application is configured to listen on 0.0.0.0:50001"
fi

echo -e "\n${YELLOW}Diagnostic complete.${NC}"