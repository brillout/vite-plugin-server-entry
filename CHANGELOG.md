## [0.7.9](https://github.com/brillout/vite-plugin-server-entry/compare/v0.7.8...v0.7.9) (2025-05-07)


### Bug Fixes

* add DEBUG flag ([#21](https://github.com/brillout/vite-plugin-server-entry/issues/21)) ([02b590c](https://github.com/brillout/vite-plugin-server-entry/commit/02b590c169a8db7028b1ee7bd4e014a4fd478a62))



## [0.7.8](https://github.com/brillout/vite-plugin-server-entry/compare/v0.7.7...v0.7.8) (2025-04-22)


### Bug Fixes

* improve findRollupBundleEntry() ([98312f2](https://github.com/brillout/vite-plugin-server-entry/commit/98312f28d5a23502b5d563b4a21f660a8870b337))
* rename entryOthers => entryLibraries ([31f36e9](https://github.com/brillout/vite-plugin-server-entry/commit/31f36e97457be8bc2ebb1c455794c942e17ef347))



## [0.7.7](https://github.com/brillout/vite-plugin-server-entry/compare/v0.7.6...v0.7.7) (2025-04-21)


### Bug Fixes

* fix typo bug ([558e64f](https://github.com/brillout/vite-plugin-server-entry/commit/558e64ffb2841a177e39807e4348a5fabcd50c2b))



## [0.7.6](https://github.com/brillout/vite-plugin-server-entry/compare/v0.7.5...v0.7.6) (2025-04-21)


### Bug Fixes

* make findRollupBundleEntry() more robust ([b5703cd](https://github.com/brillout/vite-plugin-server-entry/commit/b5703cd153d245ceba7d0bfb749f3fc69e1339aa))



## [0.7.5](https://github.com/brillout/vite-plugin-server-entry/compare/v0.7.4...v0.7.5) (2025-04-03)


### Bug Fixes

* eagerly write BUILDING status ([ef9747a](https://github.com/brillout/vite-plugin-server-entry/commit/ef9747ad6efd848c7fbb74f1ba3f8144187427d1))
* write autoImporter to both /dist/esm/ and /dist/cjs/ ([8ab8199](https://github.com/brillout/vite-plugin-server-entry/commit/8ab8199f4210d2abbcdc9cac2d26955172649d99))



## [0.7.4](https://github.com/brillout/vite-plugin-server-entry/compare/v0.7.3...v0.7.4) (2025-04-02)


### Bug Fixes

* [re-apply] more robust entry resolving ([#18](https://github.com/brillout/vite-plugin-server-entry/issues/18)) ([088587f](https://github.com/brillout/vite-plugin-server-entry/commit/088587fd205634c8d5178fc9bf5dcb18aba9c8e2))
* use rollupOptions.input instead of this.emitFile() ([2c52810](https://github.com/brillout/vite-plugin-server-entry/commit/2c52810a4462e68f16cd7aced74b28d07716eeef))



## [0.7.3](https://github.com/brillout/vite-plugin-server-entry/compare/v0.7.2...v0.7.3) (2025-04-02)


### Bug Fixes

* add debug assert ([#18](https://github.com/brillout/vite-plugin-server-entry/issues/18)) ([86a0005](https://github.com/brillout/vite-plugin-server-entry/commit/86a0005035cf90b05426cc47441acf2b9116c483))



## [0.7.2](https://github.com/brillout/vite-plugin-server-entry/compare/v0.7.1...v0.7.2) (2025-04-02)


### Bug Fixes

* more robust entry resolving (fix [#18](https://github.com/brillout/vite-plugin-server-entry/issues/18)) ([25b3cee](https://github.com/brillout/vite-plugin-server-entry/commit/25b3cee9ebfbda1c231579efffcbde0173eb29ba))



## [0.7.1](https://github.com/brillout/vite-plugin-server-entry/compare/v0.7.0...v0.7.1) (2025-03-20)


### Bug Fixes

* ensure fileName of server entry ([3d64616](https://github.com/brillout/vite-plugin-server-entry/commit/3d64616f2481f2f47fbe62de7d98a7fa87dea51e))



# [0.7.0](https://github.com/brillout/vite-plugin-server-entry/compare/v0.6.3...v0.7.0) (2025-03-20)


### Bug Fixes

* `export { serverEntryVirtualId }` ([2e973cd](https://github.com/brillout/vite-plugin-server-entry/commit/2e973cd3e16a5c6d49b8ea6b00498aa26817ee88))
* `export type { PluginConfigProvidedByUser as VitePluginServerEntryOptions }` ([f6974b7](https://github.com/brillout/vite-plugin-server-entry/commit/f6974b74b7704361aeeb43de9f470a9617e8834c))
* rename crawlServerEntry => crawlOutDir ([399de09](https://github.com/brillout/vite-plugin-server-entry/commit/399de0961e3cdd84e3f1b96ee237deaca0603b08))
* return outFilePath ([1f63878](https://github.com/brillout/vite-plugin-server-entry/commit/1f638782b2979e73a35c5946f447d572af8c794e))


### Features

* `disableServerEntryEmit` ([0c67c6a](https://github.com/brillout/vite-plugin-server-entry/commit/0c67c6ac1e7ce9610db407a438498b682f23714f))


### BREAKING CHANGES

* use `VitePluginServerEntryOptions` instead of `ConfigVitePluginServerEntry`
* Changed `inject` option.
* Removed `autoImport` option.
* crawlServerEntry => crawlOutDir



## [0.6.3](https://github.com/brillout/vite-plugin-server-entry/compare/v0.6.2...v0.6.3) (2025-02-20)


### Bug Fixes

* dual publish ESM + CJS [second-attempt] ([#17](https://github.com/brillout/vite-plugin-server-entry/issues/17)) ([53ddd34](https://github.com/brillout/vite-plugin-server-entry/commit/53ddd342b194dd074ed98be1c1d9a821a1925779))
* update @brillout/import ([224c3d6](https://github.com/brillout/vite-plugin-server-entry/commit/224c3d6bec3fed9da329ad1061da1f04257b9093))
* update @brillout/import ([e743bf0](https://github.com/brillout/vite-plugin-server-entry/commit/e743bf0eaa8e1f8cad14a4c5cc7864c364aed3fa))
* update @brillout/picocolors ([8374096](https://github.com/brillout/vite-plugin-server-entry/commit/83740961a9ed136a484b90ff503a200fced5d480))
* update @brillout/picocolors ([082dfa0](https://github.com/brillout/vite-plugin-server-entry/commit/082dfa0e7a3e2d210f6890e21612891c38457986))



## [0.6.2](https://github.com/brillout/vite-plugin-server-entry/compare/v0.6.1...v0.6.2) (2025-02-19)


### Bug Fixes

* Revert "fix: dual publish ESM + CJS" ([498ef2a](https://github.com/brillout/vite-plugin-server-entry/commit/498ef2ab34a483db9b10416c156a6c65c915ce3c))



## [0.6.1](https://github.com/brillout/vite-plugin-server-entry/compare/v0.6.0...v0.6.1) (2025-02-19)


### Bug Fixes

* dual publish ESM + CJS ([d248363](https://github.com/brillout/vite-plugin-server-entry/commit/d248363e8cdc03351df648d7094fce248be91d11))
* expose importServerProductionIndex() ([d6f2f1e](https://github.com/brillout/vite-plugin-server-entry/commit/d6f2f1ea3e0ecccfd39f418cb76985dfdcf2b3f7))



# [0.6.0](https://github.com/brillout/vite-plugin-server-entry/compare/v0.5.8...v0.6.0) (2025-02-10)


### Bug Fixes

* eagerly use auto importer ([11b5d9b](https://github.com/brillout/vite-plugin-server-entry/commit/11b5d9bfba27a75a8df2c3cffd3b2e19d1bf7cfa))
* enforce importServerProductionIndex() success ([1012043](https://github.com/brillout/vite-plugin-server-entry/commit/1012043760f868b57f412896b055b5e15267a689))
* improve error message ([ce973e2](https://github.com/brillout/vite-plugin-server-entry/commit/ce973e23069b1c25875b09ec7d2cbefb6e7d1f0f))
* option `tolerateNotFound` renamed to `tolerateDoesNotExist` ([c12dbb1](https://github.com/brillout/vite-plugin-server-entry/commit/c12dbb1c079f0ad008d605d6327403c1cb4a7533))
* remove doNotLoadServer ([8fec3d2](https://github.com/brillout/vite-plugin-server-entry/commit/8fec3d29d87dfce0d8e1fb866b1665e73d1ef99c))


### Features

* `importServerProductionIndex()` ([d734bdd](https://github.com/brillout/vite-plugin-server-entry/commit/d734bddaa53d1bfb0ed072a576742b5582f8b07b))


### BREAKING CHANGES

* option `tolerateNotFound` renamed to `tolerateDoesNotExist`



## [0.5.8](https://github.com/brillout/vite-plugin-server-entry/compare/v0.5.7...v0.5.8) (2025-01-24)


### Bug Fixes

* improve debug logs ([4647375](https://github.com/brillout/vite-plugin-server-entry/commit/4647375689164cc0ea566509a8cfbc3762be3da4))
* improve error message ([c33dd7d](https://github.com/brillout/vite-plugin-server-entry/commit/c33dd7d0d12e11e059a5bed070e90df10a5e36e3))
* support inject + pre-rendering ([a9f0984](https://github.com/brillout/vite-plugin-server-entry/commit/a9f0984d34c75183786d6fd6f8cdba0fc244b151))



## [0.5.7](https://github.com/brillout/vite-plugin-server-entry/compare/v0.5.6...v0.5.7) (2025-01-09)


### Bug Fixes

* update error message ([d02b8d6](https://github.com/brillout/vite-plugin-server-entry/commit/d02b8d61bf39061c0b95f9d6f2e665cca06ccd17))



## [0.5.6](https://github.com/brillout/vite-plugin-server-entry/compare/v0.5.5...v0.5.6) (2024-12-12)


### Bug Fixes

* remove missing source map warning ([b800228](https://github.com/brillout/vite-plugin-server-entry/commit/b8002285b96da1a631baf5c127592055b4d5501a))



## [0.5.5](https://github.com/brillout/vite-plugin-server-entry/compare/v0.5.4...v0.5.5) (2024-12-12)


### Bug Fixes

* fix error message upon wrong usage with inject ([6969cd1](https://github.com/brillout/vite-plugin-server-entry/commit/6969cd1ac7fb22fc9939ccfab18ed457e77ec066))
* improve tolerateNotFound flag ([1d05c3f](https://github.com/brillout/vite-plugin-server-entry/commit/1d05c3f582ff02b4e84c9be2d1751be798d7ca5e))



## [0.5.4](https://github.com/brillout/vite-plugin-server-entry/compare/v0.5.3...v0.5.4) (2024-11-24)


### Bug Fixes

* support crawling when inside ESM bundle [second attempt] (fix [#13](https://github.com/brillout/vite-plugin-server-entry/issues/13)) ([7309c32](https://github.com/brillout/vite-plugin-server-entry/commit/7309c32ffa6812656ddc23e1865776eab36d4bb0))



## [0.5.3](https://github.com/brillout/vite-plugin-server-entry/compare/v0.5.2...v0.5.3) (2024-11-24)


### Bug Fixes

* revert support crawling when inside ESM bundle ([#13](https://github.com/brillout/vite-plugin-server-entry/issues/13)) ([36d6cbb](https://github.com/brillout/vite-plugin-server-entry/commit/36d6cbba88f155b91d9dd57c16d7fa8b69a72241))



## [0.5.2](https://github.com/brillout/vite-plugin-server-entry/compare/v0.5.1...v0.5.2) (2024-11-24)


### Bug Fixes

* support crawling when inside ESM bundle (fix [#13](https://github.com/brillout/vite-plugin-server-entry/issues/13)) ([d58442c](https://github.com/brillout/vite-plugin-server-entry/commit/d58442c48f0a672cc1a924012c7376efeba8adc4))
* tolerate missing cwd ([dc56716](https://github.com/brillout/vite-plugin-server-entry/commit/dc567167278328680e67e3009e4e38c6dff5ef27))



## [0.5.1](https://github.com/brillout/vite-plugin-server-entry/compare/v0.5.0...v0.5.1) (2024-11-02)


### Bug Fixes

* fix type of `tolerateNotFound` ([3c26229](https://github.com/brillout/vite-plugin-server-entry/commit/3c262294ef47776c8e8c067a259e948ef59fa89c))



# [0.5.0](https://github.com/brillout/vite-plugin-server-entry/compare/v0.4.13...v0.5.0) (2024-11-02)


### Bug Fixes

* improve error message ([9889d97](https://github.com/brillout/vite-plugin-server-entry/commit/9889d9711185dbc1506e7996203129eb5df62c9d))
* remove workaround that isn't needed anymore ([0b04058](https://github.com/brillout/vite-plugin-server-entry/commit/0b0405806cef2c77caf3eb8324a74c62197af06b))
* rename `getImporterCode()` => `getServerProductionEntry()` ([be81708](https://github.com/brillout/vite-plugin-server-entry/commit/be8170896813e426a1528ed46597b7044fc171c2))
* rename importServerEntry => importServerProductionEntry ([b8045df](https://github.com/brillout/vite-plugin-server-entry/commit/b8045dfc95437186459353b1f43ee24cea979da4))
* rename serverEntryPlugin => serverProductionEntryPlugin ([ef3db53](https://github.com/brillout/vite-plugin-server-entry/commit/ef3db538cc62bb121d20dc75689d2e1078f71dd1))
* simplify export ([3da8c94](https://github.com/brillout/vite-plugin-server-entry/commit/3da8c94d5823046f9a3d9e19f793970d59320244))


### Features

* new option `importServerEntry({ tolerateNotFound })` ([59899ac](https://github.com/brillout/vite-plugin-server-entry/commit/59899ac1d226a22b7d1c140f9a02d82dcb418813))


### BREAKING CHANGES

* `serverEntryPlugin()` was renamed `serverProductionEntryPlugin()`
* `getImporterCode()` was renamed `getServerProductionEntry()`
* Make sure to import from either `@brillout/vite-plugin-server-entry/plugin` or `@brillout/vite-plugin-server-entry/runtime`.
* `importServerEntry()` renamed to `importServerProductionEntry()`
* `importServerEntry(outDir)` => `importServerEntry({ outDir })`



## [0.4.13](https://github.com/brillout/vite-plugin-server-entry/compare/v0.4.12...v0.4.13) (2024-10-08)


### Bug Fixes

* improve manual import instructions ([fab34c2](https://github.com/brillout/vite-plugin-server-entry/commit/fab34c296a1ca81c550cfd65772ddb509bb049ac))



## [0.4.12](https://github.com/brillout/vite-plugin-server-entry/compare/v0.4.11...v0.4.12) (2024-08-25)


### Bug Fixes

* define package.json["exports"]["importServerEntry"] ([14ae910](https://github.com/brillout/vite-plugin-server-entry/commit/14ae9102fc92dd14fd7779e88c5d6e3b014699c8))



## [0.4.11](https://github.com/brillout/vite-plugin-server-entry/compare/v0.4.10...v0.4.11) (2024-08-24)


### Bug Fixes

* simplify exports and code structure ([661ca2b](https://github.com/brillout/vite-plugin-server-entry/commit/661ca2b500a377b2b089082360c4f1b56403f4b0))



## [0.4.10](https://github.com/brillout/vite-plugin-server-entry/compare/v0.4.9...v0.4.10) (2024-08-23)


### Bug Fixes

* remove unused logic ([e3ae31d](https://github.com/brillout/vite-plugin-server-entry/commit/e3ae31dc1c0ba187fff06c2e4ac6ac12b16bfe4d))



## [0.4.9](https://github.com/brillout/vite-plugin-server-entry/compare/v0.4.8...v0.4.9) (2024-08-23)


### Bug Fixes

* do not write node_modules/.../autoImporter.js upon inject mode ([cbf1306](https://github.com/brillout/vite-plugin-server-entry/commit/cbf1306e2fc758cb4580876290c78b19fe60a2c8))
* improve inject setting ([e442da1](https://github.com/brillout/vite-plugin-server-entry/commit/e442da11da2812febf89b28d1a38ad56015c0e62))
* remove deprecated dist/server/importBuild.js ([8c1f978](https://github.com/brillout/vite-plugin-server-entry/commit/8c1f978d60728e6bf908221a519687e52d4520aa))
* resolve user configs later ([54b9807](https://github.com/brillout/vite-plugin-server-entry/commit/54b9807a4ed545ca2963730ee39ecb2a31fd08b8))


### Features

* ConfigVitePluginServerEntry ([a56d728](https://github.com/brillout/vite-plugin-server-entry/commit/a56d7280ce979954e4add1d6b3c3f4c55b58b0b1))
* new setting config.vitePluginServerEntry.autoImport (fix [#12](https://github.com/brillout/vite-plugin-server-entry/issues/12)) ([e2b9ca9](https://github.com/brillout/vite-plugin-server-entry/commit/e2b9ca9fe8f4224c6965f0ac37980aeafb686f7b))



## [0.4.8](https://github.com/brillout/vite-plugin-server-entry/compare/v0.4.7...v0.4.8) (2024-08-19)


### Bug Fixes

* remove counter productive assertion ([c854964](https://github.com/brillout/vite-plugin-server-entry/commit/c85496427b5b71d0cd086ab510c3768e2faf3ed7))



## [0.4.7](https://github.com/brillout/vite-plugin-server-entry/compare/v0.4.6...v0.4.7) (2024-07-04)


### Bug Fixes

* improve error message upon failure crawling server entry (fix [#11](https://github.com/brillout/vite-plugin-server-entry/issues/11)) ([4f0bd38](https://github.com/brillout/vite-plugin-server-entry/commit/4f0bd3864c39d6e732f5db07e5b45d6e4ae23330))



## [0.4.6](https://github.com/brillout/vite-plugin-server-entry/compare/v0.4.5...v0.4.6) (2024-04-17)


### Bug Fixes

* let user decide stack trace size ([6cc1c7c](https://github.com/brillout/vite-plugin-server-entry/commit/6cc1c7c3640b249181908063b60c8c1a3d2b18bf))



## [0.4.5](https://github.com/brillout/vite-plugin-server-entry/compare/v0.4.4...v0.4.5) (2024-03-29)


### Bug Fixes

* improve error message upon build.ssr entry (fix [#9](https://github.com/brillout/vite-plugin-server-entry/issues/9)) ([d1856b9](https://github.com/brillout/vite-plugin-server-entry/commit/d1856b950d8875f8d05dd5660be6d3fd88a21cdb))
* improve error message upon erased server entry ([#9](https://github.com/brillout/vite-plugin-server-entry/issues/9)) ([04fb71a](https://github.com/brillout/vite-plugin-server-entry/commit/04fb71a0303502dd100a1cdaa6cefdfc7924d2ce))



## [0.4.4](https://github.com/brillout/vite-plugin-server-entry/compare/v0.4.3...v0.4.4) (2024-02-09)


### Bug Fixes

* do not set `process.env.NODE_ENV = production;` ([55972f0](https://github.com/brillout/vite-plugin-server-entry/commit/55972f07b6c20fd143689778b5bc46723fcf55ae))



## [0.4.3](https://github.com/brillout/vite-plugin-server-entry/compare/v0.4.2...v0.4.3) (2024-01-07)


### Bug Fixes

* minor TypeScript fix ([d75a812](https://github.com/brillout/vite-plugin-server-entry/commit/d75a81282700e79162c260c8806235530588ce93))



## [0.4.2](https://github.com/brillout/vite-plugin-server-entry/compare/v0.4.1...v0.4.2) (2024-01-07)


### Bug Fixes

* don't create Rollup entry upon inject ([df3ee71](https://github.com/brillout/vite-plugin-server-entry/commit/df3ee71028b64c3cf8b5d4e4e8f4f8a23ba7d19c))
* prettify stack trace ([807e5af](https://github.com/brillout/vite-plugin-server-entry/commit/807e5afbafd4778cb319befebcb03b430ae67b0f))



## [0.4.1](https://github.com/brillout/vite-plugin-server-entry/compare/v0.4.0...v0.4.1) (2024-01-07)


### Bug Fixes

* import regression ([c072e77](https://github.com/brillout/vite-plugin-server-entry/commit/c072e77cc011ccf4f2e6685d0d5483f30afc4a7a))
* new autoImporter path ([2fa28cd](https://github.com/brillout/vite-plugin-server-entry/commit/2fa28cdb4fc3e25ae8558a13c014d171aae12b7e))
* relative autoImporter path ([7dd414c](https://github.com/brillout/vite-plugin-server-entry/commit/7dd414c2b06e270620f877e2470ef4949d39a63a))
* use import() ([fe7242d](https://github.com/brillout/vite-plugin-server-entry/commit/fe7242d269bcbbe6b6e255708a0b8185d08dc8f1))



# [0.4.0](https://github.com/brillout/vite-plugin-server-entry/compare/v0.3.4...v0.4.0) (2024-01-07)


### Bug Fixes

* rename everything ([1c9a059](https://github.com/brillout/vite-plugin-server-entry/commit/1c9a059ab226fe19724d793c3b03916f92cab412))



## [0.3.4](https://github.com/brillout/vite-plugin-import-build/compare/v0.3.3...v0.3.4) (2024-01-05)


### Bug Fixes

* await import upon crawl ([e292c9d](https://github.com/brillout/vite-plugin-import-build/commit/e292c9d4ddd2e5a7e6930b7d7b8cc926075447f1))



## [0.3.3](https://github.com/brillout/vite-plugin-import-build/compare/v0.3.2...v0.3.3) (2024-01-05)


### Bug Fixes

* fail earlier ([037a982](https://github.com/brillout/vite-plugin-import-build/commit/037a9823ec3fa11db57c80f31dcd1634acfb9e55))



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



