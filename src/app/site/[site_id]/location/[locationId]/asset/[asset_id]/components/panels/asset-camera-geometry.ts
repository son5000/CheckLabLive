import type { PointerEvent } from "react";

import type {
  AssetPartConfig,
  AssetThresholdConfig,
  DetectionPointConfig,
  DetectionRoiConfig,
} from "@/app/layouts/types";

export type PercentPoint = {
  x: number;
  y: number;
};

const POINT_HIT_RADIUS = 2.6;

export function getRelativePoint(
  event: PointerEvent<HTMLDivElement>,
): PercentPoint {
  const rect = event.currentTarget.getBoundingClientRect();

  return {
    x: roundPercent(((event.clientX - rect.left) / rect.width) * 100),
    y: roundPercent(((event.clientY - rect.top) / rect.height) * 100),
  };
}

export function buildRoi(
  start: PercentPoint,
  end: PercentPoint,
): DetectionRoiConfig {
  return {
    height: roundPercent(Math.abs(end.y - start.y)),
    width: roundPercent(Math.abs(end.x - start.x)),
    x: roundPercent(Math.min(start.x, end.x)),
    y: roundPercent(Math.min(start.y, end.y)),
  };
}

export function findAreaPointHit(
  point: PercentPoint,
  parts: AssetPartConfig[],
  selectedPartId?: string,
) {
  for (const area of getHitOrderedAreas(parts, selectedPartId)) {
    const hitPoint = findPointHit(point, area.points);

    if (hitPoint) {
      return { area, point: hitPoint };
    }
  }

  return undefined;
}

export function findAreaRoiHit(
  point: PercentPoint,
  parts: AssetPartConfig[],
  selectedPartId?: string,
) {
  return getHitOrderedAreas(parts, selectedPartId)
    .filter((area) => area.roi && isPointInsideRoi(point, area.roi))
    .sort((firstArea, secondArea) => {
      if (firstArea.id === selectedPartId) {
        return -1;
      }

      if (secondArea.id === selectedPartId) {
        return 1;
      }

      return getRoiArea(firstArea.roi) - getRoiArea(secondArea.roi);
    })
    .map((area) => ({ area, roi: area.roi }))
    .at(0);
}

export function getPointDelta(
  start: PercentPoint,
  end: PercentPoint,
): PercentPoint {
  return {
    x: end.x - start.x,
    y: end.y - start.y,
  };
}

export function moveRoi(
  roi: DetectionRoiConfig,
  delta: PercentPoint,
): DetectionRoiConfig {
  return {
    ...roi,
    x: roundPercent(Math.min(100 - roi.width, Math.max(0, roi.x + delta.x))),
    y: roundPercent(Math.min(100 - roi.height, Math.max(0, roi.y + delta.y))),
  };
}

export function movePoint(
  point: PercentPoint,
  delta: PercentPoint,
): PercentPoint {
  return {
    x: roundPercent(point.x + delta.x),
    y: roundPercent(point.y + delta.y),
  };
}

export function getAverage(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function roundMetric(value: number) {
  return Number(value.toFixed(1));
}

export function roundPercent(value: number) {
  return Number(Math.min(100, Math.max(0, value)).toFixed(1));
}

export function areAssetThresholdsEqual(
  firstThresholds: AssetThresholdConfig,
  secondThresholds: AssetThresholdConfig,
) {
  return (
    firstThresholds.temperature === secondThresholds.temperature &&
    firstThresholds.temperatureCritical === secondThresholds.temperatureCritical &&
    firstThresholds.ultrasoundDb === secondThresholds.ultrasoundDb &&
    firstThresholds.ultrasoundCriticalDb ===
      secondThresholds.ultrasoundCriticalDb
  );
}

function getHitOrderedAreas(
  parts: AssetPartConfig[],
  selectedPartId?: string,
) {
  return [...parts].sort((firstArea, secondArea) => {
    if (firstArea.id === selectedPartId) {
      return -1;
    }

    if (secondArea.id === selectedPartId) {
      return 1;
    }

    return 0;
  });
}

export function findPointHit(
  pointer: PercentPoint,
  points: DetectionPointConfig[],
) {
  return points.find(
    (point) =>
      Math.hypot(pointer.x - point.x, pointer.y - point.y) <= POINT_HIT_RADIUS,
  );
}

export function isPointInsideRoi(
  point: PercentPoint,
  roi: DetectionRoiConfig,
) {
  return (
    point.x >= roi.x &&
    point.x <= roi.x + roi.width &&
    point.y >= roi.y &&
    point.y <= roi.y + roi.height
  );
}

function getRoiArea(roi?: DetectionRoiConfig) {
  return roi ? roi.width * roi.height : Number.POSITIVE_INFINITY;
}
