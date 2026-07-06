
## 概述
这是一个专门用于课程排课的AI智能体，它根据用户输入的课程信息自动生成指定月份课程日历，并导出为可下载的 Excel（.xlsx）文件。

项目基于AI Agent框架 [VoltAgent](https://github.com/VoltAgent/voltagent)，修改自示例 [with-assistant-ui](https://github.com/VoltAgent/voltagent/tree/main/examples/with-assistant-ui)


## 项目下载和运行

### 拉取代码
```
git clone https://github.com/jerryhu/course-schedule-agent.git
```

### 配置API Key
* 在项目根目录创建.env文件
* 复制.env.example文件中的到.env文件
* 修改.env文件中的DEEPSEEK_API_KEY

### 安装依赖

```
npm install
```

### 运行代码
```
npm run dev
```

## 演示

<img width="720" height="696" alt="preview" src="https://github.com/user-attachments/assets/651ec819-01bb-4792-b189-55e15a3120b9" />

## 其他
* voltagent/tools/courseScheduleTool.ts 将课程信息转换为Excel文件
* template/template-1.xlsx 是课程表Excel模版


