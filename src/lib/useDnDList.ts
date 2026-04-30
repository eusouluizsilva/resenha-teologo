import { useCallback, useRef, useState } from 'react'

// Hook que gerencia ordenação por drag-and-drop e teclado para uma lista
// genérica de itens identificados por id. Mantém a ordem otimista no
// cliente (`orderedIds`) e dispara `onCommit` com o array final apenas
// quando a ordem muda. Funciona com mouse (HTML5 DnD), toque (long-press
// natural via draggable) e teclado (setas + Home/End via getKeyHandler).
export function useDnDList<T extends { _id: string }>(
  items: T[] | undefined,
  onCommit: (orderedIds: string[]) => void,
) {
  const [draftOrder, setDraftOrder] = useState<string[] | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const lastCommittedKey = useRef<string>('')

  // Ordem efetiva: prioriza o draft local (durante reorder otimista),
  // senão usa a ordem real do servidor.
  const orderedIds = (() => {
    if (!items) return []
    if (draftOrder && draftOrder.length === items.length) {
      const valid = new Set(items.map((i) => i._id))
      if (draftOrder.every((id) => valid.has(id))) return draftOrder
    }
    return items.map((i) => i._id)
  })()

  const orderedItems = orderedIds
    .map((id) => items?.find((i) => i._id === id))
    .filter((x): x is T => Boolean(x))

  const commit = useCallback(
    (next: string[]) => {
      const key = next.join('|')
      if (key === lastCommittedKey.current) return
      lastCommittedKey.current = key
      onCommit(next)
    },
    [onCommit],
  )

  const move = useCallback(
    (sourceId: string, targetIndex: number) => {
      if (!items) return
      const current = orderedIds.slice()
      const sourceIdx = current.indexOf(sourceId)
      if (sourceIdx === -1) return
      const clamped = Math.max(0, Math.min(targetIndex, current.length - 1))
      if (clamped === sourceIdx) return
      current.splice(sourceIdx, 1)
      current.splice(clamped, 0, sourceId)
      setDraftOrder(current)
      commit(current)
    },
    [items, orderedIds, commit],
  )

  const moveUp = useCallback(
    (id: string) => {
      const idx = orderedIds.indexOf(id)
      if (idx > 0) move(id, idx - 1)
    },
    [orderedIds, move],
  )

  const moveDown = useCallback(
    (id: string) => {
      const idx = orderedIds.indexOf(id)
      if (idx >= 0 && idx < orderedIds.length - 1) move(id, idx + 1)
    },
    [orderedIds, move],
  )

  function getItemProps(id: string) {
    return {
      draggable: true,
      onDragStart: (e: React.DragEvent) => {
        setDraggingId(id)
        e.dataTransfer.effectAllowed = 'move'
        try {
          e.dataTransfer.setData('text/plain', id)
        } catch {
          /* ignore */
        }
      },
      onDragEnd: () => {
        setDraggingId(null)
        setOverId(null)
      },
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (overId !== id) setOverId(id)
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault()
        const sourceId = draggingId ?? e.dataTransfer.getData('text/plain')
        setOverId(null)
        setDraggingId(null)
        if (!sourceId || sourceId === id) return
        const targetIdx = orderedIds.indexOf(id)
        if (targetIdx === -1) return
        move(sourceId, targetIdx)
      },
    }
  }

  function getKeyHandler(id: string) {
    return (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowUp' && (e.altKey || e.metaKey)) {
        e.preventDefault()
        moveUp(id)
      } else if (e.key === 'ArrowDown' && (e.altKey || e.metaKey)) {
        e.preventDefault()
        moveDown(id)
      }
    }
  }

  return {
    orderedItems,
    orderedIds,
    draggingId,
    overId,
    moveUp,
    moveDown,
    getItemProps,
    getKeyHandler,
  }
}
