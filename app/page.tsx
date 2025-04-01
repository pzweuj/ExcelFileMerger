"use client"

import { useState } from "react"
import { FileUploader } from "@/components/file-uploader"
import { FileTable } from "@/components/file-table"
import { Button } from "@/components/ui/button"
import { mergeExcelFiles } from "@/lib/excel-utils"
import { toast } from "@/components/ui/use-toast"
import { Language, translations } from "@/lib/i18n"
import { LanguageSwitcher } from "@/components/language-switcher"

export default function ExcelMerger() {
  const [files, setFiles] = useState<
    Array<{
      file: File
      headers: string[]
      compatible: boolean
      sheetName: string  // 添加sheetName字段来存储活动sheet名称
    }>
  >([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [language, setLanguage] = useState<Language>('zh')
  const t = translations[language]

  const handleFilesUploaded = async (uploadedFiles: File[]) => {
    if (uploadedFiles.length === 0) return

    setIsProcessing(true)

    try {
      // Process files one by one
      const processedFiles = await Promise.all(
        uploadedFiles.map(async (file) => {
          const { headers, sheetName } = await extractHeadersAndSheetName(file)
          return { file, headers, compatible: true, sheetName }
        }),
      )

      // If we already have files, compare headers with the first file
      if (files.length > 0) {
        const referenceHeaders = files[0].headers
        processedFiles.forEach((fileData) => {
          fileData.compatible = areHeadersCompatible(referenceHeaders, fileData.headers)
        })
      } else if (processedFiles.length > 1) {
        // If these are the first files being added, compare with the first of the batch
        const referenceHeaders = processedFiles[0].headers
        processedFiles.slice(1).forEach((fileData) => {
          fileData.compatible = areHeadersCompatible(referenceHeaders, fileData.headers)
        })
      }

      setFiles([...files, ...processedFiles])
      toast({
        title: t.filesUploaded,
        description: t.filesProcessed.replace('{count}', uploadedFiles.length.toString()),
      })
    } catch (error) {
      console.error("Error processing files:", error)
      toast({
        title: t.error,
        description: t.failedToProcess,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemoveFile = (index: number) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)

    // If we removed the first file, we need to recalculate compatibility
    if (index === 0 && newFiles.length > 0) {
      const newReferenceHeaders = newFiles[0].headers
      newFiles.forEach((fileData, i) => {
        if (i > 0) {
          fileData.compatible = areHeadersCompatible(newReferenceHeaders, fileData.headers)
        }
      })
    }

    setFiles(newFiles)
  }

  const handleMergeFiles = async () => {
    if (files.length === 0) {
      toast({
        title: t.noFilesToMerge,
        description: t.pleaseUpload,
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Filter compatible files
      const compatibleFiles = files.filter((f) => f.compatible).map((f) => f.file)

      if (compatibleFiles.length === 0) {
        toast({
          title: t.noCompatibleFiles,
          description: t.noCompatibleFilesToMerge,
          variant: "destructive",
        })
        return
      }

      // Merge files and download
      await mergeExcelFiles(compatibleFiles)

      toast({
        title: t.success,
        description: t.filesMerged.replace('{count}', compatibleFiles.length.toString()),
      })
    } catch (error) {
      console.error("Error merging files:", error)
      toast({
        title: t.error,
        description: t.failedToMerge,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <main className="container mx-auto py-8 px-4 relative">
      <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} />
      
      <h1 className="text-3xl font-bold mb-6">{t.title}</h1>
      <p className="mb-6 text-muted-foreground">
        {t.description}
      </p>

      <div className="mb-8">
        <FileUploader 
          onFilesUploaded={handleFilesUploaded} 
          isProcessing={isProcessing} 
          uploadText={t.uploadFiles}
          dragDropText={t.dragAndDrop}
          processingText={t.processing}
        />
      </div>

      {files.length > 0 && (
        <>
          <div className="mb-6">
            <FileTable 
              files={files} 
              onRemoveFile={handleRemoveFile} 
              labels={{
                filename: t.filename,
                status: t.status,
                actions: t.actions,
                compatible: t.compatible,
                incompatible: t.incompatible,
                remove: t.remove
              }}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleMergeFiles} disabled={isProcessing || !files.some((f) => f.compatible)}>
              {isProcessing ? t.processing : t.mergeCompatibleFiles}
            </Button>
          </div>
        </>
      )}
    </main>
  )
}

// 修改后的Helper functions
async function extractHeadersAndSheetName(file: File): Promise<{ headers: string[], sheetName: string }> {
  const { read, utils } = await import("xlsx")

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = read(data, { type: "array" })

        // 获取活动sheet或者默认使用第一张sheet
        const activeSheet = workbook.Workbook?.Sheets?.find(s => s.Hidden === 0)
        // 确保sheetName是字符串，如果activeSheet.name不存在，则使用第一个sheet名称
        const sheetName = activeSheet?.name || workbook.SheetNames[0]
        
        // 确保 sheetName 存在且为有效的工作表名称
        const worksheet = workbook.Sheets[sheetName]
        if (!worksheet) {
            throw new Error('无法获取工作表')
        }

        // Get headers (first row)
        const jsonData = utils.sheet_to_json(worksheet, { header: 1 })
        const headers = jsonData[0] as string[]

        resolve({ headers, sheetName })
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error("Failed to read file"))
    }

    reader.readAsArrayBuffer(file)
  })
}

// 保持原有的兼容性检查函数不变
function areHeadersCompatible(headers1: string[], headers2: string[]): boolean {
  if (headers1.length !== headers2.length) return false

  return headers1.every((header, index) => header === headers2[index])
}

