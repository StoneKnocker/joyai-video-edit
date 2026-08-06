import * as React from "react";
import { cn } from "~/lib/utils";
import { GenerationForm } from "./generation-form";
import { VideoPreview } from "./video-preview";
import type { GenerationTab, WorkspaceTaskState } from "./workspace-types";

export type VideoWorkspaceProps = {};

export function VideoWorkspace(_props: VideoWorkspaceProps) {
  const [activeTab, setActiveTab] =
    React.useState<GenerationTab>("multi-reference");
  const [taskState, setTaskState] = React.useState<WorkspaceTaskState>({
    status: "idle",
    videoUrls: [],
    imageUrls: [],
  });

  return (
    <div
      id="workspace"
      className={cn(
        "landing-theme mx-auto my-4 flex h-full w-full max-w-[90rem] flex-col items-start gap-8 p-6 lg:flex-row",
        "scroll-mt-20 rounded-3xl border border-border/50 bg-card shadow-xl",
      )}
    >
      <GenerationForm
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onTaskStateChange={setTaskState}
      />
      <VideoPreview
        showGuide={activeTab === "multi-reference"}
        taskState={taskState}
      />
    </div>
  );
}

export default VideoWorkspace;
