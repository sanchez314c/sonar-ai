export { ipc } from './ipc'
export type { SongInfo, LyricsResult, Config, SaveResult, ServiceResult } from './ipc'
export {
  parseLRC,
  parseLRCWithMetadata,
  findCurrentLineIndex,
  toLRCString,
  type LRCLine,
  type LRCMetadata,
  type ParsedLRC
} from './lrcParser'
