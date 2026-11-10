# NoScroll (iOS)

Cliente independente de Instagram e YouTube (versões web oficiais, via WKWebView) sem Reels e sem Shorts.
Sem backend, sem analytics, sem rastreamento. Todos os filtros rodam no iPhone.

> Status: **pausado.** O caminho escolhido foi o Safari com a extensão Userscripts (ver `../noscroll-safari/`),
> que não exige assinatura nem renovação a cada 7 dias. Este projeto fica guardado para o caso de você
> mudar de ideia (conta paga de desenvolvedor ou SideStore). A Fase 1 nunca foi compilada: o CI do
> GitHub Actions recusou o job antes de iniciar (provável problema de conta ou cobrança, não de código).

## Decisões aprovadas

| Tema | Decisão |
|---|---|
| iOS mínimo | 17.0 (testado no CI com o simulador disponível; seu aparelho roda iOS 27) |
| Sessão | Efêmera por padrão (`nonPersistent`). Opção "Lembrar sessão" por plataforma (`WKWebsiteDataStore(forIdentifier:)`) |
| YouTube | Tentar o login. Se o Google bloquear o WebView, usar deslogado |
| Shorts | Bloqueados sempre |
| Reels | Reel aberto a partir do Direct é liberado, sem rolagem para o próximo, **se for tecnicamente separável**. Caso contrário, bloqueia tudo |
| Distribuição | Uso pessoal. Fora da App Store |

## Estrutura

```
noscroll-ios/
  project.yml              Especificação do projeto (XcodeGen). O .xcodeproj é gerado, não versionado
  NoScroll/
    App/                   Entrada do app e navegação raiz
    Core/                  Platform (fonte única de verdade), Preferences, AppInfo
    Features/Home/         Tela inicial
    Features/Settings/     Configurações
    Features/Browser/      WebView (placeholder na Fase 1)
  NoScrollTests/           XCTest
```

## Como é compilado (sem Mac)

O workflow `.github/workflows/noscroll-ios.yml` roda num runner macOS do GitHub Actions:

1. `xcodegen generate` cria o `NoScroll.xcodeproj`;
2. `xcodebuild test` roda os testes unitários num simulador de iPhone;
3. `xcodebuild build` gera o app para iPhone **sem assinatura**;
4. o `.app` é empacotado em `NoScroll-unsigned.ipa` e publicado como artefato da execução.

Para baixar: aba **Actions** do repositório → execução "NoScroll iOS" → seção **Artifacts**.

## Instalação no iPhone

O iOS só instala apps assinados. Para uso pessoal, sem pagar nada, a assinatura é feita com um
**Apple ID gratuito** por uma ferramenta de sideload num computador Windows ou Mac (por exemplo,
Sideloadly ou AltStore):

- a assinatura gratuita vale **7 dias** e depois precisa ser refeita;
- é preciso ativar o **Modo de Desenvolvedor** no iPhone (Ajustes → Privacidade e Segurança);
- recomenda-se usar um Apple ID secundário, porque a ferramenta de terceiros recebe as credenciais.

Guia detalhado: Fase 6.
