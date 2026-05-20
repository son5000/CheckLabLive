/**
 * 역할
 * - 대시보드 기능 전반에서 공유하는 타입 저장소입니다.
 *
 * 개요
 * - 셸, 전역 사이드메뉴, 알림, 관제 본문 모듈이 이 파일의 타입을 공유합니다.
 * - 화면 파일은 로컬 타입을 다시 정의하지 않고 이곳의 도메인 계약을 가져옵니다.
 *
 * STEP 1. 내비게이션 셸 계약을 먼저 배치합니다.
 * STEP 2. 관제 본문 계약을 그 다음에 배치합니다.
 * STEP 3. 관제 데이터에서 파생되는 차트와 임계치 계약을 마지막에 배치합니다.
 *
 * 헬퍼
 * - 기준선 설정 타입은 차트 모듈 사이의 임계선 형식을 표준화합니다.
 */

export type DashboardStatus = "normal" | "caution" | "warning" | "danger" | "error";

export type NotificationGrade =
  | "info"
  | "success"
  | "caution"
  | "warning"
  | "danger"
  | "error";

export type MonitoringNodeType = "overview" | "site" | "place" | "asset";

export type ManagementMenuIcon =
  | "alarm"
  | "asset"
  | "site"
  | "place"
  | "camera"
  | "roi"
  | "threshold"
  | "rule"
  | "notification"
  | "user";

export type MonitoringTreeNode = {
  alertCount?: number;
  assetCode?: string;
  assetCount?: number;
  assetNumber?: string;
  children?: MonitoringTreeNode[];
  description?: string;
  emergencyContact?: string;
  floor?: string;
  href?: string;
  id: string;
  label: string;
  lastCollectedAt?: string;
  lastInspectionDate?: string;
  locationCount?: number;
  manager?: string;
  modelName?: string;
  operationState?: OperationState;
  serialNumber?: string;
  status?: DashboardStatus;
  type: MonitoringNodeType;
};

export type ManagementMenuItem = {
  id: string;
  label: string;
  icon: ManagementMenuIcon;
};

export type DashboardHeaderState = {
  selectedPath: string[];
  assetStatus: DashboardStatus;
  assetStatusLabel: string;
  unresolvedAlarmCount: number;
  lastCollectedAt: string;
  userName: string;
};

export type DashboardNotification = {
  asset_id?: string;
  dedupeKey?: string;
  assetId?: string;
  eventId?: string;
  id: string;
  grade: NotificationGrade;
  href?: string;
  title: string;
  location: string;
  message: string;
  occurredAt: string;
  occurredAtIso?: string;
};

export type AssetJudgement = "정상" | "요주의" | "이상";

export type OperationState = "가동중" | "비가동";

export type TrendRangeId = "1m" | "30m" | "1h" | "24h" | "7d";

export type TrendKind = "ultrasonic" | "temperature";

export type AssetJudgementItem = {
  id: string;
  name: string;
  judgement: AssetJudgement;
};

export type AssetMetrics = {
  assetName: string;
  soundDb: number;
  peakDb: number;
  frequencyKHz: number;
  averageTemperature: number;
  maxTemperature: number;
  minTemperature: number;
  operationState: OperationState;
  powerStatus: string;
  inputVoltage: string;
  powerUsage: string;
};

export type TemperatureArea = {
  id: string;
  name: string;
  average: number;
  max: number;
  min: number;
  points: string;
};

export type AlarmRecord = {
  id: string;
  type: string;
  occurredAt: string;
  code: string;
  isConfirmed: boolean;
};

export type TrendRange = {
  id: TrendRangeId;
  label: string;
  points: number;
};

export type TrendPoint = {
  time: string;
  average: number;
  max: number;
  min?: number;
  peakFrequency?: number;
  spread?: number;
};

export type ThresholdState = {
  soundDb: number;
  peakDb: number;
  averageTemperature: number;
  maxTemperature: number;
};

export type ThresholdMetric = {
  id: keyof ThresholdState;
  group: "초음파" | "열화상";
  label: string;
  value: number;
  threshold: number;
  unit: string;
};

export type WaveformPoint = {
  sample: number;
  amplitude: number;
};

export type ReferenceLineConfig = {
  label: string;
  value: number;
  stroke: string;
};

export type AssetEventGrade = "normal" | "caution" | "abnormal";

export type AssetEventSource =
  | "asset-part-threshold"
  | "asset-threshold"
  | "system";

export type AssetEventRecord = {
  alertId?: string;
  asset_id?: string;
  edgeId?: string;
  eventType?: string;
  globalAlert?: boolean;
  id: string;
  grade: AssetEventGrade;
  isRead?: boolean;
  message: string;
  occurredAt: string;
  occurredAtIso?: string;
  readAt?: string;
  readBy?: string;
  roiId?: string;
  source: AssetEventSource;
  sourceType?: string;
  title: string;
  xNorm?: number;
  yNorm?: number;
};

export type AssetCameraStreamState = "idle" | "live" | "error" | string;

export type AssetCameraFeed = {
  id: string;
  label: string;
  name: string;
  streamMessage?: string;
  streamState?: AssetCameraStreamState;
  streamUrl?: string | null;
};

export type TemperatureJudgement = "normal" | "caution" | "abnormal";

export type DetectionSelectionMode = "area" | "points";

export type DetectionPointConfig = {
  id: string;
  x: number;
  y: number;
};

export type DetectionRoiConfig = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type AssetThresholdConfig = {
  temperature: number;
  temperatureCritical?: number;
  ultrasoundDb: number;
  ultrasoundCriticalDb?: number;
};

export type AssetPartViewer3DTarget = {
  color?: string;
  kind: "area" | "point";
  previewImageDataUrl?: string;
  worldArea?: {
    end: Vector3;
    start: Vector3;
  };
  worldPosition: Vector3;
};

export type AssetPartConfig = {
  id: string;
  linkedAlarm: boolean;
  mode: DetectionSelectionMode;
  name: string;
  points: DetectionPointConfig[];
  roi?: DetectionRoiConfig;
  source?: "3d" | "camera";
  thresholds: AssetThresholdConfig;
  viewer3DTarget?: AssetPartViewer3DTarget;
};

export type AssetPartStatus = {
  partId: string;
  dominantFrequencyKHz: number;
  judgement: TemperatureJudgement;
  temperatureAverage: number;
  temperatureMax: number;
  ultrasoundPeakDb: number;
};

export type SampleSite = {
  site_id: string;
  name: string;
  description: string;
  status: DashboardStatus;
  href: string;
  locationCount: number;
  assetCount: number;
  alertCount: number;
};

export type SampleLocation = {
  id: string;
  site_id: string;
  name: string;
  floor: string;
  status: DashboardStatus;
  href: string;
  assetCount: number;
  summary: string;
};

export type SampleAsset = {
  asset_id: string;
  assetNumber?: string;
  emergencyContact?: string;
  assetCode?: string;
  id: string;
  lastInspectionDate?: string;
  site_id: string;
  locationId: string;
  manager?: string;
  modelName?: string;
  name: string;
  operationState?: OperationState;
  serialNumber?: string;
  type: string;
  status: DashboardStatus;
  href: string;
  lastCollectedAt: string;
};

export type UltrasoundDetection = {
  id: string;
  sourceCoordinateId: string;
  x: number;
  y: number;
  peakDb: number;
  averageDb: number;
  frequencyBandKHz: string;
  dominantFrequencyKHz: number;
};

export type AssetDashboardHeaderSnapshot = {
  assetName?: string;
  dashboardStatus?: DashboardStatus;
  eventJudgmentLabel?: string;
  eventJudgmentGrade?: AssetEventGrade;
  lastCollectedAt?: string;
  locationLabel?: string;
  overallStatusLabel?: string;
  path?: string[];
  recentAlertCount?: number;
  statusJudgement?: TemperatureJudgement;
};

export type AssetDashboardSummarySnapshot = {
  averageTemperature?: number;
  dominantFrequencyKHz?: number;
  frequencyBandKHz?: string;
  temperatureMax?: number;
  temperatureMin?: number;
  ultrasoundAverageDb?: number;
  ultrasoundDetectionCount?: number;
  ultrasoundPeakDb?: number;
};

export type AssetDashboardTrendSnapshot = {
  selectedRangeId?: string;
  temperatureData?: TrendPoint[];
  temperatureReferenceLines?: ReferenceLineConfig[];
  ultrasonicData?: TrendPoint[];
  ultrasonicReferenceLines?: ReferenceLineConfig[];
};

export type AssetDashboardRemoteSnapshot = {
  asset_id: string;
  cameraFeeds?: AssetCameraFeed[];
  clock?: {
    currentDate?: string;
    currentTime?: string;
  };
  header?: AssetDashboardHeaderSnapshot;
  initialAssetParts?: AssetPartConfig[];
  initialAssetPartStates?: AssetPartStatus[];
  initialThresholds?: AssetThresholdConfig | null;
  recentEvents?: AssetEventRecord[];
  summary?: AssetDashboardSummarySnapshot;
  trend?: AssetDashboardTrendSnapshot;
};

// 3D Model Viewer Types
export type Model3DViewType = "camera" | "3d";
export type CameraPreset =
  | "front"
  | "back"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "isometric";

export type Model3DTextureRole =
  | "baseColor"
  | "emissive"
  | "alpha"
  | "roughness";

export type Model3DTextureFile = {
  enabled?: boolean;
  id: string;
  label?: string;
  role: Model3DTextureRole;
  source: string | File;
  strength?: number;
};

export type Model3DFile = {
  fallbackToDefault?: boolean;
  label?: string;
  normalizeSize?: number;
  plyUrl: string | File;
  textureUrl?: string | File;
  textureUrls?: Array<string | File>;
  textures?: Model3DTextureFile[];
};

export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export type Camera3DConfig = {
  damping?: boolean;
  maxDistance?: number;
  minDistance?: number;
  position: Vector3;
  preset?: CameraPreset;
  fov: number;
  target: Vector3;
};

export type Lighting3DConfig = {
  ambientLight: {
    intensity: number;
    color: string;
  };
  directionalLight: {
    color: string;
    intensity: number;
    position: Vector3;
  };
  hemisphereLight?: {
    color: string;
    groundColor: string;
    intensity: number;
  };
  pointLight?: {
    color: string;
    distance: number;
    enabled?: boolean;
    intensity: number;
    position: Vector3;
  };
};

export type Background3DConfig = {
  color: string;
  fog?: {
    color: string;
    enabled: boolean;
    far: number;
    near: number;
  };
  gridColor?: string;
  gridDivisions?: number;
  gridSize: number;
  groundColor?: string;
  showAxes?: boolean;
  showGrid: boolean;
  showGround?: boolean;
};

export type Model3DConfig = {
  castShadow?: boolean;
  color: string;
  metalness?: number;
  opacity: number;
  receiveShadow?: boolean;
  roughness?: number;
  rotation: Vector3;
  scale: number;
  textureBlend?: number;
  wireframe?: boolean;
};

export type Viewer3DControlConfig = {
  autoRotateSpeed?: number;
  enableFileInputs?: boolean;
  enablePan?: boolean;
  enableRotate?: boolean;
  enableZoom?: boolean;
  showOptionBar?: boolean;
};

export type Viewer3DConfig = {
  autoRotate?: boolean;
  camera: Camera3DConfig;
  background: Background3DConfig;
  controls?: Viewer3DControlConfig;
  lighting: Lighting3DConfig;
  model: Model3DConfig;
};
