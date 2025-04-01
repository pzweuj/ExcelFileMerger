import type { WorkBook } from "xlsx"

export async function mergeExcelFiles(files: File[]): Promise<void> {
  const { read, utils, writeFile } = await import("xlsx")
  
  // 创建一个新的工作簿
  const mergedWorkbook = utils.book_new()
  let mergedData: any[] = []
  
  // 处理每个文件
  for (const file of files) {
    const data = await readFileAsArrayBuffer(file)
    const workbook = read(data, { type: "array" })
    
    // 获取活动sheet或者默认使用第一张sheet
    const activeSheet = workbook.Workbook?.Sheets?.find(s => s.Hidden === 0)
    const sheetName = activeSheet?.name || workbook.SheetNames[0]
    
    // 确保sheetName存在
    if (!sheetName) {
      console.warn(`无法在文件 ${file.name} 中找到有效的工作表名称`)
      continue
    }
    
    const worksheet = workbook.Sheets[sheetName]
    
    if (!worksheet) {
      console.warn(`无法在文件 ${file.name} 中找到工作表 ${sheetName}`)
      continue
    }
    
    // 转换为JSON
    const jsonData = utils.sheet_to_json(worksheet)
    
    // 如果是第一个文件，保留表头
    if (mergedData.length === 0) {
      mergedData = jsonData
    } else {
      // 否则只添加数据行
      mergedData = [...mergedData, ...jsonData]
    }
  }
  
  // 创建新的工作表
  const newWorksheet = utils.json_to_sheet(mergedData)
  utils.book_append_sheet(mergedWorkbook, newWorksheet, "合并数据")
  
  // 下载文件
  writeFile(mergedWorkbook, "merged_excel.xlsx")
}

// 辅助函数：将文件读取为ArrayBuffer
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer)
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsArrayBuffer(file)
  })
}

async function readExcelFile(file: File, xlsx: any): Promise<WorkBook> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = xlsx.read(data, { type: "array" })
        resolve(workbook)
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

