import Link from "next/link";

import { cn } from "@/lib/utils";

import { treeIconMap } from "../constants/dashboard-icons";
import type { MonitoringTreeNode } from "@/app/layouts/types";

/**
 * 역할
 * - 접힌 관제 트리의 아이콘 버튼입니다.
 *
 * 개요
 * - 사이드바가 접혔을 때 전역 사이드메뉴의 핵심 탐색 지점을 보여줍니다.
 *
 * STEP 1. 펼친 트리 행과 동일한 아이콘을 계산합니다.
 * STEP 2. 접근 가능한 아이콘 버튼만 렌더링합니다.
 * STEP 3. 접근성 속성으로 활성 상태 의미를 유지합니다.
 *
 * 헬퍼
 * - 시각적 텍스트가 숨겨져도 제목과 접근성 라벨로 라벨을 제공합니다.
 */

type CompactTreeItemProps = {
  node: MonitoringTreeNode;
  activeNodeId: string;
};

export function CompactTreeItem({ node, activeNodeId }: CompactTreeItemProps) {
  const Icon = treeIconMap[node.type];
  const isActive = node.id === activeNodeId;
  const className = cn(
    "grid h-8 w-10 place-items-center rounded-md transition",
    isActive
      ? "bg-sidebar-primary text-sidebar-primary-foreground"
      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
  );
  const icon = <Icon className="CompactTreeItem CompactTreeItem__icon-1 h-4 w-4" aria-hidden="true" />;

  if (node.href) {
    return (
      <Link
        className={cn("CompactTreeItem CompactTreeItem__link-1", className)}
        title={node.label}
        aria-label={node.label}
        aria-current={isActive ? "page" : undefined}
        href={node.href}
      >
        {icon}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cn("CompactTreeItem CompactTreeItem__button-1", className)}
      title={node.label}
      aria-label={node.label}
      aria-current={isActive ? "page" : undefined}
    >
      {icon}
    </button>
  );
}
