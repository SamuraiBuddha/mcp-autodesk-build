# Development Setup Guide

## Prerequisites

### Required Software

1. **Node.js** (v18.0 or higher)
   ```bash
   # Check version
   node --version
   
   # Install via nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   ```

2. **Git**
   ```bash
   # Check version
   git --version
   ```

3. **Code Editor** (VS Code recommended)
   - Install VS Code
   - Recommended extensions:
     - ESLint
     - Prettier
     - JavaScript and TypeScript Nightly
     - GitLens
     - Thunder Client (for API testing)

### Autodesk Platform Services Setup

1. **Create an Autodesk Account**
   - Visit [Autodesk Platform Services](https://aps.autodesk.com/)
   - Sign up for a developer account

2. **Create an App**
   - Navigate to "My Apps"
   - Click "Create App"
   - Fill in:
     - App Name: `MCP Autodesk Build Dev`
     - Description: `Development environment for MCP server`
     - Callback URL: `http://localhost:3000/callback`
   - Select APIs:
     - Data Management API
     - ACC Account Admin API
     - ACC Build API
     - ACC API

3. **Note Credentials**
   - Client ID
   - Client Secret
   - Keep these secure!

## Local Development Setup

### 1. Clone the Repository

```bash
# Clone the repo
git clone https://github.com/SamuraiBuddha/mcp-autodesk-build.git
cd mcp-autodesk-build

# Create your feature branch
git checkout -b feature/your-feature-name
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install

# Install dev dependencies
npm install --save-dev
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

Add your credentials:
```env
# Required
AUTODESK_CLIENT_ID=your_client_id_here
AUTODESK_CLIENT_SECRET=your_client_secret_here
AUTODESK_CALLBACK_URL=http://localhost:3000/callback

# Development
NODE_ENV=development
LOG_LEVEL=debug
PORT=3000

# Optional for development
DEBUG=mcp:*
DISABLE_CACHE=false
MOCK_API=false
```

### 4. SSL Setup (Optional but Recommended)

For local HTTPS:

```bash
# Generate self-signed certificate
mkdir certs
cd certs
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
cd ..

# Update .env
echo "SSL_KEY=./certs/key.pem" >> .env
echo "SSL_CERT=./certs/cert.pem" >> .env
echo "HTTPS=true" >> .env
```

## Running the Development Server

### Basic Development Mode

```bash
# Start the development server with hot reload
npm run dev

# The server will start on http://localhost:3000
# MCP endpoint: http://localhost:3000/mcp
```

### Debug Mode

```bash
# Run with Node.js inspector
npm run debug

# Or with VS Code debugger
# Press F5 or use Run > Start Debugging
```

### Watch Mode

```bash
# Run tests in watch mode
npm run test:watch

# Run linter in watch mode
npm run lint:watch
```

## Development Workflow

### 1. Code Style and Linting

```bash
# Run ESLint
npm run lint

# Auto-fix issues
npm run lint:fix

# Format code with Prettier
npm run format
```

### 2. Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/tools/issues.test.js

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

### 3. Type Checking

```bash
# Check TypeScript types (JSDoc)
npm run type-check
```

## Tool Development

### Creating a New Tool

1. **Create tool file**
   ```bash
   touch src/tools/my-new-tool.js
   ```

2. **Implement tool structure**
   ```javascript
   // src/tools/my-new-tool.js
   import { z } from 'zod';
   
   export const definition = {
     name: 'my_new_tool',
     description: 'Description of what this tool does',
     inputSchema: z.object({
       projectId: z.string().describe('Project ID'),
       // Add your parameters
     })
   };
   
   export async function handler(params, context) {
     const { auth, logger } = context;
     
     try {
       // Implement your tool logic
       const result = await makeAPICall(auth, params);
       
       return {
         success: true,
         data: result
       };
     } catch (error) {
       logger.error('Tool error:', error);
       throw error;
     }
   }
   ```

3. **Register the tool**
   ```javascript
   // src/tools/index.js
   import * as myNewTool from './my-new-tool.js';
   
   export const tools = [
     // ... existing tools
     myNewTool
   ];
   ```

4. **Add tests**
   ```javascript
   // tests/tools/my-new-tool.test.js
   import { describe, it, expect } from 'vitest';
   import { handler } from '../../src/tools/my-new-tool.js';
   
   describe('my_new_tool', () => {
     it('should do something', async () => {
       const result = await handler(
         { projectId: 'test-123' },
         { auth: mockAuth, logger: mockLogger }
       );
       
       expect(result.success).toBe(true);
     });
   });
   ```

## API Mocking for Development

### Using Mock Mode

```bash
# Enable mock mode
MOCK_API=true npm run dev
```

### Creating Mock Data

```javascript
// src/mocks/issues.js
export const mockIssues = [
  {
    id: 'issue-123',
    title: 'Test Issue',
    status: 'open',
    // ... more fields
  }
];

// src/mocks/index.js
export { mockIssues } from './issues.js';
```

## Debugging

### 1. VS Code Launch Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug MCP Server",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/src/index.js",
      "envFile": "${workspaceFolder}/.env",
      "outputCapture": "std"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Current Test",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "${file}"],
      "console": "integratedTerminal"
    }
  ]
}
```

### 2. Logging and Debugging

```javascript
// Enable debug logging
DEBUG=mcp:* npm run dev

// Component-specific debugging
DEBUG=mcp:auth npm run dev
DEBUG=mcp:tools:issues npm run dev

// Multiple components
DEBUG=mcp:auth,mcp:tools:* npm run dev
```

### 3. Chrome DevTools

```bash
# Start with inspector
node --inspect src/index.js

# Open Chrome and navigate to:
chrome://inspect
```

## Database Setup (Optional)

For persistent token storage during development:

### SQLite (Default)

```bash
# Automatically created in development
# Location: ./data/tokens.db
```

### PostgreSQL (Advanced)

```bash
# Install PostgreSQL
# Update .env
DATABASE_URL=postgresql://user:password@localhost:5432/mcp_dev

# Run migrations
npm run db:migrate
```

## Testing with Claude Desktop

### 1. Configure Claude Desktop

```json
// ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
// %APPDATA%\Claude\claude_desktop_config.json (Windows)
{
  "mcpServers": {
    "autodesk-build-dev": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-autodesk-build/src/index.js"],
      "env": {
        "NODE_ENV": "development",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

### 2. Test Commands

```
Test prompts:
- "List all projects"
- "Show me open issues"
- "Create a test issue"
- "Search for photos from this week"
```

## Common Development Tasks

### Adding a New API Endpoint

1. Add endpoint configuration:
   ```javascript
   // src/config/endpoints.js
   export const endpoints = {
     // ... existing endpoints
     myNewEndpoint: '/construction/admin/v1/my-endpoint'
   };
   ```

2. Create API client method:
   ```javascript
   // src/api/client.js
   async myNewMethod(params) {
     return this.get(endpoints.myNewEndpoint, params);
   }
   ```

### Handling Webhooks

```javascript
// src/webhooks/handler.js
export function handleWebhook(event) {
  switch (event.type) {
    case 'issue.created':
      return handleIssueCreated(event.data);
    case 'rfi.updated':
      return handleRFIUpdated(event.data);
    // Add your webhook handlers
  }
}
```

### Performance Profiling

```bash
# Generate CPU profile
node --prof src/index.js

# Process the profile
node --prof-process isolate-*.log > profile.txt

# Memory profiling
node --expose-gc --inspect src/index.js
```

## Troubleshooting Development Issues

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Authentication Issues

1. Clear token cache:
   ```bash
   rm -rf ./data/tokens.db
   ```

2. Reset OAuth app:
   - Go to Autodesk Platform Services
   - Regenerate client secret
   - Update .env file

### Module Resolution Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

## Recommended Development Practices

1. **Always work in feature branches**
2. **Write tests for new features**
3. **Update documentation**
4. **Follow commit message conventions**
5. **Run linter before committing**
6. **Test with Claude Desktop before PR**
7. **Keep dependencies updated**

## Resources

- [MCP Documentation](https://github.com/anthropics/model-context-protocol)
- [Autodesk Platform Services](https://aps.autodesk.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Testing Best Practices](https://testingjavascript.com/)

## Getting Help

- Check existing issues on GitHub
- Join our Discord server
- Read the troubleshooting guide
- Contact the maintainers