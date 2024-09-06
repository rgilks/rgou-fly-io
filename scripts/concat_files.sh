#!/bin/bash

set -euo pipefail

# Check if at least two arguments are provided (root folder and at least one file extension or specific file)
if [ $# -lt 2 ]; then
    echo "Usage: $0 <root_folder> <file_extension1|specific_file1> [file_extension2|specific_file2] ... [-- <excluded_file1> <excluded_file2> ...]"
    echo "Example: $0 . justfile .zig .zon .md .dot -- zig-out/"
    exit 1
fi

# Root folder
root_folder="$1"
shift

# File extensions, specific files, and excluded files
file_extensions=()
specific_files=()
excluded_files=()
parse_inclusions=true

for arg in "$@"; do
    if [[ "$arg" == "--" ]]; then
        parse_inclusions=false
        continue
    fi
    
    if $parse_inclusions; then
        if [[ "$arg" == .* ]]; then
            file_extensions+=("${arg#.}")  # Remove leading dot for find command
        else
            specific_files+=("$arg")
        fi
    else
        excluded_files+=("$arg")
    fi
done

echo "Root folder: $root_folder"
echo "Specific files to include: ${specific_files[*]}"
echo "File extensions: ${file_extensions[*]}"
echo "Files and folders to exclude: ${excluded_files[*]}"

# Output file name
output_file="_concat.txt"

# Temporary file for compilation
temp_file=$(mktemp)

# Function to clean up temporary file
cleanup() {
    rm -f "$temp_file"
}

# Set up trap to ensure cleanup on script exit
trap cleanup EXIT

# Get the absolute path of the output file
output_file_abs="$root_folder/$output_file"

# Function to check if a file should be ignored based on .gitignore patterns and excluded files
should_ignore() {
    local file="$1"
    local relative_path="${file#$root_folder/}"
    
    # Check if the file is in an excluded folder or matches an excluded file
    for excluded in "${excluded_files[@]}"; do
        # Remove leading ./ if present
        excluded="${excluded#./}"
        if [[ "$excluded" == */ ]]; then
            # It's a folder, check if the file is inside this folder
            if [[ "$relative_path" == "$excluded"* || "$relative_path" == *"/$excluded"* ]]; then
                # echo "Ignoring (excluded folder): $file"
                return 0  # Should ignore
            fi
        elif [[ "$relative_path" == "$excluded" || "$relative_path" == *"/$excluded" ]]; then
            # echo "Ignoring (excluded file): $file"
            return 0  # Should ignore
        fi
    done
    
    if [ -f "$root_folder/.gitignore" ]; then
        while IFS= read -r pattern; do
            # Ignore empty lines and comments
            [[ -z "$pattern" || "$pattern" == \#* ]] && continue
            
            # Remove leading and trailing slashes
            pattern="${pattern#/}"
            pattern="${pattern%/}"
            
            # Convert gitignore pattern to grep pattern
            grep_pattern=$(echo "$pattern" | sed -e 's/\./\\./g' -e 's/\*/.*/g' -e 's/^/^/' -e 's/$/($|\/)/g')
            
            if echo "$relative_path" | grep -Eq "$grep_pattern"; then
                # echo "Ignoring (gitignore pattern): $file"
                return 0  # Should ignore
            fi
        done < "$root_folder/.gitignore"
    fi
    
    return 1  # Should not ignore
}

# Function to add a file to the compilation
add_file() {
    local file="$1"
    echo -e "\n\n;;------------------------------" >> "$temp_file"
    echo -e ";; File: $file" >> "$temp_file"
    echo -e ";;------------------------------\n" >> "$temp_file"
    cat "$file" >> "$temp_file"
    echo "Added: $file"
}

# Add specific files first
for file in "${specific_files[@]}"; do
    full_path="$root_folder/$file"
    if [ -f "$full_path" ] && ! should_ignore "$full_path"; then
        add_file "$full_path"
    else
        echo "Warning: Specific file not found or ignored: $full_path"
    fi
done

# Find all files with the specified extensions recursively in the specified root folder
if [ ${#file_extensions[@]} -gt 0 ]; then
    echo "Searching for files with extensions: ${file_extensions[*]}"
    find_command="find \"$root_folder\" -type f \( $(printf -- "-name '*.%s' -o " "${file_extensions[@]}") -false \) -print0"
    echo "Executing find command: $find_command"
    eval "$find_command" | sort -z | while IFS= read -r -d '' file; do
        # Skip the output file
        if [ "$file" = "$output_file_abs" ]; then
            echo "Skipping output file: $file"
            continue
        fi
        
        # Check if the file should be ignored based on .gitignore and excluded files
        if should_ignore "$file"; then
            continue
        fi
        
        add_file "$file"
    done
else
    echo "No file extensions specified."
fi

# Move the temporary file to the final output file
mv "$temp_file" "$output_file_abs"

echo "Compilation complete. Output saved to $output_file in $root_folder"
