# Checklist MVP Observer — Estado atualizado

Legenda:  
✅ Concluído — pronto e testado  
🔄 Em andamento — parcialmente pronto / precisa refinamento  
⏳ Pendente — não iniciado  
❌ Não aplicável

> Contexto geral: projeto principal é Web (React/Vite). Decidimos empacotar o Web como app nativo com Capacitor (não reescrever em React Native). Esta checklist agrega status atual, comentários e próximos passos.

---

## 1) Schema & Dados
- **Definição de tabelas principais (posts, post_media, post_reports)**  
  - Status: ✅ Concluído  
  - Comentário: Esquema básico definido e documentado; revisar índices adicionais conforme necessidade.
- **Tabela `airports` e ingestão de dados (ANAC / OurAirports)**  
  - Status: 🔄 Em andamento  
  - Comentário: Planejamento ETL (staging → dedupe → upsert) definido; dataset ~70k disponível. Implementação do pipeline pendente.

---

## 2) Auth / Invite / Accounts
- **Fluxo invite / single‑use token / aceitação de convite**  
  - Status: ✅ Concluído  
- **Armazenamento seguro de token_hash / service_role_key**  
  - Status: ✅ Práticas definidas (service_role_key server‑only).  

---

## 3) Posts & Media
- **posts (criar/editar/remover)**  
  - Status: ✅ Concluído — RLS e políticas definidas.
- **post_media (upload, path, thumbnails)**  
  - Status: ✅ Parcial  
  - Comentário: Upload Web já implementado; thumbnails/processing pendente.
- **post_reports / moderation actions**  
  - Status: 🔄 Em andamento — modelo pronto; UI/queue de moderação pendentes.

---

## 4) Storage / EXIF / Privacy (LGPD)
- **Bucket `post-media` e política de acesso**  
  - Status: 🔄 Parcial  
  - Comentário: Atualmente público no Web; planejar migração para bucket privado + signed URLs.
- **EXIF stripping (privacy)**  
  - Status: ⏳ Pendente — recomendado server‑side (sharp) ou client‑side se necessário.
- **Thumbnails & media processing (async job)**  
  - Status: ⏳ Pendente

---

## 5) Mobile integration (supabase-js for auth & upload)
> Observação: Implementado para Web; a estratégia escolhida é empacotar o Web com Capacitor.

- Instalação `@supabase/supabase-js` (Web) — ✅ (src/lib/supabaseClient.ts)  
- Polyfills React Native — ❌ Não aplicável (somente se for RN)  
- Env Vars (SUPABASE_URL / ANON_KEY) — ✅ (.env, Vite)  
- Módulo cliente centralizado — ✅ (src/lib/supabaseClient.ts)  
- Fluxos Auth (Sign In/Up) — ✅ (Web)  
- Persistência de sessão — ✅ (SDK Web / LocalStorage)  
- Seleção de imagens (nativo) — ❌ Web usa `<input type="file">`; Capacitor + Camera plugin necessário  
- Upload autenticado — ✅ (Web)  
- Validação tipos/tamanhos — 🔄 Básica no Web, precisa aprimorar  
- Remoção de EXIF — ⏳ Pendente  
- URL assinada / curta — ✅ atualmente usa `getPublicUrl()` (bucket público) — adaptar se privatizar bucket  
- Integração Auth + Upload — ✅ (post inclui path)  
- Fila Offline/Sincronização — ⏳ Pendente  
- UX: botão enviar desabilitado — ✅ (Web)  
- Tratamento de Erros �� ✅ (Web)  
- Bucket Privado/Segurança — 🔄 Parcial — precisa migrar para privado

- **Capacitor (empacotar Web como app nativo)**  
  - Status: 🔄 Em andamento (decisão tomada).  
  - Próximo passo: `npx cap init`, adicionar plataformas, instalar plugins (Camera/Filesystem/Storage), ajustar `capacitor.config.json` e permissões nativas.

---

## 6) Offline / Sync
- **Fila local de posts pendentes / retry** — ⏳ Pendente  
- **Cache local de aeroportos / sync incremental** — ⏳ Pendente

---

## 7) Moderation, audit_logs & compliance
- **post_reports + moderation queue** — 🔄 Em andamento  
- **audit_logs append-only** — ⏳ Pendente

---

## 8) Jobs / Background tasks
- **METAR/NOTAM fetcher (agendado)** — ⏳ Pendente  
- **Media processing (thumbnails, EXIF removal)** — ⏳ Pendente  
- **Airports ETL job (staging → dedupe → upsert)** — ⏳ Pendente

---

## 9) CI Workflows + Deploy Scripts
- **CI (PR checks: lint, typecheck, tests, build)** — ⏳ Pendente (templates prontos)  
- **Deploy (main): build production + deploy to Vercel (or action)** — ⏳ Pendente  
- **Migrations via CI (safe runner)** — ⏳ Pendente  
- **Android build (Capacitor) workflow** — ⏳ Pendente  
- **README badges / branch protection / docs for secrets** — ⏳ Pendente

---

## 10) Observability & Monitoring
- **Sentry integration / structured logs / metrics / alerts** — ⏳ Pendente

---

## 11) Security & Secrets
- **Service role key (server only)** — ✅ Prática definida  
- **DATABASE_URL (CI secret)** — 🔄 Parcial — instruções dadas; secret a adicionar no repo  
- **Bucket privacy & signed URLs** — 🔄 Plano definido; migração pendente

---

## 12) Docs, Tests, QA
- **README / CONTRIBUTING / Runbook CI & deploy** — ⏳ Pendente (templates sugeridos)  
- **Unit / Integration / E2E tests** — 🔄 Parcial (alguns unit tests; E2E pendente)  
- **QA checklist** — ⏳ Pendente (testes enumerados; execução pendente)

---

## 13) UX / Accessibility
- **Microcopy & confirm/undo flows** — 🔄 Parcial (Web)  
- **Accessibility baseline** — ⏳ Pendente

---

# Próximos passos recomendados (prioridade alta)
1. Inicializar Capacitor e adicionar plataformas (android/ios).  
2. Tornar bucket `post-media` privado e adaptar front/server para signed URLs.  
3. Implementar EXIF stripping server‑side e pipeline de thumbnails (job asíncrono).  
4. Gerar e aplicar workflows CI (PR checks + deploy). Posso gerar os YAMLs.  
5. Implementar fila offline + sync no app (IndexedDB / Capacitor Storage).  
6. Implementar migrations runner (supabase CLI ou psql scripts) e adicionar `DATABASE_URL` secret no GitHub.

---

# Artefatos / ações que posso gerar agora
Escolha a(s) opção(ões) que quer que eu gere em seguida:
1. Gerar `.github/workflows/ci.yml` e `deploy.yml` prontos.  
2. Gerar `capacitor.config.json` + instruções passo‑a‑passo e snippet Camera → upload → supabase.  
3. Gerar script/migration ETL para airports (staging → dedupe → upsert).  
4. Gerar Edge Function template para assinar URLs / criar posts (server‑side trusted ops).  
5. Recriar este checklist como arquivo no repo (este arquivo) e abrir PR com os artefatos escolhidos.

---

# Como usar este arquivo
- Salve como `CHECKLIST_MVP_OBSERVER.md` na raiz do repositório.  
- Atualize os status conforme o progresso e use as opções finais para pedir artefatos automatizados.  
- Se quiser, eu gero os arquivos selecionados e um PR com mudanças iniciais.

---  
Última atualização: 2026-01-15  
Contato: AdminAuditavel (solicite geração de arquivos via opção 1–5)
