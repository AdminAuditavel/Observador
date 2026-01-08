# Protótipo UI (mobile‑first) — App de Consciência Situacional Aeronáutica

Visão geral
- Tela principal por aeródromo (mobile single-column).
- Três blocos empilhados: Resumo oficial, Feed visual, Linha do tempo compacta.
- Cores semânticas: verde (normal), amarelo (atenção), vermelho (crítico).
- Selo de origem: [Oficial] ou [Colaborativo] em todos os blocos relevantes.

Tela: Aeródromo — topo
- Header: nome do aeródromo + ICAO/IATA, distância (se ativo) e ícone de favorito.
- Botão de ação rápida: "Ver mapa / rota".
- Último fetch: timestamp (ex.: "Atualizado: 12:05 UTC").

Bloco 1 — Resumo oficial (card fixo)
- METAR/SPECI curto (linha única): vento, visibilidade, teto, temperatura/dewpoint, QNH.
- Ícones rápidos: vento (seta + speed), visibilidade (km/m), pista (condição).
- NOTAM críticos listados abaixo do METAR (máx 3), cada um com:
  - Título resumido, período, selo origem (ICAO/autoridade) e cor por criticidade.
  - Ação rápida: "Marcar como lido", "Detalhar".
- Selo grande: "Oficial" no canto superior do card.
- Tap no METAR abre modal com METAR completo + TAF (se disponível) + link "Fonte".

Bloco 2 — Feed visual (scroll vertical)
- Fotos e vídeos curtos (thumb + meta):
  - Selo de recência (ex.: "há 2 min"), avatar do colaborador, indicador de confiança (dentro do avatar ou badge: verificado).
  - Distância/azimute estimado (se geotag disponível).
  - Botões: "Confirmar condição" (usuários verificados), "Curtir", "Reportar".
- Ordenação padrão: recência. Filtro: "Ver apenas verificados / por distância / por pista".
- Ao abrir um post: foto em tela cheia, EXIF básico, hora da observação, opção de comentar, opção de marcar como "observação confirmada".

Bloco 3 — Linha do tempo compacta
- Evento cronológico: METAR updates, NOTAM publish/expire, posts visuais.
- Pequenos ícones por tipo (oficial vs colaborativo).
- Permite scrubbing horizontal para ver histórico do dia.

Cartões rápidos para NOTAMs importantes
- NOTAMs com ação única: botão "Marcar como lido" (persistente por usuário) e "Confirmar condição" (apenas para usuários verificados).
- NOTAMs com alto impacto (pista fechada) aparecem no topo do feed com fundo em vermelho e modal obrigatório para ler detalhes.

Mapa / Radar
- Botão "Ver no mapa": abre mapa com:
  - Localização do aeródromo, posts geolocalizados (cluster por zoom).
  - Overlay de radar/tempo se integrado (celulas convectivas, relâmpago).
  - Trajetória aproximada / azimute dos posts para referência.

Fluxos essenciais
- Ao abrir aeródromo: fetch METAR+NOTAMs -> renderizar Resumo oficial -> verificar cache -> carregar feed visual.
- Ao postar foto: opcional geotag, auto‑preenchimento de aeródromo por proximidade, upload background com compressão, badge de "pendente" se offline.

Acessibilidade e microinterações
- Textos com contraste alto, opção de tamanho de fonte.
- Feedback claro para ações (snackbars) e confirmação antes de publicar.
- Disclaimer persistente visível no rodapé: "Conteúdo colaborativo é suplementar. Consulte fontes oficiais."

Componentes visuais (sugestão)
- Badges: Oficial (azul escuro), Colaborativo (cinza), Verificado (verde com check).
- Ícones: vento, pista, visibilidade, relâmpago, câmera, mapa.
- Layout tile/card com bordas suaves e sombra leve.

Observações UX para MVP
- Priorizar clareza entre oficial e colaborativo.
- Evitar over-notification: NOTAMs críticos geram alerta único por sessão.
- Perfis verificados: exibir selo e histórico de confirmações.

Wireframes textuais (sequência)
1) Home Aeródromo: Header -> Resumo Oficial card -> Feed Visual (primeiro post em destaque) -> Linha do tempo compacta (mini).
2) Post view: imagem grande -> metadata (hora, autor, distância, geolocalização) -> ações (confirmar/reportar).
3) METAR modal: METAR bruto + interpretação simples + TAF.
4) NOTAM detail: texto completo + período + ação "Marcar como lido".
