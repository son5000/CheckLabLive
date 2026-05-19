import { ListTree } from "lucide-react";

import { cn } from "@/lib/utils";

import { flattenTree } from "../helpers/monitoring-tree";
import type { MonitoringTreeNode } from "@/app/layouts/types";
import { CompactTreeItem } from "./compact-tree-item";
import { MonitoringTreeItem } from "./monitoring-tree-item";

/**
 * 역할
 * - 전역 사이드메뉴의 관제 트리 섹션입니다.
 *
 * 개요
 * - 관제 내비게이션의 펼친 계층과 접힌 아이콘 레일을 담당합니다.
 *
 * STEP 1. 축약 모드에 사용할 트리를 평탄화합니다.
 * STEP 2. 축약 모드에서도 전체 현황, 공정 노드, 활성 설비를 보이게 유지합니다.
 * STEP 3. 펼친 상태에서는 전체 재귀 트리를 렌더링합니다.
 *
 * 헬퍼
 * - 전역 사이드메뉴의 첫 번째 시각 그룹인 `관제 트리`를 반영합니다.
 */

type MonitoringTreeSectionProps = {
  monitoringTree: MonitoringTreeNode;
  activeNodeId: string;
  isCollapsed: boolean;
};

export function MonitoringTreeSection({
  monitoringTree,
  activeNodeId,
  isCollapsed,
}: MonitoringTreeSectionProps) {
  const compactTreeNodes = flattenTree(monitoringTree).filter(
    (node) => node.type === "overview" || node.type === "site" || node.id === activeNodeId,
  );

  return (
    <section className="MonitoringTreeSection MonitoringTreeSection__section-1 min-h-0 overflow-hidden rounded-md border border-sidebar-border bg-background/45 p-2">
      <div className={cn("MonitoringTreeSection MonitoringTreeSection__container-1 mb-1.5 flex h-5 items-center gap-1.5", isCollapsed && "md:justify-center")}>
        <ListTree className="MonitoringTreeSection MonitoringTreeSection__icon-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <h2 className={cn("MonitoringTreeSection MonitoringTreeSection__title-1 truncate text-xs font-semibold", isCollapsed && "md:hidden")}>
          관제 트리
        </h2>
      </div>

      {isCollapsed ? (
        <div className="MonitoringTreeSection MonitoringTreeSection__container-2 hidden justify-items-center gap-1 md:grid">
          {compactTreeNodes.map((node) => (
            <CompactTreeItem key={node.id} node={node} activeNodeId={activeNodeId} />
          ))}
        </div>
      ) : null}

      <ul className={cn("MonitoringTreeSection MonitoringTreeSection__list-1 space-y-0.5", isCollapsed && "md:hidden")}>
        <MonitoringTreeItem node={monitoringTree} activeNodeId={activeNodeId} depth={0} />
      </ul>
    </section>
  );
}
