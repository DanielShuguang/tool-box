/**
 * 对象操作 Hook
 *
 * 处理对象选择、属性更新、删除等操作
 */
import { ref, shallowRef } from 'vue'
import { DEFAULT_OBJECT_PROPERTIES } from '../constants'
import type { ObjectProperties } from '../types'

export function useObjectOperations() {
  const objectProperties = ref<ObjectProperties>({ ...DEFAULT_OBJECT_PROPERTIES })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectedObject = shallowRef<any>(null)

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

  const updateObjectProperty = (property: keyof ObjectProperties, value: unknown, canvas: any) => {
    objectProperties.value[property] = value as never

    const activeObject = canvas?.getActiveObject()
    if (activeObject) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(activeObject as any)[property] = value
      activeObject.setCoords()
      canvas.renderAll()
    }
  }

  const deleteSelected = (canvas: any, onDeleteComplete?: () => void) => {
    const activeObjects = canvas?.getActiveObjects()
    if (activeObjects?.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      activeObjects.forEach((obj: any) => canvas.remove(obj))
      canvas.discardActiveObject()
      canvas.renderAll()
      onDeleteComplete?.()
    }
  }

  const clearCanvas = (canvas: any) => {
    if (!canvas) return
    canvas.clear()
    canvas.backgroundColor = '#ffffff'
    canvas.renderAll()
  }

  const applyPropertiesToSelected = (canvas: any) => {
    const activeObject = canvas?.getActiveObject()
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
