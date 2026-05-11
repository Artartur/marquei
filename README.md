# Marquei

Sistema de agendamento para salões e clínicas com três perfis de acesso: **Gestor**, **Profissional** e **Cliente**.

---

## Stack

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Frontend | Angular 21 + SSR | Framework opinativo com injeção de dependência nativa, roteamento robusto e suporte a SSR sem configuração extra — adequado para um produto que pode precisar de SEO no futuro |
| Estilos | Tailwind CSS v4 | Utility-first sem CSS customizado; v4 tem melhor performance de build e sintaxe de tema via CSS nativo |
| Reatividade | RxJS + Angular Signals | Signals para estado global simples (auth), RxJS para streams de dados e filtros reativos nas listas |
| HTTP | Angular HttpClient + Interceptor | Refresh automático de token transparente para o restante da aplicação |
| Backend | NestJS + Supabase + Prisma | Repositório separado |

---

## Como rodar localmente

### Pré-requisitos

- Node.js 20+
- npm 11+
- Backend do Marquei rodando https://marquei-backend.onrender.com/

### 1. Clone e instale as dependências

```bash
git clone <url-do-repositorio>
cd marquei
npm install
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` com a URL da API:

```
API_URL=http://localhost:3000
```

### 3. Inicie o servidor de desenvolvimento

```bash
npm start
```

O app estará disponível em `http://localhost:4200`.

### 4. (Opcional) Build com SSR

```bash
npm run build
node dist/marquei/server/server.mjs
```

A variável `API_URL` é lida em tempo de execução pelo servidor SSR — não precisa rebuildar para trocar o endpoint.

---

## Variáveis de ambiente

| Variável | Descrição | Padrão |
|---|---|---|
| `API_URL` | URL base da API NestJS | `https://marquei-backend.onrender.com` |

---

## Credenciais de teste

Crie os usuários via `/register` ou pelo seed do backend. Um por perfil:

| Perfil | E-mail | Senha |
|---|---|---|
| Gestor | `gestor@marquei.com` | `senha123` |
| Profissional | `profissional@marquei.com` | `senha123` |
| Cliente | `cliente@marquei.com` | `senha123` |

> O login redireciona automaticamente para a área correta conforme o perfil do usuário.

---

## Decisões de arquitetura

**Roteamento e isolamento por perfil.** Cada perfil (MANAGER, PROFESSIONAL, CLIENT) carrega um módulo lazy-loaded próprio, protegido por dois guards em sequência: `authGuard` verifica a sessão ativa e `roleGuard` valida o papel antes de renderizar qualquer rota. Isso evita que componentes de um perfil sejam carregados no bundle de outro e torna simples adicionar novos perfis no futuro.

**Autenticação stateless com refresh transparente.** O `accessToken` vive apenas em memória (Angular Signal), nunca em `localStorage`. O `refreshToken` é um cookie HttpOnly gerenciado pelo backend. O interceptor de HTTP captura respostas 401, solicita um novo token em `/auth/refresh` e reexecuta a requisição original — tudo invisível para os serviços e componentes. Na inicialização do app, `initSession()` tenta restaurar a sessão via refresh antes de renderizar qualquer rota protegida.

---

## O que ficou de fora

- **Testes automatizados** — nenhum teste unitário ou e2e foi escrito; o foco foi na entrega das funcionalidades.
- **Responsividade mobile** — a sidebar some em telas menores (`hidden lg:flex`) mas não há navegação alternativa para mobile.
- **Paginação nas listas** — clientes, profissionais e agendamentos carregam todos os registros de uma vez.
- **Notificações em tempo real** — o status dos agendamentos é atualizado por polling manual; WebSockets ou SSE dariam uma UX melhor.
- **i18n** — locale fixado em `pt-BR`; internacionalização não foi considerada.

**Com mais tempo:**
separaria a sidebar inline do `dashboard.component.html` no mesmo componente reutilizável que os outros módulos já usam, eliminando a duplicação de código que causou o bug do link de Importação; adicionaria testes de integração nas rotas críticas (login, agendamento, importação); e implementaria paginação server-side nas listagens.
