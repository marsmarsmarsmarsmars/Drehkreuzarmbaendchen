#!/usr/bin/env bash
set -e



# 2. Required packages
DEPS=(git python3 python3-venv python3-pip python3-fastapi python3-uvicorn python3-pydantic python3-sqlalchemy python3-bcrypt python3-passlib bc)
# If the script is run with "--yes" or the AUTOYES env var is set, skip the confirmation prompt.
if [[ "$1" == "--yes" ]] || [[ -n "$AUTOYES" ]]; then
  echo "Auto‑confirm enabled – proceeding with package installation."
else
  echo "The following packages will be installed (if not already present): ${DEPS[*]}"
  read -r -p "Continue? [y/N] " REPLY
  # Abort only on explicit 'n' or 'N'
  if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo "Aborting."
    exit 1
  fi
fi

sudo apt-get update
sudo apt-get install -y --no-install-recommends "${DEPS[@]}"

# 2. Check Python version >= 3.11
PYVER=$(python3 -c 'import sys; print("%d.%d" % sys.version_info[:2])')
if (( $(echo "$PYVER < 3.11" | bc -l) )); then
  echo "Python 3.11 or newer is required (found $PYVER). Aborting."
  exit 1
fi


# 3. Create system user
if ! id -u armbaendchen >/dev/null 2>&1; then
  sudo useradd -r -s /usr/sbin/nologin armbaendchen
fi

# 4. Install application
APP_DIR="/opt/armbaendchen"
sudo mkdir -p "$APP_DIR"
sudo chown armbaendchen:armbaendchen "$APP_DIR"
sudo -u armbaendchen git clone https://github.com/marsmarsmarsmarsmars/Drehkreuzarmbaendchen.git "$APP_DIR"
cd "$APP_DIR"

# 5. Python virtualenv
sudo -u armbaendchen python3 -m venv --system-site-packages venv
source venv/bin/activate
pip install --upgrade pip && pip install --no-cache-dir -r backend/requirements.txt

# 6. Create data directory
mkdir -p backend/data
sudo chown -R armbaendchen:armbaendchen backend/data

# 7. Install systemd service
SERVICE_FILE="/opt/armbaendchen/service/armbaendchen.service"
sudo tee "$SERVICE_FILE" > /dev/null <<'EOF'
[Unit]
Description=Armbaendchen FastAPI service
After=network.target

[Service]
User=armbaendchen
Group=armbaendchen
WorkingDirectory=/opt/armbaendchen
Environment=PATH=/opt/armbaendchen/venv/bin
ExecStart=/opt/armbaendchen/venv/bin/uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
Restart=on-failure
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Symlink service to systemd
sudo ln -sf /opt/armbaendchen/service/armbaendchen.service /etc/systemd/system/armbaendchen.service
sudo systemctl daemon-reload
sudo systemctl enable --now armbaendchen.service

# 8. Ensure update helper is executable
sudo chmod +x /opt/armbaendchen/service/armbaendchen-update

echo "Installation finished. Service is running and can be managed with:"
echo "  sudo systemctl {start|stop|restart|status} armbaendchen"
echo "To update later run:"
echo "  sudo /opt/armbaendchen/service/armbaendchen-update"

# Optional cleanup of compiler tools and pip cache
if [[ "$1" == "--cleanup" ]] || [[ -n "$CLEANUP" ]]; then
  echo "Cleaning up compiler tools and pip cache to free space..."
  sudo apt-get purge -y build-essential gcc g++ cpp
  sudo apt-get autoremove --purge -y
  sudo apt-get clean
  sudo rm -rf /var/lib/apt/lists/* /root/.cache/pip
  echo "Cleanup completed."
fi
