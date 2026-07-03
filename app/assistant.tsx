"use client";

import { useState } from "react";
import { Thread } from "@/components/assistant-ui/thread";
import { ThreadListSidebar } from "@/components/assistant-ui/threadlist-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { AssistantChatTransport, useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";


/**
 * 生成对话id
 */
const generateConversationId = () => {
  return 'conv_' + Date.now();
}

export const Assistant = () => {
  const [conversationId, setConversationId] = useState<string>(() => generateConversationId() );

  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: "/api/chat",
      body: {
        userId: 'user_123456',
        conversationId: conversationId,
      },
    }),
  });

  /**
   * 开启新的对话
   */
  const switchToNewThread = () => {
    setConversationId(() => generateConversationId());
    
    // clear UI state
    runtime.thread.reset();
  };

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SidebarProvider>
        <div className="flex h-dvh w-full pr-0.5">
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center justify-between border-b px-4">
              {/* 左侧：标题 / breadcrumb */}
              <div className="flex items-center gap-2 co">
                {/* <span style={{ color: "#006d75", fontWeight: 600 }}>课程表AI小助手</span> */}
                <span style={{ color: "#006d75", fontWeight: 600 }}>课程日历排课 AI 智能体</span>
              </div>
              {/* 右侧：按钮 */}
              <div className="flex items-center">
                <Button 
                  variant="ghost"
                  onClick={switchToNewThread}
                  className="aui-button-icon"
                >
                  + 开启新对话
                </Button>
              </div>
            </header>
            <div className="flex-1 overflow-hidden">
              <Thread />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
};
