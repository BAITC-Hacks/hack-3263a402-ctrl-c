"""Local-only functional checks; creates attempts for the preview account."""
import json, urllib.request, urllib.error, uuid, http.cookiejar
base='http://localhost:5173'
user='blitz-smoke-'+str(uuid.uuid4())
jar=http.cookiejar.CookieJar()
opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
opener.open(base+'/signin-with-chatgpt?return_to=/')
headers={'Content-Type':'application/json','Origin':base,'X-Blitz-CSRF':'1'}
def call(body=None,extra=None):
 req=urllib.request.Request(base+'/api/learn',data=None if body is None else json.dumps(body).encode(),headers={**headers,**(extra or {})})
 try:
  with opener.open(req,timeout=120) as r:return r.status,json.load(r)
 except urllib.error.HTTPError as e:
  raw=e.read().decode()
  try: value=json.loads(raw)
  except json.JSONDecodeError: value={'error':'non-json rejection'}
  return e.code,value
def ans(lesson,key,answer,attempt=None):return call({'action':'answer','courseId':'python','lessonId':lesson,'questionKey':key,'answer':answer,**({'attemptId':attempt} if attempt else {})})
code,s=call();assert code==200 and s['signedIn']
assert 'correctIndex' not in json.dumps(s['courses']) and 'expected' not in json.dumps(s['courses'])
assert ans('composition','q0','1')[0]==403
assert ans('print','q0','01')[0]==400
code,wrong=ans('print','q0','0');assert code==200 and not wrong['result']['correct'];a=wrong['result']['id']
code,trial=ans('print','transfer','2',a);assert code==200 and not trial['result']['correct'] and trial['result']['correctAnswer']==''
transfer=[x for x in trial['state']['attempts'] if x['question_key']=='transfer'][0]
assert json.loads(transfer['snapshot'])['correctAnswer']==''
request=urllib.request.Request(base+'/api/learn',data=json.dumps({'action':'history','attemptId':a}).encode(),headers=headers)
try: urllib.request.urlopen(request); raise AssertionError('Unauthenticated history accepted')
except urllib.error.HTTPError as e: assert e.code==401
code,good=ans('print','transfer','5',a);assert code==200 and good['result']['correct']
assert next(x for x in good['state']['attempts'] if x['id']==a)['resolved']==1
assert ans('print','transfer','5',a)[0]==404
for lesson,values in [('print',[('q0','1'),('q1','1'),('output','AI\n3')]),('variables',[('q0','1'),('q1','2'),('output','9')]),('strings',[('q0','0'),('q1','1'),('output','o\n5')])]:
 for key,value in values:
  code,r=ans(lesson,key,value);assert code==200 and r['result']['correct'],r
assert ans('conditions','q0','1')[0]==200
code,reloaded=call();assert code==200 and len(reloaded['attempts'])>=13
assert call({'action':'project','courseId':'python','levelId':'level-2','body':'Достаточно длинная работа для проверки правила открытия.'})[0]==403
assert call({'action':'answer'}, {'Origin':'https://example.invalid'})[0]==403
print(json.dumps({'passed':['auth and attempt history isolation','answer keys hidden','level gates','MCQ validation','incorrect attempt snapshot','transfer hides solution','remediation resolves error','duplicate remediation rejected','9 answers graded','progress survives refetch','project gate','origin check'],'testUser':'local preview account'},ensure_ascii=False))
