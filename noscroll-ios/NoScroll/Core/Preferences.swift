import Foundation
import Observation

/// Preferências do usuário. É o ÚNICO dado que o NoScroll grava por conta própria
/// (UserDefaults, local, apenas valores booleanos).
@MainActor
@Observable
final class Preferences {
    enum Key {
        static let instagramFilter = "filter.instagram.enabled"
        static let youtubeFilter = "filter.youtube.enabled"
        static let rememberInstagramSession = "session.instagram.remember"
        static let rememberYouTubeSession = "session.youtube.remember"
    }

    @ObservationIgnored private let defaults: UserDefaults

    var isInstagramFilterEnabled: Bool {
        didSet { defaults.set(isInstagramFilterEnabled, forKey: Key.instagramFilter) }
    }

    var isYouTubeFilterEnabled: Bool {
        didSet { defaults.set(isYouTubeFilterEnabled, forKey: Key.youtubeFilter) }
    }

    /// Desligado (padrão): sessão só em memória (WKWebsiteDataStore.nonPersistent()).
    /// Ligado: sessão salva no aparelho, isolada por plataforma (WKWebsiteDataStore(forIdentifier:)).
    var rememberInstagramSession: Bool {
        didSet { defaults.set(rememberInstagramSession, forKey: Key.rememberInstagramSession) }
    }

    var rememberYouTubeSession: Bool {
        didSet { defaults.set(rememberYouTubeSession, forKey: Key.rememberYouTubeSession) }
    }

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        isInstagramFilterEnabled = defaults.object(forKey: Key.instagramFilter) as? Bool ?? true
        isYouTubeFilterEnabled = defaults.object(forKey: Key.youtubeFilter) as? Bool ?? true
        rememberInstagramSession = defaults.object(forKey: Key.rememberInstagramSession) as? Bool ?? false
        rememberYouTubeSession = defaults.object(forKey: Key.rememberYouTubeSession) as? Bool ?? false
    }

    func isFilterEnabled(for platform: Platform) -> Bool {
        switch platform {
        case .instagram: isInstagramFilterEnabled
        case .youtube: isYouTubeFilterEnabled
        }
    }

    func remembersSession(for platform: Platform) -> Bool {
        switch platform {
        case .instagram: rememberInstagramSession
        case .youtube: rememberYouTubeSession
        }
    }
}
