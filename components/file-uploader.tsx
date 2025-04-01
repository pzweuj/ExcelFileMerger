"use client"

import { useState } from "react"  // 移除 useEffect
import { Cloud, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
// 移除 getCurrentWindow 导入
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
  dragDropText = "Drag and drop files here or click to upload",  // 这个提示文本可以保留或修改
  processingText = "Processing...",
  existingFilePaths = [] // 默认为空数组
}: FileUploaderProps) {
  // 移除拖拽相关状态
  // const [isDragActive, setIsDragActive] = useState(false)

  // 移除整个拖拽处理的 useEffect

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
        border-gray-300 hover:border-primary
        ${isProcessing ? 'opacity-50' : ''}`}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        <Cloud className="h-10 w-10 text-muted-foreground" />
        <div className="flex flex-col items-center">
          <p className="text-sm text-muted-foreground mb-1">
            {/* 修改提示文本，不再提及拖放 */}
            点击下方按钮选择Excel文件
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

