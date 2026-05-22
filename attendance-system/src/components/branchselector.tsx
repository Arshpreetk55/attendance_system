'use client'

type Branch = 'CSE' | 'IT'

interface BranchSelectorProps {
  teacherName: string
  availableBranches: Branch[]
  onSelect: (branch: Branch) => void
}

const BRANCH_META: Record<Branch, { label: string; desc: string; color: string; bg: string; emoji: string }> = {
  CSE: {
    label: 'Computer Science & Engineering',
    desc:  'View CSE students, mark CSE attendance',
    color: '#2563eb',
    bg:    '#2563eb15',
    emoji: '💻',
  },
  IT: {
    label: 'Information Technology',
    desc:  'View IT students, mark IT attendance',
    color: '#7c3aed',
    bg:    '#7c3aed15',
    emoji: '🌐',
  },
}

function BranchSelector({ teacherName, availableBranches, onSelect }: BranchSelectorProps) {
  const single = availableBranches.length === 1

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-md space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto"
            style={{ background: 'var(--color-primary)' }}
          >
            {teacherName.charAt(0)}
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            Welcome, {teacherName.split(' ')[0]}!
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {single
              ? 'Entering your dashboard…'
              : 'You handle multiple branches. Which one would you like to open?'}
          </p>
        </div>

        {/* Branch cards */}
        <div className="space-y-3">
          {availableBranches.map((branch) => {
            const meta = BRANCH_META[branch]
            return (
              <button
                key={branch}
                onClick={() => onSelect(branch)}
                className="w-full text-left p-5 rounded-2xl border-2 transition-all duration-150 hover:scale-[1.01]"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: meta.bg }}
                  >
                    {meta.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
                        {branch}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: meta.bg, color: meta.color }}
                      >
                        Branch
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {meta.label}
                    </p>
                    <p className="text-xs mt-1" style={{ color: meta.color }}>
                      {meta.desc}
                    </p>
                  </div>
                  <span style={{ color: meta.color }}>{'→'}</span>
                </div>
              </button>
            )
          })}
        </div>

        {!single && (
          <p className="text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
            You can switch branches anytime from the dashboard header.
          </p>
        )}
      </div>
    </div>
  )
}

// Export both ways to prevent any default/named import mismatch
export { BranchSelector }
export default BranchSelector
