import { cn } from "@/lib/utils";

import type { AssetPartConfig, AssetPartStatus } from "@/app/layouts/types";
import {
  getJudgementDetail,
  judgementClassName,
  judgementLabel,
  type AssetJudgementState,
} from "./judgement";

export function AssetJudgementBanner({
  parts,
  partStates,
  judgement,
  thresholdsConfigured,
}: {
  parts: AssetPartConfig[];
  partStates: AssetPartStatus[];
  judgement: AssetJudgementState;
  thresholdsConfigured: boolean;
}) {
  const judgementDetail =
    thresholdsConfigured && judgement !== "unconfigured"
      ? getJudgementDetail(parts, partStates, judgement)
      : "설비 임계치를 설정해야 정상·요주의·이상 판정과 알림 이벤트가 활성화됩니다.";

  return (
    <div
      className={cn(
        "AssetJudgementBanner AssetJudgementBanner__container-1 mt-2 min-w-0 rounded-md border px-2.5 py-1.5",
        judgementClassName[judgement],
      )}
    >
      <p className="AssetJudgementBanner AssetJudgementBanner__text-1 truncate text-[11px] font-medium">
        설비 종합 판정
      </p>
      <p className="AssetJudgementBanner AssetJudgementBanner__text-2 truncate text-xl font-semibold leading-tight">
        {thresholdsConfigured ? judgementLabel[judgement] : "임계치 설정 필요"}
      </p>
      <p
        className="AssetJudgementBanner AssetJudgementBanner__text-3 truncate text-[10px] opacity-85"
        title={judgementDetail}
      >
        {judgementDetail}
      </p>
    </div>
  );
}
