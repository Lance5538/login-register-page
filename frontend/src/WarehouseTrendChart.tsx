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

registerEChartsModules([CanvasRenderer, GridComponent, LegendComponent, TooltipComponent, LineChart]);

type TrendChartOption = ComposeOption<
  GridComponentOption | LegendComponentOption | TooltipComponentOption | LineSeriesOption
>;

type WarehouseTrendChartProps = {
  data: WarehouseTrendPoint[];
};

function formatQuantity(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

export default function WarehouseTrendChart({ data }: WarehouseTrendChartProps) {
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
      animationDuration: 420,
      animationDurationUpdate: 280,
      color: ['#67e1b9', '#8fb8ff'],
      grid: {
        top: 54,
        right: 20,
        bottom: 28,
        left: 52,
      },
      legend: {
        top: 0,
        icon: 'roundRect',
        itemWidth: 14,
        itemHeight: 8,
        textStyle: {
          color: '#8ca2b4',
          fontFamily: 'Space Grotesk, Segoe UI, sans-serif',
        },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(7, 14, 19, 0.96)',
        borderColor: 'rgba(140, 162, 180, 0.24)',
        textStyle: {
          color: '#edf5fb',
          fontFamily: 'Space Grotesk, Segoe UI, sans-serif',
        },
        valueFormatter: (value) => {
          if (typeof value !== 'number') {
            return `${value}`;
          }

          return `${formatQuantity(value)} units`;
        },
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.map((point) => point.label),
        axisTick: {
          show: false,
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(140, 162, 180, 0.26)',
          },
        },
        axisLabel: {
          color: '#8ca2b4',
          margin: 14,
          fontSize: 12,
        },
      },
      yAxis: {
        type: 'value',
        name: 'Quantity',
        nameGap: 22,
        nameTextStyle: {
          color: '#8ca2b4',
          fontSize: 12,
          fontFamily: 'IBM Plex Mono, SFMono-Regular, monospace',
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: '#8ca2b4',
          formatter: (value: number) => formatQuantity(value),
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(140, 162, 180, 0.16)',
            type: 'dashed',
          },
        },
      },
      series: [
        {
          name: 'Inbound',
          type: 'line',
          smooth: 0.2,
          symbol: 'circle',
          symbolSize: 8,
          data: data.map((point) => point.inbound),
          lineStyle: {
            width: 3,
          },
          itemStyle: {
            borderWidth: 2,
            borderColor: '#041015',
          },
        },
        {
          name: 'Outbound',
          type: 'line',
          smooth: 0.2,
          symbol: 'circle',
          symbolSize: 8,
          data: data.map((point) => point.outbound),
          lineStyle: {
            width: 3,
          },
          itemStyle: {
            borderWidth: 2,
            borderColor: '#041015',
          },
        },
      ],
    };

    chartRef.current.setOption(option, true);
  }, [data]);

  return <div className="dashboard-chart" ref={containerRef} role="img" aria-label="Seven-day inbound and outbound trend chart" />;
}
