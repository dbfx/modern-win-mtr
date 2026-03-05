import path from 'path';
import fs from 'fs';
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
    extraResource: [path.resolve(__dirname, 'build', 'app-update.yml')],
  },
  hooks: {
    generateAssets: async () => {
      // Generate app-update.yml required by electron-updater
      const yml = 'provider: github\nowner: dbfx\nrepo: modern-win-mtr\n';
      const buildDir = path.resolve(__dirname, 'build');
      if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
      fs.writeFileSync(path.join(buildDir, 'app-update.yml'), yml, 'utf-8');
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'modern-mtr',
      setupIcon: path.resolve(__dirname, 'build', 'icon.ico'),
      iconUrl: 'https://raw.githubusercontent.com/dbfx/modern-win-mtr/main/build/icon.ico',
    }),
    new MakerZIP({}, ['darwin', 'linux']),
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
