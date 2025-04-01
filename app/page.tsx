"use client"

// 修改导入部分
import { useState } from "react"
import { FileUploader } from "@/components/file-uploader"
import { FileTable } from "@/components/file-table"
import { Button } from "@/components/ui/button"
import { mergeExcelFiles } from "@/lib/excel-utils"
import { toast } from "@/components/ui/use-toast"
import { Language, translations } from "@/lib/i18n"
import { LanguageSwitcher } from "@/components/language-switcher"
import { readFile, BaseDirectory } from '@tauri-apps/plugin-fs'

export default function ExcelMerger() {
  // 添加一个状态来控制调试按钮的显示
  const [showDebug, setShowDebug] = useState(false);
  
  // 其他状态保持不变
  const [files, setFiles] = useState<Array<{
    file: File
    headers: string[]
    compatible: boolean
    sheetName: string
  }>>([])
  
  // 新增状态跟踪所有文件路径
  const [filePaths, setFilePaths] = useState<string[]>([])

  // 移除错误的 await 表达式（这些应该在 handleFilesUploaded 函数内）
  const [isProcessing, setIsProcessing] = useState(false)
  const [language, setLanguage] = useState<Language>('zh')
  const t = translations[language]

  // 修改 handleRemoveFile 函数，确保完全清除状态
  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
  
    // 更新文件路径状态，确保与files数组同步
    const newFilePaths = [...filePaths];
    newFilePaths.splice(index, 1);
    
    // 如果删除后没有文件了，重置所有状态
    if (newFiles.length === 0) {
      setFiles([]);
      setFilePaths([]);
      // 添加额外的清理逻辑，确保状态完全重置
      console.log("所有文件已删除，状态已重置");
      return;
    }
  
    // 兼容性检查逻辑
    if (index === 0 && newFiles.length > 0) {
      const newReferenceHeaders = newFiles[0].headers;
      newFiles.forEach((fileData, i) => {
        if (i > 0) {
          fileData.compatible = areHeadersCompatible(newReferenceHeaders, fileData.headers);
        }
      });
    }
  
    setFiles(newFiles);
    setFilePaths(newFilePaths);
  };

  // 修改 handleFilesUploaded 函数，添加额外的检查
  const handleFilesUploaded = async (newFilePaths: string[]) => {
    if (newFilePaths.length === 0) return;
  
    setIsProcessing(true);
    
    // 添加额外的检查，确保状态一致性
    if (files.length === 0 && filePaths.length > 0) {
      console.log("检测到状态不一致，重置文件路径");
      setFilePaths([]);
    }
  
    try {
      // 修正去重逻辑 - 使用更严格的检查
      const filteredPaths = newFilePaths.filter(path => {
        const fileName = path.split('\\').pop() || path;
        // 检查路径是否已存在，或者文件名是否已存在于当前文件列表中
        const pathExists = filePaths.includes(path);
        const fileNameExists = files.some(f => f.file.name === fileName);
        return !pathExists && !fileNameExists;
      });
  
      if (filteredPaths.length === 0) {
        toast({
          title: t.fileAlreadyExists,
          description: t.fileAlreadyExistsDesc,
          variant: "default",
        });
        setIsProcessing(false);
        return;
      }
      
      // 处理新文件
      const processedFiles = await Promise.all(
        filteredPaths.map(async (path) => {
          const { headers, sheetName } = await extractHeadersAndSheetName(path);
          const data = await readFile(path, { baseDir: BaseDirectory.Download });
          const file = new File([data], path.split('\\').pop() || path, {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });
          return { file, headers, compatible: true, sheetName };
        }),
      );
  
      // 更新文件列表
      const updatedFiles = [...files, ...processedFiles];
      
      // 检查兼容性
      if (updatedFiles.length > 1) {
        const referenceHeaders = updatedFiles[0].headers;
        updatedFiles.slice(1).forEach(fileData => {
          fileData.compatible = areHeadersCompatible(referenceHeaders, fileData.headers);
        });
      }
  
      setFiles(updatedFiles);
      setFilePaths(prev => [...prev, ...filteredPaths]);
  
      toast({
        title: t.filesUploaded,
        description: t.filesProcessed.replace('{count}', filteredPaths.length.toString()),
      });
    } catch (error) {
      console.error("Error processing files:", error);
      toast({
        title: t.error,
        description: t.failedToProcess,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

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
      // Filter compatible files and use existing File objects
      const compatibleFiles = files
        .filter((f) => f.compatible)
        .map((f) => f.file);
  
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

  // 添加一个调试函数
  const debugState = () => {
    console.log("当前文件列表:", files);
    console.log("当前文件路径:", filePaths);
  };

  // 在返回的JSX中
  return (
    <main className="container mx-auto py-8 px-4 relative">
      <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} />
      
      {/* 添加一个隐藏的按钮来切换调试模式 */}
      <div className="absolute top-2 left-2 opacity-30" onClick={() => setShowDebug(!showDebug)}>
        •
      </div>
      
      <h1 className="text-3xl font-bold mb-6">{t.title}</h1>
      <p className="mb-6 text-muted-foreground">
        {t.description}
      </p>

      {/* 只在调试模式下显示调试按钮 */}
      {showDebug && (
        <Button onClick={debugState} variant="outline" className="absolute top-4 right-4">
          调试状态
        </Button>
      )}

      <div className="mb-8">
        <FileUploader 
          onFilesUploaded={handleFilesUploaded} 
          isProcessing={isProcessing} 
          uploadText={t.uploadFiles}
          dragDropText={t.dragAndDrop}
          processingText={t.processing}
          existingFilePaths={filePaths}
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
// 修改 extractHeadersAndSheetName 函数
async function extractHeadersAndSheetName(filePath: string): Promise<{ headers: string[], sheetName: string }> {
  const { read, utils } = await import("xlsx")
  
  try {
    // 使用正确的 readFile API
    const data = await readFile(filePath, {
      baseDir: BaseDirectory.Download // 根据实际需要调整目录
    })
    const workbook = read(new Uint8Array(data), { type: "array" })

    const activeSheet = workbook.Workbook?.Sheets?.find(s => s.Hidden === 0)
    const sheetName = activeSheet?.name || workbook.SheetNames[0]
    
    const worksheet = workbook.Sheets[sheetName]
    if (!worksheet) {
      throw new Error('无法获取工作表')
    }

    const jsonData = utils.sheet_to_json(worksheet, { header: 1 })
    const headers = jsonData[0] as string[]

    return { headers, sheetName }
  } catch (error) {
    throw new Error(`Failed to read file: ${error}`)
  }
}

// 保持原有的兼容性检查函数不变
function areHeadersCompatible(headers1: string[], headers2: string[]): boolean {
  if (headers1.length !== headers2.length) return false

  return headers1.every((header, index) => header === headers2[index])
}

