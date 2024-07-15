import os
import re

def update_project_files(input_file='project_contents.txt'):
    current_file = None
    current_content = []
    files_updated = 0
    
    with open(input_file, 'r', encoding='utf-8') as infile:
        for line in infile:
            if line.startswith("File: "):
                if current_file:
                    update_file(current_file, current_content)
                    files_updated += 1
                
                current_file = line[6:].strip()  # Remove "File: " prefix and whitespace
                current_content = []
            elif line.startswith("=" * 6):  # Separator line
                continue
            else:
                current_content.append(line)
        
        # Update the last file
        if current_file:
            update_file(current_file, current_content)
            files_updated += 1
    
    print(f"Total files updated or created: {files_updated}")

def update_file(file_path, content):
    # Ensure the directory exists
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    # Check if the file exists and compare content
    try:
        with open(file_path, 'r', encoding='utf-8') as existing_file:
            existing_content = existing_file.readlines()
        
        if existing_content == content:
            print(f"No changes needed for {file_path}")
            return
    except FileNotFoundError:
        print(f"Creating new file: {file_path}")
    
    # Write the new content
    with open(file_path, 'w', encoding='utf-8') as outfile:
        outfile.writelines(content)
    
    # Count non-empty lines
    non_empty_lines = sum(1 for line in content if line.strip())
    print(f"Updated {file_path} - {non_empty_lines} non-empty lines written")

if __name__ == "__main__":
    update_project_files()
