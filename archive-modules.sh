#!/bin/bash
# Archive stub modules

ARCHIVE_DIR="/data/data/com.termux/files/home/zynkra/server/src/archive"
SRC_DIR="/data/data/com.termux/files/home/zynkra/server/src"

# Create archive directory
mkdir -p "$ARCHIVE_DIR"

# List of modules to archive
MODULES=(
  "snapmap"
  "crypto"
  "dao"
  "token"
  "tipping"
  "advanced-features"
  "watchlist"
  "sponsored-posts"
  "snooze"
  "forms"
)

# Move each module to archive
for module in "${MODULES[@]}"; do
  if [ -d "$SRC_DIR/$module" ]; then
    mv "$SRC_DIR/$module" "$ARCHIVE_DIR/"
    echo "Archived: $module"
  else
    echo "Not found: $module"
  fi
done

echo "Done archiving modules"
