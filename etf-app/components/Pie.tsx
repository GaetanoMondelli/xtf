import dynamic from 'next/dynamic';

export const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

import type { ApexOptions } from 'apexcharts';


export const PieC = (
    { children }: { children: React.ReactNode }
) => {

    const chartOptions: ApexOptions = {
        chart: {
            background: 'transparent',
            stacked: false,
            toolbar: {
                show: false
            }
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '60%'
                }
            }
        },
        colors: ['#ff9900', '#1c81c2', '#333', '#5c6ac0'],
        dataLabels: {
            enabled: true,
            formatter: function (val) {
                return val + '%';
            },
            style: {
                colors: ['white']
            },
            background: {
                enabled: true,
                foreColor: 'white',
                padding: 8,
                borderRadius: 4,
                borderWidth: 0,
                opacity: 0.3,
                dropShadow: {
                    enabled: true,
                    top: 1,
                    left: 1,
                    blur: 1,
                    color: 'black', //theme.colors.alpha.black[70],
                    opacity: 0.5
                }
            },
            dropShadow: {
                enabled: true,
                top: 1,
                left: 1,
                blur: 1,
                color: 'darkgray', //theme.colors.alpha.black[50],
                opacity: 0.5
            }
        },
        fill: {
            opacity: 1
        },
        labels: ['Bitcoin', 'Ripple', 'Cardano', 'Ethereum'],
        legend: {
            labels: {
                colors: 'white'
            },
            show: false
        },
        stroke: {
            width: 0
        },
        theme: {
            //   mode: theme.palette.mode
        }
    };

    const chartSeries = [10, 20, 25, 45];

    return <div>
        <Chart
            options={chartOptions}
            series={chartSeries}
            type="donut"
            width="380"
        >
            {children}
        </Chart>
    </div>
}
