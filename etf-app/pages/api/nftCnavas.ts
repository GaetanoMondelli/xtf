import { Chart } from 'chart.js';
import { createCanvas } from 'canvas';
import { NextApiRequest, NextApiResponse } from 'next';

function renderChartToBuffer(chartData: any) {
    const width = 400; // Set the desired width
    const height = 400; // Set the desired height

    // Create a canvas element
    const canvas = createCanvas(width, height);
    const ctx: any = canvas.getContext('2d');

    // Create a new Chart instance
    new Chart(ctx, {
        type: 'bar', // or any other type
        data: chartData,
        options: {
            // ... your chart options
        }
    });

    // Return the PNG buffer
    return canvas.toBuffer('image/png');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const chartData = req.body; // Assume chart data is sent in request body

        const buffer = renderChartToBuffer(chartData);

        // Set the content type to PNG
        res.setHeader('Content-Type', 'image/png');

        // Send the buffer as a response
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ error: error });
    }
}