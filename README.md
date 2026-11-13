# Cobrinha Arena

Jogo clássico da Cobrinha (Snake) desenvolvido com **HTML5 Canvas**, **CSS3 moderno** e **JavaScript puro (Vanilla JS)**, pronto para ser versionado no GitHub e publicado diretamente na Vercel sem necessidade de ferramentas de build ou dependências externas.

Criado por **[Seu nome]**

---

## Recursos do Jogo

- **6 níveis com dificuldade progressiva**:
  1. **Campo Aberto** — Grade `20×20`, velocidade inicial moderada, sem obstáculos (Meta: `50 pts`)
  2. **Pilares Simétricos** — Grade `20×20`, mais velocidade e 4 pilares internos (Meta: `120 pts`)
  3. **Cruz Aberta** — Grade `18×18`, corredores estreitos e velocidade maior (Meta: `200 pts`)
  4. **Fortaleza em L** — Grade `18×18`, cantoneiras internas e núcleo central (Meta: `300 pts`)
  5. **Corredor Estreito** — Grade `16×16`, espaço compacto e barreiras paralelas (Meta: `420 pts`)
  6. **Arena Mestra** — Grade `16×16`, modo infinito com aceleração gradual para disputa de recordes
- **Identificação do jogador**: campo obrigatório de nome antes de iniciar a partida.
- **Ranking persistente no navegador**: registra pontuação, nível alcançado e nome do jogador no `localStorage`, mantendo o Top 10 ordenado mesmo após recarregar a página.
- **Controles completos**:
  - **Desktop**: teclas de seta (`↑`, `↓`, `←`, `→`) ou `WASD`, além de `Espaço` / `P` para pausar e `Enter` para avançar de nível.
  - **Dispositivos móveis**: gestos de deslize (*swipe*) diretamente no tabuleiro ou botões direcionais na tela.
- **Áudio integrado sem arquivos externos**: efeitos sonoros sintetizados via *Web Audio API* com botão para ligar/desligar.

---

## Estrutura do Projeto

```text
.
├── index.html      # Estrutura semântica e telas de estado do jogo
├── style.css       # Estilização responsiva, paleta e tipografia
├── script.js       # Engine do jogo, níveis, controles e ranking
├── .gitignore      # Arquivos ignorados pelo Git
└── README.md       # Documentação do projeto
```

---

## Como Personalizar os Créditos

Antes de publicar, substitua o texto `[Seu nome]` pelo seu nome real nos seguintes pontos:

1. No arquivo `index.html` (na tela inicial e no rodapé `<footer>`).
2. Neste arquivo `README.md`.

---

## Como Executar Localmente

Como `script.js` utiliza módulo ES (`type="module"`), execute através de um servidor HTTP local simples:

### Opção 1 — Extensão Live Server (VS Code)
1. Abra a pasta do projeto no VS Code.
2. Clique com o botão direito em `index.html` e selecione **Open with Live Server**.

### Opção 2 — Python (já instalado na maioria dos sistemas)
```bash
python3 -m http.server 8080
```
Depois acesse `http://localhost:8080` no navegador.

### Opção 3 — Node.js (`npx serve`)
```bash
npx serve .
```

---

## Como Versionar no GitHub e Publicar na Vercel

### 1. Subir para o GitHub
```bash
git init
git add index.html style.css script.js README.md .gitignore
git commit -m "Versão inicial do jogo Cobrinha Arena"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/cobrinha-arena.git
git push -u origin main
```

### 2. Publicar na Vercel
1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta do GitHub.
2. Clique em **Add New... → Project** e importe o repositório `cobrinha-arena`.
3. Em **Framework Preset**, mantenha **Other** (sem comando de build, com diretório raiz `.`).
4. Clique em **Deploy**. Em poucos segundos o jogo estará no ar com HTTPS automático.

---

## Créditos

Desenvolvido por **[Seu nome]**.
