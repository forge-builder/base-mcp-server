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
      {
        name: 'lookup_erc8004_agent',
        description: 'Look up an ERC-8004 agent by token ID on Base Mainnet. Returns owner, name, services, and x402 support.',
        inputSchema: {
          type: 'object',
          properties: {
            tokenId: {
              type: 'number',
              description: 'ERC-8004 token ID (e.g. 35176 for Roger, 35313 for DataForge)',
            },
          },
          required: ['tokenId'],
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
      case 'lookup_erc8004_agent':
        if (args.tokenId === undefined) {
          throw new Error('tokenId is required');
        }
        result = await lookupErc8004Agent(args.tokenId);
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

// ERC-8004 Registry constants
const ERC8004_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';
const ERC8004_SELECTOR_OWNEROF = '0x6352211e';
const ERC8004_SELECTOR_TOKENURI = '0xc87b56dd';

async function lookupErc8004Agent(tokenId) {
  try {
    const idHex = '0x' + BigInt(tokenId).toString(16).padStart(64, '0');
    
    const [ownerRaw, uriRaw] = await Promise.all([
      fetch(BASE_RPC, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({jsonrpc:'2.0',method:'eth_call',params:[{to:ERC8004_REGISTRY,data:ERC8004_SELECTOR_OWNEROF+idHex.slice(2)},'latest'],id:1})
      }).then(r=>r.json()),
      fetch(BASE_RPC, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({jsonrpc:'2.0',method:'eth_call',params:[{to:ERC8004_REGISTRY,data:ERC8004_SELECTOR_TOKENURI+idHex.slice(2)},'latest'],id:2})
      }).then(r=>r.json()),
    ]);

    const owner = ownerRaw?.result ? '0x'+ownerRaw.result.slice(26) : null;
    if (!owner || owner === '0x'+'0'.repeat(40)) return {exists: false, tokenId};
    
    let metadata = null;
    const uriHex = uriRaw?.result || '';
    if (uriHex && uriHex.startsWith('0x') && uriHex !== '0x') {
      try {
        // Decode bytes string: offset(32) + length(32) + data
        const len = parseInt(uriHex.slice(66, 130), 16);
        if (len > 0 && len < 5000) {
          const strHex = uriHex.slice(130, 130 + len * 2);
          const str = Buffer.from(strHex, 'hex').toString('utf8');
          if (str.startsWith('data:application/json;base64,')) {
            const b64 = str.split(',')[1];
            metadata = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
          }
        }
      } catch (e) {
        // decode failed — skip
      }
    }
    
    return {
      exists: true,
      tokenId,
      owner,
      name: metadata?.name || null,
      description: metadata?.description || null,
      services: metadata?.services || [],
      x402support: metadata?.x402support || false,
      chainId: 8453,
      registry: ERC8004_REGISTRY,
    };
  } catch(e) {
    return {exists: false, tokenId, error: e.message};
  }
}
