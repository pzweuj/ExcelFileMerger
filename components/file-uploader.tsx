"use client"

import { useEffect, useState } from "react"
import { Cloud, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { open } from '@tauri-apps/plugin-dialog'

interface FileUploaderProps {
  onFilesUploaded: (files: string[]) => void  // 修改为接收文件路径
  isProcessing: boolean
  uploadText?: string
  dragDropText?: string
  processingText?: string
  existingFilePaths?: string[] // 添加现有文件路径列表
}

export function FileUploader({ 
  onFilesUploaded, 
  isProcessing,
  uploadText = "Upload Files",
  dragDropText = "Drag and drop files here or click to upload",
  processingText = "Processing...",
  existingFilePaths = [] // 默认为空数组
}: FileUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false)

  useEffect(() => {
    let unlistenFn: (() => void) | null = null

    const setupDragDrop = async () => {
      const window = getCurrentWindow()
      unlistenFn = await window.onDragDropEvent((event) => {
        if (event.payload.type === 'over') {
          setIsDragActive(true)
        } else if (event.payload.type === 'drop') {
          setIsDragActive(false)
          const paths = event.payload.paths as string[]
          const excelFiles = paths.filter(path => 
            path.toLowerCase().endsWith('.xlsx')
          )
          
          // 添加去重逻辑 - 确保不包含已存在的文件路径
          const uniqueExcelFiles = excelFiles.filter((path, index, self) => 
            self.indexOf(path) === index && !existingFilePaths.includes(path)
          )

          if (uniqueExcelFiles.length > 0) {
            onFilesUploaded(uniqueExcelFiles)
          }
        } else {
          setIsDragActive(false)
        }
      })
    }

    setupDragDrop()
    return () => {
      if (unlistenFn) {
        unlistenFn()
      }
    }
  }, [onFilesUploaded, existingFilePaths]) // 添加 existingFilePaths 作为依赖

  const handleFileSelect = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{
          name: 'Excel',
          extensions: ['xlsx']  // 只保留xlsx格式
        }]
      })

      if (Array.isArray(selected) && selected.length > 0) {
        // 过滤掉已存在的文件路径
        const uniqueSelected = selected.filter(path => !existingFilePaths.includes(path))
        if (uniqueSelected.length > 0) {
          onFilesUploaded(uniqueSelected)
        }
      }
    } catch (error) {
      console.error('Error selecting files:', error)
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors
        ${isDragActive ? "border-primary bg-primary/10" : "border-gray-300 hover:border-primary"}
        ${isProcessing ? 'opacity-50' : ''}`}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        <Cloud className="h-10 w-10 text-muted-foreground" />
        <div className="flex flex-col items-center">
          <p className="text-sm text-muted-foreground mb-1">
            {dragDropText}
          </p>
          <Button 
            onClick={handleFileSelect}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {processingText}
              </>
            ) : (
              uploadText
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

