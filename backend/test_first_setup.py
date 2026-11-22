from fastapi.testclient import TestClient
from backend.app.main import app
client = TestClient(app)
resp = client.get('/api/first-setup')
print('status', resp.status_code)
print('json', resp.json())
