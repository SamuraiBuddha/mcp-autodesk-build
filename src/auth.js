import axios from 'axios';
import { EventEmitter } from 'events';
import { createLogger } from './utils/logger.js';
import { TokenStorage } from './utils/tokenStorage.js';
import { getApiEndpoints } from './config.js';

const logger = createLogger('auth');

/**
 * Manages OAuth2 authentication with Autodesk Platform Services
 */
export class AuthManager extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.endpoints = getApiEndpoints(config);
    this.tokenStorage = new TokenStorage(config.token);
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.isAuthenticated = false;
    
    // Try to load existing tokens
    this.loadTokens();
  }

  /**
   * Load tokens from storage
   */
  async loadTokens() {
    try {
      const tokens = await this.tokenStorage.getTokens();
      if (tokens) {
        this.accessToken = tokens.accessToken;
        this.refreshToken = tokens.refreshToken;
        this.tokenExpiry = new Date(tokens.expiresAt);
        this.isAuthenticated = true;
        
        logger.info('Loaded existing authentication tokens');
        
        // Check if token needs refresh
        if (this.isTokenExpired()) {
          await this.refreshAccessToken();
        }
      }
    } catch (error) {
      logger.debug('No existing tokens found');
    }
  }

  /**
   * Get authorization URL for OAuth flow
   * @returns {string} Authorization URL
   */
  getAuthorizationUrl() {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.autodesk.clientId,
      redirect_uri: this.config.autodesk.callbackUrl,
      scope: this.config.autodesk.scope,
    });

    return `${this.endpoints.auth.authorize}?${params.toString()}`;
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   * @param {string} code - Authorization code from callback
   */
  async handleCallback(code) {
    try {
      const response = await axios.post(
        this.endpoints.auth.token,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: this.config.autodesk.clientId,
          client_secret: this.config.autodesk.clientSecret,
          redirect_uri: this.config.autodesk.callbackUrl,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      await this.saveTokens(response.data);
      
      logger.info('Successfully authenticated with Autodesk');
      this.emit('authenticated');
      
      return true;
    } catch (error) {
      logger.error('Failed to exchange authorization code:', error.response?.data || error.message);
      throw new Error('Authentication failed');
    }
  }

  /**
   * Refresh the access token using refresh token
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      logger.debug('Refreshing access token...');
      
      const response = await axios.post(
        this.endpoints.auth.refresh,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.config.autodesk.clientId,
          client_secret: this.config.autodesk.clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      await this.saveTokens(response.data);
      
      logger.info('Successfully refreshed access token');
      this.emit('token_refreshed');
      
      return true;
    } catch (error) {
      logger.error('Failed to refresh token:', error.response?.data || error.message);
      
      // Clear tokens if refresh fails
      this.clearTokens();
      throw new Error('Token refresh failed - please re-authenticate');
    }
  }

  /**
   * Save tokens to storage
   * @param {Object} tokenData - Token response from Autodesk
   */
  async saveTokens(tokenData) {
    this.accessToken = tokenData.access_token;
    this.refreshToken = tokenData.refresh_token || this.refreshToken;
    
    // Calculate expiry time (subtract 5 minutes for safety)
    const expiresIn = tokenData.expires_in || 3600;
    this.tokenExpiry = new Date(Date.now() + (expiresIn - 300) * 1000);
    
    this.isAuthenticated = true;

    // Save to storage
    await this.tokenStorage.saveTokens({
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      expiresAt: this.tokenExpiry.toISOString(),
    });
  }

  /**
   * Clear all tokens
   */
  async clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.isAuthenticated = false;
    
    await this.tokenStorage.clearTokens();
    
    logger.info('Cleared authentication tokens');
    this.emit('logout');
  }

  /**
   * Check if token is expired
   * @returns {boolean} True if token is expired
   */
  isTokenExpired() {
    if (!this.tokenExpiry) return true;
    return new Date() >= this.tokenExpiry;
  }

  /**
   * Get valid access token (refreshing if necessary)
   * @returns {string} Valid access token
   */
  async getAccessToken() {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated - please run with --auth flag to authenticate');
    }

    if (this.isTokenExpired()) {
      await this.refreshAccessToken();
    }

    return this.accessToken;
  }

  /**
   * Get authorization headers for API requests
   * @returns {Object} Headers with authorization
   */
  async getAuthHeaders() {
    const token = await this.getAccessToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Make authenticated request to Autodesk API
   * @param {Object} options - Axios request options
   * @returns {Promise} API response
   */
  async makeAuthenticatedRequest(options) {
    const headers = await this.getAuthHeaders();
    
    try {
      if (this.config.debug.logApiCalls) {
        logger.debug('API Request:', {
          method: options.method,
          url: options.url,
          params: options.params,
        });
      }

      const response = await axios({
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (this.config.debug.logApiCalls) {
        logger.debug('API Response:', {
          status: response.status,
          data: response.data,
        });
      }

      return response;
    } catch (error) {
      // Handle token expiry
      if (error.response?.status === 401) {
        logger.debug('Token expired, attempting refresh...');
        await this.refreshAccessToken();
        
        // Retry request with new token
        const newHeaders = await this.getAuthHeaders();
        return axios({
          ...options,
          headers: {
            ...newHeaders,
            ...options.headers,
          },
        });
      }
      
      throw error;
    }
  }
}