import type { ReactNode } from "react";

/**
 * 역할
 * - 대시보드 헤더 액션에서 공유하는 아이콘 전용 버튼입니다.
 *
 * 개요
 * - 크기, 테두리, 마우스 올림, 제목, 접근성 라벨 동작을 통일합니다.
 *
 * STEP 1. 사용자가 이해할 수 있는 라벨을 받습니다.
 * STEP 2. 전달받은 루시드 아이콘 노드를 렌더링합니다.
 * STEP 3. 선택적 클릭 핸들러를 연결합니다.
 *
 * 헬퍼
 * - 별도 배지나 텍스트 라벨이 필요 없는 헤더 버튼에 사용합니다.
 */

type HeaderIconButtonProps = {
  label: string;
  children: ReactNode;
  onClick?: () => void;
};

export function HeaderIconButton({ label, children, onClick }: HeaderIconButtonProps) {
  return (
    <button
      type="button"
      className="HeaderIconButton HeaderIconButton__button-1 grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-background text-muted-foreground transition hover:bg-accent hover:text-foreground"
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
