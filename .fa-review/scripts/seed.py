"""Seed a scratch new-api instance with demo data through its API.

Usage: python3 seed.py http://127.0.0.1:3300 <sqlite-db-path>
Prints each request and the start of its response.
"""
import json
import sqlite3
import sys
import time
import urllib.request

BASE = sys.argv[1]
DB = sys.argv[2]
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


call('GET', '/api/setup')
call('POST', '/api/setup', {
    'username': 'admin', 'password': PASSWORD, 'confirmPassword': PASSWORD,
    'SelfUseModeEnabled': False, 'DemoSiteEnabled': False,
})
login = call('POST', '/api/user/login', {'username': 'admin', 'password': PASSWORD})
token = login.get('data', {}).get('access_token')
auth = {'Authorization': f'Bearer {token}'}

# A second user whose quota the admin adjusts (manage rows + audit events).
call('POST', '/api/user/', {'username': 'demo-user', 'password': PASSWORD,
                            'display_name': 'Demo User'}, auth)
users = call('GET', '/api/user/?p=1&page_size=10', headers=auth)
items = users.get('data', {}).get('items', [])
demo = next((u for u in items if u.get('username') == 'demo-user'), None)
if demo:
    call('POST', '/api/user/manage', {'id': demo['id'], 'action': 'add_quota',
                                      'mode': 'add', 'value': 2500000}, auth)

# Session 5: one channel so the pricing and model pages list models.
call('POST', '/api/channel/', {'mode': 'single', 'channel': {
    'name': 'demo-openai', 'type': 1, 'key': 'sk-demo-not-real', 'base_url': '',
    'models': 'gpt-4o,claude-sonnet-4-5,gemini-2.5-pro', 'group': 'default',
    'status': 1}}, auth)

# API keys: token.create audit events.
call('POST', '/api/token/', {'name': 'demo-key', 'remain_quota': 3500000,
                             'expired_time': -1, 'unlimited_quota': False}, auth)
call('POST', '/api/token/', {'name': 'unlimited-key', 'remain_quota': 0,
                             'expired_time': -1, 'unlimited_quota': True}, auth)

# System access token: security proof, generate, then one call with it so the
# access-token history has records.
proof = call('POST', '/api/verify', {'method': 'password',
                                     'scope': 'access_token.generate',
                                     'password': PASSWORD}, auth)
proof_token = proof.get('data', {}).get('proof_token', '')
generated = call('POST', '/api/user/token', {},
                 {**auth, 'X-Security-Proof': proof_token})
system_token = generated.get('data')
if isinstance(system_token, dict):
    system_token = system_token.get('token') or system_token.get('access_token')
if system_token:
    call('GET', '/api/user/self', headers={'Authorization': system_token,
                                           'New-Api-User': '1'})
    call('GET', '/api/token/?p=1&size=10', headers={'Authorization': system_token,
                                                    'New-Api-User': '1'})

# A pending top-up order, completed by the admin: wallet billing history,
# a top-up row in the usage logs and a user.topup_complete audit event.
now = int(time.time())
con = sqlite3.connect(DB)
con.execute(
    'INSERT INTO top_ups (user_id, amount, money, trade_no, payment_method, payment_provider, '
    'create_time, complete_time, status) VALUES (1, 20, 20.0, ?, ?, ?, ?, 0, ?)',
    ('DEMO-ORDER-1', 'stripe', 'stripe', now - 86400 * 3, 'pending'))
con.commit()
call('POST', '/api/user/topup/complete', {'trade_no': 'DEMO-ORDER-1'}, auth)

# Consume logs (what a relayed request writes), spread over the last days.
for i, (model, prompt, completion, quota, use_time) in enumerate([
    ('gpt-4o', 1250, 380, 4210, 3),
    ('claude-sonnet-4-5', 3400, 910, 12800, 7),
    ('gemini-2.5-pro', 820, 240, 1900, 2),
]):
    other = json.dumps({'model_ratio': 1.25, 'completion_ratio': 4,
                        'group_ratio': 1, 'frt': 850})
    con.execute(
        'INSERT INTO logs (user_id, created_at, type, content, username, '
        'token_name, model_name, quota, prompt_tokens, completion_tokens, '
        'use_time, is_stream, channel_id, token_id, "group", ip, other) '
        'VALUES (1, ?, 2, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, ?, ?, ?)',
        (now - 3600 * (i * 20 + 2), '', 'admin', 'demo-key', model, quota,
         prompt, completion, use_time, 'default', '203.0.113.7', other))
con.commit()

# Legacy manage and login rows, as written before manage actions moved to
# the audit log; the usage logs still render them from other.op.
legacy = [
    (3, {'op': {'action': 'user.manage', 'params': {'action': 'disable',
            'username': 'demo-user', 'id': 2}}}, now - 600),
    (3, {'op': {'action': 'user.quota_override', 'params': {
            'target_username': 'demo-user', 'target_user_id': 2,
            'from': 500000, 'to': 2500000}}}, now - 500),
    (7, {'op': {'action': 'login', 'params': {'method': 'password'}}}, now - 400),
]
for log_type, other, created_at in legacy:
    con.execute(
        'INSERT INTO logs (user_id, created_at, type, content, username, '
        'token_name, model_name, quota, prompt_tokens, completion_tokens, '
        'use_time, is_stream, channel_id, token_id, "group", ip, other) '
        'VALUES (1, ?, ?, ?, ?, "", "", 0, 0, 0, 0, 0, 0, 0, "", ?, ?)',
        (created_at, log_type, 'legacy row', 'admin', '203.0.113.7',
         json.dumps(other)))
con.commit()

# Session 5: hourly dashboard data across a year boundary (2025-12-27 to
# 2026-01-03) and across Nowruz (2026-03-15 to 2026-03-23, 1404/12/24 to
# 1405/01/03), in UTC, plus one consume log in each period.
import calendar
import datetime


def utc(y, m, d, h=0):
    return calendar.timegm(datetime.datetime(y, m, d, h).timetuple())


models = [('gpt-4o', 1.0), ('claude-sonnet-4-5', 1.6), ('gemini-2.5-pro', 0.7)]
for start, days in ((utc(2025, 12, 27), 8), (utc(2026, 3, 15), 9)):
    for day in range(days):
        for hour in (3, 9, 15, 21):
            ts = start + day * 86400 + hour * 3600
            for index, (model, factor) in enumerate(models):
                count = 4 + (day * 3 + hour + index * 5) % 11
                quota = int(count * 9000 * factor)
                for user_id, username in ((1, 'admin'), (2, 'demo-user')):
                    con.execute(
                        'INSERT INTO quota_data (user_id, username, model_name, '
                        'created_at, use_group, token_id, channel_id, node_name, '
                        'token_used, count, quota) VALUES (?, ?, ?, ?, ?, 1, 1, "", ?, ?, ?)',
                        (user_id, username, model, ts, 'default', count * 1500,
                         count, quota // user_id))
for created_at in (utc(2025, 12, 31, 22), utc(2026, 3, 21, 1)):
    con.execute(
        'INSERT INTO logs (user_id, created_at, type, content, username, '
        'token_name, model_name, quota, prompt_tokens, completion_tokens, '
        'use_time, is_stream, channel_id, token_id, "group", ip, other) '
        'VALUES (1, ?, 2, "", "admin", "demo-key", "gpt-4o", 5200, 1400, 420, '
        '4, 1, 1, 1, "default", "203.0.113.7", ?)',
        (created_at, json.dumps({'model_ratio': 1.25, 'completion_ratio': 4,
                                 'group_ratio': 1, 'frt': 700})))
con.commit()
con.close()

if len(sys.argv) > 3 and sys.argv[3] == 'en':
    print('SEED_DONE')
    sys.exit(0)
call('PUT', '/api/user/self', {'language': 'fa'}, auth)
print('SEED_DONE')
