#!/bin/bash
# MediaCraft Release Creation Script

echo "Creating MediaCraft Release Package"
echo "=================================="

# Set version
VERSION="1.0.0"
RELEASE_NAME="mediacraft-${VERSION}"

# Create release directory
mkdir -p releases
RELEASE_DIR="releases/${RELEASE_NAME}"
mkdir -p $RELEASE_DIR

# Copy distribution files
cp -r dist/mediacraft/* $RELEASE_DIR/

# Create version file
echo "MediaCraft ${VERSION}" > $RELEASE_DIR/VERSION

# Create release archive
cd releases
tar -czf "${RELEASE_NAME}.tar.gz" ${RELEASE_NAME}
cd ..

echo ""
echo "Release package created: releases/${RELEASE_NAME}.tar.gz"
echo ""
echo "To deploy MediaCraft:"
echo "1. Upload the release package to your server"
echo "2. Extract the package: tar -xzf ${RELEASE_NAME}.tar.gz"
echo "3. Navigate to the extracted directory: cd ${RELEASE_NAME}"
echo "4. Run the installation script: sudo ./install.sh"
echo ""
echo "MediaCraft will be accessible at https://mediacraft.yzhu.name after installation"