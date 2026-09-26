"""Session 6 additions to the demo data, and the saved interface language.

Usage:
  python3 seed6.py <base-url> <sqlite-db-path>   # after seed.py
  python3 seed6.py <base-url> lang <code>        # en, zhCN or fa

The admin's saved language is applied at sign-in and wins over the
browser's localStorage, so set it before each screenshot run.
"""
import json
import sqlite3
import sys
import time
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

if sys.argv[2] == 'lang':
    call('PUT', '/api/user/self', {'language': sys.argv[3]}, auth)
    sys.exit(0)

DB = sys.argv[2]

# Redemption codes and subscription plans need the payment compliance
# confirmation (Payment Gateway settings).
call('POST', '/api/option/payment_compliance', {'confirmed': True}, auth)

# Redemption codes: one batch of three and a single code with an expiry.
call('POST', '/api/redemption/', {'name': 'spring-promo', 'quota': 2500000,
                                  'count': 3, 'expired_time': 0}, auth)
call('POST', '/api/redemption/', {'name': 'partner-trial', 'quota': 500000,
                                  'count': 1,
                                  'expired_time': int(time.time()) + 86400 * 30},
     auth)

# A subscription plan, bound to demo-user.
call('POST', '/api/subscription/admin/plans', {'plan': {
    'title': 'Basic', 'subtitle': 'Light usage', 'price_amount': 9.9,
    'duration_unit': 'month', 'duration_value': 1, 'enabled': True,
    'sort_order': 10, 'total_amount': 5000000}}, auth)
plans = call('GET', '/api/subscription/admin/plans', headers=auth)
items = plans.get('data') or []
if isinstance(items, dict):
    items = items.get('items') or []
plan_id = next((p.get('plan', p).get('id') for p in items), None)
if plan_id:
    call('POST', '/api/subscription/admin/bind', {'user_id': 2, 'plan_id': plan_id},
         auth)

# Pending and expired top-up orders for the billing history.
now = int(time.time())
con = sqlite3.connect(DB)
for trade_no, status, days in (('DEMO-ORDER-2', 'pending', 1),
                               ('DEMO-ORDER-3', 'expired', 2)):
    con.execute(
        'INSERT INTO top_ups (user_id, amount, money, trade_no, payment_method, '
        'payment_provider, create_time, complete_time, status) '
        'VALUES (1, 10, 10.0, ?, ?, ?, ?, 0, ?)',
        (trade_no, 'stripe', 'stripe', now - 86400 * days, status))
con.commit()
con.close()
print('SEED6_DONE')
