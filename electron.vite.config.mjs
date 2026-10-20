import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

// Windows 上如果 Chromium 沙箱初始化失败，Electron 会启动瞬间静默退出：
// 终端里打完 "start electron app..." 就直接回到提示符，没有任何报错。
// electron-vite 读到 NO_SANDBOX=1 会给 Electron 追加 --no-sandbox，dev / start 即可正常拉起窗口。
// 想恢复沙箱（例如在允许沙箱的机器上）：运行前设置 NO_SANDBOX=0。
if (process.platform === 'win32' && !process.env.NO_SANDBOX) {
  process.env.NO_SANDBOX = '1'
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    plugins: [vue()]
  }
})
