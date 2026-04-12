// Toast 组件 - 还原自 app.js AntdToast + showToast + AntdToastContainer
import { useState, useEffect } from 'react'
import { CircleCheck, CircleAlert, TriangleAlert } from 'lucide-react'

// 全局 toast 状态（模块级单例，还原原版行为）
const _toastState = { toasts: [], listeners: new Set() }
const _notifyToast = () => { _toastState.listeners.forEach(fn => fn([..._toastState.toasts])) }
const _toastTimers = []

export function showToast({ type = 'success', message, description = '', duration = 3000 }) {
  const toast = { id: Date.now() + Math.random(), type, message, description, leaving: false }
  _toastState.toasts = [..._toastState.toasts, toast]
  _notifyToast()
  const timer = setTimeout(() => {
    _toastState.toasts = _toastState.toasts.map(t => t.id === toast.id ? { ...t, leaving: true } : t)
    _notifyToast()
    setTimeout(() => {
      _toastState.toasts = _toastState.toasts.filter(t => t.id !== toast.id)
      _notifyToast()
    }, 300)
  }, duration)
  _toastTimers.push(timer)
  return toast.id
}

function AntdToast({ toasts }) {
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 12, pointerEvents: 'none'
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          pointerEvents: 'auto', minWidth: 320, maxWidth: 400,
          background: '#fff', borderRadius: 8,
          boxShadow: '0 6px 16px rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12), 0 9px 28px 8px rgba(0,0,0,0.05)',
          padding: '16px 24px', display: 'flex', gap: 12, alignItems: 'flex-start',
          opacity: t.leaving ? 0 : 1,
          transform: t.leaving ? 'translateX(100%)' : 'translateX(0)',
          transition: 'opacity 0.3s, transform 0.3s',
        }}>
          <div style={{ flexShrink: 0, marginTop: 2 }}>
            {t.type === 'success'
              ? <CircleCheck style={{ width: 22, height: 22, color: '#52c41a' }} />
              : t.type === 'error'
                ? <CircleAlert style={{ width: 22, height: 22, color: '#ff4d4f' }} />
                : <TriangleAlert style={{ width: 22, height: 22, color: '#faad14' }} />
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.88)', lineHeight: '22px', marginBottom: t.description ? 4 : 0 }}>
              {t.message}
            </div>
            {t.description && (
              <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.65)', lineHeight: '22px' }}>
                {t.description}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export function AntdToastContainer() {
  const [toasts, setToasts] = useState([])
  useEffect(() => {
    const listener = t => setToasts(t)
    _toastState.listeners.add(listener)
    return () => _toastState.listeners.delete(listener)
  }, [])
  if (toasts.length === 0) return null
  return <AntdToast toasts={toasts} />
}
