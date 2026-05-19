import { Settings2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { managementIconMap } from "../constants/dashboard-icons";
import type { ManagementMenuItem } from "@/app/layouts/types";

/**
 * 역할
 * - 전역 사이드메뉴의 관리 메뉴 섹션입니다.
 *
 * 개요
 * - 설비, 공정, 관심 영역, 임계치 설정 같은 운영 설정 항목을 렌더링합니다.
 *
 * STEP 1. 접힘 상태 동작이 포함된 섹션 라벨을 렌더링합니다.
 * STEP 2. 각 메뉴 항목의 의미 기반 아이콘 키를 계산합니다.
 * STEP 3. 2열 레이아웃과 축약 아이콘 레이아웃을 전환합니다.
 *
 * 헬퍼
 * - 전역 사이드메뉴의 두 번째 시각 그룹인 `관리 메뉴`를 반영합니다.
 */

type ManagementMenuSectionProps = {
  items: ManagementMenuItem[];
  isCollapsed: boolean;
};

export function ManagementMenuSection({ items, isCollapsed }: ManagementMenuSectionProps) {
  return (
    <section className="ManagementMenuSection ManagementMenuSection__section-1 shrink-0 overflow-hidden rounded-md border border-sidebar-border bg-background/45 p-2">
      <div className={cn("ManagementMenuSection ManagementMenuSection__container-1 mb-1.5 flex h-5 items-center gap-1.5", isCollapsed && "md:justify-center")}>
        <Settings2 className="ManagementMenuSection ManagementMenuSection__icon-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <h2 className={cn("ManagementMenuSection ManagementMenuSection__title-1 truncate text-xs font-semibold", isCollapsed && "md:hidden")}>
          관리 메뉴
        </h2>
      </div>
      <div
        className={cn(
          "ManagementMenuSection ManagementMenuSection__container-2 grid gap-1",
          isCollapsed ? "grid-cols-2 md:grid-cols-1" : "grid-cols-2",
        )}
      >
        {items.map((item) => {
          const Icon = managementIconMap[item.icon];

          return (
            <button
              key={item.id}
              type="button"
              className={cn(
                "ManagementMenuSection ManagementMenuSection__button-1 flex h-7 min-w-0 items-center gap-1.5 rounded-md px-1.5 text-left text-xs text-sidebar-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isCollapsed && "md:grid md:h-8 md:place-items-center md:px-0",
              )}
              title={item.label}
              aria-label={item.label}
            >
              <Icon className="ManagementMenuSection ManagementMenuSection__icon-2 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className={cn("ManagementMenuSection ManagementMenuSection__label-1 min-w-0 truncate", isCollapsed && "md:hidden")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
