import Foundation

/// Fonte única de verdade sobre cada plataforma suportada.
/// Adicionar ou ajustar uma plataforma deve exigir mudanças apenas aqui
/// (mais os arquivos de filtro correspondentes).
enum Platform: String, CaseIterable, Identifiable, Hashable, Sendable {
    case instagram
    case youtube

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .instagram: "Instagram"
        case .youtube: "YouTube"
        }
    }

    var subtitle: String {
        switch self {
        case .instagram: "Feed, Direct e perfis"
        case .youtube: "Vídeos, canais e playlists"
        }
    }

    /// Ícone genérico do SF Symbols (sem logos oficiais das marcas).
    var systemImage: String {
        switch self {
        case .instagram: "camera"
        case .youtube: "play.rectangle"
        }
    }

    /// Nome do conteúdo de vídeo curto que o filtro bloqueia.
    var blockedContentName: String {
        switch self {
        case .instagram: "Reels"
        case .youtube: "Shorts"
        }
    }

    var startURL: URL {
        switch self {
        case .instagram: URL(string: "https://www.instagram.com/")!
        case .youtube: URL(string: "https://m.youtube.com/")!
        }
    }

    /// Domínios-raiz permitidos (subdomínios incluídos).
    /// Lista inicial; será refinada empiricamente na Fase 2.
    var allowedRootDomains: Set<String> {
        switch self {
        case .instagram:
            ["instagram.com", "cdninstagram.com", "fbcdn.net", "facebook.com"]
        case .youtube:
            ["youtube.com", "ytimg.com", "googlevideo.com", "google.com", "gstatic.com", "ggpht.com"]
        }
    }

    /// Versão do filtro JavaScript. Os filtros chegam nas Fases 3 e 4.
    var filterVersion: String? {
        nil
    }
}
