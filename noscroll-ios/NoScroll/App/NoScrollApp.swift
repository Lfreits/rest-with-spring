import SwiftUI

@main
struct NoScrollApp: App {
    @State private var preferences = Preferences()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(preferences)
        }
    }
}
