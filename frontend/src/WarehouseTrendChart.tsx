import { useEffect, useRef } from 'react';
import { LineChart, type LineSeriesOption } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
  type GridComponentOption,
  type LegendComponentOption,
  type TooltipComponentOption,
} from 'echarts/components';
import { init, use as registerEChartsModules, type ComposeOption, type EChartsType } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import type { WarehouseTrendPoint } from './dashboardMock';
import type { AuthLocale } from './content';
import { getLocaleTag } from './content';

registerEChartsModules([CanvasRenderer, GridComponent, LegendComponent, TooltipComponent, LineChart]);

type TrendChartOption = ComposeOption<
  GridComponentOption | LegendComponentOption | TooltipComponentOption | LineSeriesOption
>;

type WarehouseTrendChartProps = {
  data: WarehouseTrendPoint[];
  locale: AuthLocale;
};

function formatQuantity(value: number, locale: AuthLocale) {
  return new Intl.NumberFormat(getLocaleTag(locale)).format(value);
}

export default function WarehouseTrendChart({ data, locale }: WarehouseTrendChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<EChartsType | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const chart = init(containerRef.current);
    chartRef.current = chart;

    const resizeChart = () => {
      chart.resize();
    };

    let resizeObserver: ResizeObserver | undefined;

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        resizeChart();
      });
      resizeObserver.observe(containerRef.current);
    } else {
      window.addEventListener('resize', resizeChart);
    }

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', resizeChart);
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) {
      return;
    }

    const option: TrendChartOption = {
      animationDuration: 320,
      animationDurationUpdate: 220,
      color: ['#2563eb', '#0f766e'],
      grid: {
        top: 48,
        right: 20,
        bottom: 34,
        left: 56,
      },
      legend: {
        top: 0,
        icon: 'roundRect',
        itemWidth: 12,
        itemHeight: 8,
        textStyle: {
          color: '#475569',
          fontFamily: 'IBM Plex Sans, Segoe UI, sans-serif',
          fontSize: 12,
        },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#ffffff',
        borderColor: '#dbe2ea',
        borderWidth: 1,
        textStyle: {
          color: '#0f172a',
          fontFamily: 'IBM Plex Sans, Segoe UI, sans-serif',
        },
        valueFormatter: (value) => {
          if (typeof value !== 'number') {
            return `${value}`;
          }

          return locale === 'zh' ? `${formatQuantity(value, locale)} 件` : `${formatQuantity(value, locale)} units`;
        },
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.map((point) =>
          new Intl.DateTimeFormat(getLocaleTag(locale), {
            month: 'short',
            day: 'numeric',
          }).format(new Date(point.isoDate)),
        ),
        axisTick: {
          show: false,
        },
        axisLine: {
          lineStyle: {
            color: '#dbe2ea',
          },
        },
        axisLabel: {
          color: '#64748b',
          margin: 12,
          fontSize: 12,
        },
      },
      yAxis: {
        type: 'value',
        name: locale === 'zh' ? '数量' : 'Quantity',
        nameGap: 18,
        nameTextStyle: {
          color: '#64748b',
          fontSize: 12,
          fontFamily: 'IBM Plex Sans, Segoe UI, sans-serif',
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: '#64748b',
          formatter: (value: number) => formatQuantity(value, locale),
        },
        splitLine: {
          lineStyle: {
            color: '#e7edf3',
          },
        },
      },
      series: [
        {
          name: locale === 'zh' ? '入库' : 'Inbound',
          type: 'line',
          smooth: 0.2,
          symbol: 'circle',
          symbolSize: 7,
          data: data.map((point) => point.inbound),
          lineStyle: {
            width: 3,
          },
          itemStyle: {
            borderWidth: 2,
            borderColor: '#ffffff',
          },
          areaStyle: {
            color: 'rgba(37, 99, 235, 0.08)',
          },
        },
        {
          name: locale === 'zh' ? '出库' : 'Outbound',
          type: 'line',
          smooth: 0.2,
          symbol: 'circle',
          symbolSize: 7,
          data: data.map((point) => point.outbound),
          lineStyle: {
            width: 3,
          },
          itemStyle: {
            borderWidth: 2,
            borderColor: '#ffffff',
          },
          areaStyle: {
            color: 'rgba(15, 118, 110, 0.08)',
          },
        },
      ],
    };

    chartRef.current.setOption(option, true);
  }, [data, locale]);

  return (
    <div
      className="dashboard-chart"
      ref={containerRef}
      role="img"
      aria-label={locale === 'zh' ? '近七天入库与出库趋势图' : 'Seven-day inbound and outbound trend chart'}
    />
  );
}
