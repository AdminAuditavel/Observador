# Plano técnico (4 semanas) — Integração METAR/NOTAM + Feed Colaborativo

Sumário
- Objetivo: integrar METAR/SPECI + NOTAMs como camada oficial, construir feed colaborativo e sincronização móvel/offline.
- Entregáveis: protótipo UI (já fornecido), API de integração, esquema de cache, regras de prioridade, checklist de testes e cronograma de 4 semanas.

Fontes de dados recomendadas
- METAR/SPECI: serviços públicos (ex.: NOAA Aviation Weather Center feeds) ou provedores comerciais com API (AVWX, CheckWX, Meteoblue, etc.). Priorizar fonte com JSON e timestamps NTP.
- NOTAMs: FAA/NAT/ANSP provider APIs ou serviços comerciais (ex.: AviationAPI), com metadados de criticidade se possível.
- Radar/tempo: integrações opcionais com providers que entreguem tiles ou GeoJSON de células (p.ex. Meteomatics, OpenWeatherMap).
- Fotos/colaboração: backend próprio (uploads para S3/compatible storage) com thumbnails e exif.

Modelo de dados (exemplos JSON)
- METAR (interno):
{
  "type":"METAR",
  "icao":"SBGR",
  "raw":"SBGR 081200Z 32008KT 9999 FEW020 23/12 Q1013",
  "parsed":{
    "wind_direction":320,
    "wind_speed_kt":8,
    "visibility_m":9999,
    "clouds":[{"type":"FEW","alt_ft":2000}],
    "temp_c":23.0,
    "dewpoint_c":12.0,
    "qnh_hpa":1013
  },
  "observed_at":"2026-01-08T12:00:00Z",
  "fetched_at":"2026-01-08T12:01:05Z",
  "source":"ICAO_XYZ",
  "trust":"official"
}
- NOTAM (interno):
{
  "id":"NOTAM-12345",
  "icao":"SBGR",
  "text":"RWY 09/27 CLOSED 1200-1600",
  "start":"2026-01-08T12:00:00Z",
  "end":"2026-01-08T16:00:00Z",
  "category":"runway",
  "criticality":"high",
  "source":"ANSP",
  "fetched_at":"..."
}

- Photo post:
{
  "id":"p_abc",
  "user_id":"u_123",
  "icao":"SBGR",
  "url":"https://.../thumb.jpg",
  "original_url":"https://.../full.jpg",
  "observed_at":"2026-01-08T12:03:00Z",
  "uploaded_at":"2026-01-08T12:04:10Z",
  "lat":-23.435,
  "lon":-46.473,
  "confidence_score":0.82,
  "verified":false
}

Regras de prioridade / mesclagem
- Prioridade 1: NOTAMs com criticality=high (ex.: runway closed) — sempre topo e alerta.
- Prioridade 2: METAR/SPECI oficiais — exibidos no card oficial; se discrepância com feed visual, mostrar banner "Conflito: verifique".
- Prioridade 3: Fotos/verificações colaborativas recentes — destacadas se >= N confirmações de usuários verificados ou confiança >= threshold (ex.: 0.75).
- Conflitos: se METAR indica visibilidade > 5000m e múltiplas fotos mostram baixa visibilidade, badge de conflito e sugerir "confirmar condição" para verificados.

APIs sugeridas (backend)
- GET /api/v1/aerodrome/{icao}/summary
  - Retorna METAR curto, NOTAMs filtrados (criticos), última foto destacada, timestamps.
- GET /api/v1/aerodrome/{icao}/feed?limit=...
  - Retorna posts visuais paginados.
- POST /api/v1/aerodrome/{icao}/post
  - Upload foto (multipart) + metadata (observed_at, lat/lon).
- GET /api/v1/metadata/providers
  - Health and last fetched timestamps for each official source.
- Webhook /pubsub para notificações de NOTAMs críticos.

Cache e sincronização (mobile + backend)
- Backend:
  - Cache curto para METAR (TTL 60–300s), NOTAMs TTL 5–15min dependendo de criticidade.
  - Use ETag/If-Modified-Since para reduzir chamadas.
  - Registrar fetch logs com timestamps e http status.
- Mobile:
  - Local store (SQLite/Realm) com última METAR e NOTAMs; validade explicita (exibir badge "pode estar desatualizado").
  - Sincronização incremental: pull on open + background refresh (interval configurável).
  - Uploads offline: fila local para retry com exponencial backoff.
  - Política: mostrar última válida, exibir "último fetch: X min atrás" e um CTA para re-atualizar.

Segurança, autenticação e verificações
- Autenticação: OAuth2 (clientes), token JWT para mobile.
- Uploads: signed URLs (S3) para evitar upload direto ao serviço principal.
- Autorização: roles (user, verified_user, admin). Ação "confirmar condição" apenas para verified_user.
- Auditoria: gravar user_id, ip, ua, timestamps para cada post e ação de confirmação.
- Proteção de dados: TLS everywhere, rate limits, WAF rules.
- Privacidade: remoção de metadados sensíveis via política (opcional para usuários).

Confiança e moderação
- Score de confiança composto por: reputação do usuário, número de confirmações, frescor da observação, consistência geográfica.
- Mecanismo de verificação: processo de verificação manual inicial (documentos/voo) + trusted-badges.
- Mecanismos anti-abuso: detecção de uploads em massa, filtros de imagens inválidas, relatório de conteúdo.

Observabilidade e métricas
- Métricas chave: latência de fetch de fontes oficiais, taxa de erro por provider, tempo desde observação até upload, número de confirmações por post.
- Logs: armazenar logs de fetch de fontes oficiais para auditoria e reprocessamento.

Testes e validação
- Integração METAR/NOTAM: validar parsing com 10 aeródromos (incluindo casos extremos: VRB winds, CAVOK, notams longos).
- UX: teste com 5 usuários (pilotos/opeadores) para validar legibilidade mobile.
- Simular conectividade intermitente e offline uploads.

Cronograma 4 semanas (MVP)
Semana 0 (setup rápido)
- Configurar repositório, CI/CD, infra básica (S3, DB RDS/managed, staging).
- Integrar 1 fonte METAR e 1 fonte NOTAM em ambiente de teste.
- Entregável: endpoint /aerodrome/{icao}/summary com METAR+NOTAM.

Semana 1
- Implementar parsing e normalização METAR/SPECI.
- Implementar cache backend e logs de fetch.
- Entregável: METAR curto exibível no card (API + mobile mock).

Semana 2
- Filtragem e exibição de NOTAMs críticos; NOTAMs de exemplo para 5 aeródromos.
- Backend de upload inicial (assinatura S3) + modelo Photo.
- Entregável: NOTAMs críticos + upload de foto funcionais no staging.

Semana 3
- Feed visual: listagem, post view, ordenação por recência.
- Implementação básica de offline upload e cache local no app.
- Regras de prioridade e banner de conflito.
- Entregável: feed funcional com offline/fallback.

Semana 4
- Confiança/verification flow (manual verificação / badges).
- Testes de integração e UX com 5 aeródromos/usuários; ajustes finais.
- Entregável: MVP pronto para piloto com 5 aeródromos + documentação de integração.

Checklist de validação (aceitação)
- METAR exibido e com timestamp correto.
- NOTAMs críticos exibidos e acionam alerta.
- Fotos podem ser enviadas offline e sincronizadas.
- Badges de verificado aplicáveis e "confirmar condição" funciona apenas para verificados.
- Logs de fetch e métricas ativos (tempo médio de fetch < 5s).

Dependências e riscos
- Dependência de qualidade dos providers METAR/NOTAM.
- Latência/limites de API podem afetar frescor.
- Questões regulatórias ao exibir NOTAMs (recomendado alinhamento com ANSP local).

Próximas etapas executáveis agora
- Escolher 5 aeródromos piloto.
- Decidir provedores METAR/NOTAM (público vs comercial).
- Escolher stack móvel (Flutter, React Native, nativo) e backend (Node/Go/Python).
- Posso gerar: (A) Esquema OpenAPI para endpoints acima; (B) Mock JSON para 5 aeródromos; (C) Protótipo visual em Figma/FIGMA spec (esboço) — diga qual deseja primeiro.
