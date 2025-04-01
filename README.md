# Excel文件合并工具

一个简单易用的Web应用，用于合并多个表头相同的Excel xlsx文件，只支持合并第一个子表。

## 功能特点

- 支持上传多个Excel (.xlsx) 文件
- 自动检测文件兼容性（基于表头）
- 合并兼容文件的数据
- 支持中英文界面切换
- 仅合并Excel文件中的第一个子表
- 拖放文件上传

## 安装与运行

1. 克隆仓库

```bash
git clone https://github.com/pzweuj/ExcelFileMerger.git
cd ExcelFileMerger
```

2. 安装依赖

```bash
pnpm install
```

3. 运行

```bash
pnpm run dev
```
