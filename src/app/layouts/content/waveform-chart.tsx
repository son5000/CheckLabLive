import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { WaveformPoint } from "@/app/layouts/types";

/**
 * 역할
 * - 초음파 관제를 위한 오디오 파형 차트입니다.
 *
 * 개요
 * - 미리 생성된 파형 데이터를 받아 차트 라이브러리로 렌더링합니다.
 *
 * STEP 1. 간결한 LIVE 차트 카드를 렌더링합니다.
 * STEP 2. 샘플 눈금은 숨기고 도움말 확인은 유지합니다.
 * STEP 3. 생성된 진폭 시리즈를 그립니다.
 *
 * 헬퍼
 * - 데이터 생성은 차트 데이터 헬퍼와 텔레메트리 훅에서 담당합니다.
 */

type WaveformChartProps = {
  data: WaveformPoint[];
};

export function WaveformChart({ data }: WaveformChartProps) {
  return (
    <section className="WaveformChart WaveformChart__section-1 flex min-h-0 min-w-0 flex-col overflow-hidden rounded-md border border-border bg-card p-2">
      <div className="WaveformChart WaveformChart__container-1 mb-1 flex min-w-0 items-center justify-between gap-2">
        <h3 className="WaveformChart WaveformChart__title-1 min-w-0 truncate text-xs font-semibold text-foreground">오디오 파형</h3>
        <span className="WaveformChart WaveformChart__label-1 shrink-0 rounded-sm border border-border bg-background px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
          LIVE
        </span>
      </div>
      <div className="WaveformChart WaveformChart__container-2 min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 2, left: 8 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="sample" hide />
            <YAxis
              domain={[-1.4, 1.4]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                color: "var(--popover-foreground)",
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--popover-foreground)" }}
            />
            <Line
              type="monotone"
              dataKey="amplitude"
              name="진폭"
              stroke="var(--chart-3)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
