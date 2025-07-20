#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';
import { createLogger } from './utils/logger.js';
import { loadConfig } from './config.js';
import { AuthManager } from './auth.js';
import { registerTools } from './tools/index.js';
import { setupErrorHandlers } from './utils/errorHandler.js';

// Load environment variables
dotenv.config();

const logger = createLogger('main');
const config = loadConfig();

/**
 * Initialize and start the MCP server
 */
async function main() {
  try {
    logger.info('Starting Autodesk Build MCP Server...');
    
    // Initialize auth manager
    const authManager = new AuthManager(config);
    
    // Create MCP server
    const server = new Server(
      {
        name: 'autodesk-build-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
          prompts: {},
        },
      }
    );

    // Setup error handlers
    setupErrorHandlers(server);

    // Register all tools
    await registerTools(server, authManager, config);

    // Setup server event handlers
    server.onerror = (error) => {
      logger.error('Server error:', error);
    };

    server.onclose = () => {
      logger.info('Server connection closed');
    };

    // Create and start transport
    const transport = new StdioServerTransport();
    
    logger.info('MCP server initialized successfully');
    logger.info(`Available tools: ${Object.keys(server.tools).length}`);
    
    // Start the server
    await server.connect(transport);
    
    logger.info('Autodesk Build MCP Server is running');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down server...');
      await server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Shutting down server...');
      await server.close();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Check if we need to handle OAuth callback
if (process.argv.includes('--auth')) {
  // Start OAuth flow
  import('./auth-server.js').then(({ startAuthServer }) => {
    startAuthServer(config);
  });
} else {
  // Start MCP server
  main().catch((error) => {
    logger.error('Unhandled error:', error);
    process.exit(1);
  });
}