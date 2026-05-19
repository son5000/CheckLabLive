"use client";

import { useEffect, useState } from "react";

/**
 * 역할
 * - 대시보드 셸의 테마 모드 컨트롤러입니다.
 *
 * 개요
 * - 기본값은 관제 화면에 맞춰 dark로 시작합니다.
 * - 밝은/어두운 상태를 관리하고 테일윈드 어두운 모드에 맞춰 문서 요소를 동기화합니다.
 *
 * STEP 1. 활성 모드를 클라이언트 상태에 저장합니다.
 * STEP 2. 모드를 `document.documentElement`에 반영합니다.
 * STEP 3. 헤더 액션에서 사용할 작은 토글 함수를 제공합니다.
 *
 * 헬퍼
 * - 문서 객체 모델 부수 효과가 시각적 셸 컴포넌트에 섞이지 않게 합니다.
 */

export type ThemeMode = "light" | "dark";

export function useDashboardTheme() {
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const isDarkMode = themeMode === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    document.documentElement.style.colorScheme = themeMode;
  }, [isDarkMode, themeMode]);

  const handleThemeToggle = () => {
    setThemeMode((mode) => (mode === "dark" ? "light" : "dark"));
  };

  return {
    isDarkMode,
    themeMode,
    onThemeToggle: handleThemeToggle,
  };
}
