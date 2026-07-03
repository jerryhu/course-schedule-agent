import { tool } from "@voltagent/core"; // 引入 VoltAgent 核心库
import { z } from "zod";
import ExcelJS from "exceljs";
import path from "path";

const COLOR_PALETTE: string[] = [
  '237804', '9e1068', '6B21A8', '391085', 'ad8b00',
  'ad4e00', '10239e', '006d75', '333333',
];

// 行高参数（单位: point）
const BASE_ROW_HEIGHT: number = 20;      // 仅含日期数字时的基础行高
const COURSE_LINE_HEIGHT: number = 16;   // 每条课程文本占用的额外行高
const CELL_PADDING: number = 4;          // 上下内边距补偿

// ============================

/**
 * 构建课程字体颜色映射表
 * @param courses 课程列表
 */
function buildCourseColorMap(courses: Course[]): Record<string, string> {
  const map: Record<string, string> = {};
  let idx = 0;
  for (const course of courses) {
    if (!map[course.c]) {
      map[course.c] = COLOR_PALETTE[idx % COLOR_PALETTE.length];
      idx++;
    }
  }
  return map;
}

/**
 * 构建日历工作表
 * @param targetSheet 日历工作表
 * @param year 日历年份
 * @param month 日历月份
 * @param title 标题
 * @param courses 课程列表
 */
function buildCalendarSheet(
  targetSheet: ExcelJS.Worksheet,
  year: number,
  month: number,
  title: string,
  courses: Course[]
): void {
  // 1. 日历网格参数
  const firstDay: Date = new Date(year, month - 1, 1);
  const startWeekday: number = firstDay.getDay();
  const jsDayToCol: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 0: 7 };
  const startCol: number = jsDayToCol[startWeekday];
  const daysInMonth: number = new Date(year, month, 0).getDate();

  // 2. 构建 日期→坐标 映射 & 每行课程计数
  const dateCellMap: Record<number, CellPosition> = {};
  const rowCourseCount: Record<number, number> = {}; // key: rowNum, value: 该行所有格子中最大的课程数

  for (let day = 1; day <= daysInMonth; day++) {
    const offset: number = (day - 1) + (startCol - 1);
    const rowOffset: number = Math.floor(offset / 7);
    const colOffset: number = offset % 7;
    const targetRow: number = 3 + rowOffset;
    const targetCol: number = 1 + colOffset;

    if (rowOffset <= 5 && targetRow <= 8) {
      dateCellMap[day] = { row: targetRow, col: targetCol };
      if (!rowCourseCount[targetRow]) rowCourseCount[targetRow] = 0;
    }
  }

  // 3. 统计每行的最大课程数（决定该行行高）
  const courseCountPerCell: Record<string, number> = {}; // key: "row-col", value: 课程条数
  for (const course of courses) {
    const pos: CellPosition | undefined = dateCellMap[course.d];
    if (!pos) continue;
    const key: string = `${pos.row}-${pos.col}`;
    courseCountPerCell[key] = (courseCountPerCell[key] || 0) + 1;
  }

  for (const [key, count] of Object.entries(courseCountPerCell)) {
    const rowNum: number = Number(key.split('-')[0]);
    rowCourseCount[rowNum] = Math.max(rowCourseCount[rowNum] || 0, count);
  }

  // 4. 根据课程数动态设置行高
  for (let r = 3; r <= 8; r++) {
    const maxCourses: number = rowCourseCount[r] || 0;
    const height: number = BASE_ROW_HEIGHT + maxCourses * COURSE_LINE_HEIGHT + CELL_PADDING;
    targetSheet.getRow(r).height = height;
  }

  // 5. 填入日期数字
  for (const [dayStr, pos] of Object.entries(dateCellMap)) {
    const cell: ExcelJS.Cell = targetSheet.getCell(pos.row, pos.col);
    cell.value = {
      richText: [
        {
          text: dayStr + ' ',
          font: { bold: true, color: { argb: 'CCCCCC' }, size: 12 },
        },
      ],
    };
    cell.alignment = { horizontal: 'left', vertical: 'top' };
  }

  // 6. 构建颜色映射 & 填入课程
  const courseColorMap: Record<string, string> = buildCourseColorMap(courses);

  // 遍历课程列表
  for (const course of courses) {
    const pos: CellPosition | undefined = dateCellMap[course.d];
    if (!pos) {
      console.warn(`⚠️ 日期 ${course.d} 超出范围，跳过: ${course.c}`);
      continue;
    }

    const cell: ExcelJS.Cell = targetSheet.getCell(pos.row, pos.col);
    const courseText: string = `\n${course.c} ${course.t}`;
    const fontColor: string = courseColorMap[course.c];

    let richTextParts: ExcelJS.RichText[];
    if (
      cell.value &&
      typeof cell.value === 'object' &&
      'richText' in cell.value &&
      Array.isArray(cell.value.richText)
    ) {
      richTextParts = [...(cell.value.richText)];
    } else {
      const existing: string = cell.value != null ? String(cell.value) : '';
      richTextParts = [
        {
          text: existing,
          font: { bold: true, color: { argb: 'CCCCCC' }, size: 12 },
        },
      ];
    }

    richTextParts.push({
      text: courseText,
      font: { color: { argb: fontColor }, size: 10 },
    });

    cell.value = { richText: richTextParts };
    cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
  }

  // 7. 空白格子处理
  for (let r = 3; r <= 8; r++) {
    for (let c = 1; c <= 7; c++) {
      const cell: ExcelJS.Cell = targetSheet.getCell(r, c);
      if (cell.value == null) cell.value = '';
    }
  }

  // 8. 更新标题
  targetSheet.getCell('A1').value = title;
}

/**
 * 生成课程日历excel文件
 * @param calendars 日历信息列表
 */
async function generateCourseCalendar(calendars: CalendarInfo[]): Promise<CourseCalendarResult> {
  // 创建工作簿
  const workbook = new ExcelJS.Workbook();
  const templateFolder: string = path.join(process.cwd(), 'template');
  const templatePath: string = path.join(templateFolder, 'template-1.xlsx');
  // 读取日历模版文件
  await workbook.xlsx.readFile(templatePath);

  const sourceWorksheet: ExcelJS.Worksheet | undefined = workbook.getWorksheet('sheet1');
  if (!sourceWorksheet) throw new Error('模板文件中未找到工作表');

  // 创建一个新的工作簿实例
  const newWorkbook = new ExcelJS.Workbook();

  // 遍历日历列表
  for (const calendarInfo of calendars) {
    const { year, month, title, courses } = calendarInfo;
    // 添加新的sheet
    const targetSheet: ExcelJS.Worksheet = newWorkbook.addWorksheet(title);

    // 复制模版中的sheet内容
    targetSheet.model = Object.assign(sourceWorksheet.model, {
      mergeCells: sourceWorksheet.model.merges,
      name: title,
    });

    // 构建日历工作表
    await buildCalendarSheet(targetSheet, year, month, title, courses);
  }

  const timestamp: number = Date.now();
  const fileName: string = `course-schedule-${timestamp}.xlsx`;
  const outputPath: string = path.join(process.cwd(), 'public', 'downloads', fileName);
  await newWorkbook.xlsx.writeFile(outputPath);

  return { fileName: fileName  }
}

// 定义生成 Excel 的 VoltAgent Tool
export const courseScheduleTool = tool({
  name:"courseSchedule",
  description: "根据提供的课程上课时间的日历数据生成 Excel 文件，并返回可供下载和预览的文件信息。",
  parameters: z.object({
    calendars: z.array(z.object({
      year: z.number().describe("课程日历的年份"),
      month: z.number().describe("课程日历的月份"),
      title: z.string().describe("课程日历的标题"), 
      courses: z.array(z.object({
        c: z.string().describe("课程名称"),
        d: z.number().describe("日期（几号）"),
        t: z.string().describe("上课时间，例如 '17:00~18:00'")
      })),
    }))
  }),
  execute: async ({calendars}) => {
    // 生成课程日历excel文件
    const result = await generateCourseCalendar(calendars);

    const baseURL = 'http://localhost:3000/'
    
    // 返回前端所需的结构化数据：包含下载 URL 和用于预览的原始数据
    return {
      success: true,
      message: "Excel 生成成功",
      downloadUrl: `${baseURL}/downloads/${result.fileName}`, // 供前端下载的路由
      previewData: calendars         // 供前端直接渲染表格预览
    };
  }
});
