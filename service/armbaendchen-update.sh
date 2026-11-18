#!/usr/bin/env bash
set -e

APP_DIR="/opt/armbaendchen"
cd "$APP_DIR"

# Determine if the systemd service is currently running
SERVICE_NAME="armbaendchen.service"
SERVICE_WAS_RUNNING=0
if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
  SERVICE_WAS_RUNNING=1
  echo "Service $SERVICE_NAME is running – stopping before update."
  sudo systemctl stop "$SERVICE_NAME"
fi

# Fetch latest tags/commits as the proper user
sudo -u armbaendchen git -C "$APP_DIR" fetch --tags
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)
if [ "$LOCAL" = "$REMOTE" ]; then
  echo "Already up to date."
  # If we stopped the service earlier, start it again before exiting
  if [ $SERVICE_WAS_RUNNING -eq 1 ]; then
    sudo systemctl start "$SERVICE_NAME"
  fi
  exit 0
fi

echo "Updating to latest version..."
# Remove any existing client source code (if present)
if [ -d client ]; then
  sudo -u armbaendchen rm -rf client
fi
# Download pre‑built frontend from GitHub release
FRONTEND_URL="https://github.com/marsmarsmarsmarsmars/Drehkreuzarmbaendchen/releases/download/frontend-latest/frontend-dist.tar.gz"
TMP_ARCH="/tmp/frontend-dist.tar.gz"
# Try to fetch; ignore if not yet available (first install)
sudo -u armbaendchen curl -L -o "$TMP_ARCH" "$FRONTEND_URL" || true
if [ -f "$TMP_ARCH" ]; then
  sudo -u armbaendchen mkdir -p client/dist
  sudo -u armbaendchen tar -xzf "$TMP_ARCH" -C client/dist --strip-components=1
  rm "$TMP_ARCH"
fi
# Install/upgrade Python requirements (still as armbaendchen) without --upgrade flag
sudo -u armbaendchen bash -c "source venv/bin/activate && pip install --no-cache-dir -r backend/requirements.txt"
# Apply any database schema changes
sudo -u armbaendchen python -c "from backend.app import models, main; models.Base.metadata.create_all(bind=main.engine)"
# Restart the service if it was running before
if [ $SERVICE_WAS_RUNNING -eq 1 ]; then
  echo "Restarting service $SERVICE_NAME..."
  sudo systemctl start "$SERVICE_NAME"
fi

echo "Update complete."
