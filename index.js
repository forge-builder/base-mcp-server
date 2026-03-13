import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * Base Gas MCP Server
 * Provides real-time gas prices for the Base blockchain
 */

const BASE_RPC = 'https://mainnet.base.org';

async function getBaseGasPrice() {
  try {
    const response = await fetch(BASE_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_gasPrice',
        params: [],
        id: 1
      })
    });
    
    const data = await response.json();
    const gasPriceWei = parseInt(data.result, 16);
    
    // Convert to Gwei
    const gasPriceGwei = gasPriceWei / 1e9;
    
    // Estimate costs for different operations (in Gwei)
    return {
      gasPrice: gasPriceGwei.toFixed(4),
      gasPriceWei: gasPriceWei,
      estimatedCosts: {
        transfer: (gasPriceGwei * 21000 / 1e9).toFixed(6),
        erc20Transfer: (gasPriceGwei * 65000 / 1e9).toFixed(6),
        swap: (gasPriceGwei * 150000 / 1e9).toFixed(6),
        nftMint: (gasPriceGwei * 100000 / 1e9).toFixed(6)
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function getBaseBlockNumber() {
  try {
    const response = await fetch(BASE_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      })
    });
    
    const data = await response.json();
    const blockNumber = parseInt(data.result, 16);
    
    return {
      blockNumber: blockNumber,
      blockHex: data.result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function getBaseBalance(address) {
  try {
    const response = await fetch(BASE_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1
      })
    });
    
    const data = await response.json();
    const balanceWei = parseInt(data.result, 16);
    const balanceEth = balanceWei / 1e18;
    
    return {
      address: address,
      balance: balanceEth.toFixed(6),
      balanceWei: balanceWei,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return { error: error.message };
  }
}

// Create server instance
const server = new Server(
  {
    name: 'base-gas-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_base_gas_price',
        description: 'Get current gas price on Base network in Gwei',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_base_block_number',
        description: 'Get current Base blockchain block number',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_base_balance',
        description: 'Get ETH balance of an address on Base',
        inputSchema: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              description: 'Ethereum address to check balance for',
            },
          },
          required: ['address'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;
    
    switch (name) {
      case 'get_base_gas_price':
        result = await getBaseGasPrice();
        break;
      case 'get_base_block_number':
        result = await getBaseBlockNumber();
        break;
      case 'get_base_balance':
        if (!args.address) {
          throw new Error('Address is required');
        }
        result = await getBaseBalance(args.address);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Base Gas MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
