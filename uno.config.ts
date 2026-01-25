import { defineConfig, presetAttributify, presetWind3 } from 'unocss';

export default defineConfig({
  presets: [
    presetWind3(), // 基础原子类
    presetAttributify(), // 属性模式
  ],
  shortcuts: {}, // 自定义
  theme: {
    colors: {
      primary: '#4285f4', // 与CSS变量对应
      secondary: '#ea4335',
    },
    spacing: {
      sm: '0.5rem',
      md: '1rem',
      lg: '2rem',
    },
  },
});
