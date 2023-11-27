// pages/api/cryptoData.ts
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

type CoinGeckoResponse = {
    prices: Array<[number, number]>;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<CoinGeckoResponse | { message: string }>
) {
    try {
        const { id, days } = req.query as { id: string; days: string };
        const response = await axios.get<CoinGeckoResponse>(`https://api.coingecko.com/api/v3/coins/${id}/market_chart`, {
            params: { vs_currency: 'usd', days: days, interval: 'daily' }
        });
        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching data' });
    }
}
