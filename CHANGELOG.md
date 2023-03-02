# Change Log

All notable changes to this project will be documented in this file. This project uses [Semantic Versioning](https://semver.org/).


## [0.4.1] - 2023-03-02
### Updated
- Changed http timeout from 1000ms to 5000ms to reduce state resets
  in weak wifi conditions.


## [0.4.0] - 2023-02-27
### Updated
- Added a timeout parameter to the http client requests to prevent
  hanging the plugin while waiting from a response from the aircon.


## [0.3.0] - 2022-10-02
### Updated
- Improved http communication to the hardware by adding error handling while
  setting state.  Requests are attempted 3 times before failing action.


## [0.2.3] - 2021-04-10
### Added
- Added "verified by homebridge" to README


## [0.2.2] - 2021-04-03
### Fixed
- Correctly set PLUGIN_NAME variable to match correct value

### Updated
- Updated README.md with new config settings.
- Added CHANGELOG.md file to document releases


## [0.2.1] - 2021-04-02
### Added
- Added additional optional (advanced) configuration

### Fixed
- Fixed problem detect by npm lint after tagging 0.2.0


## [0.2.0] - 2021-04-02
### Changed
- Modified schema to configure devices as individual platforms


##  0.1.0 - 2021-03-31
- Initial release


[Unreleased]: https://github.com/rchrch/homebridge-mhacwifi1-lan/compare/0.4.1...main
[0.4.1]: https://github.com/rchrch/homebridge-mhacwifi1-lan/compare/0.4.0...0.4.1
[0.4.0]: https://github.com/rchrch/homebridge-mhacwifi1-lan/compare/0.3.0...0.4.0
[0.3.0]: https://github.com/rchrch/homebridge-mhacwifi1-lan/compare/0.2.3...0.3.0
[0.2.3]: https://github.com/rchrch/homebridge-mhacwifi1-lan/compare/0.2.2...0.2.3
[0.2.2]: https://github.com/rchrch/homebridge-mhacwifi1-lan/compare/0.2.1...0.2.2
[0.2.1]: https://github.com/rchrch/homebridge-mhacwifi1-lan/compare/0.2.0...0.2.1
[0.2.0]: https://github.com/rchrch/homebridge-mhacwifi1-lan/compare/0.1.0..0.2.0
