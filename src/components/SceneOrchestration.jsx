// 场景编排容器组件 - 接入点详情 Tab 2
import SceneCard from './SceneCard'

const SCENES = [
  { code: 'PRE', name: '事前场景', color: 'blue' },
  { code: 'PROCESS', name: '事中场景', color: 'green' },
  { code: 'POST', name: '事后场景', color: 'orange' },
]

export default function SceneOrchestration({ eventPointCode, sceneFeatures = {}, availableFeatures = [], availableProperties = [], onChange, readOnly }) {
  const handleSceneChange = (sceneCode, features) => {
    const updated = { ...sceneFeatures, [sceneCode]: features }
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-slate-800 mb-1">场景编排</h3>
        <p className="text-xs text-[rgba(0,0,0,0.45)] mb-4">
          接入点 <span className="font-mono text-[#1890ff]">{eventPointCode}</span> 的三阶段场景配置。
          每个场景可绑定特征并指定执行动作（READ/WRITE/DELETE）和进入条件。
        </p>
        <div className="space-y-4">
          {SCENES.map(scene => (
            <SceneCard
              key={scene.code}
              sceneName={scene.name}
              sceneCode={scene.code}
              sceneColor={scene.color}
              features={sceneFeatures[scene.code] || []}
              availableFeatures={availableFeatures}
              availableProperties={availableProperties}
              onChange={(features) => handleSceneChange(scene.code, features)}
              readOnly={readOnly}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
