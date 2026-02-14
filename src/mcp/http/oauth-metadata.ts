export type OAuthMetadataConfig = {
  resourceUrl: string;
  authorizationServerIssuer?: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  jwksUri?: string;
  scopesSupported: string[];
};

export function loadOAuthMetadataConfigFromEnv(baseUrl: string): OAuthMetadataConfig {
  const scopesSupported = (process.env.MCP_SUPPORTED_SCOPES ?? "analyze,validate,patch")
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean);

  return {
    resourceUrl: `${baseUrl}/mcp`,
    authorizationServerIssuer: process.env.MCP_OAUTH_ISSUER,
    authorizationEndpoint: process.env.MCP_OAUTH_AUTHORIZATION_ENDPOINT,
    tokenEndpoint: process.env.MCP_OAUTH_TOKEN_ENDPOINT,
    jwksUri: process.env.MCP_OAUTH_JWKS_URI,
    scopesSupported,
  };
}

export function buildProtectedResourceMetadata(config: OAuthMetadataConfig): Record<string, unknown> {
  return {
    resource: config.resourceUrl,
    authorization_servers: config.authorizationServerIssuer
      ? [config.authorizationServerIssuer]
      : [],
    scopes_supported: config.scopesSupported,
    bearer_methods_supported: ["header"],
    resource_documentation: "https://github.com/modelcontextprotocol",
  };
}

export function buildAuthorizationServerMetadata(
  config: OAuthMetadataConfig,
): Record<string, unknown> | null {
  if (
    !config.authorizationServerIssuer ||
    !config.authorizationEndpoint ||
    !config.tokenEndpoint
  ) {
    return null;
  }

  return {
    issuer: config.authorizationServerIssuer,
    authorization_endpoint: config.authorizationEndpoint,
    token_endpoint: config.tokenEndpoint,
    jwks_uri: config.jwksUri ?? null,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["client_secret_post", "none"],
    scopes_supported: config.scopesSupported,
  };
}
