// SearchSelect - 还原自 app.js PdSearchSelect 组件
import { useState, useRef, useEffect } from 'react'

export default function SearchSelect({ value, onChange, options = [], placeholder = '请选择', disabled = false }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { ref.current && !ref.current.contains(e.target) && setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = options.filter(opt => (opt.label || opt.name || '').toLowerCase().includes(search.toLowerCase()))
  const selected = options.find(opt => (opt.value !== undefined ? opt.value : opt.id || opt.name) === value)
  const displayText = selected ? (selected.label || selected.name || '') : ''

  return (
    <div className="relative" ref={ref}>
      <div
        className={`flex items-center border rounded-md px-3 h-8 bg-white transition-colors ${disabled ? 'bg-[#f5f5f5] cursor-not-allowed border-[#d9d9d9]' : 'cursor-pointer border-[#d9d9d9] hover:border-[#1890ff]'}`}
        onClick={() => { !disabled && setOpen(!open) }}
      >
        <span className={`flex-1 text-sm truncate ${displayText ? 'text-[rgba(0,0,0,0.88)]' : 'text-[rgba(0,0,0,0.25)]'}`}>
          {displayText || placeholder}
        </span>
        <svg className="w-3 h-3 ml-1 text-[rgba(0,0,0,0.25)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-[#f0f0f0] z-20 py-1 max-h-60 overflow-auto">
          <div className="px-2 py-1.5">
            <input
              type="text"
              className="w-full border border-[#d9d9d9] rounded px-2 h-7 text-sm outline-none focus:border-[#1890ff]"
              placeholder="搜索..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          {filtered.length === 0 && <div className="px-3 py-2 text-sm text-[rgba(0,0,0,0.25)]">无匹配项</div>}
          {filtered.map(opt => {
            const val = opt.value !== undefined ? opt.value : opt.id || opt.name
            return (
              <div
                key={val}
                className={`px-3 py-1.5 text-sm cursor-pointer transition-colors ${val === value ? 'bg-[#e6f7ff] text-[#1890ff]' : 'hover:bg-[#f5f5f5]'}`}
                onClick={() => { onChange(val); setOpen(false); setSearch('') }}
              >
                {opt.label || opt.name || ''}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
