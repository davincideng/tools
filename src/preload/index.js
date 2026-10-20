import { contextBridge, ipcRenderer } from 'electron'
import { createToolApis } from './tools/index.js'

contextBridge.exposeInMainWorld('tools', createToolApis(ipcRenderer))
