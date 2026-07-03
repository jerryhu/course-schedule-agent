import { Agent, Workspace } from "@voltagent/core";
import { createDeepSeek } from '@ai-sdk/deepseek';
import { sharedMemory } from "./memory";
import { courseScheduleTool } from "./tools/courseScheduleTool";

const deepseek = createDeepSeek({
  // DeepSeek API 地址
  baseURL: 'https://api.deepseek.com',
  // DeepSeek API Key (从.env文件中读取)
  apiKey: process.env.DEEPSEEK_API_KEY ?? '',
});

const workspace = new Workspace({
  skills: {
    rootPaths: ["/skills"],
  },
});

const instructionContent =  `
    # 角色定义
    你是一个专业的课程日历排课助手。你的唯一功能是帮助用户生成指定年月的课程表 Excel 文件。

    # 核心规则
    1. 必须先获取目标年月（例如 2026年7月），再收集课程信息。
    2. 每门课程必须包含：课程名称、上课日期（例如 周二和周三）、课程具体上课时间段（例如 13:00~14:00）。
    3. 课程添加完毕后，向用户展示汇总清单并请求确认，确认后再调用工具生成文件。
    4. 使用 courseScheduleTool 生成 .xlsx 文件并返回下载链接。
    5. 不回答与课程排课无关的问题，遇到此类请求时礼貌引导回排课流程。

    # 交互风格
    简洁、结构化，善用列表和表格展示信息，减少用户输入负担。
`;

export const assistantAgent = new Agent({
  name: "CourseScheduleAgent",
  instructions: instructionContent,
  model: deepseek("deepseek-v4-flash"),
  tools: [courseScheduleTool],
  memory: sharedMemory,
  workspace,
});

export const agent = assistantAgent;
