#!/usr/bin/env bash
set -e

# ------------------------------------------------------------
# armbaendchen-update.sh – update / repair script
# ------------------------------------------------------------
# Supports normal update, forced repair ("--repair" or "--force")
# and automatically restores a missing frontend build.
# ------------------------------------------------------------

APP_DIR="/opt/armbaendchen"
cd "$APP_DIR"

# -------- Parse optional flags --------------------------------
REPAIR=0
for arg in "$@"; do
  case "$arg" in
    --repair|--force) REPAIR=1 ;;
  esac
done

# -------- Determine service state ----------------------------
SERVICE_NAME="armbaendchen.service"
SERVICE_WAS_RUNNING=0
if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
  SERVICE_WAS_RUNNING=1
  echo "Service $SERVICE_NAME is running – stopping before update/repair."
  sudo systemctl stop "$SERVICE_NAME"
fi

# -------- Git operations --------------------------------------
# Fetch latest tags/commits as the proper user
sudo -u armbaendchen git -C "$APP_DIR" fetch --tags origin
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

# Determine whether we need to reset the repository
NEED_RESET=0
if [ $REPAIR -eq 1 ]; then
  NEED_RESET=1
else
  if [ "$LOCAL" != "$REMOTE" ]; then
    NEED_RESET=1
  else
    # Even if up‑to‑date, check for missing frontend index.html
    if [ ! -f client/dist/index.html ]; then
      echo "Frontend index.html missing – triggering repair."
      NEED_RESET=1
    fi
  fi
fi

if [ $NEED_RESET -eq 1 ]; then
  echo "Resetting repository to latest commit..."
  # Ensure a clean reset (fetch already done above)
  sudo -u armbaendchen git -C "$APP_DIR" reset --hard origin/main
fi

# ------------------------------------------------------------
# Frontend handling – always ensure a fresh build is present
# ------------------------------------------------------------
# Remove any leftover client source (keep only the built dist after download)
if [ -d client ]; then
  sudo -u armbaendchen rm -rf client
fi

FRONTEND_URL="https://github.com/marsmarsmarsmarsmars/Drehkreuzarmbaendchen/releases/download/frontend-latest/frontend-dist.tar.gz"
TMP_ARCH="/tmp/frontend-dist.tar.gz"
# Use -f to let curl fail on HTTP errors (e.g., 404)
if sudo -u armbaendchen curl -fL -o "$TMP_ARCH" "$FRONTEND_URL"; then
  sudo -u armbaendchen mkdir -p client/dist
  sudo -u armbaendchen tar -xzf "$TMP_ARCH" -C client/dist --strip-components=1
  rm "$TMP_ARCH"
else
  echo "Warning: Could not download frontend archive – proceeding without updating frontend."
fi

# ------------------------------------------------------------
# Ensure correct ownership of the whole installation directory
# ------------------------------------------------------------
sudo chown -R armbaendchen:armbaendchen "$APP_DIR"

# ------------------------------------------------------------
# Python dependencies & DB schema update
# ------------------------------------------------------------
# Install requirements (no upgrade) inside the venv as the correct user
sudo -u armbaendchen bash -c "source venv/bin/activate && pip install --no-cache-dir -r backend/requirements.txt"
# Apply any pending database migrations / create tables
sudo -u armbaendchen python -c "from backend.app import models, main; models.Base.metadata.create_all(bind=main.engine)"

# ------------------------------------------------------------
# Restart the service (or start it if it was stopped)
# ------------------------------------------------------------
if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
  echo "Service $SERVICE_NAME already running – restarting to pick up changes."
  sudo systemctl restart "$SERVICE_NAME"
else
  echo "Starting service $SERVICE_NAME..."
  sudo systemctl start "$SERVICE_NAME"
fi

echo "Update/repair completed."
