import SwiftUI

struct SettingsView: View {
    @Environment(Preferences.self) private var preferences
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        @Bindable var preferences = preferences

        NavigationStack {
            Form {
                Section {
                    Toggle("Bloquear Reels no Instagram", isOn: $preferences.isInstagramFilterEnabled)
                    Toggle("Bloquear Shorts no YouTube", isOn: $preferences.isYouTubeFilterEnabled)
                } header: {
                    Text("Filtros")
                } footer: {
                    Text("Os filtros rodam apenas neste iPhone.")
                }

                Section {
                    Toggle("Lembrar sessão do Instagram", isOn: $preferences.rememberInstagramSession)
                    Toggle("Lembrar sessão do YouTube", isOn: $preferences.rememberYouTubeSession)
                } header: {
                    Text("Sessões")
                } footer: {
                    Text("Desligado: o login fica só na memória e é apagado quando o app fecha. Ligado: o login fica salvo neste iPhone, separado por plataforma, e pode ser apagado a qualquer momento.")
                }

                Section("Sobre") {
                    LabeledContent("Versão do app", value: AppInfo.version)
                    ForEach(Platform.allCases) { platform in
                        LabeledContent(
                            "Filtro \(platform.displayName)",
                            value: platform.filterVersion ?? "Em desenvolvimento"
                        )
                    }
                }
            }
            .navigationTitle("Configurações")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("OK") { dismiss() }
                }
            }
        }
    }
}
