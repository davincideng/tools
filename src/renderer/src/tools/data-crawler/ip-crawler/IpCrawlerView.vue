<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  CircleCheck,
  DocumentCopy,
  RefreshRight,
  Search
} from '@element-plus/icons-vue'

defineEmits(['back'])

const defaultForm = () => ({
  target: '',
  protocol: 'http',
  port: '',
  path: '',
  method: 'GET',
  timeout: 15000,
  headers: '',
  body: '',
  followRedirects: true,
  ignoreTlsErrors: false
})

const form = reactive(defaultForm())
const loading = ref(false)
const error = ref('')
const result = ref(null)
const activeTab = ref('preview')
const advancedOpen = ref([])

const hasResult = computed(() => Boolean(result.value))
const isBodyMethod = computed(() => !['GET', 'HEAD'].includes(form.method))
const displayBody = computed(() => {
  if (!result.value) return ''
  if (result.value.contentKind === 'binary') {
    return `[二进制响应]\n大小：${formatBytes(result.value.sizeBytes)}\nContent-Type：${
      result.value.contentType || '未知'
    }`
  }
  return result.value.body || '响应内容为空'
})
const previewText = computed(() => {
  if (!result.value) return ''
  if (result.value.isJson && result.value.json !== null) {
    return JSON.stringify(result.value.json, null, 2)
  }
  return displayBody.value
})
const headersText = computed(() => {
  if (!result.value) return ''
  return JSON.stringify(result.value.headers || {}, null, 2)
})
const resultStatusClass = computed(() => {
  const status = result.value?.statusCode
  if (!status) return 'neutral'
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 400) return 'warning'
  return 'danger'
})
const contentKindLabel = computed(() => {
  const labels = {
    json: 'JSON',
    html: 'HTML',
    xml: 'XML',
    text: '文本',
    binary: '二进制'
  }
  return labels[result.value?.contentKind] || '未知'
})

function cleanError(value) {
  const message = value instanceof Error ? value.message : String(value)
  return message.replace(/^Error invoking remote method '[^']+':\s*/, '')
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatDuration(milliseconds) {
  if (!Number.isFinite(milliseconds)) return '-'
  if (milliseconds < 1000) return `${milliseconds} ms`
  return `${(milliseconds / 1000).toFixed(2)} s`
}

function reset() {
  Object.assign(form, defaultForm())
  result.value = null
  error.value = ''
  activeTab.value = 'preview'
  advancedOpen.value = []
}

async function run() {
  error.value = ''
  result.value = null

  if (!form.target.trim()) {
    ElMessage.warning('请输入目标 IP、域名或完整 URL')
    return
  }

  if (!window.tools?.ipCrawler?.run) {
    error.value = '当前环境未加载 Electron preload，请通过 Electron 启动应用'
    return
  }

  loading.value = true
  try {
    const response = await window.tools.ipCrawler.run({
      target: form.target.trim(),
      protocol: form.protocol,
      port: form.port,
      path: form.path.trim(),
      method: form.method,
      timeout: form.timeout,
      headers: form.headers,
      body: form.body,
      followRedirects: form.followRedirects,
      ignoreTlsErrors: form.ignoreTlsErrors
    })

    if (!response?.success) {
      throw new Error(response?.error || '请求失败')
    }

    result.value = response.data
    activeTab.value = 'preview'
  } catch (requestError) {
    error.value = cleanError(requestError)
  } finally {
    loading.value = false
  }
}

async function copyText(text, successMessage) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(successMessage)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    textarea.remove()
    ElMessage.success(successMessage)
  }
}
</script>

<template>
  <section class="tool-page ip-crawler-page">
    <header class="tool-topbar">
      <el-button text :icon="ArrowLeft" @click="$emit('back')">返回数据爬取</el-button>
      <div class="tool-topbar-title">
        <h2>IP 数据爬取</h2>
        <div class="tool-topbar-meta">数据爬取 · 请求目标地址并查看接口或网页返回的数据</div>
      </div>
      <el-tag effect="plain">HTTP / HTTPS</el-tag>
    </header>

    <div class="crawler-content">
      <section class="request-section">
        <div class="section-heading">
          <div>
            <h3>请求配置</h3>
            <p>直接填 IP、域名或完整 URL；端口和路径可选。</p>
          </div>
          <div class="request-state">
            <span class="state-dot" :class="{ active: loading }"></span>
            {{ loading ? '请求中' : '等待请求' }}
          </div>
        </div>

        <div class="request-grid">
          <label class="form-field target-field">
            <span>目标地址</span>
            <el-input
              v-model="form.target"
              size="large"
              :disabled="loading"
              placeholder="例如：192.168.1.20:8080/api 或 http://example.com"
              @keyup.enter="run"
            />
          </label>

          <label class="form-field">
            <span>协议</span>
            <el-select v-model="form.protocol" :disabled="loading">
              <el-option label="HTTP" value="http" />
              <el-option label="HTTPS" value="https" />
            </el-select>
          </label>

          <label class="form-field">
            <span>端口</span>
            <el-input
              v-model="form.port"
              :disabled="loading"
              placeholder="默认端口"
              inputmode="numeric"
            />
          </label>

          <label class="form-field">
            <span>请求路径</span>
            <el-input
              v-model="form.path"
              :disabled="loading"
              placeholder="例如 /api/data"
            />
          </label>

          <label class="form-field">
            <span>请求方法</span>
            <el-select v-model="form.method" :disabled="loading">
              <el-option label="GET" value="GET" />
              <el-option label="POST" value="POST" />
              <el-option label="PUT" value="PUT" />
              <el-option label="PATCH" value="PATCH" />
              <el-option label="DELETE" value="DELETE" />
            </el-select>
          </label>

          <label class="form-field">
            <span>超时（毫秒）</span>
            <el-input-number
              v-model="form.timeout"
              :disabled="loading"
              :min="1000"
              :max="120000"
              :step="1000"
              controls-position="right"
            />
          </label>
        </div>

        <el-collapse v-model="advancedOpen" class="advanced-options">
          <el-collapse-item name="advanced">
            <template #title>
              <span class="advanced-title">高级选项</span>
              <span class="advanced-hint">请求头、请求体、重定向与 HTTPS 证书</span>
            </template>

            <div class="advanced-grid">
              <label class="form-field">
                <span>请求头</span>
                <el-input
                  v-model="form.headers"
                  type="textarea"
                  :rows="5"
                  :disabled="loading"
                  placeholder='支持 JSON 或逐行填写，例如：&#10;{"Authorization":"Bearer token"}'
                />
              </label>
              <label class="form-field">
                <span>请求体</span>
                <el-input
                  v-model="form.body"
                  type="textarea"
                  :rows="5"
                  :disabled="loading || !isBodyMethod"
                  placeholder='例如：{"page":1,"size":20}'
                />
              </label>
            </div>

            <div class="advanced-switches">
              <el-checkbox v-model="form.followRedirects" :disabled="loading">
                自动跟随重定向
              </el-checkbox>
              <el-checkbox v-model="form.ignoreTlsErrors" :disabled="loading">
                忽略 HTTPS 证书错误
              </el-checkbox>
            </div>
          </el-collapse-item>
        </el-collapse>

        <div class="request-actions">
          <el-button type="primary" size="large" :loading="loading" @click="run">
            <el-icon><Search /></el-icon>
            开始采集
          </el-button>
          <el-button size="large" :disabled="loading" @click="reset">
            <el-icon><RefreshRight /></el-icon>
            重置
          </el-button>
          <span class="request-tip">GET 请求不需要填写请求体</span>
        </div>
      </section>

      <el-alert
        v-if="error"
        :title="error"
        type="error"
        show-icon
        closable
        @close="error = ''"
      />

      <section v-if="hasResult" class="result-section">
        <div class="result-heading">
          <div>
            <h3>采集结果</h3>
            <p class="result-url">{{ result.url }}</p>
          </div>
          <div class="result-actions">
            <el-tag :type="resultStatusClass" effect="light">
              {{ result.statusCode }} {{ result.statusText }}
            </el-tag>
            <el-tag effect="plain">{{ contentKindLabel }}</el-tag>
            <el-button
              text
              :icon="DocumentCopy"
              @click="copyText(displayBody, '响应内容已复制')"
            >
              复制内容
            </el-button>
          </div>
        </div>

        <div class="metric-grid">
          <div class="metric-item">
            <span>状态码</span>
            <strong :class="`status-${resultStatusClass}`">{{ result.statusCode }}</strong>
          </div>
          <div class="metric-item">
            <span>耗时</span>
            <strong>{{ formatDuration(result.elapsedMs) }}</strong>
          </div>
          <div class="metric-item">
            <span>响应大小</span>
            <strong>{{ formatBytes(result.sizeBytes) }}</strong>
          </div>
          <div class="metric-item">
            <span>内容编码</span>
            <strong class="metric-small">{{ result.charset || '未知' }}</strong>
          </div>
        </div>

        <div class="response-panel">
          <div class="response-panel-head">
            <div class="response-summary">
              <el-icon><CircleCheck /></el-icon>
              <span>服务器已返回响应</span>
              <span v-if="result.truncated" class="truncated-note">
                内容超过 5 MB，仅展示前 5 MB
              </span>
            </div>
            <el-button text @click="copyText(headersText, '响应头已复制')">
              复制响应头
            </el-button>
          </div>

          <el-tabs v-model="activeTab">
            <el-tab-pane label="数据预览" name="preview">
              <div v-if="result.title || result.description" class="page-meta">
                <div v-if="result.title">
                  <span>网页标题</span>
                  <strong>{{ result.title }}</strong>
                </div>
                <div v-if="result.description">
                  <span>页面描述</span>
                  <strong>{{ result.description }}</strong>
                </div>
              </div>
              <pre class="value-block">{{ previewText }}</pre>
            </el-tab-pane>
            <el-tab-pane label="原始响应" name="raw">
              <pre class="value-block">{{ displayBody }}</pre>
            </el-tab-pane>
            <el-tab-pane label="响应头" name="headers">
              <pre class="value-block">{{ headersText }}</pre>
            </el-tab-pane>
          </el-tabs>
        </div>
      </section>

      <section v-else class="empty-result">
        <div class="empty-icon">
          <el-icon><Search /></el-icon>
        </div>
        <h3>还没有采集结果</h3>
        <p>填写目标地址后点击“开始采集”，返回内容会显示在这里。</p>
      </section>
    </div>
  </section>
</template>

<style scoped>
.crawler-content {
  width: min(1120px, 100%);
  margin: 0 auto;
  padding: 26px 30px 40px;
}

.request-section,
.result-section {
  padding: 0;
}

.section-heading,
.result-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;
}

.section-heading h3,
.result-heading h3 {
  margin: 0 0 5px;
  font-size: 17px;
  font-weight: 650;
}

.section-heading p,
.result-heading p {
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
}

.request-state {
  display: flex;
  align-items: center;
  gap: 7px;
  padding-top: 3px;
  color: var(--text-muted);
  font-size: 12px;
}

.state-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #a8b3bf;
}

.state-dot.active {
  background: var(--warning);
  box-shadow: 0 0 0 4px rgba(183, 121, 31, 0.1);
}

.request-grid {
  display: grid;
  grid-template-columns: minmax(260px, 1.8fr) 120px 120px 1.2fr 130px 150px;
  gap: 10px;
  align-items: end;
}

.target-field {
  min-width: 0;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field > span {
  color: var(--text-muted);
  font-size: 12px;
}

.advanced-options {
  margin-top: 16px;
  border-top: 1px solid var(--border);
  border-bottom: 0;
}

.advanced-title {
  margin-right: 10px;
  font-weight: 600;
}

.advanced-hint {
  color: var(--text-muted);
  font-size: 12px;
}

.advanced-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.advanced-switches {
  display: flex;
  gap: 24px;
  margin-top: 14px;
}

.request-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
}

.request-tip {
  margin-left: 4px;
  color: var(--text-muted);
  font-size: 12px;
}

.result-section {
  margin-top: 28px;
}

.result-heading {
  align-items: center;
}

.result-heading > div:first-child {
  min-width: 0;
}

.result-url {
  max-width: 700px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.metric-item {
  display: flex;
  min-height: 72px;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
}

.metric-item span {
  color: var(--text-muted);
  font-size: 12px;
}

.metric-item strong {
  font-family: Consolas, "Cascadia Code", monospace;
  font-size: 21px;
  font-weight: 600;
}

.metric-item strong.metric-small {
  font-size: 15px;
}

.status-success {
  color: #16835f;
}

.status-warning {
  color: var(--warning);
}

.status-danger {
  color: var(--danger);
}

.status-neutral {
  color: var(--text-muted);
}

.response-panel {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
}

.response-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
}

.response-summary {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--text-muted);
  font-size: 12px;
}

.response-summary .el-icon {
  color: #16835f;
}

.truncated-note {
  color: var(--warning);
}

.response-panel :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 16px;
}

.response-panel :deep(.el-tabs__content) {
  padding: 0 16px 16px;
}

.value-block {
  max-height: 460px;
  margin: 0;
  padding: 14px 16px;
  overflow: auto;
  border-radius: 6px;
  background: #101a24;
  color: #dce8f2;
  font-family: Consolas, "Cascadia Code", monospace;
  font-size: 13px;
  line-height: 1.65;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.page-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: #fbfcfd;
  font-size: 12px;
}

.page-meta > div {
  display: flex;
  gap: 10px;
}

.page-meta span {
  flex: 0 0 64px;
  color: var(--text-muted);
}

.page-meta strong {
  min-width: 0;
  font-weight: 500;
  overflow-wrap: anywhere;
}

.empty-result {
  display: flex;
  min-height: 300px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 28px;
  border: 1px dashed var(--border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.55);
  text-align: center;
}

.empty-icon {
  display: grid;
  width: 52px;
  height: 52px;
  margin-bottom: 14px;
  place-items: center;
  border-radius: 8px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 24px;
}

.empty-result h3 {
  margin: 0 0 7px;
  font-size: 16px;
  font-weight: 600;
}

.empty-result p {
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
}

@media (max-width: 1180px) {
  .request-grid {
    grid-template-columns: minmax(220px, 1fr) 110px 110px 150px;
  }

  .target-field,
  .request-grid > .form-field:nth-child(4) {
    grid-column: span 2;
  }
}

@media (max-width: 900px) {
  .crawler-content {
    padding: 20px 18px 32px;
  }

  .request-grid {
    grid-template-columns: 1fr 1fr;
  }

  .target-field {
    grid-column: 1 / -1;
  }

  .request-grid > .form-field:nth-child(4) {
    grid-column: auto;
  }

  .advanced-grid {
    grid-template-columns: 1fr;
  }

  .metric-grid {
    grid-template-columns: 1fr 1fr;
  }

  .result-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 620px) {
  .request-grid,
  .metric-grid {
    grid-template-columns: 1fr;
  }

  .target-field {
    grid-column: auto;
  }

  .advanced-switches {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .result-actions {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .response-summary {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
