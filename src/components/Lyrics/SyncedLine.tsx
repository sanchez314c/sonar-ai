import { motion } from 'framer-motion'
import { theme } from '../../styles/theme'

export type LineState = 'past' | 'current' | 'future'

interface SyncedLineProps {
  text: string
  state: LineState
  index: number
  fontSize: number
  onClick?: () => void
}

const stateStyles: Record<LineState, { color: string; opacity: number; scale: number }> = {
  past: {
    color: theme.colors.textMuted,
    opacity: 0.6,
    scale: 1,
  },
  current: {
    color: theme.colors.teal,
    opacity: 1,
    scale: 1.05,
  },
  future: {
    color: theme.colors.textSecondary,
    opacity: 0.9,
    scale: 1,
  },
}

export function SyncedLine({ text, state, index, fontSize, onClick }: SyncedLineProps) {
  const styles = stateStyles[state]

  // Empty lines render as spacers
  if (!text.trim()) {
    return <div className="h-6" data-lyric-line data-index={index} />
  }

  return (
    <motion.div
      data-lyric-line
      data-index={index}
      className="px-6 py-2 cursor-pointer transition-all duration-300 relative"
      style={{
        fontSize: state === 'current' ? fontSize * 1.1 : fontSize,
      }}
      initial={false}
      animate={{
        color: styles.color,
        opacity: styles.opacity,
        scale: styles.scale,
        fontWeight: state === 'current' ? 600 : 400,
      }}
      transition={{
        duration: 0.3,
        ease: 'easeOut',
      }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      aria-current={state === 'current' ? 'true' : undefined}
      whileHover={{
        opacity: 1,
        scale: state === 'current' ? 1.05 : 1.02,
      }}
    >
      {/* Current line glow effect — enhanced neo-noir teal highlight */}
      {state === 'current' && (
        <motion.div
          className="absolute inset-0 -z-10 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            background: 'linear-gradient(90deg, rgba(20, 184, 166, 0.08) 0%, rgba(20, 184, 166, 0.15) 50%, rgba(20, 184, 166, 0.08) 100%)',
            marginLeft: '-1rem',
            marginRight: '-1rem',
            paddingLeft: '1rem',
            paddingRight: '1rem',
            boxShadow: 'inset 0 0 20px rgba(20, 184, 166, 0.06)',
            borderLeft: '2px solid rgba(20, 184, 166, 0.4)',
          }}
        />
      )}

      <span className={state === 'current' ? 'text-shadow-glow' : ''}>
        {text}
      </span>
    </motion.div>
  )
}
