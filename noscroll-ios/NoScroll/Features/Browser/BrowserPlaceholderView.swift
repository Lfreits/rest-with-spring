import SwiftUI

/// Placeholder da Fase 1. Será substituído pelo navegador (WKWebView) na Fase 2.
struct BrowserPlaceholderView: View {
    let platform: Platform

    var body: some View {
        ContentUnavailableView(
            platform.displayName,
            systemImage: platform.systemImage,
            description: Text("O navegador chega na Fase 2.")
        )
        .navigationTitle(platform.displayName)
        .navigationBarTitleDisplayMode(.inline)
    }
}
