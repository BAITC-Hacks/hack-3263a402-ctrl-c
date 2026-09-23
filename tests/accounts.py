"""Auth integration checks. Default: local; --live checks deployed crypto/cookies using isolated QA accounts.
Passwords and session tokens stay in memory and are never printed.
"""
import argparse, copy, hashlib, http.cookiejar, json, secrets, sqlite3, time, urllib.request, urllib.error
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--base', default='http://localhost:5173')
parser.add_argument('--live', action='store_true')
args = parser.parse_args()
base = args.base.rstrip('/')
assert base.startswith('https://') if args.live else base == 'http://localhost:5173'
headers = {'Content-Type': 'application/json', 'Origin': base, 'X-Blitz-CSRF': '1'}
if not args.live: headers['CF-Connecting-IP'] = '198.51.100.' + str(secrets.randbelow(254)+1)
passed = []

class Client:
    def __init__(self):
        self.jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))
    def call(self, path='/api/learn', body=None, extra=None):
        request = urllib.request.Request(base + path, data=json.dumps(body).encode() if body is not None else None, headers={**headers, **(extra or {})})
        try:
            response = self.opener.open(request, timeout=30)
        except urllib.error.HTTPError as error:
            response = error
        raw = response.read()
        try: result = json.loads(raw)
        except json.JSONDecodeError: result = {'error': 'non-json response'}
        if response.status >= 500:
            raise AssertionError(f"Service failure {response.status}: {result.get('error','unknown')}")
        assert 'password_hash' not in json.dumps(result) and 'token_hash' not in json.dumps(result)
        return response.status, result, response.headers

a, b, anonymous = Client(), Client(), Client()
name_a, name_b = 'qa_a_' + secrets.token_hex(6), 'qa_b_' + secrets.token_hex(6)
password = secrets.token_urlsafe(32)
for client, name in [(a, name_a), (b, name_b)]:
    status, _, response_headers = client.call('/api/auth', {'action':'register','username':name,'password':password})
    assert status == 201, 'Registration failed'
    cookie = response_headers.get('Set-Cookie', '')
    assert 'HttpOnly' in cookie and 'SameSite=Lax' in cookie and 'Path=/' in cookie
    if args.live: assert '__Host-blitz_session=' in cookie and 'Secure' in cookie and 'Domain=' not in cookie
    status, state, _ = client.call()
    assert state['signedIn'] and state['user']['username'] == name and not state['courses'] and not state['attempts']
passed.append('registration and isolated empty profiles')

# Persist a learning result through the actual API, without spending any model calls.
status, result, _ = a.call(body={'action':'answer','courseId':'python','lessonId':'print','questionKey':'q0','answer':'0'})
assert status == 200 and not result['result']['correct']
attempt = result['result']['id']
assert any(x['id'] == attempt for x in a.call()[1]['attempts'])
assert not b.call()[1]['attempts']
assert b.call(body={'action':'history','attemptId':attempt})[0] == 404
assert b.call(body={'action':'answer','courseId':'python','lessonId':'print','questionKey':'transfer','attemptId':attempt,'answer':'5'})[0] == 404
assert anonymous.call(body={'action':'history','attemptId':attempt})[0] == 401
passed.append('persisted practice and cross-account access denied')

# Logout revokes the token in the database, including a copied cookie.
copied = Client()
for cookie in a.jar: copied.jar.set_cookie(copy.deepcopy(cookie))
assert a.call('/api/auth', {'action':'logout'})[0] == 200
assert not a.call()[1]['signedIn'] and not copied.call()[1]['signedIn']
assert a.call('/api/auth', {'action':'login','username':name_a.upper(),'password':password})[0] == 200
assert any(x['id'] == attempt for x in a.call()[1]['attempts'])
assert a.call('/api/auth', {'action':'login','username':name_a,'password':'incorrect password phrase'})[0] == 401
assert anonymous.call('/api/auth', {'action':'login','username':'absent_'+secrets.token_hex(5),'password':password})[0] == 401
passed.append('logout revokes session; login restores progress; wrong passwords rejected')

assert a.call('/api/auth', {'action':'logout'}, {'X-Blitz-CSRF':''})[0] == 403
assert a.call('/api/auth', {'action':'logout'}, {'Origin':'https://example.invalid'})[0] == 403
assert a.call(body={'action':'answer'}, extra={'X-Blitz-CSRF':''})[0] == 403
assert a.call('/api/auth', {'action':'register','username':name_a,'password':password})[0] == 409
assert anonymous.call('/api/auth', {'action':'register','username':'link_'+secrets.token_hex(4),'password':password,'linkProgress':True})[0] == 409
passed.append('CSRF, duplicate username and unverified linking rejected')

if args.live:
    # The Sites dispatcher must strip supplied identity headers; no real identity is impersonated.
    status, result, _ = anonymous.call('/api/auth', extra={'oai-authenticated-user-id':'untrusted-qa-user','oai-authenticated-user-email':'qa@example.invalid'})
    assert status == 200 and result['user'] is None, 'Untrusted identity headers were accepted'
    passed.append('public dispatcher rejects caller-supplied identity headers')
else:
    database_path = next(p for p in Path('.wrangler/state/v3/d1/miniflare-D1DatabaseObject').glob('*.sqlite') if p.name != 'metadata.sqlite')
    database = sqlite3.connect(database_path, timeout=10)
    stored = database.execute('SELECT password_hash FROM accounts WHERE username=?', (name_a,)).fetchone()[0]
    assert stored.startswith('scrypt-v1$') and password not in stored
    stored_b = database.execute('SELECT password_hash FROM accounts WHERE username=?', (name_b,)).fetchone()[0]
    assert stored != stored_b, 'Equal passwords need distinct salts'
    token = next(c.value for c in a.jar if c.name == 'blitz_local_session')
    assert database.execute('SELECT count(*) FROM auth_sessions WHERE token_hash=?',(token,)).fetchone()[0] == 0
    database.execute('UPDATE auth_sessions SET expires_at=? WHERE token_hash=?', (int(time.time()*1000)-1, hashlib.sha256(token.encode()).hexdigest()))
    database.commit()
    # Retain a valid platform sign-in while the app token is expired or signed out.
    a.opener.open(base+'/signin-with-chatgpt?return_to=/').read()
    assert not a.call()[1]['signedIn']
    a.call('/api/auth', {'action':'logout'})
    assert not a.call()[1]['signedIn']
    passed.append('salted hashes, hashed tokens, expired session fails closed with ambient ChatGPT login')
    legacy = Client(); legacy.opener.open(base+'/signin-with-chatgpt?return_to=/').read()
    before = legacy.call()[1]
    private_course = next((course for course in before['courses'] if course['id'] != 'python'), None)
    if private_course:
        assert b.call(body={'action':'lesson','courseId':private_course['id'],'lessonId':private_course['levels'][0]['lessons'][0]['id']})[0] == 404
    link_name = 'qa_link_'+secrets.token_hex(5)
    assert before['user']['canLinkProgress']
    assert legacy.call('/api/auth', {'action':'register','username':link_name,'password':password,'linkProgress':True})[0] == 201
    linked = Client()
    assert linked.call('/api/auth', {'action':'login','username':link_name,'password':password})[0] == 200
    after = linked.call()[1]
    assert after['courses'] == before['courses'] and after['attempts'] == before['attempts'] and after['projects'] == before['projects']
    # Remove only this test's credential mapping; the pre-existing learning records remain intact.
    link_id = database.execute('SELECT id FROM accounts WHERE username=?',(link_name,)).fetchone()[0]
    database.execute('DELETE FROM auth_sessions WHERE account_id=?',(link_id,))
    database.execute('DELETE FROM accounts WHERE id=?',(link_id,))
    database.commit()
    passed.append('opt-in linking preserves all previous learning records')
    missing_name = 'ratelimit_'+secrets.token_hex(4)
    for _ in range(10): assert anonymous.call('/api/auth', {'action':'login','username':missing_name,'password':password})[0] == 401
    assert anonymous.call('/api/auth', {'action':'login','username':missing_name,'password':password})[0] == 429
    passed.append('persistent login throttling')
    database.close()

a.call('/api/auth', {'action':'logout'}); b.call('/api/auth', {'action':'logout'})
print(json.dumps({'passed':passed,'environment':'production' if args.live else 'local'},ensure_ascii=False))
