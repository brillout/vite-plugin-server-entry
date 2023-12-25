## [0.3.2](https://github.com/brillout/vite-plugin-import-build/compare/v0.3.1...v0.3.2) (2023-12-25)


### Bug Fixes

* avoid TypeScript multiple Vite version mistmatch ([d61b76f](https://github.com/brillout/vite-plugin-import-build/commit/d61b76f6a0b724290ccb2f29cf47868b05e21a6d))



## [0.3.1](https://github.com/brillout/vite-plugin-import-build/compare/v0.3.0...v0.3.1) (2023-12-20)


### Bug Fixes

* fix windows ([3c8861e](https://github.com/brillout/vite-plugin-import-build/commit/3c8861e18b338eeb989ecbe8d429e7d44f869b16))
* improve assertions ([c225208](https://github.com/brillout/vite-plugin-import-build/commit/c22520855753e933e3d547228cc247670821afdc))



# [0.3.0](https://github.com/brillout/vite-plugin-import-build/compare/v0.2.22...v0.3.0) (2023-12-20)


### Bug Fixes

* consier pre-release as higher version ([2f22ca1](https://github.com/brillout/vite-plugin-import-build/commit/2f22ca1ffae3408e2f7bd82f01bc8d7a543f8ff0))
* ensure only one plugin instance is applied ([f60bdc3](https://github.com/brillout/vite-plugin-import-build/commit/f60bdc38712be251331f1dafaaaccffdb47c989f))
* implement configVersion handling ([58cb5ac](https://github.com/brillout/vite-plugin-import-build/commit/58cb5ac956466a5cf09bbef69a7620dfb5a86a6d))
* make bundle search more robust ([bfd4d45](https://github.com/brillout/vite-plugin-import-build/commit/bfd4d45526c67feaf6013f5a824a59fa94ca76e2))
* new breaking interface ([13bc1ae](https://github.com/brillout/vite-plugin-import-build/commit/13bc1aea2e4b420d6807f4615b772166c9e6b2ff))
* remove disableAutoImporter option ([a3bac4c](https://github.com/brillout/vite-plugin-import-build/commit/a3bac4c2edd4e0f7a5a33e8ace92348fe9d94479))


### Features

* inject ([e796ed8](https://github.com/brillout/vite-plugin-import-build/commit/e796ed84e380e280ff3ba7fdd2ce943f240ec2f4))



## [0.2.22](https://github.com/brillout/vite-plugin-import-build/compare/v0.2.21...v0.2.22) (2023-12-12)


### Features

* dedicate option for testing crawler ([9504160](https://github.com/brillout/vite-plugin-import-build/commit/9504160b649b0bd8c5a3196fb4e999a178f7a7c4))



## [0.2.21](https://github.com/brillout/vite-plugin-import-build/compare/v0.2.20...v0.2.21) (2023-12-12)


### Bug Fixes

* explicitly fail upon wrong disableAutoImporter usage ([e99a4e6](https://github.com/brillout/vite-plugin-import-build/commit/e99a4e600bc4872101daf0aea89648d9e8f8f2a7))
* improve autoImporter.status assertion ([30b5745](https://github.com/brillout/vite-plugin-import-build/commit/30b57457e4cb059024a3d4a9d8593bf3f35f21c8))
* make writting auto importer file failure explicit ([0cd82c6](https://github.com/brillout/vite-plugin-import-build/commit/0cd82c6a99ad93424092458182b46e9e95d29ef7))
* when disabling auto importer, then also disable crawling ([85b1cfd](https://github.com/brillout/vite-plugin-import-build/commit/85b1cfdb4eeee6911bfa1ef011cc9e53c6e94601))


### Features

* add option for libraries to disable auto importer ([56fc54d](https://github.com/brillout/vite-plugin-import-build/commit/56fc54da6f63a1023b0f5dec62f9f44468eaf77f))



## [0.2.20](https://github.com/brillout/vite-plugin-import-build/compare/v0.2.19...v0.2.20) (2023-10-06)


### Bug Fixes

* handle missing `__filename` ([aba6c7e](https://github.com/brillout/vite-plugin-import-build/commit/aba6c7eb16e1c9339fdad23d9347cbc7d640f54c))



## [0.2.19](https://github.com/brillout/vite-plugin-import-build/compare/v0.2.18...v0.2.19) (2023-10-06)


### Bug Fixes

* help Vite's CJS/ESM analysis ([2331a4e](https://github.com/brillout/vite-plugin-import-build/commit/2331a4ebff54a456b9ab667b454570c4e5c3b86c))



## [0.2.18](https://github.com/brillout/vite-plugin-import-build/compare/v0.2.17...v0.2.18) (2023-06-14)


### Bug Fixes

* _disableAutoImporter ([0c234f4](https://github.com/brillout/vite-plugin-import-build/commit/0c234f4ccd73296189bcb8ffcb8c76d12958b778))
* improve debug logs ([b31d2f7](https://github.com/brillout/vite-plugin-import-build/commit/b31d2f7b582201cf24cdf7b4cdcf50da1fd30640))
* **yarn-pnp:** Fix where build is failing while using yarn-pnp  ([ce8331c](https://github.com/brillout/vite-plugin-import-build/commit/ce8331cb22dfba5ed1ac57933328a136410ba5ec))



## [0.2.17](https://github.com/brillout/vite-plugin-import-build/compare/v0.2.16...v0.2.17) (2023-06-06)


### Bug Fixes

* improve debug logs ([ee84028](https://github.com/brillout/vite-plugin-import-build/commit/ee84028f71ddb49db13d0b73f35e7514e4eba212))
* improve instructions and comment (brillout/vite-plugin-ssr[#797](https://github.com/brillout/vite-plugin-import-build/issues/797)) ([36ceaf5](https://github.com/brillout/vite-plugin-import-build/commit/36ceaf54b50b838e1285ddea0d9a80b05292588a))
* support side channel semver ([01f9d79](https://github.com/brillout/vite-plugin-import-build/commit/01f9d7922a7f36624713f271ee8d2a0832a276a8))


### Features

* add `outDir` argument ([89bbe89](https://github.com/brillout/vite-plugin-import-build/commit/89bbe89042749fcabc7ee027cba6f521f4fd4487))



## [0.2.16](https://github.com/brillout/vite-plugin-import-build/compare/v0.2.15...v0.2.16) (2023-04-15)


### Bug Fixes

* improve error message ([1e54c3e](https://github.com/brillout/vite-plugin-import-build/commit/1e54c3efb54598e2843da6384118da31300f6fd4))



## [0.2.15](https://github.com/brillout/vite-plugin-import-build/compare/v0.2.14...v0.2.15) (2023-04-14)


### Bug Fixes

* fix webpack support (fix brillout/vite-plugin-ssr[#786](https://github.com/brillout/vite-plugin-import-build/issues/786)) ([2ab73b3](https://github.com/brillout/vite-plugin-import-build/commit/2ab73b3c4f82d750767c4b53c87616c9e18de931))



## [0.2.14](https://github.com/brillout/vite-plugin-import-build/compare/v0.2.13...v0.2.14) (2023-04-09)


### Bug Fixes

* use @brillout/import@0.2.3 ([4451487](https://github.com/brillout/vite-plugin-import-build/commit/44514874077aab8c091d01e85617e0fad15531b6))



## [0.2.13](https://github.com/brillout/vite-plugin-import-build/compare/v0.2.12...v0.2.13) (2023-03-14)


### Bug Fixes

* fix webpack support (fix brillout/telefunc[#66](https://github.com/brillout/vite-plugin-import-build/issues/66)) ([af767c8](https://github.com/brillout/vite-plugin-import-build/commit/af767c80c1a84b9d92afc0a1694f056a85b30dde))



## [0.2.12](https://github.com/brillout/vite-plugin-import-build/compare/v0.2.11...v0.2.12) (2023-03-05)


### Bug Fixes

* improve entry finder ([5b045cc](https://github.com/brillout/vite-plugin-import-build/commit/5b045cc305d846fdd44fad3e9f3819cd5577ad49))
* improve entry not found error message ([212294c](https://github.com/brillout/vite-plugin-import-build/commit/212294c96948d9894cfe3cd031843beb72d70cb8))



## [0.2.11](https://github.com/brillout/vite-plugin-import-build/compare/v0.2.10...v0.2.11) (2023-02-25)


### Bug Fixes

* show debug logs only if DEBUG is enabled ([362021d](https://github.com/brillout/vite-plugin-import-build/commit/362021defd9f81a26b6bde8a23911b23c23a3ff9)), closes [brillout/vite-plugin-ssr#672](https://github.com/brillout/vite-plugin-ssr/issues/672)
* skip removing error stack lines ([ec0570b](https://github.com/brillout/vite-plugin-import-build/commit/ec0570b5e954323bab63f8577b0f3f61672992b6))



## [0.2.10](https://github.com/brillout/vite-plugin-import-build/compare/v0.2.9...v0.2.10) (2023-02-24)


### Bug Fixes

* deprecate older data versions ([0f054f7](https://github.com/brillout/vite-plugin-import-build/commit/0f054f7f94fe26ed7db01f192cf80aa844848a42))



## [0.2.9](https://github.com/brillout/vite-plugin-import-build/compare/v0.2.8...v0.2.9) (2023-02-24)


### Bug Fixes

* gracefully handle undefined __dirname ([c1ed669](https://github.com/brillout/vite-plugin-import-build/commit/c1ed669aa828a5fdb486fa98e3ea670c6b78cbb0))



## [0.2.8](https://github.com/brillout/vite-plugin-import-build/compare/v0.2.7...v0.2.8) (2023-02-24)


### Bug Fixes

* add build logs to debug logs ([9a61ef3](https://github.com/brillout/vite-plugin-import-build/commit/9a61ef37003ffddbcb4fe28f0e0ea66e0bafb465))
* add require() error to debug logs ([415746c](https://github.com/brillout/vite-plugin-import-build/commit/415746c5f89874aca9853026363a8d3244422d50))
* further add debug logs ([bdbd76f](https://github.com/brillout/vite-plugin-import-build/commit/bdbd76f7136d5c3325b131972f30bbe731c34d97))
* gracefully handle unsupported environments ([f1689e7](https://github.com/brillout/vite-plugin-import-build/commit/f1689e7c934b7c00d2aa3258c37e1c98e7c00595))
* minor improvements to debug logs ([f66bdd4](https://github.com/brillout/vite-plugin-import-build/commit/f66bdd470ff006571c4cc77f04b6bb80847e2715))
* tolerate unknown require/resolve errors ([d10a8b5](https://github.com/brillout/vite-plugin-import-build/commit/d10a8b50c0b1ec504cc132600c85c5223f346d3f))



## [0.2.7](https://github.com/brillout/vite-plugin-import-build/compare/v0.2.6...v0.2.7) (2023-02-17)


### Bug Fixes

* improve error message ([5bfb9e2](https://github.com/brillout/vite-plugin-import-build/commit/5bfb9e2633c0922394f6085ea11bc9ef01ab6e9b))



## [0.2.6](https://github.com/brillout/vite-plugin-import-build/compare/v0.2.5...v0.2.6) (2023-02-16)


### Bug Fixes

* properly generate source code containing windows paths (fix [#5](https://github.com/brillout/vite-plugin-import-build/issues/5)) ([29ab74e](https://github.com/brillout/vite-plugin-import-build/commit/29ab74eeddcbc72fd3a604f6576af7757dadf46d))



## [0.2.5](https://github.com/brillout/vite-plugin-import-build/compare/v0.2.4...v0.2.5) (2023-02-13)


### Bug Fixes

* impl config.vitePluginImportBuild._disableAutoImporter ([e033423](https://github.com/brillout/vite-plugin-import-build/commit/e0334230d5379fb92f536e8839c5f8536df56a0d))



## [0.2.4](https://github.com/brillout/vite-plugin-import-build/compare/v0.2.3...v0.2.4) (2023-02-13)


### Bug Fixes

* improve debug logs ([6bd1957](https://github.com/brillout/vite-plugin-import-build/commit/6bd195704e8d6381b9895d9d2c6eec8de70d0ae6))



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



