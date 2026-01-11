// Vercel serverless function to proxy Casper RPC requests
// This avoids CORS issues when making browser-side RPC calls

export const config = {
    runtime: 'edge',
}

export default async function handler(request) {
    // Only allow POST requests
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    try {
        const body = await request.json()

        // Forward request to Casper testnet RPC
        const rpcUrl = 'https://node.testnet.cspr.cloud/rpc'
        const apiKey = process.env.VITE_CSPR_CLOUD_API_KEY || ''

        const headers = {
            'Content-Type': 'application/json',
        }

        if (apiKey) {
            headers['Authorization'] = apiKey
        }

        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        })

        const data = await response.json()

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
