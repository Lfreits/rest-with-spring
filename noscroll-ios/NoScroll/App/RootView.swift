import SwiftUI

struct RootView: View {
    var body: some View {
        NavigationStack {
            HomeView()
                .navigationDestination(for: Platform.self) { platform in
                    BrowserPlaceholderView(platform: platform)
                }
        }
    }
}

#Preview {
    RootView()
        .environment(Preferences(defaults: UserDefaults(suiteName: "preview")!))
}
