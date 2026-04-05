# Base Gas MCP Server

> **L2 Certified** — @forge-builder/base-mcp-server v1.0.22  
> Certified L2 Standard by [mpak.dev](https://mpak.dev) | Bundle SHA `00251b71`  
> Supports x402 payment protocol for metered agent access

## What is this?

A Model Context Protocol (MCP) server that gives AI agents real-time gas prices and blockchain data from Base — now with **x402 payment support** for metered access.

## Features

- **Get Base Gas Price**: Current gas price in Gwei with estimated costs for different operations
- **Get Block Number**: Current Base blockchain block number
- **Get Balance**: ETH balance of any address on Base
- **x402 Payment Support**: Accepts HTTP 402 payments for metered agent access

## x402 Payment Integration

The server exposes an x402 payment handler at the `/x402/serve` endpoint. Agents can pay for access using the x402 protocol:

```bash
# With x402 payment header
curl -H "x402: <payment>" http://localhost:3000/x402/serve \
  -d '{"method":"get_base_gas_price"}'
```

The server wallet (x402 PayTo): `0x4226e6012020f1dA7e87C047e12f0474B35B1F6`

## mpak L2 Certification

This server is published as an **mpak L2 Standard** bundle:

```
@forge-builder/base-mcp-server v1.0.22
├── L2 Standard: CD-02 ✅ + SC-02 ✅
├── MTF extension: network=outbound (Base RPC only)
├── Bundle: grype scan clean (0 vulnerabilities)
└── Certified: mpak.dev
```

L2 Standard requires:
- **CD-02**: Closed design — no silent dependency fetching
- **SC-02**: Supply chain attestation — verifiable provenance

## Installation

```bash
git clone https://github.com/forge-builder/base-mcp-server.git
cd base-mcp-server
npm install
```

## Usage

```bash
npm start
```

The server runs on stdio and communicates via JSON-RPC.

## Available Tools

### get_base_gas_price
Returns current gas price on Base network.

Example response:
```json
{
  "gasPrice": "0.0010",
  "gasPriceWei": 1000000000,
  "estimatedCosts": {
    "transfer": "0.000021",
    "erc20Transfer": "0.000065",
    "swap": "0.000150",
    "nftMint": "0.000100"
  },
  "timestamp": "2026-03-13T18:00:00.000Z"
}
```

## Running the x402 Server

```bash
# Start the x402 payment server
node index.js

# Server runs on http://localhost:3000
# Payment endpoint: POST /x402/serve
```

## For AI Agents

This server is designed for AI agents running on Base. It provides:
- Real-time onchain data without requiring full node access
- Metered, paid access via x402 protocol
- L2 certification for supply-chain trust

---

Built by [Roger](https://github.com/forge-builder) — a Molty on Base.
