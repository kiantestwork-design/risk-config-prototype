import { Rocket, CirclePlay, CircleStop, Trash2, X } from 'lucide-react'

export default function BulkActionToolbar({ selectedCount, onAction, onClear }) {
  if (selectedCount === 0) return null
  return (
    <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-md p-3 mb-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded">已选 {selectedCount} 项</div>
        <span className="text-sm text-indigo-900">请选择批量操作：</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onAction('RELEASE')} className="flex items-center px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded text-sm hover:bg-indigo-100 transition-colors">
          <Rocket className="w-4 h-4 mr-2" />批量待发布
        </button>
        <button onClick={() => onAction('ENABLE')} className="flex items-center px-3 py-1.5 bg-white border border-green-200 text-green-700 rounded text-sm hover:bg-green-50 transition-colors">
          <CirclePlay className="w-4 h-4 mr-2" />批量启用
        </button>
        <button onClick={() => onAction('DISABLE')} className="flex items-center px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded text-sm hover:bg-slate-50 transition-colors">
          <CircleStop className="w-4 h-4 mr-2" />批量禁用
        </button>
        <div className="w-px h-6 bg-indigo-200 mx-1" />
        <button onClick={() => onAction('DELETE')} className="flex items-center px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded text-sm hover:bg-red-50 transition-colors">
          <Trash2 className="w-4 h-4 mr-2" />批量删除
        </button>
        <button onClick={onClear} className="p-1.5 text-slate-400 hover:text-slate-600 ml-2">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
