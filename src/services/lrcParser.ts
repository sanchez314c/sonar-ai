/**
 * LRC File Parser
 * Parses synchronized lyrics in LRC format
 */

export interface LRCLine {
  time: number  // Time in milliseconds
  text: string
}

export interface LRCMetadata {
  artist?: string
  title?: string
  album?: string
  author?: string  // Lyrics author
  length?: string  // Song length
  offset?: number  // Timing offset in ms
}

export interface ParsedLRC {
  metadata: LRCMetadata
  lines: LRCLine[]
}

/**
 * Parse timestamp string to milliseconds
 * Supports formats: [mm:ss.xx], [mm:ss.xxx], [mm:ss]
 */
function parseTimestamp(timestamp: string): number {
  // Remove brackets
  const cleanTime = timestamp.replace(/[\[\]]/g, '')

  // Match different formats
  const match = cleanTime.match(/^(\d+):(\d+)(?:\.(\d+))?$/)

  if (!match) return -1

  const minutes = parseInt(match[1], 10)
  const seconds = parseInt(match[2], 10)
  const centiseconds = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0

  return (minutes * 60 * 1000) + (seconds * 1000) + centiseconds
}

/**
 * Parse LRC format string into structured data
 */
export function parseLRC(lrcContent: string): LRCLine[] {
  const lines: LRCLine[] = []

  if (!lrcContent) return lines

  const rawLines = lrcContent.split('\n')

  for (const line of rawLines) {
    const trimmedLine = line.trim()

    if (!trimmedLine) continue

    // Match all timestamps at the beginning of the line
    // Format: [mm:ss.xx] or [mm:ss.xxx] or [mm:ss]
    const timestampRegex = /\[(\d+:\d+(?:\.\d+)?)\]/g
    const timestamps: number[] = []
    let match: RegExpExecArray | null
    let lastIndex = 0

    while ((match = timestampRegex.exec(trimmedLine)) !== null) {
      const time = parseTimestamp(match[0])
      if (time >= 0) {
        timestamps.push(time)
      }
      lastIndex = timestampRegex.lastIndex
    }

    if (timestamps.length === 0) continue

    // Get the text after all timestamps
    const text = trimmedLine.slice(lastIndex).trim()

    // Skip metadata lines (they have format [key:value])
    if (timestamps.length === 1 && !text && trimmedLine.includes(':')) {
      continue
    }

    // Add a line entry for each timestamp
    for (const time of timestamps) {
      lines.push({ time, text })
    }
  }

  // Sort by time
  lines.sort((a, b) => a.time - b.time)

  return lines
}

/**
 * Parse LRC content with metadata extraction
 */
export function parseLRCWithMetadata(lrcContent: string): ParsedLRC {
  const metadata: LRCMetadata = {}
  const lines: LRCLine[] = []

  if (!lrcContent) return { metadata, lines }

  const rawLines = lrcContent.split('\n')

  // Metadata tag patterns
  const metadataPatterns: Record<string, keyof LRCMetadata> = {
    'ar': 'artist',
    'ti': 'title',
    'al': 'album',
    'au': 'author',
    'length': 'length',
    'offset': 'offset',
  }

  for (const line of rawLines) {
    const trimmedLine = line.trim()

    if (!trimmedLine) continue

    // Check for metadata tags [tag:value]
    const metadataMatch = trimmedLine.match(/^\[([a-z]+):(.+)\]$/i)
    if (metadataMatch) {
      const [, tag, value] = metadataMatch
      const normalizedTag = tag.toLowerCase()

      if (normalizedTag in metadataPatterns) {
        const key = metadataPatterns[normalizedTag]
        if (key === 'offset') {
          metadata.offset = parseInt(value.trim(), 10)
        } else {
          metadata[key] = value.trim()
        }
      }
      continue
    }

    // Parse regular timestamped lines
    const timestampRegex = /\[(\d+:\d+(?:\.\d+)?)\]/g
    const timestamps: number[] = []
    let match: RegExpExecArray | null
    let lastIndex = 0

    while ((match = timestampRegex.exec(trimmedLine)) !== null) {
      const time = parseTimestamp(match[0])
      if (time >= 0) {
        timestamps.push(time)
      }
      lastIndex = timestampRegex.lastIndex
    }

    if (timestamps.length === 0) continue

    const text = trimmedLine.slice(lastIndex).trim()

    for (const time of timestamps) {
      // Apply offset if present
      const adjustedTime = metadata.offset ? time + metadata.offset : time
      lines.push({ time: adjustedTime, text })
    }
  }

  // Sort by time
  lines.sort((a, b) => a.time - b.time)

  return { metadata, lines }
}

/**
 * Find the current line index based on elapsed time
 */
export function findCurrentLineIndex(lines: LRCLine[], currentTimeMs: number): number {
  if (!lines.length) return -1

  // Binary search for efficiency
  let low = 0
  let high = lines.length - 1

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const midTime = lines[mid].time

    if (midTime <= currentTimeMs) {
      // Check if this is the last line that starts before currentTime
      if (mid === lines.length - 1 || lines[mid + 1].time > currentTimeMs) {
        return mid
      }
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  return -1
}

/**
 * Convert lines back to LRC format string
 */
export function toLRCString(lines: LRCLine[], metadata?: LRCMetadata): string {
  const output: string[] = []

  // Add metadata
  if (metadata) {
    if (metadata.artist) output.push(`[ar:${metadata.artist}]`)
    if (metadata.title) output.push(`[ti:${metadata.title}]`)
    if (metadata.album) output.push(`[al:${metadata.album}]`)
    if (metadata.author) output.push(`[au:${metadata.author}]`)
    if (metadata.length) output.push(`[length:${metadata.length}]`)
    if (metadata.offset) output.push(`[offset:${metadata.offset}]`)
    if (output.length) output.push('')
  }

  // Add lines
  for (const line of lines) {
    const minutes = Math.floor(line.time / 60000)
    const seconds = Math.floor((line.time % 60000) / 1000)
    const centiseconds = Math.floor((line.time % 1000) / 10)

    const timestamp = `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}]`
    output.push(`${timestamp}${line.text}`)
  }

  return output.join('\n')
}
