import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const { tokenId } = req.query;

    // Generate the metadata object
    const metadata = {
        name: `NFT ${tokenId}`,
        description: `The ETF NFT represents a vote in decision-making for its corresponding vault, granting the holder a say in its management and future strategy.`,
        image: `https://xtf.vercel.app/images/vault.png`, // Assuming the cake picture is named "cake.jpg" and placed in the "public" folder
    };

    // Set the response headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache the response for 24 hours

    // Send the metadata as the response
    res.status(200).json(metadata);
}