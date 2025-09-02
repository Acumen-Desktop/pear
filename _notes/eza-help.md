# eza Cheat Sheet and Assistant Rules (modern `ls`)

eza is a modern replacement for `ls` with better defaults, Git awareness, icons, and tree views.

## TL;DR

Recommended daily driver:

```bash
eza -al --group-directories-first --icons --git
```

Great tree view:

```bash
eza -alT --level=2 --group-directories-first --git --icons
```

## Assistant Playbook (Rules)

- Prefer eza over ls: propose `eza` by default for listing.
- Default flags: `-al --group-directories-first --icons --git` in repos.
- Clarify intent: ask if user wants tree, only files/dirs, depth, or Git status.
- Trees: use `-T` and `-L DEPTH`; add `-D` for only directories.
- Sorting: use `-s size|modified|extension` and `-r` to reverse.
- Noise control: use `-I 'node_modules|dist|.git'` or `--git-ignore` in repos.
- Symlinks: use `--follow-symlinks` for traversal; `-X` to dereference on display.
- Output ergonomics: add `-h` header in long lists; `--hyperlink` where terminals support.
- Stability: when scripting, avoid icons and colors unless requested; prefer `-B` or `-b` for sizes.

## Common Tasks

Basics

```bash
# Simple list (grid)
eza

# Long list with hidden files
eza -al

# Show one per line
eza -1

# Absolute paths and clickable links (if supported)
eza -al --absolute=on --hyperlink
```

Trees and Depth

```bash
# Tree of current dir, depth 2
eza -alT -L 2 --group-directories-first

# Tree of only directories
eza -DT -L 3
```

Sorting and Grouping

```bash
# Largest files first
eza -al --sort=size -r

# Newest first
eza -al --sort=modified -r

# Group directories first (recommended)
eza -al --group-directories-first
```

Git-aware Listing

```bash
# Show Git status columns (tracked/ignored/modified)
eza -al --git

# Fast repo overview (roots only)
eza --git-repos-no-status
```

Filtering

```bash
# Only directories / only files
eza -al --only-dirs
eza -al --only-files

# Ignore common build folders
eza -al -I 'node_modules|dist|build|.git|.cache'

# Respect .gitignore
eza -al --git-ignore
```

Timestamps and Sizes

```bash
# Use specific time field and style
eza -al --time=modified --time-style=iso

# Human-friendly or bytes
eza -al -b    # binary prefixes (KiB, MiB)
eza -al -B    # bytes only

# Show directory total size (unix only)
eza -al --total-size
```

Permissions and Metadata

```bash
# Octal permissions; inode; flags (mac/BSD/windows)
eza -al -o -i -O

# Extended attributes and security context
eza -al -@ -Z
```

Symlinks

```bash
# Show entry details of link target
eza -al -X

# Follow symlinks that point to directories when recursing
eza -alT --follow-symlinks
```

## Handy Aliases

Consider adding these to your shell rc:

```bash
alias ll='eza -al --group-directories-first --icons --git'
alias l1='eza -1'
alias lt='eza -alT --level=2 --group-directories-first --git --icons'
alias lS='eza -al --sort=size -r'
alias lM='eza -al --sort=modified -r'
alias lx='eza -al --sort=extension'
alias lD='eza -al --only-dirs'
alias lF='eza -al --only-files'
alias lg='eza -al --git-ignore'
```

## Recipes

Focused Trees

```bash
# Show only src/test, hide vendor and build artifacts
eza -alT src test -L 2 -I 'node_modules|dist|build|vendor|.git'
```

Recent Changes

```bash
# 10 most-recently modified entries
eza -al --sort=modified -r | head -n 10
```

File Type Overviews

```bash
# Group by extension in long view
eza -al --sort=extension
```

CI/Scripting-safe Output

```bash
# No colors/icons; stable columns; bytes
eza -lB --no-user --no-time --no-permissions --no-quotes --icons=never --color=never
```

## Option Reference (curated)

Meta

- `-?`, `--help`: show options
- `-v`, `--version`: show version

Display

- `-1`: one entry per line
- `-l`: long view table
- `-G`: grid (default)
- `-x`: grid across
- `-R`: recurse; `-T`: tree view
- `-X`: dereference symlinks when displaying
- `-F WHEN`: classify names (always, auto, never)
- `--color WHEN`: colors (always, auto, never)
- `--color-scale [all|age|size]`; `--color-scale-mode [fixed|gradient]`
- `--icons WHEN`: icons (always, auto, never)
- `--no-quotes`: don't quote spaces
- `--hyperlink`: clickable links
- `--absolute on|follow|off`: show absolute paths
- `--follow-symlinks`: descend into symlinked dirs
- `-w COLS`: width

Filter & Sort

- `-a`: show hidden; `-aa` also shows `.` and `..`
- `-A`: almost-all (alias of `-a`)
- `-d`: treat dirs as files
- `-D`: only directories; `-f`: only files
- `--show-symlinks` / `--no-symlinks`
- `-L DEPTH`: recursion depth
- `-s FIELD`: sort by `name|Name|extension|Extension|size|type|created|modified|accessed|changed|inode|none`
- `-r`: reverse order
- `--group-directories-first` / `--group-directories-last`
- `-I 'a|b|c'`: ignore globs (pipe-separated)
- `--git-ignore`: respect .gitignore

Long View Fields

- Sizes: `-b` binary prefixes, `-B` bytes; `-S` block size
- Ownership: `-g` group; `--smart-group`; `-n` numeric IDs
- Extra columns: `-h` header; `-H` hard links; `-i` inode; `-M` mounts; `-O` flags
- Time: `-t FIELD` or `-m` modified, `-u` accessed, `-U` created, `--changed`
- Time format: `--time-style default|iso|long-iso|full-iso|relative|'+%Y-%m-%d %H:%M'`
- Size of dirs: `--total-size` (unix only)
- Hide fields: `--no-permissions`, `--no-filesize`, `--no-user`, `--no-time`
- Input: `--stdin` read names from stdin

Git

- `--git`: show file Git status
- `--no-git`: suppress Git columns (overrides others)
- `--git-repos`: repo roots with status
- `--git-repos-no-status`: repo roots without status (faster)

Attrs & Security

- `-@`, `--extended`: extended attributes and sizes
- `-Z`, `--context`: security context

---

Notes

- Icons require a Nerd Font or similar in your terminal.
- `--hyperlink` depends on terminal support for OSC 8 hyperlinks.
- For portability in scripts, prefer disabling colors/icons and fixed columns.
