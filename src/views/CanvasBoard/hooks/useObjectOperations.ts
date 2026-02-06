/**
 * 对象操作 Hook
 *
 * 处理对象选择、属性更新、删除等操作
 */
import { DEFAULT_OBJECT_PROPERTIES } from '../constants'
import type { ObjectProperties } from '../types'
import { Canvas, FabricObject } from 'fabric'

export function useObjectOperations() {
  const objectProperties = ref<ObjectProperties>({ ...DEFAULT_OBJECT_PROPERTIES })
  const selectedObject = shallowRef<FabricObject | null>(null)

  const getSelectedObject = () => selectedObject.value

  const setSelectedObject = (obj: any) => {
    selectedObject.value = obj
    if (obj) {
      updatePropertiesFromObject(obj)
    }
  }

  const clearSelection = () => {
    selectedObject.value = null
  }

  const updatePropertiesFromObject = (obj: any) => {
    objectProperties.value = {
      fill: (obj.fill as string) || '#000000',
      stroke: (obj.stroke as string) || '#000000',
      strokeWidth: obj.strokeWidth || 2,
      opacity: obj.opacity ?? 1,
      strokeDashArray: obj.strokeDashArray || []
    }
  }

  const updateObjectProperty = (
    property: keyof ObjectProperties,
    value: unknown,
    canvas: Canvas
  ) => {
    objectProperties.value[property] = value as never

    const activeObject = canvas?.getActiveObject()
    if (activeObject) {
      ;(activeObject as FabricObject)[property] = value as never
      activeObject.setCoords()
      canvas.renderAll()
    }
  }

  const deleteSelected = (canvas: Canvas | null, onDeleteComplete?: () => void) => {
    if (!canvas) return
    const activeObjects = canvas?.getActiveObjects()
    if (activeObjects?.length) {
      activeObjects.forEach((obj: FabricObject) => canvas.remove(obj))
      canvas.discardActiveObject()
      canvas.renderAll()
      onDeleteComplete?.()
    }
  }

  const clearCanvas = (canvas: Canvas | null) => {
    if (!canvas) return
    canvas.clear()
    canvas.backgroundColor = '#ffffff'
    canvas.renderAll()
  }

  const applyPropertiesToSelected = (canvas: Canvas | null) => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      activeObject.set({
        fill: objectProperties.value.fill,
        stroke: objectProperties.value.stroke,
        strokeWidth: objectProperties.value.strokeWidth,
        opacity: objectProperties.value.opacity,
        strokeDashArray: objectProperties.value.strokeDashArray
      })
      activeObject.setCoords()
      canvas.renderAll()
    }
  }

  const hasSelection = () => selectedObject.value !== null

  const resetProperties = () => {
    objectProperties.value = { ...DEFAULT_OBJECT_PROPERTIES }
  }

  return {
    objectProperties,
    selectedObject,
    getSelectedObject,
    setSelectedObject,
    clearSelection,
    updateObjectProperty,
    deleteSelected,
    clearCanvas,
    applyPropertiesToSelected,
    hasSelection,
    resetProperties
  }
}
