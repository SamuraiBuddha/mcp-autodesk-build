import { z } from 'zod';
import { createLogger } from '../utils/logger.js';
import { registerProjectTools } from './projects.js';
import { registerIssueTools } from './issues.js';
import { registerRfiTools } from './rfis.js';
import { registerSubmittalTools } from './submittals.js';
import { registerPhotoTools } from './photos.js';
import { registerFormTools } from './forms.js';
import { registerCostTools } from './cost.js';
import { registerLocationTools } from './locations.js';
import { registerDocumentTools } from './documents.js';

const logger = createLogger('tools');

/**
 * Register all available tools with the MCP server
 * @param {Server} server - MCP server instance
 * @param {AuthManager} authManager - Authentication manager
 * @param {Object} config - Configuration object
 */
export async function registerTools(server, authManager, config) {
  logger.info('Registering tools...');
  
  const toolRegistrations = [
    { name: 'Projects', register: registerProjectTools },
    { name: 'Issues', register: registerIssueTools },
    { name: 'RFIs', register: registerRfiTools },
    { name: 'Submittals', register: registerSubmittalTools },
    { name: 'Photos', register: registerPhotoTools },
    { name: 'Forms', register: registerFormTools },
    { name: 'Cost', register: registerCostTools },
    { name: 'Locations', register: registerLocationTools },
    { name: 'Documents', register: registerDocumentTools },
  ];

  let totalTools = 0;
  
  for (const { name, register } of toolRegistrations) {
    try {
      const count = await register(server, authManager, config);
      totalTools += count;
      logger.info(`Registered ${count} ${name} tools`);
    } catch (error) {
      logger.error(`Failed to register ${name} tools:`, error);
      throw error;
    }
  }

  logger.info(`Total tools registered: ${totalTools}`);
  
  return totalTools;
}

/**
 * Create a tool handler with error handling and validation
 * @param {string} name - Tool name
 * @param {z.Schema} schema - Zod schema for input validation
 * @param {Function} handler - Tool handler function
 * @returns {Object} Tool configuration for MCP
 */
export function createTool(name, schema, handler) {
  return {
    name,
    description: schema.description || `Execute ${name}`,
    inputSchema: {
      type: 'object',
      properties: zodToJsonSchema(schema),
      required: getRequiredFields(schema),
    },
    handler: async (args) => {
      try {
        // Validate input
        const validatedArgs = schema.parse(args);
        
        // Execute handler
        const result = await handler(validatedArgs);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            content: [
              {
                type: 'text',
                text: `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
              },
            ],
            isError: true,
          };
        }
        
        logger.error(`Tool ${name} error:`, error);
        
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
}

/**
 * Convert Zod schema to JSON Schema format
 * @param {z.Schema} schema - Zod schema
 * @returns {Object} JSON Schema properties
 */
function zodToJsonSchema(schema) {
  const properties = {};
  
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    
    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodTypeToJsonSchema(value);
    }
  }
  
  return properties;
}

/**
 * Convert individual Zod type to JSON Schema
 * @param {z.ZodType} zodType - Zod type
 * @returns {Object} JSON Schema type definition
 */
function zodTypeToJsonSchema(zodType) {
  if (zodType instanceof z.ZodString) {
    return { type: 'string', description: zodType.description };
  } else if (zodType instanceof z.ZodNumber) {
    return { type: 'number', description: zodType.description };
  } else if (zodType instanceof z.ZodBoolean) {
    return { type: 'boolean', description: zodType.description };
  } else if (zodType instanceof z.ZodArray) {
    return {
      type: 'array',
      items: zodTypeToJsonSchema(zodType.element),
      description: zodType.description,
    };
  } else if (zodType instanceof z.ZodEnum) {
    return {
      type: 'string',
      enum: zodType.options,
      description: zodType.description,
    };
  } else if (zodType instanceof z.ZodOptional) {
    return zodTypeToJsonSchema(zodType.unwrap());
  } else if (zodType instanceof z.ZodObject) {
    return {
      type: 'object',
      properties: zodToJsonSchema(zodType),
      description: zodType.description,
    };
  }
  
  return { type: 'string' };
}

/**
 * Get required fields from Zod schema
 * @param {z.Schema} schema - Zod schema
 * @returns {string[]} Array of required field names
 */
function getRequiredFields(schema) {
  const required = [];
  
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    
    for (const [key, value] of Object.entries(shape)) {
      if (!(value instanceof z.ZodOptional)) {
        required.push(key);
      }
    }
  }
  
  return required;
}