import os
import fnmatch

def should_include_file(filename):
    # List of file extensions to include
    include_extensions = ['.js', '.ts', '.tsx' '.json', '.py', '.html', '.css', '.md']
    return any(filename.endswith(ext) for ext in include_extensions)

def should_ignore_path(path):
    # List of patterns to ignore (both files and directories)
    ignore_patterns = [
        'node_modules',
        'venv',
        'env',
        '.git',
        '.svn',
        '.hg',
        '__pycache__',
        '.vscode',
        '.idea',
        'build',
        'dist',
        '*.egg-info',
        'package-lock.json',
        '.DS_Store',
        'Thumbs.db'
    ]
    return any(fnmatch.fnmatch(part, pattern) for pattern in ignore_patterns for part in path.split(os.sep))

def collect_project_files(output_file='project_contents.txt'):
    with open(output_file, 'w', encoding='utf-8') as outfile:
        for root, dirs, files in os.walk('.'):
            # Remove ignored directories
            dirs[:] = [d for d in dirs if not should_ignore_path(os.path.join(root, d))]

            for file in files:
                file_path = os.path.join(root, file)
                if not should_ignore_path(file_path) and should_include_file(file):
                    relative_path = os.path.relpath(file_path)

                    outfile.write(f"File: {relative_path}\n")
                    outfile.write("=" * (len(relative_path) + 6) + "\n\n")

                    try:
                        with open(file_path, 'r', encoding='utf-8') as infile:
                            content = infile.read()
                            outfile.write(content)
                    except Exception as e:
                        outfile.write(f"Error reading file: {str(e)}\n")

                    outfile.write("\n\n")

if __name__ == "__main__":
    collect_project_files()
    print("Project contents have been collected in 'project_contents.txt'")