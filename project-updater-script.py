import os

def update_project_files(input_file='project_contents.txt'):
    current_file = None
    current_content = []
    files_updated = 0
    files_created = 0
    total_files = 0

    with open(input_file, 'r', encoding='utf-8') as infile:
        for line in infile:
            if line.startswith("File: "):
                if current_file:
                    result = update_file(current_file, current_content)
                    if result == 'updated':
                        files_updated += 1
                    elif result == 'created':
                        files_created += 1
                    total_files += 1

                current_file = line[6:].strip()  # Remove "File: " prefix and whitespace
                current_content = []
            elif line.startswith("=" * 6):  # Separator line
                continue
            else:
                current_content.append(line)

        # Process the last file
        if current_file:
            result = update_file(current_file, current_content)
            if result == 'updated':
                files_updated += 1
            elif result == 'created':
                files_created += 1
            total_files += 1

    print(f"{files_updated} files changed and {files_created} created")

def update_file(file_path, content):
    # Normalize the file path
    file_path = os.path.normpath(file_path)

    # Ensure the file path is not empty and is within the current directory or its subdirectories
    if not file_path or file_path.startswith('..'):
        return 'skipped'

    # Ensure the directory exists
    dir_name = os.path.dirname(file_path)
    if dir_name:
        try:
            os.makedirs(dir_name, exist_ok=True)
        except Exception as e:
            print(f"Error creating directory for {file_path}: {str(e)}")
            return 'skipped'

    # Remove trailing newlines from content
    content = ''.join(content).rstrip() + '\n'

    # Check if the file exists and compare content
    try:
        with open(file_path, 'r', encoding='utf-8') as existing_file:
            existing_content = existing_file.read()

        if existing_content == content:
            return 'unchanged'
    except FileNotFoundError:
        pass
    except Exception as e:
        print(f"Error reading existing file {file_path}: {str(e)}")
        return 'skipped'

    # Write the new content
    try:
        with open(file_path, 'w', encoding='utf-8') as outfile:
            outfile.write(content)
    except Exception as e:
        print(f"Error writing to file {file_path}: {str(e)}")
        return 'skipped'

    # Count non-empty lines
    non_empty_lines = sum(1 for line in content.splitlines() if line.strip())

    if 'existing_content' in locals():
        print(f"Updated {file_path} - {non_empty_lines} non-empty lines written")
        return 'updated'
    else:
        print(f"Created {file_path} - {non_empty_lines} non-empty lines written")
        return 'created'

if __name__ == "__main__":
    update_project_files()