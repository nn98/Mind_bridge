import { useEffect, useRef } from 'react';
import { loadGoogleCharts } from '../services/googleCharts';

const MonthlyLineChart = () => {
    const containerRef = useRef(null);
    useEffect(() => {
        loadGoogleCharts().then(google => {
            const data = window.google.visualization.arrayToDataTable([
                ['월', '의뢰 건수'],
                ['2023-01', 108], ['2023-02', 112], ['2023-03', 125], ['2023-04', 134], ['2023-05', 141], ['2023-06', 137],
                ['2023-07', 145], ['2023-08', 152], ['2023-09', 147], ['2023-10', 138], ['2023-11', 130], ['2023-12', 135],
                ['2024-01', 138], ['2024-02', 131], ['2024-03', 144], ['2024-04', 152], ['2024-05', 160], ['2024-06', 158],
                ['2024-07', 167], ['2024-08', 173], ['2024-09', 165], ['2024-10', 162], ['2024-11', 158], ['2024-12', 161],
                ['2025-01', 160], ['2025-02', 155], ['2025-03', 168], ['2025-04', 178], ['2025-05', 190], ['2025-06', 185],
                ['2025-07', 192],
            ]);
            const chart = new google.visualization.LineChart(containerRef.current);
            chart.draw(data, {
                title: '2023 ~ 2025 월간 의뢰 현황',
                chartArea: { width: '90%', height: '65%' },
                fontName: 'Pretendard',
                curveType: 'function',
                legend: { position: 'none' },
                lineWidth: 4,
                pointSize: 6,
                hAxis: { slantedText: true, slantedTextAngle: 45, textStyle: { fontSize: 11 } },
                vAxis: { title: '건수', gridlines: { count: 6 } },
                series: { 0: { color: '#6c63ff' } },
                animation: { startup: true, duration: 900, easing: 'out' },
            });
        });
    }, []);
    return <div ref={containerRef} style={{ width: '100%', height: 500 }} />;
};
export default MonthlyLineChart;