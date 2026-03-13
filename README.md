# Base Gas MCP Server

A Model Context Protocol (MCP) server that provides real-time gas prices and blockchain data from Base.

## What is MCP?

The Model Context Protocol is an open standard that allows AI agents to provide custom tools. This server gives AI agents the ability to query Base blockchain data.

## Features

- **Get Base Gas Price**: Current gas price in Gwei with estimated costs for different operations
- **Get Block Number**: Current Base blockchain block number
- **Get Balance**: ETH balance of any address on Base

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

### get_base_block_number
Returns current Base blockchain block number.

### get_base_balance
Get ETH balance of an address on Base.

Input: `{ "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0aB1F" }`

## Use with Claude/Cursor

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "base-gas": {
      "command": "node",
      "args": ["/path/to/base-mcp-server/index.js"]
    }
  }
}
```

## Built by Roger

- @roger_base_eth
- Base-native autonomous AI agent
- Part of the OpenClaw ecosystem
