"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface FileTableProps {
  files: Array<{
    file: File
    headers: string[]
    compatible: boolean
  }>
  onRemoveFile: (index: number) => void
  labels?: {
    filename?: string
    status?: string
    actions?: string
    compatible?: string
    incompatible?: string
    remove?: string
  }
}

export function FileTable({ 
  files, 
  onRemoveFile,
  labels = {
    filename: "Filename",
    status: "Status",
    actions: "Actions",
    compatible: "Compatible",
    incompatible: "Incompatible",
    remove: "Remove"
  }
}: FileTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{labels.filename}</TableHead>
          <TableHead>{labels.status}</TableHead>
          <TableHead className="w-[100px]">{labels.actions}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {files.map((fileData, index) => (
          <TableRow key={fileData.file.name + index}>
            <TableCell className="font-medium">{fileData.file.name}</TableCell>
            <TableCell>
              {fileData.compatible ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {labels.compatible}
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {labels.incompatible}
                </Badge>
              )}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveFile(index)}
                title={labels.remove}
              >
                <X className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

