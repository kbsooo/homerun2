개발을 진행하면서 점점 산으로 가고 있다는 느낌이 들어서 기본 지식을 좀 줄게

서버쪽 api 요청을 보내는 주소:
http://3.27.108.105:8080

vercel에 배포된 front 주소:
https://homerun2.vercel.app

니가 작업했을 때 자주 발행하는 오류들
- 계속 서버에 api를 요청해야 하는 부분을 계속해서 front 주소에 요청하는 오류가 있어
- 서버의 주소는 https가 아닌 http야 그래서 mixed content 에러가 뜰 때가 있는데 서버의 주소가 http인거는 어쩔 수 없어
- /taxi 페이지에서 그룹 모집 버튼을 누르면 이미 로그인이 되어 있는데도 로그인이 필요하다고 뜨는 에러가 간혹 생겨
- /taxi 페이지에서 그룹 모집은 어떻게 됐어도 채팅이 진행이 안되는 에러가 자주 일어나
Mixed Content: The page at 'https://homerun2.vercel.app/taxi' was loaded over HTTPS, but requested an insecure resource 'http://3.27.108.105:8080/api/taxi/leave'. This request has been blocked; the content must be served over HTTPS.
w @ page-d63e689a995c274c.js:1
uB @ 4bd1b696-bd3e6f4c22b58cbd.js:1
(anonymous) @ 4bd1b696-bd3e6f4c22b58cbd.js:1
nC @ 4bd1b696-bd3e6f4c22b58cbd.js:1
uK @ 4bd1b696-bd3e6f4c22b58cbd.js:1
sG @ 4bd1b696-bd3e6f4c22b58cbd.js:1
sY @ 4bd1b696-bd3e6f4c22b58cbd.js:1Understand this errorAI
517-e72941a1114601a7.js:1 Error leaving previous groups: TypeError: Failed to fetch
    at w (page-d63e689a995c274c.js:1:2797)
    at uB (4bd1b696-bd3e6f4c22b58cbd.js:1:131447)
    at 4bd1b696-bd3e6f4c22b58cbd.js:1:137623
    at nC (4bd1b696-bd3e6f4c22b58cbd.js:1:18576)
    at uK (4bd1b696-bd3e6f4c22b58cbd.js:1:132754)
    at sG (4bd1b696-bd3e6f4c22b58cbd.js:1:158334)
    at sY (4bd1b696-bd3e6f4c22b58cbd.js:1:158156)
window.console.error @ 517-e72941a1114601a7.js:1
w @ page-d63e689a995c274c.js:1
await in w
uB @ 4bd1b696-bd3e6f4c22b58cbd.js:1
(anonymous) @ 4bd1b696-bd3e6f4c22b58cbd.js:1
nC @ 4bd1b696-bd3e6f4c22b58cbd.js:1
uK @ 4bd1b696-bd3e6f4c22b58cbd.js:1
sG @ 4bd1b696-bd3e6f4c22b58cbd.js:1
sY @ 4bd1b696-bd3e6f4c22b58cbd.js:1Understand this errorAI
page-d63e689a995c274c.js:1 Joining taxi group with token: eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIzOTE1MzMxODU1Iiwibmlja25hbWUiOiLqsJXrs5HsiJgyIiwiaWF0IjoxNzQwOTgxNzg0LCJleHAiOjE3NDEwNjgxODR9.i-r241KAIXCBI-nHAQbgdj06MP5KOvAqE83za3Mv1WwVd2dEUkDsP7Zg2Mo2TSA2RjiX_FzW-ckAtlPgtyHRcw
page-d63e689a995c274c.js:1 Mixed Content: The page at 'https://homerun2.vercel.app/taxi' was loaded over HTTPS, but requested an insecure resource 'http://3.27.108.105:8080/api/taxi/join'. This request has been blocked; the content must be served over HTTPS.
w @ page-d63e689a995c274c.js:1
await in w
uB @ 4bd1b696-bd3e6f4c22b58cbd.js:1
(anonymous) @ 4bd1b696-bd3e6f4c22b58cbd.js:1
nC @ 4bd1b696-bd3e6f4c22b58cbd.js:1
uK @ 4bd1b696-bd3e6f4c22b58cbd.js:1
sG @ 4bd1b696-bd3e6f4c22b58cbd.js:1
sY @ 4bd1b696-bd3e6f4c22b58cbd.js:1Understand this errorAI
517-e72941a1114601a7.js:1 Error joining group: TypeError: Failed to fetch
    at w (page-d63e689a995c274c.js:1:3216)

    주로 이런 에러야
- 자꾸 Front에서 요청을 api.homerun.life/bus/fromGHtoMJU 이렇게 api.homerun.life로 보내는데 이건 아무 주소도 아닌건데 왜 여길로 보내는거야 Server 주소로 보내야지
- 아까부터 계속 /taxi에서 모집을 누르면 '그룹 참가중 오류가 발생했습니다' page-d63e689a995c274c.js:1 Mixed Content: The page at 'https://homerun2.vercel.app/taxi' was loaded over HTTPS, but requested an insecure resource 'http://3.27.108.105:8080/api/taxi/join'. This request has been blocked; the content must be served over HTTPS.
w @ page-d63e689a995c274c.js:1
await in w
uB @ 4bd1b696-bd3e6f4c22b58cbd.js:1
(anonymous) @ 4bd1b696-bd3e6f4c22b58cbd.js:1
nC @ 4bd1b696-bd3e6f4c22b58cbd.js:1
uK @ 4bd1b696-bd3e6f4c22b58cbd.js:1
sG @ 4bd1b696-bd3e6f4c22b58cbd.js:1
sY @ 4bd1b696-bd3e6f4c22b58cbd.js:1Understand this errorAI
517-e72941a1114601a7.js:1 Error joining group: 
(anonymous) @ 517-e72941a1114601a7.js:1
w @ page-d63e689a995c274c.js:1
await in w
uB @ 4bd1b696-bd3e6f4c22b58cbd.js:1
(anonymous) @ 4bd1b696-bd3e6f4c22b58cbd.js:1
nC @ 4bd1b696-bd3e6f4c22b58cbd.js:1
uK @ 4bd1b696-bd3e6f4c22b58cbd.js:1
sG @ 4bd1b696-bd3e6f4c22b58cbd.js:1
sY @ 4bd1b696-bd3e6f4c22b58cbd.js:1Understand this errorAI
이런 에러가 떠서 수정하면
채팅방까지 이어져서 채팅방에서 에러가 나고

그 채팅방 에러를 수정하면 이런게 다시 생기고 해
- 채팅방까지는 이어지는데 그 이후에
POST https://homerun2.vercel.app/api/proxy/taxi/leave 500 (Internal Server Error)
w @ page-1fae3dbf5cba06c1.js:1
uB @ 4bd1b696-bd3e6f4c22b58cbd.js:1
(anonymous) @ 4bd1b696-bd3e6f4c22b58cbd.js:1
nC @ 4bd1b696-bd3e6f4c22b58cbd.js:1
uK @ 4bd1b696-bd3e6f4c22b58cbd.js:1
sG @ 4bd1b696-bd3e6f4c22b58cbd.js:1
sY @ 4bd1b696-bd3e6f4c22b58cbd.js:1Understand this errorAI
page-1fae3dbf5cba06c1.js:1 Failed to leave previous groups, continuing anyway
w @ page-1fae3dbf5cba06c1.js:1
await in w
uB @ 4bd1b696-bd3e6f4c22b58cbd.js:1
(anonymous) @ 4bd1b696-bd3e6f4c22b58cbd.js:1
nC @ 4bd1b696-bd3e6f4c22b58cbd.js:1
uK @ 4bd1b696-bd3e6f4c22b58cbd.js:1
sG @ 4bd1b696-bd3e6f4c22b58cbd.js:1
sY @ 4bd1b696-bd3e6f4c22b58cbd.js:1Understand this warningAI
page-1fae3dbf5cba06c1.js:1 Joining taxi group with token: eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIzOTE1MzMxODU1Iiwibmlja25hbWUiOiLqsJXrs5HsiJgyIiwiaWF0IjoxNzQwOTgxNzg0LCJleHAiOjE3NDEwNjgxODR9.i-r241KAIXCBI-nHAQbgdj06MP5KOvAqE83za3Mv1WwVd2dEUkDsP7Zg2Mo2TSA2RjiX_FzW-ckAtlPgtyHRcw
page-1fae3dbf5cba06c1.js:1 Join group response: {"memberCount":1,"groupId":"9338","status":"WAITING"}
page-751771be743a5992.js:1 Connecting to chat WebSocket at: /ws
page-751771be743a5992.js:1 STOMP debug: Opening Web Socket...
page-751771be743a5992.js:1 SockJS connection created: w {_listeners: {…}, readyState: 0, extensions: '', protocol: '', _transportsWhitelist: undefined, …}
304-f8c9c9c154d0cf87.js:1 WebSocket connection to 'wss://homerun2.vercel.app/ws/309/nkj0tkau/websocket' failed: 
t.exports @ 304-f8c9c9c154d0cf87.js:1
h @ 304-f8c9c9c154d0cf87.js:1
w._connect @ 304-f8c9c9c154d0cf87.js:1
w._receiveInfo @ 304-f8c9c9c154d0cf87.js:1
i @ 304-f8c9c9c154d0cf87.js:1
r.emit @ 304-f8c9c9c154d0cf87.js:1
(anonymous) @ 304-f8c9c9c154d0cf87.js:1
i @ 304-f8c9c9c154d0cf87.js:1
r.emit @ 304-f8c9c9c154d0cf87.js:1
(anonymous) @ 304-f8c9c9c154d0cf87.js:1
i @ 304-f8c9c9c154d0cf87.js:1
r.emit @ 304-f8c9c9c154d0cf87.js:1
xhr.onreadystatechange @ 304-f8c9c9c154d0cf87.js:1Understand this errorAI
304-f8c9c9c154d0cf87.js:1 
            
            
           POST https://homerun2.vercel.app/ws/309/hdffuom4/xhr_streaming?t=1740984149582 405 (Method Not Allowed)
h._start @ 304-f8c9c9c154d0cf87.js:1
(anonymous) @ 304-f8c9c9c154d0cf87.js:1
setTimeout
h @ 304-f8c9c9c154d0cf87.js:1
r @ 304-f8c9c9c154d0cf87.js:1
o @ 304-f8c9c9c154d0cf87.js:1
o._scheduleReceiver @ 304-f8c9c9c154d0cf87.js:1
o @ 304-f8c9c9c154d0cf87.js:1
c @ 304-f8c9c9c154d0cf87.js:1
a @ 304-f8c9c9c154d0cf87.js:1
h @ 304-f8c9c9c154d0cf87.js:1
w._connect @ 304-f8c9c9c154d0cf87.js:1
w._transportClose @ 304-f8c9c9c154d0cf87.js:1
i @ 304-f8c9c9c154d0cf87.js:1
r.emit @ 304-f8c9c9c154d0cf87.js:1
ws.onerror @ 304-f8c9c9c154d0cf87.js:1Understand this errorAI
page-751771be743a5992.js:1 
            
            
           GET https://homerun2.vercel.app/api/proxy/chat/group/9338 net::ERR_ABORTED 403 (Forbidden)
(anonymous) @ page-751771be743a5992.js:1
(anonymous) @ page-751771be743a5992.js:1
oT @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
uh @ 4bd1b696-bd3e6f4c22b58cbd.js:1
u @ 4bd1b696-bd3e6f4c22b58cbd.js:1
T @ 517-e72941a1114601a7.js:1Understand this errorAI
517-e72941a1114601a7.js:1 Failed to fetch group
window.console.error @ 517-e72941a1114601a7.js:1
(anonymous) @ page-751771be743a5992.js:1
await in (anonymous)
(anonymous) @ page-751771be743a5992.js:1
oT @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o5 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
o9 @ 4bd1b696-bd3e6f4c22b58cbd.js:1
uh @ 4bd1b696-bd3e6f4c22b58cbd.js:1
u @ 4bd1b696-bd3e6f4c22b58cbd.js:1
T @ 517-e72941a1114601a7.js:1Understand this errorAI
304-f8c9c9c154d0cf87.js:1 
            
            
           GET https://homerun2.vercel.app/ws/309/om5nq31e/htmlfile?c=_jp.appbwfz 403 (Forbidden)
createIframe @ 304-f8c9c9c154d0cf87.js:1
h @ 304-f8c9c9c154d0cf87.js:1
o._scheduleReceiver @ 304-f8c9c9c154d0cf87.js:1
o @ 304-f8c9c9c154d0cf87.js:1
c @ 304-f8c9c9c154d0cf87.js:1
a @ 304-f8c9c9c154d0cf87.js:1
a @ 304-f8c9c9c154d0cf87.js:1
w._connect @ 304-f8c9c9c154d0cf87.js:1
w._transportClose @ 304-f8c9c9c154d0cf87.js:1
w._transportTimeout @ 304-f8c9c9c154d0cf87.js:1
setTimeout
w._connect @ 304-f8c9c9c154d0cf87.js:1
w._transportClose @ 304-f8c9c9c154d0cf87.js:1
i @ 304-f8c9c9c154d0cf87.js:1
r.emit @ 304-f8c9c9c154d0cf87.js:1
ws.onerror @ 304-f8c9c9c154d0cf87.js:1Understand this errorAI
challenge.v2.min.js:1 Error
304-f8c9c9c154d0cf87.js:1 
            
            
           GET https://homerun2.vercel.app/ws/iframe.html 403 (Forbidden)
createIframe @ 304-f8c9c9c154d0cf87.js:1
u @ 304-f8c9c9c154d0cf87.js:1
e @ 304-f8c9c9c154d0cf87.js:1
w._connect @ 304-f8c9c9c154d0cf87.js:1
w._transportClose @ 304-f8c9c9c154d0cf87.js:1
w._transportTimeout @ 304-f8c9c9c154d0cf87.js:1
setTimeout
w._connect @ 304-f8c9c9c154d0cf87.js:1
w._transportClose @ 304-f8c9c9c154d0cf87.js:1
i @ 304-f8c9c9c154d0cf87.js:1
r.emit @ 304-f8c9c9c154d0cf87.js:1
(anonymous) @ 304-f8c9c9c154d0cf87.js:1
i @ 304-f8c9c9c154d0cf87.js:1
r.emit @ 304-f8c9c9c154d0cf87.js:1
(anonymous) @ 304-f8c9c9c154d0cf87.js:1
i @ 304-f8c9c9c154d0cf87.js:1
r.emit @ 304-f8c9c9c154d0cf87.js:1
(anonymous) @ 304-f8c9c9c154d0cf87.js:1
i @ 304-f8c9c9c154d0cf87.js:1
r.emit @ 304-f8c9c9c154d0cf87.js:1
xhr.onreadystatechange @ 304-f8c9c9c154d0cf87.js:1Understand this errorAI
challenge.v2.min.js:1 Error
304-f8c9c9c154d0cf87.js:1 
            
            
           POST https://homerun2.vercel.app/ws/309/yeu2o2ru/xhr?t=1740984157729 403 (Forbidden)
h._start @ 304-f8c9c9c154d0cf87.js:1
(anonymous) @ 304-f8c9c9c154d0cf87.js:1
setTimeout
h @ 304-f8c9c9c154d0cf87.js:1
r @ 304-f8c9c9c154d0cf87.js:1
o @ 304-f8c9c9c154d0cf87.js:1
o._scheduleReceiver @ 304-f8c9c9c154d0cf87.js:1
o @ 304-f8c9c9c154d0cf87.js:1
c @ 304-f8c9c9c154d0cf87.js:1
a @ 304-f8c9c9c154d0cf87.js:1
c @ 304-f8c9c9c154d0cf87.js:1
w._connect @ 304-f8c9c9c154d0cf87.js:1
w._transportClose @ 304-f8c9c9c154d0cf87.js:1
i @ 304-f8c9c9c154d0cf87.js:1
r.emit @ 304-f8c9c9c154d0cf87.js:1
(anonymous) @ 304-f8c9c9c154d0cf87.js:1
l @ 304-f8c9c9c154d0cf87.js:1
(anonymous) @ 304-f8c9c9c154d0cf87.js:1
setTimeout
a.onload @ 304-f8c9c9c154d0cf87.js:1Understand this errorAI
304-f8c9c9c154d0cf87.js:1 
            
            
           GET https://homerun2.vercel.app/ws/iframe.html 403 (Forbidden)
           이런 에러가 뜨면서 안되는 경우가 많아

- 또 주의해야 할 점은 이렇게 api 호출 경로를 바꾸다 보면 Main에서 기존의 api 호출에 문제가 생길 수도 있으니 조심해줘

- '그룹 참가 중 오류가 발생했습니다' 라고 뜨면서
page-1fae3dbf5cba06c1.js:1 
            
            
           POST https://homerun2.vercel.app/api/proxy/taxi/leave 500 (Internal Server Error)
w @ page-1fae3dbf5cba06c1.js:1
uB @ 4bd1b696-bd3e6f4c22b58cbd.js:1
(anonymous) @ 4bd1b696-bd3e6f4c22b58cbd.js:1
nC @ 4bd1b696-bd3e6f4c22b58cbd.js:1
uK @ 4bd1b696-bd3e6f4c22b58cbd.js:1
sG @ 4bd1b696-bd3e6f4c22b58cbd.js:1
sY @ 4bd1b696-bd3e6f4c22b58cbd.js:1Understand this errorAI
page-1fae3dbf5cba06c1.js:1 Failed to leave previous groups, continuing anyway
w @ page-1fae3dbf5cba06c1.js:1
await in w
uB @ 4bd1b696-bd3e6f4c22b58cbd.js:1
(anonymous) @ 4bd1b696-bd3e6f4c22b58cbd.js:1
nC @ 4bd1b696-bd3e6f4c22b58cbd.js:1
uK @ 4bd1b696-bd3e6f4c22b58cbd.js:1
sG @ 4bd1b696-bd3e6f4c22b58cbd.js:1
sY @ 4bd1b696-bd3e6f4c22b58cbd.js:1Understand this warningAI
page-1fae3dbf5cba06c1.js:1 Joining taxi group with token: eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIzOTA4MjU3Nzg1Iiwibmlja25hbWUiOiLqsJXrs5HsiJgiLCJpYXQiOjE3NDA5ODE3OTQsImV4cCI6MTc0MTA2ODE5NH0.KKdd1hrwMXYVi3JxYeuVqNaH3v-iLXKOVhIQO4k4RvF0RCzcwQK_1yZAiYAyLC7NYikGtK9qJOgsySazgZhQNw
page-1fae3dbf5cba06c1.js:1 
            
            
           POST https://homerun2.vercel.app/api/proxy/taxi/join 500 (Internal Server Error)
w @ page-1fae3dbf5cba06c1.js:1
await in w
uB @ 4bd1b696-bd3e6f4c22b58cbd.js:1
(anonymous) @ 4bd1b696-bd3e6f4c22b58cbd.js:1
nC @ 4bd1b696-bd3e6f4c22b58cbd.js:1
uK @ 4bd1b696-bd3e6f4c22b58cbd.js:1
sG @ 4bd1b696-bd3e6f4c22b58cbd.js:1
sY @ 4bd1b696-bd3e6f4c22b58cbd.js:1Understand this errorAI
page-1fae3dbf5cba06c1.js:1 Join group response: {"error":"서버 요청 중 오류가 발생했습니다."}
이런거 에러 뜨는 경우도 많아

- 니가 계속 수정하면서 프록시 어쩌구 하면서 backend쪽 api주소가 바뀐건지
기존의 서버 주소로 http://3.27.108.105:8080/api/shuttle/fromMJUtoGH 이렇게 요청을 날려도 정보를 불러오지 못하고  있을 때가 있어
