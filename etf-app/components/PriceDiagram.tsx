import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Layout } from 'antd';
type PriceData = { time: number; price: number };
type AssetData = Record<string, PriceData[]>;

const { Content } = Layout;

const ChartComponent: React.FC = () => {
    const [chartData, setChartData] = useState<any>();
    const days = 100; // Number of days for historical data


    // Normalization: Scale prices so that they start at the same point
    const normalizeData = (data: PriceData[]) => {
        const firstDayPrice = data[0]?.price || 1;  // Avoid division by zero
        return data.map(d => ({
            time: d.time,
            price: (d.price / firstDayPrice) * 100  // Scale to start at 100
        }));
    };

    const fetchData = async () => {
        const assets = {
            'ETH': 'ETH',
            'LINK': 'LINK',
            'SNX': 'SNX',
            'DAI': 'DAI'
        };
        const allData: AssetData = {};

        for (const [apiAsset, symbol] of Object.entries(assets)) {
            const response = await axios.get<any>(`/api/cryptoData`, {
                params: { asset: symbol }
            });
            allData[symbol] = response.data?.map((data: any) => ({
                time: data.time, // Adjust if the API uses a different property name
                price: data.close  // Adjust if the API uses a different property name
            }));
        }

        // Assuming all assets have the same number of data points
        const indexAssetData = allData['ETH']?.map((ethData, index) => {
            const ethPrice = ethData.price;
            const daiPrice = allData['DAI'][index]?.price || 0;
            const linkPrice = allData['LINK'][index]?.price || 0;
            const snxPrice = allData['SNX'][index]?.price || 0;

            return {
                time: ethData.time,
                price: 0.05 * ethPrice + 15 * daiPrice + 3 * linkPrice + 6 * snxPrice
            };
        });

        for (const key of Object.keys(allData)) {
            allData[key] = normalizeData(allData[key]);
        }
        const normalizedIndexAssetData = normalizeData(indexAssetData);


        setChartData({
            labels: indexAssetData?.map(data => new Date(data.time).toLocaleDateString()),
            datasets: [
                ...Object.keys(assets)?.map(symbol => ({
                    label: symbol,
                    data: allData[symbol]?.map(data => data.price),
                    borderColor: getRandomColor(),
                    fill: false,
                })),
                {
                    label: 'Index Asset',
                    data: normalizedIndexAssetData?.map(data => data.price),
                    borderColor: '#000000',
                    fill: false,
                }
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
            <Content style={{ padding: '0 50px' }} >

                <h2>Asset Price Comparison</h2>

                {chartData && <Line data={chartData} />}
            </Content>
        </div>
    );
};

export default ChartComponent;
