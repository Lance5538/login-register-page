import { useEffect, useRef } from 'react';
import { PieChart, type PieSeriesOption } from 'echarts/charts';
import { TooltipComponent, type TooltipComponentOption } from 'echarts/components';
import { init, use as registerEChartsModules, type ComposeOption, type EChartsType } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import type { InventoryCategoryShare } from './dashboardMock';
import type { AuthLocale } from './content';
import { getLocaleTag } from './content';

registerEChartsModules([CanvasRenderer, TooltipComponent, PieChart]);

type CategoryChartOption = ComposeOption<TooltipComponentOption | PieSeriesOption>;

type WarehouseCategoryChartProps = {
  data: InventoryCategoryShare[];
  locale: AuthLocale;
};

function formatQuantity(value: number, locale: AuthLocale) {
  return new Intl.NumberFormat(getLocaleTag(locale)).format(value);
}

export default function WarehouseCategoryChart({ data, locale }: WarehouseCategoryChartProps) {
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
      animationDuration: 320,
      animationDurationUpdate: 220,
      tooltip: {
        trigger: 'item',
        backgroundColor: '#ffffff',
        borderColor: '#dbe2ea',
        borderWidth: 1,
        textStyle: {
          color: '#0f172a',
          fontFamily: 'IBM Plex Sans, Segoe UI, sans-serif',
        },
        formatter: (params) => {
          if (typeof params === 'string' || Array.isArray(params)) {
            return `${params}`;
          }

          return locale === 'zh'
            ? `${params.name}<br/>${formatQuantity(Number(params.value), locale)} 件 · ${params.percent}%`
            : `${params.name}<br/>${formatQuantity(Number(params.value), locale)} units · ${params.percent}%`;
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['52%', '76%'],
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
            borderColor: '#ffffff',
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
  }, [data, locale]);

  return (
    <div
      className="dashboard-chart dashboard-chart--compact"
      ref={containerRef}
      role="img"
      aria-label={locale === 'zh' ? '库存分类占比图' : 'Inventory category share chart'}
    />
  );
}
