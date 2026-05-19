import type { CSSProperties } from "react";
import { useLayoutEffect, useRef, useState } from "react";

import type { DashboardNotification } from "./types";
import { NotificationCard } from "./notifications/notification-card";

/**
 * 역할
 * - 대시보드 셸의 글로벌 알림 표시 영역입니다.
 *
 * 개요
 * - 어떤 페이지를 보고 있어도 화면 중앙에 가장 중요한 글로벌 알림 1건을 크게 띄웁니다.
 * - 같은 설비에서 알림이 연속 발생해도 DashboardLayout에서 설비 단위로 1건만 전달합니다.
 * - 카드 폭은 데스크톱 기준 화면의 약 70%를 사용하고, 모바일에서는 읽기 가능한 최소 폭을 우선합니다.
 *
 * STEP 1. 중앙 알림에 표시할 최우선 알림 1건을 선택합니다.
 * STEP 2. 표시할 알림이 없으면 아무것도 렌더링하지 않습니다.
 * STEP 3. 각 알림을 `NotificationCard`로 렌더링합니다.
 *
 * 헬퍼
 * - 닫기는 단순 제거가 아니라 DashboardLayout의 3분 숨김 처리로 연결됩니다.
 *
 * 애니메이션 정책
 * - Exit: 이벤트 로그 창이 열려있으면 즉시 제거(애니메이션 없음).
 *         닫혀있으면 핸들 방향으로 짧게 힌트만 주고 페이드아웃. 실제로 핸들까지 이동하지 않음.
 * - 스택: 앞 카드가 사라지면 다음 카드가 position 이동 transition으로 앞자리로 승격.
 *         스택 카드들은 뒤로 갈수록 아래로 오프셋·축소·투명 처리.
 */

type GlobalNotificationsProps = {
  currentPathname?: string;
  notifications: DashboardNotification[];
  onDismiss: (notification: DashboardNotification) => void;
  onNavigateToDashboard: (notification: DashboardNotification) => void;
  onOpen: (notification: DashboardNotification) => void;
};

type ExitingGlobalNotification = {
  instanceId: number;
  notification: DashboardNotification;
  /** true면 drawer가 열린 채로 닫힌 경우 → 즉시 제거 */
  instant: boolean;
};

type NotificationExitMotionStyle = CSSProperties & {
  "--global-notification-exit-x"?: string;
  "--global-notification-exit-y"?: string;
  "--global-notification-exit-scale"?: number;
};
type NotificationStackStyle = CSSProperties & {
  "--global-notification-stack-index"?: number;
  "--global-notification-stack-offset-y"?: string;
  "--global-notification-stack-opacity"?: number;
  "--global-notification-stack-scale"?: number;
  "--global-notification-stack-z"?: number;
};

const ASSET_EVENT_BLIND_HANDLE_SELECTOR =
  '[data-global-notification-target="asset-event-blind-handle"], .AssetEventBlindHandle__button-1';
/** 힌트 이동 애니메이션 지속시간 (ms) */
const GLOBAL_NOTIFICATION_EXIT_MS = 220;
const GLOBAL_NOTIFICATION_STACK_LIMIT = 4;

export function GlobalNotifications({
  currentPathname = "",
  notifications,
  onDismiss,
  onNavigateToDashboard,
  onOpen,
}: GlobalNotificationsProps) {
  const visibleNotifications = notifications.slice(
    0,
    GLOBAL_NOTIFICATION_STACK_LIMIT,
  );
  const firstVisibleNotification = visibleNotifications[0] ?? null;
  const stackedNotifications = visibleNotifications
    .slice(1)
    .map((notification, index) => ({
      notification,
      stackIndex: index + 1,
    }))
    .reverse();
  const [exitingNotifications, setExitingNotifications] = useState<
    ExitingGlobalNotification[]
  >([]);
  const previousVisibleNotificationRef =
    useRef<DashboardNotification | null>(firstVisibleNotification);
  const exitSequenceRef = useRef(0);

  useLayoutEffect(() => {
    const previousNotification = previousVisibleNotificationRef.current;
    const isPreviousNotificationStillVisible = previousNotification
      ? notifications.some(
          (notification) => notification.id === previousNotification.id,
        )
      : false;

    if (
      previousNotification &&
      previousNotification.id !== firstVisibleNotification?.id &&
      !isPreviousNotificationStillVisible
    ) {
      const targetElement = document.querySelector<HTMLElement>(
        ASSET_EVENT_BLIND_HANDLE_SELECTOR,
      );
      const isDrawerOpen = isEventDrawerOpen(targetElement);

      exitSequenceRef.current += 1;
      setExitingNotifications((currentNotifications) =>
        [
          ...currentNotifications,
          {
            instanceId: exitSequenceRef.current,
            notification: previousNotification,
            instant: isDrawerOpen,
          },
        ].slice(-GLOBAL_NOTIFICATION_STACK_LIMIT),
      );
    }

    previousVisibleNotificationRef.current = firstVisibleNotification;
  }, [firstVisibleNotification, notifications]);

  if (!firstVisibleNotification && !exitingNotifications.length) {
    return null;
  }

  return (
    <div
      className="GlobalNotifications GlobalNotifications__container-1 pointer-events-none fixed inset-0 z-50 grid place-items-center px-3 py-6"
      aria-live="polite"
      aria-label="중앙 글로벌 경고 알림"
    >
      {firstVisibleNotification ? (
        <div className="GlobalNotifications GlobalNotifications__stack-shell-1 relative grid place-items-center">
          {stackedNotifications.map(({ notification, stackIndex }) => (
            <NotificationCard
              key={notification.id}
              className="GlobalNotifications__stack-card-1"
              isInteractive={false}
              notification={notification}
              onDismiss={() => undefined}
              onOpen={() => undefined}
              style={buildStackCardStyle(stackIndex)}
            />
          ))}
          <NotificationCard
            canNavigateToDashboard={canNavigateToDashboard(
              firstVisibleNotification,
              currentPathname,
            )}
            key={firstVisibleNotification.id}
            className="GlobalNotifications__front-card-1"
            notification={firstVisibleNotification}
            onDismiss={onDismiss}
            onNavigateToDashboard={onNavigateToDashboard}
            onOpen={onOpen}
          />
        </div>
      ) : null}
      {exitingNotifications.map((exitingNotification) => (
        <ExitingNotificationCard
          key={exitingNotification.instanceId}
          exitingNotification={exitingNotification}
          onExitComplete={(instanceId) => {
            setExitingNotifications((currentNotifications) =>
              currentNotifications.filter(
                (notification) => notification.instanceId !== instanceId,
              ),
            );
          }}
        />
      ))}
    </div>
  );
}

function ExitingNotificationCard({
  exitingNotification,
  onExitComplete,
}: {
  exitingNotification: ExitingGlobalNotification;
  onExitComplete: (instanceId: number) => void;
}) {
  const cardRef = useRef<HTMLElement | null>(null);
  const onExitCompleteRef = useRef(onExitComplete);
  const [motionStyle, setMotionStyle] =
    useState<NotificationExitMotionStyle>(() =>
      buildFallbackExitMotionStyle(),
    );
  const [isAnimating, setIsAnimating] = useState(false);

  useLayoutEffect(() => {
    onExitCompleteRef.current = onExitComplete;
  }, [onExitComplete]);

  useLayoutEffect(() => {
    // Drawer가 열린 상태에서 닫힌 경우 → 즉시 제거, 애니메이션 없음
    if (exitingNotification.instant) {
      onExitCompleteRef.current(exitingNotification.instanceId);
      return;
    }

    let measureFrame = 0;
    let animateFrame = 0;
    let targetElement: HTMLElement | null = null;

    const timeoutId = window.setTimeout(() => {
      onExitCompleteRef.current(exitingNotification.instanceId);
    }, GLOBAL_NOTIFICATION_EXIT_MS + 80);

    measureFrame = window.requestAnimationFrame(() => {
      const cardElement = cardRef.current;

      if (!cardElement) {
        onExitCompleteRef.current(exitingNotification.instanceId);
        return;
      }

      targetElement = document.querySelector<HTMLElement>(
        ASSET_EVENT_BLIND_HANDLE_SELECTOR,
      );

      const sourceRect = cardElement.getBoundingClientRect();
      const targetRect = targetElement?.getBoundingClientRect() ?? null;

      setMotionStyle(buildExitMotionStyle(sourceRect, targetRect));
      targetElement?.classList.add("GlobalNotifications__target-absorbing");

      animateFrame = window.requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    });

    return () => {
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(measureFrame);
      window.cancelAnimationFrame(animateFrame);
      targetElement?.classList.remove("GlobalNotifications__target-absorbing");
    };
  }, [exitingNotification.instanceId, exitingNotification.instant]);

  // instant 모드는 아무것도 렌더링하지 않음
  if (exitingNotification.instant) {
    return null;
  }

  return (
    <div className="GlobalNotifications GlobalNotifications__exit-layer-1 pointer-events-none absolute inset-0 z-[30] grid place-items-center px-3 py-6">
      <NotificationCard
        ref={cardRef}
        className={
          isAnimating
            ? "GlobalNotifications__exit-card-1 GlobalNotifications__exit-card--running"
            : "GlobalNotifications__exit-card-1"
        }
        isInteractive={false}
        notification={exitingNotification.notification}
        onAnimationEnd={(event) => {
          if (event.currentTarget === event.target) {
            onExitCompleteRef.current(exitingNotification.instanceId);
          }
        }}
        onDismiss={() => undefined}
        onOpen={() => undefined}
        style={motionStyle}
      />
    </div>
  );
}

function buildStackCardStyle(stackIndex: number): NotificationStackStyle {
  const cappedStackIndex = Math.min(stackIndex, GLOBAL_NOTIFICATION_STACK_LIMIT);

  return {
    "--global-notification-stack-index": cappedStackIndex,
    "--global-notification-stack-offset-y": formatPixels(cappedStackIndex * 14),
    "--global-notification-stack-opacity": Math.max(
      0.42,
      0.78 - cappedStackIndex * 0.12,
    ),
    "--global-notification-stack-scale": Math.max(
      0.9,
      1 - cappedStackIndex * 0.035,
    ),
    "--global-notification-stack-z":
      GLOBAL_NOTIFICATION_STACK_LIMIT - cappedStackIndex,
  };
}

function canNavigateToDashboard(
  notification: DashboardNotification,
  currentPathname: string,
) {
  return Boolean(
    notification.href && !isCurrentPath(currentPathname, notification.href),
  );
}

function isCurrentPath(pathname: string, href: string) {
  return normalizePathname(pathname) === normalizePathname(href);
}

function normalizePathname(value: string) {
  return value.replace(/\/+$/, "") || "/";
}

function buildExitMotionStyle(
  sourceRect: DOMRect,
  targetRect: DOMRect | null,
): NotificationExitMotionStyle {
  if (!targetRect || !sourceRect.width || !sourceRect.height) {
    return buildFallbackExitMotionStyle();
  }

  const sourceCenterX = sourceRect.left + sourceRect.width / 2;
  const sourceCenterY = sourceRect.top + sourceRect.height / 2;
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;
  const deltaX = targetCenterX - sourceCenterX;
  const deltaY = targetCenterY - sourceCenterY;
  const distance = Math.hypot(deltaX, deltaY);

  if (!distance) {
    return buildFallbackExitMotionStyle();
  }

  // 실제 핸들 위치까지 이동하지 않음 — 방향 힌트만 짧게 (최대 48px)
  const directionX = deltaX / distance;
  const directionY = deltaY / distance;
  const hintDistance = clampNumber(distance * 0.06, 16, 48);

  return {
    "--global-notification-exit-x": formatPixels(directionX * hintDistance),
    "--global-notification-exit-y": formatPixels(directionY * hintDistance),
    "--global-notification-exit-scale": 0.9,
  };
}

function buildFallbackExitMotionStyle(): NotificationExitMotionStyle {
  return {
    "--global-notification-exit-x": "0px",
    "--global-notification-exit-y": "-20px",
    "--global-notification-exit-scale": 0.9,
  };
}

function isEventDrawerOpen(targetElement: HTMLElement | null) {
  return targetElement?.getAttribute("aria-expanded") === "true";
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatPixels(value: number) {
  return `${Math.round(value)}px`;
}
