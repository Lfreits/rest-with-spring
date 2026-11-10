import XCTest
@testable import NoScroll

final class PlatformTests: XCTestCase {
    func testStartURLsAreHTTPSAndInsideAllowedDomains() throws {
        for platform in Platform.allCases {
            let url = platform.startURL
            XCTAssertEqual(url.scheme, "https", "\(platform)")
            let host = try XCTUnwrap(url.host())
            let allowed = platform.allowedRootDomains.contains { host == $0 || host.hasSuffix("." + $0) }
            XCTAssertTrue(allowed, "\(host) fora da lista de \(platform)")
        }
    }

    func testPlatformsDoNotShareCoreDomains() {
        XCTAssertFalse(Platform.youtube.allowedRootDomains.contains("instagram.com"))
        XCTAssertFalse(Platform.instagram.allowedRootDomains.contains("youtube.com"))
    }

    func testIdentifiersAreUnique() {
        let ids = Platform.allCases.map(\.id)
        XCTAssertEqual(ids.count, Set(ids).count)
    }
}
