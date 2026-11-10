import XCTest
@testable import NoScroll

@MainActor
final class PreferencesTests: XCTestCase {
    private func makeDefaults() -> UserDefaults {
        let suite = "NoScrollTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suite)!
        addTeardownBlock { defaults.removePersistentDomain(forName: suite) }
        return defaults
    }

    func testDefaultsFiltersOnAndSessionsEphemeral() {
        let prefs = Preferences(defaults: makeDefaults())

        XCTAssertTrue(prefs.isInstagramFilterEnabled)
        XCTAssertTrue(prefs.isYouTubeFilterEnabled)
        XCTAssertFalse(prefs.rememberInstagramSession)
        XCTAssertFalse(prefs.rememberYouTubeSession)
    }

    func testChangesPersistAcrossInstances() {
        let defaults = makeDefaults()
        let first = Preferences(defaults: defaults)
        first.isInstagramFilterEnabled = false
        first.rememberYouTubeSession = true

        let second = Preferences(defaults: defaults)
        XCTAssertFalse(second.isInstagramFilterEnabled)
        XCTAssertTrue(second.isYouTubeFilterEnabled)
        XCTAssertTrue(second.rememberYouTubeSession)
        XCTAssertFalse(second.rememberInstagramSession)
    }

    func testPerPlatformAccessorsMatchProperties() {
        let prefs = Preferences(defaults: makeDefaults())
        prefs.isYouTubeFilterEnabled = false
        prefs.rememberInstagramSession = true

        XCTAssertTrue(prefs.isFilterEnabled(for: .instagram))
        XCTAssertFalse(prefs.isFilterEnabled(for: .youtube))
        XCTAssertTrue(prefs.remembersSession(for: .instagram))
        XCTAssertFalse(prefs.remembersSession(for: .youtube))
    }
}
