# NoScroll para Safari

Filtros que tiram **Reels** do Instagram e **Shorts** do YouTube no iPhone, em dois formatos:

| Onde você usa | Ferramenta | Arquivo | Recursos |
|---|---|---|---|
| **Web app** da Tela de Início (e Safari) | Bloqueador de conteúdo (ex.: wBlock) | `filters/noscroll.txt` | Oculta Reels e Shorts. Sem exceção para o Direct |
| **Safari** | Extensão Userscripts | `scripts/*.user.js` | Tudo, incluindo o reel do Direct liberado e a tela de bloqueio |

Web apps da Tela de Início **não rodam extensões** como o Userscripts, mas **aplicam bloqueadores de
conteúdo**. Isso foi testado manualmente num iPhone com iOS 27 e wBlock.

## Web app (lista de bloqueio)

1. Instale o **wBlock** (gratuito, código aberto) e ative **todas** as extensões dele em
   **Ajustes → Apps → Safari → Extensões**.
2. No wBlock, adicione uma lista personalizada com este link:
   https://raw.githubusercontent.com/Lfreits/rest-with-spring/claude/noscroll-ios-architecture-wmog5i/noscroll-safari/filters/noscroll.txt
3. Aplique as alterações no wBlock e feche e reabra os web apps.
4. Pode remover a lista de teste (`noscroll-teste.txt`).

O que a lista faz:
- **YouTube:** oculta o botão Shorts, as prateleiras e os cards de Shorts na home, na busca e nas recomendações, e a aba Shorts dos canais. Bloqueia a abertura direta de `/shorts/`.
- **Instagram:** oculta a aba Reels, os reels do feed, do perfil e do Explorar, e **também os reels compartilhados no Direct**. Bloqueia a abertura direta de `/reel/` e `/reels/`.

Limitações da lista, que não tem lógica:
- não separa o reel do Direct;
- não tem tela de bloqueio;
- não oculta o chip "Shorts" da busca, porque isso exigiria comparar texto;
- ao navegar dentro do app, o bloqueio por endereço (`$document`) só vale quando a página carrega do zero. Nas trocas internas de tela valem as regras de ocultação.

## Safari (Userscripts)

Funcionam com a extensão gratuita **Userscripts**, da App Store.

- Sem app para assinar e sem renovação a cada 7 dias.
- Sem servidor, sem analytics, sem rastreamento. Os scripts não fazem **nenhuma** requisição de rede.
- Todo o processamento acontece no Safari do seu iPhone.

| Arquivo | Versão | O que faz |
|---|---|---|
| `scripts/instagram.user.js` | 0.1.0 | Oculta Reels. Preserva feed, Direct, perfis, publicações e busca |
| `scripts/youtube.user.js` | 0.1.0 | Remove Shorts. Preserva vídeos, busca, canais, playlists e comentários |

### Instalação (uma vez só)

1. Instale o app **Userscripts** (desenvolvedor: Justin Wasack) pela App Store e abra-o uma vez.
2. Vá em **Ajustes → Apps → Safari → Extensões → Userscripts**:
   - ative a extensão;
   - em permissões, permita **instagram.com** e **youtube.com** (ou "Outros sites: Permitir").
3. Abra no Safari cada link abaixo e instale pelo Userscripts. Toque no ícone de extensões na barra de endereço → **Userscripts** → instalar.
   - Instagram: https://raw.githubusercontent.com/Lfreits/rest-with-spring/claude/noscroll-ios-architecture-wmog5i/noscroll-safari/scripts/instagram.user.js
   - YouTube: https://raw.githubusercontent.com/Lfreits/rest-with-spring/claude/noscroll-ios-architecture-wmog5i/noscroll-safari/scripts/youtube.user.js

   Alternativa: baixe os dois arquivos e mova-os, pelo app **Arquivos**, para a pasta **Userscripts**.
4. Entre em **instagram.com** e **m.youtube.com** pelo Safari e faça login normalmente.

**Dica importante:** se os apps oficiais do Instagram e do YouTube estiverem instalados, o iOS pode
abrir os links neles em vez do Safari. Desinstalar os apps oficiais evita isso. Você também pode
manter pressionado um link e escolher abrir no Safari.

## O que é bloqueado

**Instagram**
- Aba **Reels** da navegação: some.
- `/reels/`: redireciona para o feed.
- Aba Reels de um perfil: some. Abrir `/<perfil>/reels/` volta para o perfil.
- Reels no feed, nas grades de perfil e no Explorar: somem.
- **Reel recebido no Direct:** abre normalmente, **só aquele**. Ao deslizar para o próximo, aparece a tela de bloqueio e a mídia é pausada. "Voltar" retorna ao reel liberado.
- Reel aberto por qualquer outro caminho: tela de bloqueio.
- Dentro do Direct nada é ocultado.

**YouTube**
- Botão Shorts da barra inferior, prateleiras de Shorts, cards de Shorts na home, na busca e nas recomendações, chip "Shorts" da busca e aba Shorts dos canais: somem.
- `/shorts/<id>`: tela de bloqueio, com a mídia pausada.
- `/@canal/shorts`: redireciona para `/@canal/videos`.

## Como funciona

- **Duas camadas:** CSS (rápido, aplicado antes da renderização) e JavaScript com `MutationObserver` (reforço para conteúdo carregado dinamicamente). Os testes confirmam que cada camada funciona sozinha.
- **Rotas de SPA:** a rota é verificada a cada mudança no DOM, no `popstate`, nos eventos de navegação do YouTube e a cada 500 ms (só comparação de texto, custo desprezível).
- **Sem loops:** os elementos ocultados são marcados com `data-noscroll-hidden` e o observer só reage a nós adicionados, nunca a mudanças de atributo.
- **Ocultação conservadora:** a partir de um link de Reel ou Short, o script sobe no máximo até um card conhecido (`<article>` no Instagram, `ytm-*`/`ytd-*` de vídeo no YouTube). Nunca sobe até containers genéricos.
- **Reel do Direct:** o ID do reel liberado fica no `sessionStorage` da aba e some ao fechá-la.

## Testes

### Automatizados (`npm test`, que roda `node --test`)

Os testes rodam no Chromium (Playwright) com **páginas simuladas** servidas sob os domínios reais. Nenhuma requisição sai para a internet.

| Área | Cobertura |
|---|---|
| Instagram | Reels somem no feed, na navegação, no perfil e em conteúdo carregado depois. Direct, feed, perfis e pesquisa continuam visíveis. Fluxo Direct → reel liberado → próximo bloqueado → voltar. Redirecionamentos. Pausa de mídia |
| YouTube | Shorts somem na home, busca, canal e recomendações, e em conteúdo carregado depois. Vídeos, busca, canais, playlists e comentários continuam. Bloqueio de `/shorts/`. Navegação SPA. Redirecionamento da aba do canal |
| Privacidade | Nenhuma requisição de rede gerada pelos scripts (teste em execução). Auditoria estática: sem `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `eval`, `innerHTML`, `document.cookie`, `localStorage`, captura de tela ou câmera, sem `@require`, `@connect` ou `@updateURL`, e só `@grant GM.addStyle` |

**Limite dos testes automáticos:** eles validam a **lógica** contra um HTML simulado. O HTML real do Instagram e do YouTube só pode ser validado no aparelho, pelo checklist abaixo.

### Manual, no iPhone (pendente)

Instagram:
- [ ] A aba Reels não aparece.
- [ ] O feed mostra fotos e carrosséis, e nenhum reel.
- [ ] O Direct abre, as conversas carregam e enviar mensagem funciona.
- [ ] Reel recebido no Direct abre; deslizar para o próximo mostra a tela de bloqueio.
- [ ] Perfil: publicações aparecem e a aba Reels não aparece.
- [ ] Pesquisa por usuário e por hashtag funciona.
- [ ] Explorar: sem reels.

YouTube (m.youtube.com):
- [ ] O botão Shorts não aparece na barra inferior.
- [ ] A home não tem prateleira de Shorts.
- [ ] Um vídeo normal toca, com comentários e recomendações (sem Shorts).
- [ ] A busca funciona e o chip "Shorts" não aparece.
- [ ] Canal: as abas Vídeos e Playlists funcionam, e a aba Shorts não aparece.
- [ ] Playlist toca.
- [ ] O login com a conta Google funciona no Safari.

## Limitações honestas

- **O Instagram e o YouTube mudam o HTML com frequência.** Os filtros vão precisar de ajustes de tempos em tempos. Quando algo escapar, me mande um print ou descreva a tela.
- A estrutura real das páginas não pôde ser inspecionada durante o desenvolvimento: o ambiente de desenvolvimento não tem acesso a esses sites. As primeiras versões provavelmente vão precisar de ajustes depois do checklist.
- Se o Instagram abrir um reel do Direct numa janela sobreposta **sem mudar o endereço**, a regra "só aquele reel" precisa ser revisada. Isso será verificado no checklist.
- O Safari guarda login e cookies como em qualquer site. O NoScroll não acessa nem guarda esses dados.
- Para funcionar em abas privadas, a extensão precisa estar permitida na Navegação Privada.
- Os filtros não bloqueiam anúncios nem alteram o funcionamento das plataformas. Apenas ocultam elementos na sua tela.
