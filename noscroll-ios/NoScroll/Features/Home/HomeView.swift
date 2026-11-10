import SwiftUI

struct HomeView: View {
    @Environment(Preferences.self) private var preferences
    @State private var isShowingSettings = false

    var body: some View {
        ScrollView {
            VStack(spacing: 32) {
                header

                VStack(spacing: 12) {
                    ForEach(Platform.allCases) { platform in
                        NavigationLink(value: platform) {
                            PlatformCard(
                                platform: platform,
                                isFilterEnabled: preferences.isFilterEnabled(for: platform)
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }

                Label("Sem servidores, sem analytics, sem rastreamento.", systemImage: "lock.shield")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 24)
        }
        .background(Color(.systemGroupedBackground))
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    isShowingSettings = true
                } label: {
                    Image(systemName: "gearshape")
                }
                .accessibilityLabel("Configurações")
            }
        }
        .sheet(isPresented: $isShowingSettings) {
            SettingsView()
                .environment(preferences)
        }
    }

    private var header: some View {
        VStack(spacing: 10) {
            Image(systemName: "hand.raised.slash")
                .font(.system(size: 40, weight: .semibold))
                .foregroundStyle(.tint)
            Text("NoScroll")
                .font(.largeTitle.weight(.bold))
            Text("Redes sociais sem vídeos curtos.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding(.top, 24)
    }
}

private struct PlatformCard: View {
    let platform: Platform
    let isFilterEnabled: Bool

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: platform.systemImage)
                .font(.title2)
                .frame(width: 48, height: 48)
                .background(.tint.opacity(0.12), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                .foregroundStyle(.tint)

            VStack(alignment: .leading, spacing: 4) {
                Text(platform.displayName)
                    .font(.headline)
                Text(platform.subtitle)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                FilterBadge(platform: platform, isEnabled: isFilterEnabled)
                    .padding(.top, 2)
            }

            Spacer(minLength: 0)

            Image(systemName: "chevron.right")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.tertiary)
        }
        .padding(16)
        .background(
            Color(.secondarySystemGroupedBackground),
            in: RoundedRectangle(cornerRadius: 16, style: .continuous)
        )
        .contentShape(Rectangle())
        .accessibilityElement(children: .combine)
    }
}

private struct FilterBadge: View {
    let platform: Platform
    let isEnabled: Bool

    var body: some View {
        Label(
            isEnabled ? "\(platform.blockedContentName) bloqueados" : "Filtro desligado",
            systemImage: isEnabled ? "checkmark.shield.fill" : "exclamationmark.shield"
        )
        .font(.caption.weight(.medium))
        .foregroundStyle(isEnabled ? Color.green : Color.orange)
    }
}
