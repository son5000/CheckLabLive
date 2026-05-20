import type { AssetThresholdConfig, Vector3 } from "@/app/layouts/types";

export type Viewer3DAnalysisMode = "area" | "point";

export type Viewer3DAnalysisArea = {
  end: Vector3;
  start: Vector3;
};

export type Viewer3DAnalysisDraft = {
  kind: Viewer3DAnalysisMode;
  previewImageDataUrl?: string;
  worldArea?: Viewer3DAnalysisArea;
  worldPosition: Vector3;
};

export type Viewer3DAnalysisTarget = Viewer3DAnalysisDraft & {
  color: string;
  createdAt: string;
  id: string;
  linkedAlarm: boolean;
  name: string;
  sensitivity: number;
  thresholds: AssetThresholdConfig;
};

export type Viewer3DAnalysisSummary = {
  dominantFrequencyKHz: number;
  subtitle: string;
  temperatureAverage: number;
  temperatureMax: number;
  temperatureMin: number;
  title: string;
  trendLabel: string;
  ultrasoundDetectedDb: number;
  ultrasoundPeakDb: number;
};
