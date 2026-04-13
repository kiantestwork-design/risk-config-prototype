// ConfirmPopover - 自管理 + 受控两用确认弹框
// 不传 visible → 自管理模式（点击 children 打开）
// 传 visible → 受控模式（外部控制开关）
import { useState, useRef, useEffect } from 'react'

export default function ConfirmPopover({ visible: controlledVisible, onConfirm, onCancel, message, children }) {
  const [internalVisible, setInternalVisible] = useState(false)
  const popoverRef = useRef(null)

  const isControlled = controlledVisible !== undefined
  const isOpen = isControlled ? controlledVisible : internalVisible

  const handleTriggerClick = (e) => {
    if (!isControlled) {
      e.stopPropagation()
      setInternalVisible(v => !v)
    }
  }

  const handleConfirm = () => {
    onConfirm?.()
    if (!isControlled) setInternalVisible(false)
  }

  const handleCancel = () => {
    onCancel?.()
    if (!isControlled) setInternalVisible(false)
  }

  // Click outside to close (uncontrolled mode only)
  useEffect(() => {
    if (!isOpen || isControlled) return
    const handler = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setInternalVisible(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, isControlled])

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {children && (
        <div onClick={handleTriggerClick}>
          {children}
        </div>
      )}
      {isOpen && (
        <div className="confirm-popover">
          <div className="text-sm text-[rgba(0,0,0,0.88)] mb-2 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-[#faad14] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {message}
          </div>
          <div className="flex justify-end gap-2">
            <button
              className="h-6 px-2 text-xs rounded border border-[#d9d9d9] bg-white text-[rgba(0,0,0,0.65)] hover:border-[#1890ff] hover:text-[#1890ff] transition-colors"
              onClick={handleCancel}
            >
              取消
            </button>
            <button
              className="h-6 px-2 text-xs rounded bg-[#ff4d4f] text-white border-none hover:bg-[#ff7875] transition-colors"
              onClick={handleConfirm}
            >
              确认删除
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
