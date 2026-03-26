# OmniForge RPG

Gerador de campanhas de RPG com Inteligência Artificial.

---

## URLs de acesso

| Ambiente | URL |
|---|---|
| GitHub Pages (direto) | `https://fsalamoni.github.io/omniforge/` |
| Domínio customizado | `https://www.protagonistarpg.com.br/omniforge/` |

---

## Pré-requisitos

- Conta no [Firebase](https://console.firebase.google.com/)
- Repositório no GitHub com **GitHub Pages** ativado
- Domínio `protagonistarpg.com.br` gerenciado no [Cloudflare](https://dash.cloudflare.com/)

---

## 1 — GitHub: configurar segredos e GitHub Pages

### 1.1 Adicionar segredos do Firebase

1. Acesse: **Settings → Secrets and variables → Actions → New repository secret**
2. Crie um segredo para cada variável abaixo (valores obtidos no Firebase Console):

| Nome do segredo | Onde encontrar no Firebase |
|---|---|
| `VITE_FIREBASE_API_KEY` | Project Settings → General → apiKey |
| `VITE_FIREBASE_AUTH_DOMAIN` | Project Settings → General → authDomain |
| `VITE_FIREBASE_PROJECT_ID` | Project Settings → General → projectId |
| `VITE_FIREBASE_STORAGE_BUCKET` | Project Settings → General → storageBucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Project Settings → General → messagingSenderId |
| `VITE_FIREBASE_APP_ID` | Project Settings → General → appId |

### 1.2 Ativar o GitHub Pages

1. Acesse: **Settings → Pages**
2. Em **Source**, selecione: **Deploy from a branch**
3. Em **Branch**, selecione: `gh-pages` / `/ (root)`
4. Clique em **Save**

> O workflow em `.github/workflows/deploy.yml` faz o build e publica automaticamente no branch `gh-pages` a cada push em `main` ou `master`.

Após o primeiro deploy, o site estará disponível em:
`https://fsalamoni.github.io/omniforge/`

---

## 2 — Firebase: adicionar domínios autorizados

Para que o login com Google funcione tanto no domínio do GitHub Pages quanto no domínio customizado, você precisa autorizar os dois domínios no Firebase.

1. Acesse: [Firebase Console](https://console.firebase.google.com/) → seu projeto
2. Vá em: **Authentication → Settings → Authorized domains**
3. Clique em **Add domain** e adicione **cada um** dos domínios abaixo:
   - `fsalamoni.github.io`
   - `www.protagonistarpg.com.br`

---

## 3 — Cloudflare: criar o Worker de proxy

O Worker redireciona internamente as requisições de `www.protagonistarpg.com.br/omniforge/*` para o GitHub Pages, mantendo a URL original visível ao usuário.

### 3.1 Criar o Worker

1. Acesse: [Cloudflare Dashboard](https://dash.cloudflare.com/) → sua conta
2. No menu lateral, clique em **Workers & Pages**
3. Clique em **Create** → **Create Worker**
4. Dê um nome ao Worker, por exemplo: `omniforge-proxy`
5. Na janela do editor, **apague todo o código padrão**
6. **Cole o conteúdo do arquivo `cloudflare-worker.js`** (na raiz deste repositório)
7. Clique em **Save and Deploy**

### 3.2 Adicionar a rota do Worker

Após publicar o Worker, você precisa vinculá-lo ao seu domínio:

1. Ainda no Cloudflare Dashboard, acesse: **Workers & Pages → seu worker (omniforge-proxy)**
2. Clique na aba **Settings → Triggers → Add route**
3. Preencha:
   - **Route**: `www.protagonistarpg.com.br/omniforge*`
   - **Zone**: `protagonistarpg.com.br`
4. Clique em **Add route**

> **Importante:** o padrão `omniforge*` (sem barra após) cobre tanto `/omniforge` quanto `/omniforge/` e todos os sub-caminhos.

### 3.3 Verificar o DNS do www

Certifique-se de que existe um registro DNS para `www` no Cloudflare apontando para algum destino. O Worker intercepta a requisição antes de chegar ao servidor real, mas **o registro DNS precisa existir** com o proxy do Cloudflare (nuvem laranja ☁️) ativado.

Passos:
1. Acesse: **protagonistarpg.com.br → DNS → Records**
2. Verifique se existe um registro `A` ou `CNAME` para `www`
3. Se não existir, clique em **Add record**:
   - **Type**: `A`
   - **Name**: `www`
   - **IPv4 address**: `192.0.2.1`
   - **Proxy status**: ☁️ Proxied (nuvem laranja — obrigatório)
4. Clique em **Save**

---

## 4 — Verificação final

Após concluir todos os passos acima:

1. Faça um push para `main` e aguarde o workflow do GitHub Actions terminar (cerca de 2 minutos)
2. Acesse `https://fsalamoni.github.io/omniforge/` e confirme que o site carrega
3. Acesse `https://www.protagonistarpg.com.br/omniforge/` e confirme que o site carrega com a URL do seu domínio
4. Teste o login com Google nas duas URLs

---

## Desenvolvimento local

```bash
# Instalar dependências
npm install

# Criar arquivo de variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do Firebase

# Iniciar servidor de desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview
```

---

## Estrutura do projeto

```
OmniForge-rpg/
├── .github/workflows/deploy.yml   # CI/CD para GitHub Pages
├── cloudflare-worker.js           # Worker de proxy para o Cloudflare
├── public/
│   ├── 404.html                   # Fallback SPA para GitHub Pages
│   └── manifest.json              # PWA manifest
├── src/
│   ├── firebase/                  # Configuração do Firebase
│   ├── lib/                       # Utilitários e lógica de negócio
│   ├── pages/                     # Páginas da aplicação
│   └── components/                # Componentes React
└── vite.config.js                 # Configuração do Vite (base: /omniforge/)
```
