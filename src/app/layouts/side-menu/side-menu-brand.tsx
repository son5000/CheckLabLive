import { cn } from "@/lib/utils";

import { brandIcon as BrandIcon } from "../constants/dashboard-icons";

/**
 * 역할
 * - 전역 대시보드 사이드메뉴의 브랜드 블록입니다.
 *
 * 개요
 * - 탐색 그룹 위에 고정된 제품/문맥 신호를 제공합니다.
 *
 * STEP 1. 공유 공정 아이콘을 렌더링합니다.
 * STEP 2. 데스크톱 접힘 모드에서는 아이콘만 남기고 텍스트를 숨깁니다.
 *
 * 헬퍼
 * - 셸 정체성을 일관되게 유지하기 위해 공유 아이콘 저장소에서 아이콘을 가져옵니다.
 */

type SideMenuBrandProps = {
  isCollapsed: boolean;
};

export function SideMenuBrand({ isCollapsed }: SideMenuBrandProps) {
  return (
    <div className="SideMenuBrand SideMenuBrand__container-1 flex h-10 shrink-0 items-center gap-2 px-2">
      <div className="SideMenuBrand SideMenuBrand__container-2 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
        <BrandIcon className="SideMenuBrand SideMenuBrand__icon-1 h-4 w-4" aria-hidden="true" />
      </div>
      <div className={cn("SideMenuBrand SideMenuBrand__container-3 min-w-0", isCollapsed && "md:hidden")}>
        <p className="SideMenuBrand SideMenuBrand__text-1 truncate text-sm font-semibold">공정 관제</p>
        <p className="SideMenuBrand SideMenuBrand__text-2 truncate text-[11px] text-muted-foreground">전체 설비 구조</p>
      </div>
    </div>
  );
}
