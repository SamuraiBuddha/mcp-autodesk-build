import { z } from 'zod';
import { createLogger } from './utils/logger.js';

const logger = createLogger('config');

/**
 * Configuration schema validation
 */
const configSchema = z.object({
  autodesk: z.object({
    clientId: z.string().min(1, 'AUTODESK_CLIENT_ID is required'),
    clientSecret: z.string().min(1, 'AUTODESK_CLIENT_SECRET is required'),
    callbackUrl: z.string().url().default('http://localhost:3000/callback'),
    baseUrl: z.string().url().default('https://developer.api.autodesk.com'),
    authUrl: z.string().url().default('https://developer.api.autodesk.com/authentication/v2'),
    scope: z.string().default('data:read data:write account:read account:write'),
    accountId: z.string().optional(),
    hubId: z.string().optional(),
  }),
  server: z.object({
    port: z.number().default(3000),
    logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  }),
  cache: z.object({
    ttl: z.number().default(3600), // 1 hour
    maxSize: z.number().default(100),
    checkPeriod: z.number().default(600), // 10 minutes
  }),
  rateLimit: z.object({
    maxRequests: z.number().default(60),
    windowMs: z.number().default(60000), // 1 minute
  }),
  webhook: z.object({
    secret: z.string().optional(),
    endpoint: z.string().url().optional(),
  }),
  token: z.object({
    storage: z.enum(['keychain', 'file', 'memory']).default('keychain'),
    filePath: z.string().default('./.tokens'),
  }),
  debug: z.object({
    enabled: z.boolean().default(false),
    logApiCalls: z.boolean().default(false),
    mockApi: z.boolean().default(false),
  }),
});

/**
 * Load and validate configuration from environment variables
 * @returns {Object} Validated configuration object
 */
export function loadConfig() {
  try {
    const rawConfig = {
      autodesk: {
        clientId: process.env.AUTODESK_CLIENT_ID,
        clientSecret: process.env.AUTODESK_CLIENT_SECRET,
        callbackUrl: process.env.AUTODESK_CALLBACK_URL,
        accountId: process.env.AUTODESK_ACCOUNT_ID,
        hubId: process.env.AUTODESK_HUB_ID,
      },
      server: {
        port: parseInt(process.env.PORT || '3000', 10),
        logLevel: process.env.LOG_LEVEL,
      },
      cache: {
        ttl: parseInt(process.env.CACHE_TTL || '3600', 10),
        maxSize: parseInt(process.env.CACHE_MAX_SIZE || '100', 10),
        checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD || '600', 10),
      },
      rateLimit: {
        maxRequests: parseInt(process.env.RATE_LIMIT || '60', 10),
      },
      webhook: {
        secret: process.env.WEBHOOK_SECRET,
        endpoint: process.env.WEBHOOK_ENDPOINT,
      },
      token: {
        storage: process.env.TOKEN_STORAGE,
      },
      debug: {
        enabled: process.env.DEBUG === 'true',
        logApiCalls: process.env.LOG_API_CALLS === 'true',
        mockApi: process.env.MOCK_API === 'true',
      },
    };

    // Validate configuration
    const config = configSchema.parse(rawConfig);
    
    logger.debug('Configuration loaded successfully');
    
    // Log non-sensitive config for debugging
    logger.debug('Config:', {
      server: config.server,
      cache: config.cache,
      rateLimit: config.rateLimit,
      debug: config.debug,
      autodesk: {
        callbackUrl: config.autodesk.callbackUrl,
        scope: config.autodesk.scope,
        hasClientId: !!config.autodesk.clientId,
        hasClientSecret: !!config.autodesk.clientSecret,
      },
    });

    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Configuration validation failed:');
      error.errors.forEach((err) => {
        logger.error(`  ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      logger.error('Failed to load configuration:', error);
    }
    throw new Error('Invalid configuration');
  }
}

/**
 * Get API endpoints based on configuration
 * @param {Object} config - Configuration object
 * @returns {Object} API endpoints
 */
export function getApiEndpoints(config) {
  const baseUrl = config.autodesk.baseUrl;
  
  return {
    auth: {
      authorize: `${config.autodesk.authUrl}/authorize`,
      token: `${config.autodesk.authUrl}/token`,
      refresh: `${config.autodesk.authUrl}/token`,
      userInfo: `${config.autodesk.authUrl}/userinfo`,
    },
    acc: {
      projects: `${baseUrl}/project/v1/hubs/:hubId/projects`,
      issues: `${baseUrl}/issues/v2/containers/:containerId/issues`,
      rfis: `${baseUrl}/bim360/rfis/v2/containers/:containerId/rfis`,
      photos: `${baseUrl}/data/v1/projects/:projectId/folders/:folderId/contents`,
      submittals: `${baseUrl}/bim360/submittals/v1/containers/:containerId/submittals`,
      forms: `${baseUrl}/bim360/checklists/v1/containers/:containerId/instances`,
      cost: `${baseUrl}/cost/v1/containers/:containerId`,
      locations: `${baseUrl}/locations/v2/containers/:containerId/trees/:treeId/nodes`,
    },
    data: {
      hubs: `${baseUrl}/project/v1/hubs`,
      projects: `${baseUrl}/project/v1/hubs/:hubId/projects`,
      folders: `${baseUrl}/data/v1/projects/:projectId/folders/:folderId/contents`,
      items: `${baseUrl}/data/v1/projects/:projectId/items/:itemId`,
    },
  };
}