// ========== 类型定义 ==========

/**
 * 课程信息
 */
interface Course {
  /**
   * 课程名称
   */
  c: string;
  /**
   * 日期（几号）
   */
  d: number;
  /**
   * 时间范围，如 '09:00~10:00'
   */
  t: string;
}

/**
 * 日历信息
 */
interface CalendarInfo {
  /**
   * 日历年份
   */
  year: number;
  /**
   * 日历月份
   */
  month: number;
  /**
   * 标题
   */
  title: string;
  /**
   * 课程时间列表
   */
  courses: Course[];
}

/**
 * excel表格格子位置
 */
interface CellPosition {
  /**
   * 行序号
   */
  row: number;
  /**
   * 列序号
   */
  col: number;
}

/**
 * 课程日历生成结果
 */
interface CourseCalendarResult {
  /**
   * excel文件名
   */
  fileName: string
}