import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

const config: ForgeConfig = {
  packagerConfig: {
    appBundleId: "com.stewie.learnos",
    asar: true,
    executableName: "stewie-learnos",
    extraResource: [".runtime/python"],
    name: "Stewie LearnOS",
    // 正式发行时，osxSign/osxNotarize 必须覆盖 extraResource 中的
    // Resources/python/bin/python3 与其动态库；凭据只从 CI secrets 注入。
    // Windows 的 Squirrel 证书文件与密码也只在发行工作流注入。
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: "stewie_learnos",
      setupExe: "Stewie-LearnOS-Setup.exe",
    }),
    new MakerDMG(
      {
        format: "ULFO",
        name: "Stewie-LearnOS",
      },
      ["darwin"],
    ),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: "src/main.ts",
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: "src/preload.ts",
          config: "vite.preload.config.ts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
      [FuseV1Options.GrantFileProtocolExtraPrivileges]: false,
    }),
  ],
};

export default config;
