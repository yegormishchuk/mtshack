import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface MetricChartProps {
  data: [string, number][];
  min?: number;
  max?: number;
  height?: number;
  color?: [string, string];
}

export function MetricChart({
  data,
  min = 0,
  max = 100,
  height = 160,
  color = ['#FF0023', '#ff6b6b']
}: MetricChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    chartRef.current = echarts.init(containerRef.current);

    const dateList = data.map((item) => item[0]);
    const valueList = data.map((item) => item[1]);

    const option: echarts.EChartsOption = {
      visualMap: {
        show: false,
        type: 'continuous',
        seriesIndex: 0,
        min,
        max,
        inRange: {
          color: color
        }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#374151', fontSize: 12 }
      },
      grid: {
        top: 8,
        bottom: 24,
        left: 40,
        right: 12
      },
      xAxis: {
        type: 'category',
        data: dateList,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          fontSize: 10,
          color: '#9ca3af',
          interval: Math.floor(dateList.length / 5)
        }
      },
      yAxis: {
        type: 'value',
        min,
        splitLine: { lineStyle: { color: '#f3f4f6' } },
        axisLabel: { fontSize: 10, color: '#9ca3af' }
      },
      series: [
        {
          type: 'line',
          showSymbol: false,
          smooth: true,
          data: valueList,
          lineStyle: { width: 2 },
          areaStyle: {
            opacity: 0.12
          }
        }
      ]
    };

    chartRef.current.setOption(option);

    const observer = new ResizeObserver(() => chartRef.current?.resize());
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chartRef.current?.dispose();
    };
  }, [data, min, max, color]);

  return <div ref={containerRef} style={{ width: '100%', height }} />;
}
