## [0.2.3](https://github.com/brillout/vite-plugin-import-build/compare/v0.2.2...v0.2.3) (2023-02-13)


### Bug Fixes

* improve debug logs ([bb97d8c](https://github.com/brillout/vite-plugin-import-build/commit/bb97d8ce7143d9d07978cd010cad1007dbb762ee))
* typo ([3e71ab2](https://github.com/brillout/vite-plugin-import-build/commit/3e71ab2c6213b59198d990c5b239c3a3eae71158))



## [0.2.2](https://github.com/brillout/vite-plugin-import-build/compare/v0.2.1...v0.2.2) (2023-02-13)


### Bug Fixes

* add further debug log ([6db45ed](https://github.com/brillout/vite-plugin-import-build/commit/6db45edb42b42508b4d141849a7e0423e1d55b06))
* don't assume existence of fs and path modules if process.cwd() is defined ([86ac290](https://github.com/brillout/vite-plugin-import-build/commit/86ac290f0343e3267c61fa488f5de3cfe79f6ddf))
* handle edge environemtns returning a bogus process.cwd() ([37be3e1](https://github.com/brillout/vite-plugin-import-build/commit/37be3e10aaee9cf3013a2e6be681a2c58a430733))
* simplify isYarnPnP() ([a9f7589](https://github.com/brillout/vite-plugin-import-build/commit/a9f75891950a89410d4bebbbfe384add7243cf66))
* typo ([798c788](https://github.com/brillout/vite-plugin-import-build/commit/798c7883ceca6cad961bda0ba7dcaf0f62f1cda6))



## [0.2.1](https://github.com/brillout/vite-plugin-import-build/compare/v0.2.0...v0.2.1) (2023-02-13)


### Bug Fixes

* fix path.isAbsolute assertion on windows ([bf15854](https://github.com/brillout/vite-plugin-import-build/commit/bf1585400410169543847d7daf25b1696b5a80b6))



# [0.2.0](https://github.com/brillout/vite-plugin-import-build/compare/v0.1.12...v0.2.0) (2023-02-13)


### Bug Fixes

* let the newest @brillout/vite-plugin-import-build version generate autoImporter.js ([bd542dd](https://github.com/brillout/vite-plugin-import-build/commit/bd542ddd3f3bed6cdeadf775e18451ee03c8fd29))
* make dependency on path and fs optional ([1d1f6f8](https://github.com/brillout/vite-plugin-import-build/commit/1d1f6f846887f99fdc91576a7732f5ef8b7925ea))
* re-write importBuild() ([116d12c](https://github.com/brillout/vite-plugin-import-build/commit/116d12c14f1e17d841fd7c4265b5dfd6b933462a))
* simplify loadBuild() ([346827e](https://github.com/brillout/vite-plugin-import-build/commit/346827e8f1693df95277a3559e3f2613fc2a624a))


### BREAKING CHANGES

* loadBuild() now returns Promise<undefined>



## [0.1.12](https://github.com/brillout/vite-plugin-import-build/compare/v0.1.11...v0.1.12) (2023-02-10)


### Bug Fixes

* improve assertion failure log ([b8964f2](https://github.com/brillout/vite-plugin-import-build/commit/b8964f2f0d1c7bd6d7b5041fc1a30e7f4eb7a0e0))



