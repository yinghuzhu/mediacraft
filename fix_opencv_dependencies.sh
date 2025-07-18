#!/bin/bash
# Script to fix OpenCV dependencies on Linux servers

echo "Installing OpenCV system dependencies..."

# Detect Linux distribution
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    echo "Cannot detect Linux distribution. Assuming CentOS/RHEL-like system."
    OS="Unknown"
fi

# Install dependencies based on distribution
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    echo "Detected $OS $VER"
    echo "Installing dependencies using apt..."
    sudo apt-get update
    sudo apt-get install -y libgl1-mesa-glx libglib2.0-0 libsm6 libxrender1 libxext6
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Fedora"* ]]; then
    echo "Detected $OS $VER"
    echo "Installing dependencies using yum..."
    sudo yum install -y mesa-libGL.x86_64 glib2 libSM libXrender libXext
else
    echo "Unsupported distribution: $OS"
    echo "Please install the following packages manually:"
    echo "- libGL (OpenGL libraries)"
    echo "- glib2 (GLib libraries)"
    echo "- libSM (X11 Session Management library)"
    echo "- libXrender (X Rendering Extension library)"
    echo "- libXext (X11 extensions library)"
    exit 1
fi

echo "OpenCV dependencies installed successfully!"
echo "Please try running your application again."