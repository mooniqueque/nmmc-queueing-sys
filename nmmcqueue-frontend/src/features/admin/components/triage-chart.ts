import { ApexOptions } from 'apexcharts';
import { VolumeData, CategoryData } from '../types';

export const getBarChartOptions = (volumeData: VolumeData[]): ApexOptions => ({
    chart: {
        type: 'bar',
        fontFamily: 'inherit',
        toolbar: { show: false },
        zoom: { enabled: false },
        parentHeightOffset: 0,
        offsetX: -10,
    },
    colors: ['#059669'], // emerald-600
    plotOptions: {
        bar: {
            borderRadius: 2,
            columnWidth: '35%',
        }
    },
    dataLabels: { enabled: false },
    xaxis: {
        categories: volumeData.map(d => d.time),
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
            style: { colors: 'var(--muted-foreground)', fontSize: '12px' },
            offsetY: 5,
        }
    },
    yaxis: {
        labels: {
            style: { colors: 'var(--muted-foreground)', fontSize: '12px' }
        }
    },
    grid: {
        borderColor: 'var(--border)',
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { top: 0, right: 0, bottom: 0, left: 10 }
    },
    tooltip: {
        theme: 'light',
        y: { formatter: (val) => `${val} patients` }
    }
});

export const getDonutChartOptions = (categoryData: CategoryData[]): ApexOptions => ({
    chart: {
        type: 'donut',
        fontFamily: 'inherit',
        parentHeightOffset: 0,
    },
    labels: categoryData.map(d => d.name),
    colors: categoryData.map(d => d.color),
    plotOptions: {
        pie: {
            donut: {
                size: '65%',
            },
            expandOnClick: false
        }
    },
    dataLabels: { enabled: false },
    stroke: { show: true, colors: ['#ffffff'], width: 2 },
    legend: {
        position: 'bottom',
        fontSize: '13px',
        fontFamily: 'inherit',
        fontWeight: 500,
        labels: { colors: '#475569' },
        markers: { size: 5, offsetX: -2 },
        itemMargin: { horizontal: 10, vertical: 5 }
    },
    tooltip: {
        theme: 'light',
        y: { formatter: (val) => `${val} cases` }
    }
});
