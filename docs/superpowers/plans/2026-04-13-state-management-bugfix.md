# State Management & Interaction Bugfix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 6 bugs where page-local state diverges from App top-level state, ConfirmPopover doesn't render children, checkbox events double-fire, and dirty detection misses rule associations.

**Architecture:** All mutations flow through App-level callbacks; pages become stateless views of App props. EntityEditorShell gains an `extraDirtyCheck` prop for extended dirty detection. ConfirmPopover is rewritten to self-manage visibility while remaining backward-compatible with controlled mode.

**Tech Stack:** React 18 (useState/useCallback/useRef/useEffect), Vite, Tailwind CSS

---

### Task 1: Fix ConfirmPopover to render children and self-manage visibility (Bug 3)

This is the lowest-risk, highest-isolation fix. Do it first so ExtractionConfig and SceneCard delete buttons start working immediately.

**Files:**
- Modify: `src/components/ConfirmPopover.jsx` (full rewrite)

- [ ] **Step 1: Rewrite ConfirmPopover**

Replace the entire file with a component that:
- Renders `children` as the trigger element
- Self-manages `visible` state when no `visible` prop is passed (uncontrolled mode)
- Uses external `visible` prop when passed (controlled mode for PropertyDictionary)
- Adds click-outside detection to auto-close

```jsx
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
```

- [ ] **Step 2: Verify in browser**

Run: `npm run dev`

Test manually:
1. Navigate to an entry point detail → Tab "属性提取配置" → verify delete icon (Trash2) is now visible
2. Click delete icon → verify ConfirmPopover appears
3. Click "取消" → popover closes
4. Click delete icon again → click "确认删除" → row is removed
5. Navigate to Tab "场景编排" → verify same behavior on scene feature delete
6. Navigate to 属性字典 → verify the existing controlled-mode delete still works (click "删除" text → popover appears)

- [ ] **Step 3: Commit**

```bash
git add src/components/ConfirmPopover.jsx
git commit -m "fix: rewrite ConfirmPopover to render children and self-manage visibility (Bug 3)"
```

---

### Task 2: Fix RulePickerModal checkbox double-toggle (Bug 4)

**Files:**
- Modify: `src/components/RulePickerModal.jsx:82`

- [ ] **Step 1: Add stopPropagation to checkbox onChange**

In `src/components/RulePickerModal.jsx`, change line 82 from:

```jsx
                      checked={selected.has(r.id)} onChange={() => toggleRow(r.id)} />
```

to:

```jsx
                      checked={selected.has(r.id)} onChange={(e) => { e.stopPropagation(); toggleRow(r.id) }} />
```

- [ ] **Step 2: Also fix the header checkbox toggleAll**

The header checkbox at line 71 also has a potential issue — the `toggleAll` handler on the `<th>` row might bubble. Add stopPropagation there too:

```jsx
                    onChange={toggleAll} />
```

to:

```jsx
                    onChange={(e) => { e.stopPropagation(); toggleAll() }} />
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`

Test: Navigate to a strategy edit page → click "添加规则" → in the RulePickerModal:
1. Click a checkbox → rule should be selected (blue highlight, checkbox checked)
2. Click the same checkbox again → rule should be deselected
3. Click the row (not checkbox) → rule should toggle correctly
4. Click header checkbox → all rules on page selected; click again → all deselected

- [ ] **Step 4: Commit**

```bash
git add src/components/RulePickerModal.jsx
git commit -m "fix: prevent checkbox double-toggle in RulePickerModal via stopPropagation (Bug 4)"
```

---

### Task 3: Add `extraDirtyCheck` to EntityEditorShell (Bug 1 & Bug 6 foundation)

**Files:**
- Modify: `src/components/EntityEditorShell.jsx:103,115`

- [ ] **Step 1: Add `extraDirtyCheck` prop**

In `src/components/EntityEditorShell.jsx`, modify the component signature at line 103:

```jsx
export default function EntityEditorShell({ entityName, item, isNew, fields, onSave, onBack, versions = [], renderForm, extraSections, initialMode, headerBanner, showDraftPublish, onSubmitReady }) {
```

to:

```jsx
export default function EntityEditorShell({ entityName, item, isNew, fields, onSave, onBack, versions = [], renderForm, extraSections, initialMode, headerBanner, showDraftPublish, onSubmitReady, extraDirtyCheck }) {
```

- [ ] **Step 2: Extend isDirty to include extraDirtyCheck**

At line 115, change:

```jsx
  const isDirty = useCallback(() => JSON.stringify(edited) !== baseline.current, [edited])
```

to:

```jsx
  const isDirty = useCallback(() => {
    if (JSON.stringify(edited) !== baseline.current) return true
    if (extraDirtyCheck && extraDirtyCheck()) return true
    return false
  }, [edited, extraDirtyCheck])
```

- [ ] **Step 3: Verify no regressions**

Run: `npm run dev`

Test: Open any entity editor (e.g., entry point, feature, rule) that does NOT pass `extraDirtyCheck`:
1. Enter edit mode → make a change → click back → should see "有未保存的修改" dialog
2. Enter edit mode → don't change → click back → should navigate directly

- [ ] **Step 4: Commit**

```bash
git add src/components/EntityEditorShell.jsx
git commit -m "feat: add extraDirtyCheck prop to EntityEditorShell for extended dirty detection (Bug 1/6)"
```

---

### Task 4: Fix EntryPointList extraction/scene deferred commit (Bug 1)

**Files:**
- Modify: `src/pages/EntryPointList.jsx:25-27,106-215`

- [ ] **Step 1: Add pending state and wire up deferred commit**

In `src/pages/EntryPointList.jsx`, add pending state declarations after line 35 (after `batchAction`):

```jsx
  const [pendingExtractions, setPendingExtractions] = useState(null)
  const [pendingSceneFeatures, setPendingSceneFeatures] = useState(null)
```

- [ ] **Step 2: Initialize pending state when entering editor**

Modify the `openView` and `openEdit` functions (lines 55-57). Replace:

```jsx
  const openView = (ep) => { setSelectedItem(ep); setInitialMode('view'); setMode('EDITOR') }
  const openEdit = (ep) => { setSelectedItem(ep); setInitialMode('edit'); setMode('EDITOR') }
  const openNew = () => { setSelectedItem(null); setInitialMode('edit'); setMode('EDITOR') }
```

with:

```jsx
  const openView = (ep) => { setSelectedItem(ep); setInitialMode('view'); setPendingExtractions(null); setPendingSceneFeatures(null); setMode('EDITOR') }
  const openEdit = (ep) => {
    setSelectedItem(ep)
    setInitialMode('edit')
    const epCode = ep.eventPoint || ''
    setPendingExtractions(extractions[epCode] || [])
    setPendingSceneFeatures(sceneFeatures[epCode] || { PRE: [], PROCESS: [], POST: [] })
    setMode('EDITOR')
  }
  const openNew = () => { setSelectedItem(null); setInitialMode('edit'); setPendingExtractions(null); setPendingSceneFeatures(null); setMode('EDITOR') }
```

- [ ] **Step 3: Modify handleSave to commit pending data**

Replace the existing `handleSave` function (lines 59-71):

```jsx
  const handleSave = (data) => {
    let saved
    if (selectedItem) {
      saved = { ...selectedItem, ...data }
      setItems(prev => prev.map(ep => ep.id === saved.id ? saved : ep))
    } else {
      const newId = items.length ? Math.max(...items.map(ep => ep.id)) + 1 : 1
      saved = { id: newId, eventPoint: data.eventPoint || '', description: data.description || '', status: data.status ?? 1, lifecycleState: 'DRAFT', createAt: new Date().toISOString().replace('T', ' ').slice(0, 19), updateAt: data.updateAt || '', operator: data.operator || '' }
      setItems(prev => [...prev, saved])
    }
    onSaveEntryPoint(saved)
    return saved
  }
```

with:

```jsx
  const handleSave = (data) => {
    let saved
    if (selectedItem) {
      saved = { ...selectedItem, ...data }
    } else {
      const maxId = entryPoints.length ? Math.max(...entryPoints.map(ep => ep.id)) + 1 : 1
      saved = { id: maxId, eventPoint: data.eventPoint || '', description: data.description || '', status: data.status ?? 1, lifecycleState: 'DRAFT', createAt: new Date().toISOString().replace('T', ' ').slice(0, 19), updateAt: data.updateAt || '', operator: data.operator || '' }
    }
    onSaveEntryPoint(saved)
    // Commit pending extraction/scene data
    const epCode = saved.eventPoint || ''
    if (pendingExtractions !== null) {
      onSaveExtractions(epCode, pendingExtractions)
    }
    if (pendingSceneFeatures !== null) {
      onSaveSceneFeatures(epCode, pendingSceneFeatures)
    }
    return saved
  }
```

- [ ] **Step 4: Change Tab onChange to write to pending state**

In the EDITOR rendering block (around lines 194-212), replace:

```jsx
            {/* Tab 1: 属性提取配置 */}
            {epTab === 1 && selectedItem && (
              <ExtractionConfig
                eventPointCode={epCode}
                extractions={epExtractions}
                standardProperties={properties}
                onChange={(list) => onSaveExtractions(epCode, list)}
                readOnly={m === 'view'}
              />
            )}

            {/* Tab 2: 场景编排 */}
            {epTab === 2 && selectedItem && (
              <SceneOrchestration
                eventPointCode={epCode}
                sceneFeatures={epScenes}
                availableFeatures={features}
                availableProperties={extractedProps}
                onChange={(scenes) => onSaveSceneFeatures(epCode, scenes)}
                readOnly={m === 'view'}
              />
            )}
```

with:

```jsx
            {/* Tab 1: 属性提取配置 */}
            {epTab === 1 && selectedItem && (
              <ExtractionConfig
                eventPointCode={epCode}
                extractions={m === 'edit' && pendingExtractions !== null ? pendingExtractions : epExtractions}
                standardProperties={properties}
                onChange={(list) => {
                  if (m === 'edit') setPendingExtractions(list)
                  else onSaveExtractions(epCode, list)
                }}
                readOnly={m === 'view'}
              />
            )}

            {/* Tab 2: 场景编排 */}
            {epTab === 2 && selectedItem && (
              <SceneOrchestration
                eventPointCode={epCode}
                sceneFeatures={m === 'edit' && pendingSceneFeatures !== null ? pendingSceneFeatures : epScenes}
                availableFeatures={features}
                availableProperties={m === 'edit' && pendingExtractions !== null ? pendingExtractions.map(e => ({ propertyName: e.propertyName, propertyDesc: e.propertyDesc })) : extractedProps}
                onChange={(scenes) => {
                  if (m === 'edit') setPendingSceneFeatures(scenes)
                  else onSaveSceneFeatures(epCode, scenes)
                }}
                readOnly={m === 'view'}
              />
            )}
```

- [ ] **Step 5: Add extraDirtyCheck and initialize pending on edit mode switch**

We need to handle the case where user clicks "编辑" button from within the editor (view → edit). Add `useCallback` to imports if not already present, then add the `extraDirtyCheck` callback and pass it to EntityEditorShell.

First, add `useCallback` to the import at line 2:

```jsx
import { useState, useMemo, useEffect, useCallback } from 'react'
```

Then, inside the EDITOR block (before the `return` that renders EntityEditorShell), add:

```jsx
    const initialExtractionsRef = useRef(JSON.stringify(epExtractions))
    const initialScenesRef = useRef(JSON.stringify(epScenes))

    const extraDirtyCheck = useCallback(() => {
      if (pendingExtractions !== null && JSON.stringify(pendingExtractions) !== initialExtractionsRef.current) return true
      if (pendingSceneFeatures !== null && JSON.stringify(pendingSceneFeatures) !== initialScenesRef.current) return true
      return false
    }, [pendingExtractions, pendingSceneFeatures])
```

Also add `useRef` to the import:

```jsx
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
```

Then pass `extraDirtyCheck` to EntityEditorShell:

```jsx
      <EntityEditorShell
        entityName="接入点"
        item={selectedItem}
        isNew={!selectedItem}
        initialMode={initialMode}
        onBack={() => { setMode('LIST'); setEpTab(0) }}
        onSave={handleSave}
        versions={versions}
        extraDirtyCheck={extraDirtyCheck}
```

We also need to handle EntityEditorShell's `handleEdit` callback, which switches from view to edit mode. When the user clicks "编辑" from view mode, we need to initialize the pending state. Add an effect for this:

```jsx
    // When shell switches to edit mode, initialize pending state from current props
    useEffect(() => {
      if (initialMode === 'edit' && pendingExtractions === null && selectedItem) {
        setPendingExtractions(epExtractions)
        setPendingSceneFeatures(epScenes)
      }
    }, [])
```

Actually, let's simplify. The `openEdit` already sets the pending state. But when user is in view mode and clicks the "编辑" button inside EntityEditorShell, we don't get a callback. Let's handle this differently — always initialize pending state when we're in EDITOR mode and it's null:

Remove the effect approach. Instead, in the EntityEditorShell rendering, we can watch for when the shell switches to edit mode. But EntityEditorShell doesn't expose an onModeChange callback.

Simpler approach: always initialize pending state when entering EDITOR, even for view mode. When in view mode, pending state is just a staging area that hasn't been used yet. Change `openView`:

```jsx
  const openView = (ep) => {
    setSelectedItem(ep)
    setInitialMode('view')
    const epCode = ep.eventPoint || ''
    setPendingExtractions(extractions[epCode] || [])
    setPendingSceneFeatures(sceneFeatures[epCode] || { PRE: [], PROCESS: [], POST: [] })
    setMode('EDITOR')
  }
```

This way pending state is always available when the user switches to edit mode inside the shell.

- [ ] **Step 6: Verify in browser**

Run: `npm run dev`

Test Bug 1 fix:
1. Open entry point detail → switch to "属性提取配置" tab
2. Enter edit mode → add a new extraction mapping → do NOT click save
3. Click "取消" → the extraction should NOT have been saved to App state
4. Re-open the same entry point → the extraction list should be unchanged
5. Enter edit mode → add a mapping → click "保存" → extraction is now persisted
6. Repeat tests with "场景编排" tab

- [ ] **Step 7: Commit**

```bash
git add src/pages/EntryPointList.jsx
git commit -m "fix: defer extraction/scene changes until save in EntryPointList (Bug 1)"
```

---

### Task 5: Fix EntryPointList delete/batch to use App callbacks (Bug 2 — EntryPointList)

**Files:**
- Modify: `src/App.jsx` (add new callbacks + route props)
- Modify: `src/pages/EntryPointList.jsx` (remove local items state, use props)

- [ ] **Step 1: Add delete and batch callbacks in App.jsx**

In `src/App.jsx`, after the `onSaveSceneFeatures` function (line 181), add:

```jsx
  const onDeleteEntryPoint = (id) => {
    setEntryPoints(prev => prev.filter(ep => ep.id !== id))
  }
  const onBatchUpdateEntryPoints = (ids, changes) => {
    setEntryPoints(prev => prev.map(ep => ids.includes(ep.id) ? { ...ep, ...changes } : ep))
  }
  const onBatchDeleteEntryPoints = (ids) => {
    setEntryPoints(prev => prev.filter(ep => !ids.includes(ep.id)))
  }
```

- [ ] **Step 2: Pass new callbacks to EntryPointList route**

In `src/App.jsx`, line 406, modify the EntryPointList route element to pass the new callbacks:

```jsx
<Route path="/event-points" element={<EntryPointList entryPoints={entryPoints} onSaveEntryPoint={onSaveEntryPoint} onDeleteEntryPoint={onDeleteEntryPoint} onBatchUpdateEntryPoints={onBatchUpdateEntryPoints} onBatchDeleteEntryPoints={onBatchDeleteEntryPoints} onAddToDrafts={onAddToDrafts} activations={activations} properties={properties} features={features} extractions={extractions} sceneFeatures={sceneFeatures} onSaveExtractions={onSaveExtractions} onSaveSceneFeatures={onSaveSceneFeatures} />} />
```

- [ ] **Step 3: Remove local items state from EntryPointList**

In `src/pages/EntryPointList.jsx`, modify the component signature to accept new props:

```jsx
export default function EntryPointList({ entryPoints, onSaveEntryPoint, onDeleteEntryPoint, onBatchUpdateEntryPoints, onBatchDeleteEntryPoints, onAddToDrafts, activations = [], properties = [], features = [], extractions = {}, sceneFeatures = {}, onSaveExtractions, onSaveSceneFeatures }) {
```

Remove lines 26-27:

```jsx
  const [items, setItems] = useState(entryPoints)
  useEffect(() => { setItems(entryPoints) }, [entryPoints])
```

- [ ] **Step 4: Replace all `items` references with `entryPoints`**

Throughout the file, replace `items` with `entryPoints` in filtering and rendering:

In `filtered` useMemo (line 37):
```jsx
  const filtered = useMemo(() => entryPoints.filter(ep => {
```
Change the dependency array to `[entryPoints, applied]`.

- [ ] **Step 5: Replace handleDelete to use App callback**

Replace:
```jsx
  const handleDelete = (id) => {
    if (confirm('确定要删除该接入点吗？此操作不可恢复。')) {
      setItems(prev => prev.filter(ep => ep.id !== id))
      const next = new Set(selected); next.delete(id); setSelected(next)
    }
  }
```

with:
```jsx
  const handleDelete = (id) => {
    if (confirm('确定要删除该接入点吗？此操作不可恢复。')) {
      onDeleteEntryPoint(id)
      const next = new Set(selected); next.delete(id); setSelected(next)
    }
  }
```

- [ ] **Step 6: Replace executeBatch to use App callbacks**

Replace the `executeBatch` function:

```jsx
  const executeBatch = (eligibleItems) => {
    const ids = eligibleItems.map(it => it.id)
    if (batchAction === 'RELEASE') {
      eligibleItems.forEach(it => {
        onAddToDrafts({ id: `DFT-${Date.now()}-${it.id}`, type: 'ENTRY_POINT', targetId: String(it.id), targetName: it.eventPoint, version: 'vNext', relatedKeys: it.eventPoint, updatedAt: new Date().toISOString(), editor: 'current_user', changeSummary: '批量加入发布清单' })
      })
      onBatchUpdateEntryPoints(ids, { lifecycleState: 'READY' })
    } else if (batchAction === 'ENABLE' || batchAction === 'DISABLE') {
      const newStatus = batchAction === 'ENABLE' ? 1 : 2
      onBatchUpdateEntryPoints(ids, { status: newStatus, lifecycleState: 'DRAFT', updateAt: new Date().toISOString().replace('T', ' ').slice(0, 19) })
    } else if (batchAction === 'DELETE') {
      onBatchDeleteEntryPoints(ids)
    }
    setSelected(new Set())
    setBatchModalVisible(false)
  }
```

- [ ] **Step 7: Fix handleSave (no more local setItems)**

The `handleSave` in Task 4 already calls `onSaveEntryPoint(saved)` without `setItems`. Verify it doesn't reference `setItems` anymore. The `maxId` computation should reference `entryPoints` not `items` (already done in Task 4).

- [ ] **Step 8: Fix BulkConfirmModal selectedItems prop**

Line 378 references `items.filter(...)`. Change to `entryPoints.filter(...)`:

```jsx
      <BulkConfirmModal
        visible={batchModalVisible}
        action={batchAction}
        selectedItems={entryPoints.filter(it => selected.has(it.id))}
```

- [ ] **Step 9: Verify in browser**

Run: `npm run dev`

Test:
1. Delete an entry point → navigate away → navigate back → entry point should remain deleted
2. Batch enable/disable → navigate away → navigate back → status changes persisted
3. Batch delete → navigate away → navigate back → entries should remain deleted

- [ ] **Step 10: Commit**

```bash
git add src/App.jsx src/pages/EntryPointList.jsx
git commit -m "fix: EntryPointList delete/batch ops write to App state instead of local copy (Bug 2)"
```

---

### Task 6: Fix ActivationList delete/batch to use App callbacks (Bug 2 — ActivationList)

**Files:**
- Modify: `src/App.jsx` (add activation callbacks)
- Modify: `src/pages/ActivationList.jsx` (remove local items state)

- [ ] **Step 1: Add activation callbacks in App.jsx**

In `src/App.jsx`, after the entryPoint batch callbacks (added in Task 5), add:

```jsx
  const onDeleteActivation = (id) => {
    setActivations(prev => prev.filter(a => a.id !== id))
  }
  const onBatchUpdateActivations = (ids, changes) => {
    setActivations(prev => prev.map(a => ids.includes(a.id) ? { ...a, ...changes } : a))
  }
  const onBatchDeleteActivations = (ids) => {
    setActivations(prev => prev.filter(a => !ids.includes(a.id)))
  }
```

- [ ] **Step 2: Pass new callbacks to ActivationList route**

In `src/App.jsx`, line 408, update the ActivationList route:

```jsx
<Route path="/activations" element={<ActivationList activations={activations} onSaveActivation={onSaveActivation} onDeleteActivation={onDeleteActivation} onBatchUpdateActivations={onBatchUpdateActivations} onBatchDeleteActivations={onBatchDeleteActivations} onAddToDrafts={onAddToDrafts} entryPoints={entryPoints} rules={rules} />} />
```

- [ ] **Step 3: Update ActivationList component signature and remove local items state**

In `src/pages/ActivationList.jsx`, update the signature:

```jsx
export default function ActivationList({ activations, onSaveActivation, onDeleteActivation, onBatchUpdateActivations, onBatchDeleteActivations, onAddToDrafts, entryPoints = [], rules = [] }) {
```

Remove lines 19-20:
```jsx
  const [items, setItems] = useState(activations)
  useEffect(() => { setItems(activations) }, [activations])
```

- [ ] **Step 4: Replace all `items` with `activations` in filtering/rendering**

In `allEpOpts` (line 30): change `items` → `activations`
In `allSceneOpts` (line 31): change `items` → `activations`
In `filtered` useMemo (line 33): change `items.filter` → `activations.filter`, deps to `[activations, applied]`

- [ ] **Step 5: Replace handleDelete**

```jsx
  const handleDelete = (id) => {
    if (confirm('确定要删除该策略吗？此操作不可恢复。')) {
      onDeleteActivation(id)
      const next = new Set(selected); next.delete(id); setSelected(next)
    }
  }
```

- [ ] **Step 6: Replace handleSave (no more local setItems)**

```jsx
  const handleSave = (data) => {
    let saved
    const dataWithRules = { ...data, ruleIds: editRuleIds }
    if (selectedItem) {
      saved = { ...selectedItem, ...dataWithRules }
    } else {
      const newId = activations.length ? Math.max(...activations.map(a => a.id)) + 1 : 1
      saved = { id: newId, name: dataWithRules.name || '', description: dataWithRules.description || '', eventPoint: dataWithRules.eventPoint || '', scenes: [], status: dataWithRules.status ?? 1, lifecycleState: 'DRAFT', priority: dataWithRules.priority || 1, thresholds: [], ruleIds: editRuleIds, createAt: new Date().toISOString().replace('T', ' ').slice(0, 19), updateAt: dataWithRules.updateAt || '', operator: dataWithRules.operator || '' }
    }
    onSaveActivation(saved)
    return saved
  }
```

- [ ] **Step 7: Replace executeBatch**

```jsx
  const executeBatch = (eligibleItems) => {
    const ids = eligibleItems.map(it => it.id)
    if (batchAction === 'RELEASE') {
      eligibleItems.forEach(it => {
        onAddToDrafts({ id: `DFT-${Date.now()}-${it.id}`, type: 'ACTIVATION', targetId: String(it.id), targetName: it.name, version: 'vNext', relatedKeys: it.eventPoint || '', updatedAt: new Date().toISOString(), editor: 'current_user', changeSummary: '批量加入发布清单' })
      })
      onBatchUpdateActivations(ids, { lifecycleState: 'READY' })
    } else if (batchAction === 'ENABLE' || batchAction === 'DISABLE') {
      const newStatus = batchAction === 'ENABLE' ? 1 : 2
      onBatchUpdateActivations(ids, { status: newStatus, lifecycleState: 'DRAFT', updateAt: new Date().toISOString().replace('T', ' ').slice(0, 19) })
    } else if (batchAction === 'DELETE') {
      onBatchDeleteActivations(ids)
    }
    setSelected(new Set())
    setBatchModalVisible(false)
  }
```

- [ ] **Step 8: Fix BulkConfirmModal selectedItems prop**

Change `items.filter` to `activations.filter`:

```jsx
      <BulkConfirmModal
        visible={batchModalVisible}
        action={batchAction}
        selectedItems={activations.filter(it => selected.has(it.id))}
```

- [ ] **Step 9: Verify in browser**

Same test pattern as Task 5 but for the activation/策略 list page.

- [ ] **Step 10: Commit**

```bash
git add src/App.jsx src/pages/ActivationList.jsx
git commit -m "fix: ActivationList delete/batch ops write to App state instead of local copy (Bug 2)"
```

---

### Task 7: Fix ActivationList rule association dirty detection (Bug 6)

**Files:**
- Modify: `src/pages/ActivationList.jsx:50-52,104-107`

- [ ] **Step 1: Add useCallback and useRef imports**

At line 2, ensure imports include:

```jsx
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
```

- [ ] **Step 2: Store initial ruleIds for dirty comparison**

After the `editRuleIds` state declaration (line 102), add:

```jsx
  const initialRuleIdsRef = useRef('[]')
```

Update `openView`, `openEdit`, and `openNew` to set the ref:

```jsx
  const openView = (act) => { setSelectedItem(act); setInitialMode('view'); setEditRuleIds(act.ruleIds || []); initialRuleIdsRef.current = JSON.stringify(act.ruleIds || []); setMode('EDITOR') }
  const openEdit = (act) => { setSelectedItem(act); setInitialMode('edit'); setEditRuleIds(act.ruleIds || []); initialRuleIdsRef.current = JSON.stringify(act.ruleIds || []); setMode('EDITOR') }
  const openNew = () => { setSelectedItem(null); setInitialMode('edit'); setEditRuleIds([]); initialRuleIdsRef.current = '[]'; setMode('EDITOR') }
```

- [ ] **Step 3: Add extraDirtyCheck callback and pass to EntityEditorShell**

Inside the `if (mode === 'EDITOR')` block, before the return statement, add:

```jsx
    const extraDirtyCheck = useCallback(() => {
      return JSON.stringify(editRuleIds) !== initialRuleIdsRef.current
    }, [editRuleIds])
```

Then pass it to EntityEditorShell:

```jsx
      <EntityEditorShell
        entityName="策略"
        item={selectedItem}
        isNew={!selectedItem}
        initialMode={initialMode}
        onBack={() => setMode('LIST')}
        onSave={handleSave}
        versions={actVersions}
        extraDirtyCheck={extraDirtyCheck}
```

- [ ] **Step 4: Verify in browser**

Run: `npm run dev`

Test:
1. Open a strategy in edit mode → only add/remove/reorder a rule (don't change basic form fields)
2. Click "返回" or "取消" → should see "有未保存的修改" dialog
3. Open a strategy in edit mode → don't change anything → click "返回" → should navigate directly

- [ ] **Step 5: Commit**

```bash
git add src/pages/ActivationList.jsx
git commit -m "fix: include rule association changes in dirty detection for ActivationList (Bug 6)"
```

---

### Task 8: Lift PropertyDictionary to shared App state (Bug 5)

**Files:**
- Modify: `src/App.jsx` (expose properties callbacks, pass to PropertyDictionary route)
- Modify: `src/pages/PropertyDictionary.jsx` (use props instead of local state)

- [ ] **Step 1: Make properties writable in App.jsx**

At line 101, change:
```jsx
  const [properties] = useState(MOCK_PROPERTIES)
```
to:
```jsx
  const [properties, setProperties] = useState(MOCK_PROPERTIES)
```

- [ ] **Step 2: Add property CRUD callbacks in App.jsx**

After the batch activation callbacks, add:

```jsx
  const onSaveProperty = (property) => {
    setProperties(prev => {
      const idx = prev.findIndex(p => p.id === property.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = property; return next }
      return [...prev, property]
    })
  }
  const onDeleteProperty = (id) => {
    setProperties(prev => prev.filter(p => p.id !== id))
  }
```

- [ ] **Step 3: Update PropertyDictionary route to pass props**

At line 405, change:
```jsx
<Route path="/property-dictionary" element={<PropertyDictionary />} />
```
to:
```jsx
<Route path="/property-dictionary" element={<PropertyDictionary properties={properties} extractions={extractions} onSaveProperty={onSaveProperty} onDeleteProperty={onDeleteProperty} />} />
```

- [ ] **Step 4: Rewrite PropertyDictionary to use props**

In `src/pages/PropertyDictionary.jsx`, change the component signature (line 95):

```jsx
export default function PropertyDictionary({ properties = [], extractions = {}, onSaveProperty, onDeleteProperty }) {
```

Remove the local items state (line 96):
```jsx
  const [items, setItems] = useState(MOCK_PROPERTIES.map(p => ({ ...p })))
```

Also remove the `MOCK_PROPERTIES` import at line 3:
```jsx
import { MOCK_PROPERTIES } from '../config/mock/properties'
```

- [ ] **Step 5: Compute refCount from extractions**

Add a `useMemo` to compute items with dynamic refCount:

```jsx
  const items = useMemo(() => {
    // Count how many extraction entries reference each property across all entry points
    const refCounts = {}
    Object.values(extractions).forEach(list => {
      (list || []).forEach(ext => {
        if (ext.propertyId) {
          refCounts[ext.propertyId] = (refCounts[ext.propertyId] || 0) + 1
        }
      })
    })
    return properties.map(p => ({ ...p, refCount: refCounts[p.id] || 0 }))
  }, [properties, extractions])
```

- [ ] **Step 6: Replace all `setItems(...)` calls with App callbacks**

In `saveNew` (line 134-142):
```jsx
  const saveNew = () => {
    const errs = validateForm(newForm, false)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    const newItem = { id: String(Date.now()), ...newForm, status: 1 }
    onSaveProperty(newItem)
    setShowNew(false)
    setNewForm({ ...EMPTY_FORM })
    setErrors({})
  }
```

In `saveEdit` (line 144-150):
```jsx
  const saveEdit = () => {
    const errs = validateForm(editForm, true)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    const updated = items.find(i => i.id === editingId)
    if (updated) {
      onSaveProperty({ ...updated, description: editForm.description, fieldType: editForm.fieldType, validateType: editForm.validateType, validateArgs: editForm.validateArgs })
    }
    setEditingId(null)
    setErrors({})
  }
```

In `handleDelete` (line 152-155):
```jsx
  const handleDelete = (id) => {
    onDeleteProperty(id)
    setDeleteConfirmId(null)
  }
```

In the status toggle onChange (line 217):
```jsx
<StatusToggle enabled={item.status === 1} onChange={v => onSaveProperty({ ...item, status: v ? 1 : 0 })} />
```

In the `validateForm` function, change `items.some(...)` validation to use the `items` computed from the useMemo (this is fine since `items` is now a computed value, not state).

- [ ] **Step 7: Verify in browser**

Run: `npm run dev`

Test Bug 5 fix:
1. Go to 属性字典 → add a new property (e.g., `test_prop`)
2. Navigate to an entry point → Tab "属性提取配置" → the new property should appear in the dropdown
3. Go back to 属性字典 → disable a property → check that it no longer appears as available in extraction config
4. Delete a property → navigate away → navigate back → property should remain deleted

- [ ] **Step 8: Commit**

```bash
git add src/App.jsx src/pages/PropertyDictionary.jsx
git commit -m "fix: lift PropertyDictionary to shared App state, compute refCount from extractions (Bug 5)"
```

---

### Task 9: Final integration verification

- [ ] **Step 1: Full regression test**

Run: `npm run dev`

Test all 6 fixes together:
1. **Bug 1**: Entry point edit → change extraction in tab → cancel → changes not persisted
2. **Bug 2a**: Delete entry point → navigate away → navigate back → still deleted
3. **Bug 2b**: Delete activation → navigate away → navigate back → still deleted
4. **Bug 3**: Extraction config / scene card delete buttons are visible and functional
5. **Bug 4**: RulePickerModal checkbox toggles correctly (single click = single toggle)
6. **Bug 5**: Add property in dictionary → visible in extraction config dropdown
7. **Bug 6**: Change only rule associations → cancel → "unsaved changes" warning appears

- [ ] **Step 2: Verify no console errors**

Open browser DevTools → Console tab. Navigate through all affected pages. No React errors or warnings.

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit any remaining fixes**

If any issues found, fix and commit individually.
