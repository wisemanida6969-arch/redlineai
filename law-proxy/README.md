# law-proxy — 법제처 국내 IP 프록시

Railway(해외 IP)가 법제처(law.go.kr) API를 직접 못 불러서, 한국 소재 서버 하나를
두고 그 IP만 법제처에 등록하는 용도의 초소형 프록시입니다.

## 1. 서버 준비 (택 1)

한국 리전이 있고, **고정(정적) IP**를 주는 곳이면 됩니다. 추천 순서:

| 옵션 | 비용(월) | 비고 |
|---|---|---|
| **Vultr (Seoul, ICN)** ⭐ 추천 | ~$6 | 가장 간단·안정적. 신용카드 등록 필요 |
| AWS Lightsail (ap-northeast-2, Seoul) | ~$3.5~5 | 콘솔이 조금 더 복잡함 |
| Oracle Cloud Free Tier (춘천, ap-chuncheon-1) | **무료** | 가입은 신용카드 필요, ARM 무료 인스턴스 재고 부족으로 생성 실패할 때가 있음 |

가입·서버 생성(리전을 반드시 **서울/한국**으로)은 본인이 직접 하셔야 해요
(계정 생성·결제는 제가 대신 못 합니다). Ubuntu 22.04 등 기본 이미지면 충분합니다.

## 2. 서버에 배포 (SSH 접속 후)

**Node.js 방식 (가장 단순):**
```bash
# Node 20 설치 (Ubuntu 기준)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 이 폴더(law-proxy) 내용을 서버로 복사한 뒤 그 안에서:
npm install
LAW_API_OC=여기에_OC PROXY_KEY=아무_긴_랜덤문자열 PORT=8787 node server.js
```

**계속 살아있게 하려면 (pm2):**
```bash
sudo npm install -g pm2
LAW_API_OC=여기에_OC LAW_PROXY_KEY=아무_긴_랜덤문자열 pm2 start server.js --name law-proxy
pm2 save
pm2 startup   # 안내되는 명령 한 줄 실행하면 서버 재부팅 후에도 자동 시작
```

**Docker 방식 (선호 시):**
```bash
docker build -t law-proxy .
docker run -d --restart=always -p 8787:8787 \
  -e LAW_API_OC=여기에_OC \
  -e LAW_PROXY_KEY=아무_긴_랜덤문자열 \
  --name law-proxy law-proxy
```

## 3. 방화벽 / 포트 열기

VPS 콘솔(또는 `ufw`)에서 **8787 포트를 인바운드로 허용**하세요.
```bash
sudo ufw allow 8787/tcp
```

## 4. 동작 확인

```bash
curl http://<서버IP>:8787/health
# {"ok":true,"ocConfigured":true}
```

## 5. 법제처에 이 서버 IP 등록

open.law.go.kr → 마이페이지 → OPEN API 신청정보 수정 →
**서버장비의 IP주소**에 기존 Railway IP들 대신 **이 VPS의 공인 IP 하나**만 등록.

## 6. RedlineAI(Railway)에 환경변수 추가

Railway → Variables:
```
LAW_PROXY_URL=http://<서버IP>:8787
LAW_PROXY_KEY=위에서 정한 것과 똑같은 값
```
`LAW_API_OC`는 더 이상 Railway 쪽에 필요 없습니다 (OC는 이제 프록시 서버에만 있으면 됨) — 남겨둬도 무해합니다.

적용(Deploy) 후 며칠간 `getredlineai.com`에서 판례 검색 시 출처가
**"법제처 국가법령정보 판례 API"**로 바뀌는지 확인하세요.

## 참고

- HTTPS가 아니라 http로 안내했습니다. 더 안전하게 하려면 Nginx + Let's Encrypt로
  HTTPS를 씌우거나, Cloudflare Tunnel 등을 고려할 수 있지만, `LAW_PROXY_KEY`로
  이미 접근을 제한하고 있어 우선순위는 낮습니다.
- 이 서버는 API 키(OC)를 들고 있으니, 방화벽에서 **8787 포트를 RedlineAI(Railway) 쪽에서만**
  허용하도록 IP 제한을 걸면 더 안전합니다(선택 사항).
