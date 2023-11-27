import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';

type PriceData = { time: number; price: number };
type AssetData = Record<string, PriceData[]>;

const ChartComponent: React.FC = () => {
    const [chartData, setChartData] = useState<any>({});
    const days = 100; // Number of days for historical data

    const fetchData = async () => {
        const assets = {
            ethereum: 'ETH',
            chainlink: 'LINK',
            havven: 'SNX',
            dai: 'DAI'
        };
        const allData: AssetData = {};

        for (const [id, symbol] of Object.entries(assets)) {
            const response = await axios.get<any>(`/api/cryptoData`, {
                params: { id, days }
            });
            allData[symbol] = response.data?.prices?.map(([time, price]: [number, number]) => ({ time, price }));
        }

        const indexAssetData = allData['ETH']?.map((ethData, index) => {
            const ethPrice = ethData.price;
            const daiPrice = allData['DAI'][index]?.price || 0;
            const linkPrice = allData['LINK'][index]?.price || 0;
            const snxPrice = allData['havven'][index]?.price || 0;

            return {
                time: ethData.time,
                value: 0.05 * ethPrice + 15 * daiPrice + 3 * linkPrice + 6 * snxPrice
            };
        });

        console.log('line', indexAssetData);
        console.log('line', allData);

        setChartData({
            // labels: indexAssetData?.map(data => new Date(data.time).toLocaleDateString()),
            datasets: [
                // ...Object.keys(assets)?.map(symbol => ({
                //     label: symbol.toUpperCase(),
                //     data: allData[symbol]?.map(data => data.price),
                //     borderColor: getRandomColor(),
                //     fill: false,
                // })),
                // {
                //     label: 'Index Asset',
                //     data: indexAssetData?.map(data => data.value),
                //     borderColor: '#000000',
                //     fill: false,
                // }
            ]
        });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getRandomColor = () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    return (
        <div>
            <h2>Asset Price Comparison</h2>
            {/* <Line data={chartData} /> */}
        </div>
    );
};

export default ChartComponent;
