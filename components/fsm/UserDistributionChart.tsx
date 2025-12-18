'use client';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useEffect, useState } from 'react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export const options = {
    responsive: true,
    plugins: {
        legend: {
            position: 'top' as const,
        },
        title: {
            display: true,
            text: 'Active User Distribution',
        },
    },
};

export default function UserDistributionChart() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/admin/api/fsm/stats'); // No ID = Active Version
                if (res.ok) {
                    const stats = await res.json();
                    if (stats.stateDistribution) {
                        const sorted = stats.stateDistribution.sort((a: any, b: any) => b.count - a.count);
                        const labels = sorted.map((s: any) => s.name);
                        const counts = sorted.map((s: any) => s.count);

                        setData({
                            labels,
                            datasets: [
                                {
                                    label: 'Users',
                                    data: counts,
                                    backgroundColor: 'rgba(37, 99, 235, 0.6)',
                                    borderRadius: 4,
                                },
                            ],
                        });
                    }
                }
            } catch (e) { console.error(e); }
        };
        fetchStats();
    }, []);

    if (!data) return <div className="h-64 flex items-center justify-center bg-gray-50 rounded text-sm text-gray-500">Loading Stats...</div>;

    return <Bar options={options} data={data} />;
}
