import { ChevronDown } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { treeIconMap } from "../constants/dashboard-icons";
import type { MonitoringTreeNode } from "@/app/layouts/types";

/**
 * 역할
 * - 펼친 관제 트리의 행입니다.
 *
 * 개요
 * - 전역 사이드메뉴의 공정, 위치, 설비 노드를 재귀적으로 렌더링합니다.
 *
 * STEP 1. 노드 아이콘과 활성 상태를 계산합니다.
 * STEP 2. 트리 깊이에 맞춰 들여쓰기된 행을 렌더링합니다.
 * STEP 3. 자식 노드가 있으면 재귀적으로 렌더링합니다.
 *
 * 헬퍼
 * - 이 컴포넌트는 트리 행만 렌더링하며, 접힌 레일 항목은 별도 컴포넌트에 둡니다.
 */

type MonitoringTreeItemProps = {
  node: MonitoringTreeNode;
  activeNodeId: string;
  depth: number;
};

export function MonitoringTreeItem({
  node,
  activeNodeId,
  depth,
}: MonitoringTreeItemProps) {
  const Icon = treeIconMap[node.type];
  const hasChildren = Boolean(node.children?.length);
  const isActive = node.id === activeNodeId;
  const rowContent = (
    <>
      {hasChildren ? (
        <ChevronDown className="MonitoringTreeItem MonitoringTreeItem__icon-1 h-3 w-3 shrink-0 opacity-70" aria-hidden="true" />
      ) : (
        <span className="MonitoringTreeItem MonitoringTreeItem__label-1 h-3 w-3 shrink-0" aria-hidden="true" />
      )}
      <Icon className="MonitoringTreeItem MonitoringTreeItem__icon-2 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="MonitoringTreeItem MonitoringTreeItem__label-2 min-w-0 truncate">{node.label}</span>
    </>
  );
  const rowClassName = cn(
    "flex h-5 w-full min-w-0 items-center gap-1.5 rounded-md pr-1.5 text-left text-xs transition",
    isActive
      ? "bg-sidebar-primary text-sidebar-primary-foreground"
      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
  );

  return (
    <li className="MonitoringTreeItem MonitoringTreeItem__item-1">
      {node.href ? (
        <Link
          className={cn("MonitoringTreeItem MonitoringTreeItem__link-1", rowClassName)}
          style={{ paddingLeft: `${depth * 10 + 6}px` }}
          title={node.label}
          href={node.href}
          aria-current={isActive ? "page" : undefined}
        >
          {rowContent}
        </Link>
      ) : (
        <button
          type="button"
          className={cn("MonitoringTreeItem MonitoringTreeItem__button-1", rowClassName)}
          style={{ paddingLeft: `${depth * 10 + 6}px` }}
          title={node.label}
          aria-current={isActive ? "page" : undefined}
        >
          {rowContent}
        </button>
      )}
      {hasChildren ? (
        <ul className="MonitoringTreeItem MonitoringTreeItem__list-1 mt-0.5 space-y-0.5">
          {node.children?.map((child) => (
            <MonitoringTreeItem
              key={child.id}
              node={child}
              activeNodeId={activeNodeId}
              depth={depth + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
