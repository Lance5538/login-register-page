import { useEffect, useRef } from 'react';
import { PieChart, type PieSeriesOption } from 'echarts/charts';
import { TooltipComponent, type TooltipComponentOption } from 'echarts/components';
import { init, use as registerEChartsModules, type ComposeOption, type EChartsType } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import type { InventoryCategoryShare } from './dashboardMock';

registerEChartsModules([CanvasRenderer, TooltipComponent, PieChart]);

type CategoryChartOption = ComposeOption<TooltipComponentOption | PieSeriesOption>;

type WarehouseCategoryChartProps = {
  data: InventoryCategoryShare[];
};

function formatQuantity(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

export default function WarehouseCategoryChart({ data }: WarehouseCategoryChartProps) {
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

    const option: CategoryChartOption = {
      animationDuration: 420,
      animationDurationUpdate: 280,
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(7, 14, 19, 0.96)',
        borderColor: 'rgba(140, 162, 180, 0.24)',
        textStyle: {
          color: '#edf5fb',
          fontFamily: 'Space Grotesk, Segoe UI, sans-serif',
        },
        formatter: (params) => {
          if (typeof params === 'string' || Array.isArray(params)) {
            return `${params}`;
          }

          return `${params.name}<br/>${formatQuantity(Number(params.value))} units · ${params.percent}%`;
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['54%', '78%'],
          center: ['50%', '50%'],
          minAngle: 6,
          avoidLabelOverlap: true,
          label: {
            show: false,
          },
          labelLine: {
            show: false,
          },
          itemStyle: {
            borderWidth: 3,
            borderColor: '#09131b',
          },
          data: data.map((item) => ({
            name: item.label,
            value: item.value,
            itemStyle: {
              color: item.color,
            },
          })),
        },
      ],
    };

    chartRef.current.setOption(option, true);
  }, [data]);

  return <div className="dashboard-chart dashboard-chart--compact" ref={containerRef} role="img" aria-label="Inventory category share pie chart" />;
}
