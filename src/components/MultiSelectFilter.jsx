// MultiSelectFilter - 还原自 app.js PdMultiSelectFilter 组件
import { useState, useRef, useEffect } from 'react'

export default function MultiSelectFilter({ value = [], onChange, options = [], placeholder = '请选择' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { ref.current && !ref.current.contains(e.target) && setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <div
        className="flex items-center flex-wrap gap-1 border rounded-md px-2 min-h-[32px] bg-white cursor-pointer border-[#d9d9d9] hover:border-[#1890ff] transition-colors"
        onClick={() => setOpen(!open)}
      >
        {value.length === 0 && <span className="text-sm text-[rgba(0,0,0,0.25)] py-1">{placeholder}</span>}
        {value.map(v => {
          const opt = options.find(o => o.value === v)
          return (
            <span key={v} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#e6f7ff] text-[#1890ff] text-xs whitespace-nowrap flex-shrink-0">
              {opt ? opt.label : v}
              <svg className="w-3 h-3 cursor-pointer hover:text-[#ff4d4f]" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                onClick={e => { e.stopPropagation(); onChange(value.filter(x => x !== v)) }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          )
        })}
        <svg className="w-3 h-3 ml-auto text-[rgba(0,0,0,0.25)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-[#f0f0f0] z-20 py-1 max-h-60 overflow-auto">
          {options.map(opt => (
            <div
              key={opt.value}
              className="px-3 py-1.5 text-sm cursor-pointer hover:bg-[#f5f5f5] flex items-center gap-2 transition-colors"
              onClick={() => value.includes(opt.value)
                ? onChange(value.filter(v => v !== opt.value))
                : onChange([...value, opt.value])
              }
            >
              <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${value.includes(opt.value) ? 'bg-[#1890ff] border-[#1890ff]' : 'border-[#d9d9d9]'}`}>
                {value.includes(opt.value) && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
