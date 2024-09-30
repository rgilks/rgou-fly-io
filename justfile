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
    ./scripts/concat_files.sh . justfile Dockerfile .conf .toml .zig .zon .md .dot .html .mjs .js -- zig-out/

concat-js:
    ./scripts/concat_files.sh . justfile Dockwefile .html .mjs .js -- zig-out/


# Run live server
s:
    live-server public

# =================
# Docker Build
# =================

# Docker Build and Run
dbr:
    #!/usr/bin/env bash
    docker build -t flyio/rgou:latest .
    docker run --name rgou_container --rm -it -p 8080:8080 -p 9223:9223 flyio/rgou:latest

# Docker Stop
dk:
    #!/usr/bin/env bash
    docker kill rgou_container || echo "Container is not running"

# =================
# Deployment
# =================

# Deploy to Fly.io
deploy:
    #!/usr/bin/env bash
    chmod +x scripts/increment_versions.sh
    scripts/increment_versions.sh
    fly deploy
