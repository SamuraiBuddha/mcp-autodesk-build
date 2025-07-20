# Autodesk Build MCP Server

[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-blue)](https://github.com/anthropics/model-context-protocol)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Autodesk Platform Services](https://img.shields.io/badge/Autodesk-Platform%20Services-orange)](https://aps.autodesk.com/)

A Model Context Protocol (MCP) server implementation for Autodesk Construction Cloud Build, enabling AI-powered construction project management through Claude and other MCP-compatible clients.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Available Tools](#available-tools)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Overview

This MCP server provides a bridge between AI assistants (like Claude) and Autodesk Construction Cloud Build, allowing you to:

- Manage construction issues, RFIs, and submittals through natural language
- Access and organize project photos and documents
- Track project costs and budgets
- Manage forms and quality control processes
- Automate routine project management tasks

The server implements the Model Context Protocol, making it compatible with any MCP-enabled AI client.

## Features

### Core Capabilities

- **Issue Management**: Create, update, and track construction issues
- **RFI Management**: Submit and respond to Requests for Information
- **Submittal Tracking**: Manage submittal logs and approval workflows
- **Photo Management**: Access and organize jobsite photos with location tagging
- **Forms & Checklists**: Access standardized quality and safety inspection forms
- **Cost Management**: Track budgets, change orders, and payment applications
- **Document Management**: Search and retrieve project documents
- **Location Management**: Manage building areas and location hierarchies

### Technical Features

- OAuth2 authentication with token management
- Rate limiting and retry logic
- Comprehensive error handling
- Webhook support for real-time updates
- Batch operations for improved performance
- Caching for frequently accessed data

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│                 │     │                 │     │                  │
│  Claude/Client  │────▶│   MCP Server    │────▶│  Autodesk Build  │
│                 │     │                 │     │       API        │
└─────────────────┘     └─────────────────┘     └──────────────────┘
         │                       │                        │
         │                       │                        │
         ▼                       ▼                        ▼
   Natural Language         Tool Router              REST APIs
     Commands               & Handler              (OAuth2 Auth)
```

### Component Overview

1. **MCP Server Core**: Handles protocol communication and tool routing
2. **Authentication Module**: Manages OAuth2 flow and token refresh
3. **Tool Handlers**: Individual handlers for each Autodesk Build feature
4. **Cache Layer**: Reduces API calls for frequently accessed data
5. **Error Handler**: Provides meaningful error messages and recovery

## Prerequisites

- Node.js 18.0 or higher
- npm or yarn package manager
- Autodesk Platform Services account
- Autodesk Construction Cloud Build project access
- OAuth2 application credentials from Autodesk

## Installation

### Quick Start

```bash
# Clone the repository
git clone https://github.com/SamuraiBuddha/mcp-autodesk-build.git
cd mcp-autodesk-build

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your credentials (see Configuration section)
# Then start the server
npm start
```

### Installing as a Package

```bash
npm install -g mcp-autodesk-build
```

## Configuration

### 1. Autodesk App Registration

1. Visit [Autodesk Platform Services](https://aps.autodesk.com/)
2. Create a new app or use existing credentials
3. Add the following redirect URI: `http://localhost:3000/callback`
4. Note your Client ID and Client Secret

### 2. Environment Variables

Create a `.env` file with the following:

```env
# Autodesk Credentials
AUTODESK_CLIENT_ID=your_client_id_here
AUTODESK_CLIENT_SECRET=your_client_secret_here
AUTODESK_CALLBACK_URL=http://localhost:3000/callback

# Server Configuration
PORT=3000
LOG_LEVEL=info

# Optional: Webhook Configuration
WEBHOOK_SECRET=your_webhook_secret
WEBHOOK_ENDPOINT=https://your-domain.com/webhooks

# Optional: Cache Configuration
CACHE_TTL=3600
CACHE_MAX_SIZE=100
```

### 3. Claude Desktop Configuration

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "autodesk-build": {
      "command": "node",
      "args": ["/path/to/mcp-autodesk-build/src/index.js"],
      "env": {
        "AUTODESK_CLIENT_ID": "your_client_id",
        "AUTODESK_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

## Usage

### Basic Commands

Once configured, you can use natural language commands with Claude:

```
"Show me all open issues in the Main Building project"
"Create an RFI about the electrical panel specifications"
"Find photos from last week's concrete pour"
"Update issue #123 with a new comment"
"List all pending submittals for review"
```

### Authentication Flow

On first use:
1. The server will provide an authentication URL
2. Open the URL in your browser
3. Log in with your Autodesk account
4. Authorize the application
5. The server will store the refresh token for future use

## Available Tools

### Project Management

| Tool | Description |
|------|-------------|
| `list_projects` | List all accessible projects |
| `get_project` | Get detailed project information |
| `search_projects` | Search projects by name or criteria |

### Issues

| Tool | Description |
|------|-------------|
| `list_issues` | List issues with filtering options |
| `create_issue` | Create a new issue |
| `update_issue` | Update existing issue |
| `close_issue` | Close an issue with resolution |
| `add_issue_comment` | Add comment to an issue |
| `attach_photo_to_issue` | Attach photos to issues |

### RFIs (Requests for Information)

| Tool | Description |
|------|-------------|
| `list_rfis` | List RFIs with status filters |
| `create_rfi` | Create a new RFI |
| `respond_to_rfi` | Submit RFI response |
| `update_rfi_status` | Update RFI status |
| `get_rfi_details` | Get detailed RFI information |

### Submittals

| Tool | Description |
|------|-------------|
| `list_submittals` | List submittal items |
| `create_submittal` | Create new submittal |
| `update_submittal_status` | Update submittal status |
| `add_submittal_revision` | Add revision to submittal |

### Photos

| Tool | Description |
|------|-------------|
| `list_photos` | List project photos |
| `get_photo_details` | Get photo metadata |
| `search_photos_by_location` | Find photos by location |
| `search_photos_by_date` | Find photos by date range |

### Forms & Checklists

| Tool | Description |
|------|-------------|
| `list_forms` | List available forms |
| `get_form_responses` | Get submitted forms |
| `search_forms` | Search forms by type/status |

### Cost Management

| Tool | Description |
|------|-------------|
| `get_budget_summary` | Get project budget overview |
| `list_change_orders` | List change orders |
| `get_cost_trends` | Get cost trend analysis |

## API Reference

For detailed API documentation, see [docs/api-reference.md](docs/api-reference.md)

## Examples

### Example 1: Issue Management Workflow

```javascript
// List open issues
const issues = await tools.list_issues({
  projectId: "project-123",
  status: "open",
  assignedTo: "john.doe@company.com"
});

// Create a new issue
const newIssue = await tools.create_issue({
  projectId: "project-123",
  title: "Concrete crack in foundation",
  description: "Found 2mm crack in northeast corner",
  location: "Building A - Foundation",
  priority: "high",
  assignTo: "jane.smith@company.com"
});
```

### Example 2: RFI Workflow

```javascript
// Create an RFI
const rfi = await tools.create_rfi({
  projectId: "project-123",
  subject: "Clarification on electrical panel specs",
  question: "Please confirm the amperage rating for Panel A",
  assignTo: "engineer@design.com",
  dueDate: "2024-03-15"
});
```

More examples in [examples/](examples/) directory.

## Development

### Project Structure

```
mcp-autodesk-build/
├── src/
│   ├── index.js           # Main server entry point
│   ├── auth.js            # OAuth2 authentication
│   ├── config.js          # Configuration management
│   ├── tools/             # Tool implementations
│   │   ├── issues.js
│   │   ├── rfis.js
│   │   ├── submittals.js
│   │   ├── photos.js
│   │   └── ...
│   └── utils/             # Utility functions
├── docs/                  # Documentation
│   ├── architecture.md
│   ├── dev-setup.md
│   ├── protocol.md
│   └── api-reference.md
├── examples/              # Usage examples
├── tests/                 # Test suite
├── package.json
├── .env.example
├── .gitignore
└── LICENSE
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/tools/issues.test.js
```

### Debugging

Enable debug logging:

```bash
DEBUG=mcp:* npm start
```

### Building for Production

```bash
npm run build
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use ES6+ features
- Follow ESLint configuration
- Add JSDoc comments for all public functions
- Write tests for new features

## Troubleshooting

### Common Issues

**Authentication Errors**
- Ensure your Autodesk app has the correct permissions
- Check that redirect URI matches exactly
- Verify client ID and secret are correct

**Connection Issues**
- Check firewall settings
- Verify internet connectivity
- Ensure Autodesk services are accessible

**Rate Limiting**
- The server implements automatic retry with backoff
- Consider enabling caching for frequently accessed data

For more help, see [docs/troubleshooting.md](docs/troubleshooting.md)

## Security

- Credentials are stored securely using system keychain when available
- All API communications use HTTPS
- OAuth2 tokens are refreshed automatically
- Sensitive data is never logged

See [SECURITY.md](SECURITY.md) for security policies.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Anthropic](https://anthropic.com) for the Model Context Protocol
- [Autodesk Platform Services](https://aps.autodesk.com/) team
- MCP community for examples and best practices

## Support

- 📧 Email: support@example.com
- 💬 Discord: [Join our server](https://discord.gg/example)
- 🐛 Issues: [GitHub Issues](https://github.com/SamuraiBuddha/mcp-autodesk-build/issues)
- 📖 Docs: [Full Documentation](https://docs.example.com)