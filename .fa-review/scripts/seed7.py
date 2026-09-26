"""Session 7 additions to the demo data (after seed.py and seed6.py).

Usage: python3 seed7.py <base-url>

- legal documents, so sign-in and sign-up show the legal consent line
- a demo Epay configuration and a 20% discount on the 100 preset, so the
  wallet shows the top-up presets (nothing is ever paid; the address is a
  placeholder)
- two more channels (one tagged, one disabled) and model metadata with a
  vendor, for the channels and models pages
"""
import json
import sys
import urllib.request

BASE = sys.argv[1]
PASSWORD = 'DemoPass-2026!'


def call(method, path, body=None, headers=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header('Content-Type', 'application/json')
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req) as resp:
            text = resp.read().decode()
    except urllib.error.HTTPError as err:
        text = err.read().decode()
    print(f'{method} {path} -> {text[:160]}')
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {}


login = call('POST', '/api/user/login', {'username': 'admin', 'password': PASSWORD})
token = login.get('data', {}).get('access_token')
auth = {'Authorization': f'Bearer {token}', 'New-Api-User': '1'}


def option(key, value):
    call('PUT', '/api/option/', {'key': key, 'value': value}, auth)


option('legal.user_agreement', 'Demo user agreement.')
option('legal.privacy_policy', 'Demo privacy policy.')
option('RegisterEnabled', 'true')
option('PasswordRegisterEnabled', 'true')
option('PayAddress', 'https://pay.example.com/')
option('EpayId', 'demo')
option('EpayKey', 'demo-key-not-real')
option('payment_setting.amount_discount', json.dumps({'100': 0.8}))

call('POST', '/api/channel/', {'mode': 'single', 'channel': {
    'name': 'azure-east', 'type': 3, 'key': 'demo-azure-key-not-real',
    'base_url': 'https://demo-east.openai.azure.com', 'other': '2025-04-01-preview',
    'models': 'gpt-4o,gpt-4o-mini', 'group': 'default', 'tag': 'production',
    'priority': 10, 'weight': 5, 'status': 1}}, auth)
call('POST', '/api/channel/', {'mode': 'single', 'channel': {
    'name': 'anthropic-backup', 'type': 14, 'key': 'sk-ant-demo-not-real',
    'models': 'claude-sonnet-4-5', 'group': 'default', 'status': 2}}, auth)

vendor = call('POST', '/api/vendors/', {'name': 'OpenAI', 'icon': 'OpenAI',
                                        'description': 'Demo vendor'}, auth)
vendor_id = (vendor.get('data') or {}).get('id', 0)
for name, desc, tags in (
    ('gpt-4o', 'Multimodal flagship model', 'chat,vision'),
    ('gpt-4o-mini', 'Small, fast model', 'chat'),
    ('claude-sonnet-4-5', 'Balanced model', 'chat,code'),
):
    call('POST', '/api/models/', {'model_name': name, 'description': desc,
                                  'tags': tags, 'vendor_id': vendor_id,
                                  'status': 1, 'name_rule': 0}, auth)
print('SEED7_DONE')
