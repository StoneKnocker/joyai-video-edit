import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";

interface WorkspaceContextType {
  showWorkspace: boolean;
  selectedTemplateId: string | null;
  showWorkspaceWithTemplate: (templateId?: string) => void;
  hideWorkspace: () => void;
  resetWorkspace: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  const showWorkspaceWithTemplate = useCallback((templateId?: string) => {
    setSelectedTemplateId(templateId ?? null);
    setShowWorkspace(true);
    // Scroll to workspace after state update
    setTimeout(() => {
      const workspaceElement = document.getElementById("workspace");
      if (workspaceElement) {
        workspaceElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  }, []);

  const hideWorkspace = useCallback(() => {
    setShowWorkspace(false);
    setSelectedTemplateId(null);
  }, []);

  const resetWorkspace = useCallback(() => {
    setSelectedTemplateId(null);
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        showWorkspace,
        selectedTemplateId,
        showWorkspaceWithTemplate,
        hideWorkspace,
        resetWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
