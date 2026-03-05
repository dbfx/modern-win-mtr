import path from 'path';
import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { VitePlugin } from '@electron-forge/plugin-vite';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: path.resolve(__dirname, 'build', 'icon'),
    name: 'Modern MTR',
    executableName: 'modern-mtr',
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'modern-mtr',
      setupIcon: path.resolve(__dirname, 'build', 'icon.ico'),
      iconUrl: 'https://raw.githubusercontent.com/dbfx/modern-win-mtr/main/build/icon.ico',
    }),
    new MakerZIP({}),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/main/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
  ],
};

export default config;
