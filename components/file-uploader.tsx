"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Cloud, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileUploaderProps {
  onFilesUploaded: (files: File[]) => void
  isProcessing: boolean
  uploadText?: string
  dragDropText?: string
  processingText?: string
}

export function FileUploader({ 
  onFilesUploaded, 
  isProcessing,
  uploadText = "Upload Files",
  dragDropText = "Drag and drop files here or click to upload",
  processingText = "Processing..."
}: FileUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Filter only Excel files
      const excelFiles = acceptedFiles.filter((file) =>
        file.name.endsWith(".xlsx") || file.name.endsWith(".xls")
      )
      
      if (excelFiles.length > 0) {
        onFilesUploaded(excelFiles)
      }
    },
    [onFilesUploaded]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    disabled: isProcessing,
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
        isDragActive ? "border-primary bg-primary/10" : "border-gray-300 hover:border-primary"
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center gap-4">
        <Cloud className="h-10 w-10 text-muted-foreground" />
        <div className="flex flex-col items-center">
          <p className="text-sm text-muted-foreground mb-1">
            {dragDropText}
          </p>
          <Button disabled={isProcessing}>
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

