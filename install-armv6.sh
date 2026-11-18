#!/usr/bin/env bash
set -e

# 1. Check Python version >= 3.11
PYVER=$(python3 -c 'import sys; print("%d.%d" % sys.version_info[:2])')
if (( $(echo "$PYVER < 3.11" | bc -l) )); then
  echo "Python 3.11 or newer is required (found $PYVER). Aborting."
  exit 1
fi

# 2. Required packages
DEPS=(git python3 python3-venv python3-pip build-essential libffi-dev libssl-dev)
echo "The following packages will be installed (if not already present): ${DEPS[*]}"
read -p "Continue? [y/N] " -r
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborting."
  exit 1
fi

sudo apt-get update
sudo apt-get install -y "${DEPS[@]}"

# 3. Create system user
if ! id -u armbaendchen >/dev/null 2>&1; then
  sudo useradd -r -s /usr/sbin/nologin armbaendchen
fi

# 4. Install application
APP_DIR="/opt/armbaendchen"
sudo mkdir -p "$APP_DIR"
sudo chown armbaendchen:armbaendchen "$APP_DIR"
sudo -u armbaendchen git clone https://github.com/marsmarsmarsmarsmars/Drehkreuzarmb%C3%A4ndchen.git "$APP_DIR"
cd "$APP_DIR"

# 5. Python virtualenv
sudo -u armbaendchen python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt

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

# 8. Deploy update helper
sudo mkdir -p /opt/armbaendchen/service
sudo tee /opt/armbaendchen/service/armbaendchen-update > /dev/null <<'EOF'
#!/usr/bin/env bash
set -e
APP_DIR="/opt/armbaendchen"
cd "$APP_DIR"
git fetch --tags
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)
if [ "$LOCAL" = "$REMOTE" ]; then
  echo "Already up to date."
  exit 0
fi
echo "Updating to latest version..."
git reset --hard origin/main
source venv/bin/activate
pip install -r backend/requirements.txt --upgrade
python -c "from backend.app import models, main; models.Base.metadata.create_all(bind=main.engine)"
sudo systemctl restart armbaendchen.service
echo "Update complete."
EOF
sudo chmod +x /opt/armbaendchen/service/armbaendchen-update

echo "Installation finished. Service is running and can be managed with:"
echo "  sudo systemctl {start|stop|restart|status} armbaendchen"
echo "To update later run:"
echo "  sudo /opt/armbaendchen/service/armbaendchen-update"
