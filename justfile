# Royal Game of Ur - Justfile

# List all available commands
default:
    @just --list

# ======================
# Project Initialization
# ======================

# Initialize the entire project
init: setup-scripts
    @echo "Project initialized successfully!"

# Set up script permissions
setup-scripts:
    chmod +x scripts/*.sh
    @echo "Scripts are now executable."

# =================
# Development Tasks
# =================

# Concatenate all relevant files (for an LLM to read)
concat:
    ./scripts/concat_files.sh . justfile .toml .zig .zon .md .dot .html .mjs .js -- zig-out/

# =================
# Docker Build
# =================

# Docker Build
docker-build:
    #!/usr/bin/env bash
    docker build -t flyio/rgou:latest . 
    docker run -v $(pwd):/app flyio/rgou:latest
