// pages/api/cryptoData.ts
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

type YoungPlatformResponse = {
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<YoungPlatformResponse | { message: string }>
) {
    try {
        const { asset } = req.query as { asset: string };
        const response = await axios.get<YoungPlatformResponse>(`https://api.youngplatform.com/api/v3/charts?pair=${asset}-EUR`, {
            // Include additional necessary parameters here
        });
        res.status(200).json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching data' });
    }
}
