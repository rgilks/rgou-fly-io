#!/bin/bash

# File to modify
INDEX_FILE="public/index.html"

# Function to increment version
increment_version() {
    echo "$1" | awk -F. '{$NF = $NF + 1;} 1' | sed 's/ /./g'
}

# Function to update version for a specific file
update_version() {
    local file=$1
    echo "Searching for version of $file"
    grep "${file}" "$INDEX_FILE"
    local current_version=$(grep -o "${file}.*v=[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*" "$INDEX_FILE" | grep -o "[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*")
    if [ -z "$current_version" ]; then
        echo "Version not found for $file"
        return
    fi
    local new_version=$(increment_version "$current_version")
    sed -i.bak "s|${file}.*v=${current_version}|${file}?v=${new_version}|g" "$INDEX_FILE"
    echo "Updated $file from $current_version to $new_version"
}

# List of files to update
files=(
    "/js/board.mjs"
    "/js/pieces.mjs"
    "/js/game.mjs"
    "/js/websocket.mjs"
    "/js/utils.mjs"
    "/js/main.mjs"
)

# Update versions for all files
for file in "${files[@]}"; do
    update_version "$file"
done

# Remove backup file created by sed
rm -f "${INDEX_FILE}.bak"

echo "All versions processed."
