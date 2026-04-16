import http.client
import json
import sys
import uuid

conn = http.client.HTTPConnection('127.0.0.1', 8000)

# 1. Register and Login
uid = str(uuid.uuid4())[:8]
login_data = json.dumps({'username':f'test_{uid}', 'email': f'test_{uid}@test.com', 'password':'SecurePass123'})
conn.request('POST', '/api/auth/register', body=login_data, headers={'Content-Type': 'application/json'})
res = conn.getresponse()
token_info = json.loads(res.read())
token = token_info.get('access_token')

if not token:
    print('Login failed:', token_info)
    sys.exit(1)

# 2. Setup multipart with NO files
boundary = '------WebKitFormBoundary7B9a8bXZ'
body = (
    f'--{boundary}\r\n'
    f'Content-Disposition: form-data; name="content"\r\n\r\n'
    f'Testing via script\r\n'
    f'--{boundary}--\r\n'
)

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': f'multipart/form-data; boundary={boundary}'
}

conn.request('POST', '/api/community/posts', body=body.encode('utf-8'), headers=headers)
post_res = conn.getresponse()
print('Status:', post_res.status)
print('Body:', post_res.read().decode())
