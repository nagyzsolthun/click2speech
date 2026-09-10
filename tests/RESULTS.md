# Browser validation — 2026-09-10

Built with Node.js 22.22.1 using `bash build.sh`, including clean `npm ci`
installs from both lockfiles. All 23 unit tests passed. Both npm audits reported
zero vulnerabilities. The release package is `build214.zip` (generated/ignored).

| Check | Firefox 154.0.1 | Chromium 152.0.7977.64 |
| --- | --- | --- |
| Real Speech Dispatcher speech start and completion | Passed | Passed |
| Native speech still running after 65 seconds | Passed | Passed |
| Toggle cancels reading | Passed | Passed |
| Forced background shutdown and recovery | Passed, page resumes reading | Passed, runtime routing restored |
| Page click starts reading | Passed, including empty CSS `:hover` regression | Not exercised by this harness |
| Closing reading tab cancels speech | Passed | Not exercised by this harness |
| Offscreen document recreation | Not applicable | Passed |
| Options UI | General page passed | General/speech routes and logo passed |

The standalone Vite preview also rendered its mock settings and logo without
uncaught runtime errors. Browser tests used isolated profiles and real installed
voices, with no speech mocks. Run the two speech suites sequentially: concurrent
clients of this OS speech service delayed a Chromium utterance beyond the test
start timeout.

The voices emitted no word-boundary events in either browser. The unit tests
verify boundary forwarding, but visual word highlighting still needs a manual
check with a boundary-capable voice. The broader manual checklist in `testing`
was not exhaustively exercised.

The input fix uses the latest pointer coordinates when CSS `:hover` is empty.
Before the fix, Firefox WebDriver delivered mouse events to the paragraph but
clicking never started speech; the same integration test passes with the fix.
