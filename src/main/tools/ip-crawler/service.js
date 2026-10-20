// HTTP/HTTPS request logic for the IP crawler tool.
import http from 'node:http'
import https from 'node:https'

const DEFAULT_TIMEOUT = 15000
const MAX_TIMEOUT = 120000
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024
const MAX_REDIRECTS = 5
const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'])

function normalizeHeaders(input) {
  if (!input) return {}

  if (typeof input === 'object' && !Array.isArray(input)) {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [key, String(value)])
    )
  }

  const text = String(input).trim()
  if (!text) return {}

  if (text.startsWith('{')) {
    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      throw new Error('请求头不是有效的 JSON')
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('请求头必须是 JSON 对象')
    }
    return Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [key, String(value)])
    )
  }

  const headers = {}
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue
    const separator = line.indexOf(':')
    if (separator <= 0) {
      throw new Error(`请求头格式错误：${line}`)
    }
    headers[line.slice(0, separator).trim()] = line.slice(separator + 1).trim()
  }
  return headers
}

function normalizeTimeout(value) {
  if (value === '' || value === undefined || value === null) return DEFAULT_TIMEOUT
  const timeout = Number(value)
  if (!Number.isFinite(timeout) || timeout < 1000) {
    throw new Error('超时时间不能小于 1000 毫秒')
  }
  return Math.min(Math.round(timeout), MAX_TIMEOUT)
}

function buildTargetUrl(config) {
  const rawTarget = String(config.target || '').trim()
  if (!rawTarget) throw new Error('请输入目标 IP、域名或完整 URL')

  const protocol = config.protocol === 'https' ? 'https' : 'http'
  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(rawTarget)
    ? rawTarget
    : `${protocol}://${rawTarget}`

  let url
  try {
    url = new URL(candidate)
  } catch {
    throw new Error('目标地址格式不正确，例如：192.168.1.10:8080/api')
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('目前只支持 HTTP 和 HTTPS 请求')
  }

  if (config.port !== '' && config.port !== undefined && config.port !== null) {
    const port = Number(config.port)
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('端口必须是 1-65535 之间的整数')
    }
    url.port = String(port)
  }

  const path = String(config.path || '').trim()
  if (path) {
    const normalized = path.startsWith('/') || path.startsWith('?') ? path : `/${path}`
    if (normalized.startsWith('?')) {
      url.search = normalized
    } else {
      const queryIndex = normalized.indexOf('?')
      if (queryIndex >= 0) {
        url.pathname = normalized.slice(0, queryIndex)
        url.search = normalized.slice(queryIndex)
      } else {
        url.pathname = normalized
      }
    }
  }

  return url
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_match, code) =>
      String.fromCodePoint(Number.parseInt(code, 16))
    )
}

function extractHtmlMeta(text) {
  const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const descriptionMatch = text.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i
  )
  return {
    title: titleMatch ? decodeHtmlEntities(titleMatch[1]).replace(/\s+/g, ' ').trim() : '',
    description: descriptionMatch
      ? decodeHtmlEntities(descriptionMatch[1]).replace(/\s+/g, ' ').trim()
      : ''
  }
}

function getHeader(headers, name) {
  const value = headers[name.toLowerCase()]
  return Array.isArray(value) ? value.join(', ') : value || ''
}

function getCharset(contentType, buffer) {
  const headerCharset = contentType.match(/charset\s*=\s*["']?([^;"'\s]+)/i)
  if (headerCharset) return headerCharset[1].toLowerCase()

  const head = buffer.subarray(0, 2048).toString('latin1')
  const metaCharset = head.match(/<meta[^>]+charset\s*=\s*["']?([^"'\s/>]+)/i)
  return metaCharset ? metaCharset[1].toLowerCase() : 'utf-8'
}

function normalizeCharset(charset) {
  const value = String(charset || 'utf-8').toLowerCase()
  if (['gb2312', 'gbk', 'gb_2312-80'].includes(value)) return 'gb18030'
  return value
}

function decodeBody(buffer, contentType) {
  const charset = normalizeCharset(getCharset(contentType, buffer))
  try {
    return {
      text: new TextDecoder(charset, { fatal: false }).decode(buffer),
      charset
    }
  } catch {
    return {
      text: buffer.toString('utf8'),
      charset: 'utf-8'
    }
  }
}

function inspectBody(buffer, contentType) {
  const lowerType = contentType.toLowerCase()
  const binaryType =
    lowerType.startsWith('image/') ||
    lowerType.startsWith('audio/') ||
    lowerType.startsWith('video/') ||
    lowerType.includes('octet-stream') ||
    lowerType.includes('application/zip') ||
    lowerType.includes('application/pdf')
  const decoded = binaryType
    ? { text: '', charset: '' }
    : decodeBody(buffer, contentType)
  const text = decoded.text
  const trimmed = text.trim()

  let json = null
  let isJson = lowerType.includes('json')
  if ((isJson || trimmed.startsWith('{') || trimmed.startsWith('[')) && trimmed) {
    try {
      json = JSON.parse(trimmed)
      isJson = true
    } catch {
      if (lowerType.includes('json')) {
        isJson = false
      }
    }
  }

  let contentKind = 'text'
  if (binaryType) contentKind = 'binary'
  else if (isJson) contentKind = 'json'
  else if (lowerType.includes('html') || /^<!doctype html/i.test(trimmed)) contentKind = 'html'
  else if (lowerType.includes('xml') || trimmed.startsWith('<?xml')) contentKind = 'xml'

  const htmlMeta = contentKind === 'html' ? extractHtmlMeta(text) : { title: '', description: '' }

  return {
    body: binaryType ? '' : text,
    json,
    isJson,
    contentKind,
    charset: decoded.charset,
    title: htmlMeta.title,
    description: htmlMeta.description
  }
}

function requestOnce(url, options, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    const transport = url.protocol === 'https:' ? https : http
    const startedAt = Date.now()
    const method = options.method
    const body = options.body
    const headers = { ...options.headers }

    if (body && !Object.keys(headers).some((key) => key.toLowerCase() === 'content-length')) {
      headers['Content-Length'] = Buffer.byteLength(body)
    }

    const request = transport.request(
      url,
      {
        method,
        headers,
        timeout: options.timeout,
        rejectUnauthorized: !options.ignoreTlsErrors
      },
      (response) => {
        const statusCode = response.statusCode || 0
        const location = getHeader(response.headers, 'location')

        if (
          options.followRedirects &&
          location &&
          [301, 302, 303, 307, 308].includes(statusCode)
        ) {
          response.resume()
          if (redirectCount >= MAX_REDIRECTS) {
            reject(new Error(`重定向次数超过 ${MAX_REDIRECTS} 次`))
            return
          }

          let nextUrl
          try {
            nextUrl = new URL(location, url)
          } catch {
            reject(new Error(`服务器返回了无效的重定向地址：${location}`))
            return
          }

          const shouldSwitchToGet =
            statusCode === 303 ||
            ([301, 302].includes(statusCode) && !['GET', 'HEAD'].includes(method))

          resolve(
            requestOnce(
              nextUrl,
              {
                ...options,
                method: shouldSwitchToGet ? 'GET' : method,
                body: shouldSwitchToGet ? '' : body
              },
              redirectCount + 1
            )
          )
          return
        }

        const chunks = []
        let storedBytes = 0
        let totalBytes = 0
        let truncated = false

        response.on('data', (chunk) => {
          totalBytes += chunk.length
          if (storedBytes >= MAX_RESPONSE_BYTES) {
            truncated = true
            return
          }

          const remaining = MAX_RESPONSE_BYTES - storedBytes
          const slice = chunk.length > remaining ? chunk.subarray(0, remaining) : chunk
          chunks.push(slice)
          storedBytes += slice.length
          if (slice.length < chunk.length) truncated = true
        })

        response.on('end', () => {
          const buffer = Buffer.concat(chunks, storedBytes)
          const contentType = getHeader(response.headers, 'content-type')
          const inspected = inspectBody(buffer, contentType)
          const flatHeaders = Object.fromEntries(
            Object.entries(response.headers).map(([key, value]) => [
              key,
              Array.isArray(value) ? value.join(', ') : String(value ?? '')
            ])
          )

          resolve({
            url: url.toString(),
            statusCode,
            statusText: response.statusMessage || '',
            headers: flatHeaders,
            contentType,
            contentKind: inspected.contentKind,
            charset: inspected.charset,
            body: inspected.body,
            json: inspected.json,
            isJson: inspected.isJson,
            title: inspected.title,
            description: inspected.description,
            sizeBytes: totalBytes,
            returnedBytes: storedBytes,
            truncated,
            elapsedMs: Date.now() - startedAt
          })
        })
      }
    )

    request.on('timeout', () => {
      request.destroy(new Error(`请求超时（${options.timeout} 毫秒）`))
    })

    request.on('error', (error) => {
      if (error.code === 'ENOTFOUND') {
        reject(new Error(`找不到目标主机：${url.hostname}`))
      } else if (error.code === 'ECONNREFUSED') {
        reject(new Error(`目标拒绝连接：${url.host}`))
      } else if (error.code === 'CERT_HAS_EXPIRED' || error.code === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
        reject(new Error('HTTPS 证书校验失败，可在高级选项中允许自签名证书'))
      } else {
        reject(error)
      }
    })

    if (body) request.write(body)
    request.end()
  })
}

async function crawl(config = {}) {
  const url = buildTargetUrl(config)
  const method = String(config.method || 'GET').toUpperCase()
  if (!ALLOWED_METHODS.has(method)) {
    throw new Error(`不支持的请求方法：${method}`)
  }

  const timeout = normalizeTimeout(config.timeout)
  const headers = normalizeHeaders(config.headers)
  const body = ['GET', 'HEAD'].includes(method) ? '' : String(config.body || '')

  if (!Object.keys(headers).some((key) => key.toLowerCase() === 'user-agent')) {
    headers['User-Agent'] = 'DataTools/0.1'
  }
  if (!Object.keys(headers).some((key) => key.toLowerCase() === 'accept')) {
    headers.Accept = '*/*'
  }
  if (!Object.keys(headers).some((key) => key.toLowerCase() === 'accept-encoding')) {
    headers['Accept-Encoding'] = 'identity'
  }
  if (
    body &&
    !Object.keys(headers).some((key) => key.toLowerCase() === 'content-type')
  ) {
    headers['Content-Type'] = 'application/json; charset=utf-8'
  }

  return requestOnce(url, {
    method,
    headers,
    body,
    timeout,
    followRedirects: config.followRedirects !== false,
    ignoreTlsErrors: config.ignoreTlsErrors === true
  })
}

export { crawl }
