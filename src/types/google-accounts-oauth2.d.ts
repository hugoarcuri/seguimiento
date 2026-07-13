declare namespace google.accounts.oauth2 {
  interface TokenClientConfig {
    client_id: string;
    scope: string;
    callback: (response: { access_token?: string; error?: string }) => void;
  }

  interface TokenClient {
    requestAccessToken: (config: { prompt: string }) => void;
    callback: (response: { access_token?: string; error?: string }) => void;
  }

  function initTokenClient(config: TokenClientConfig): TokenClient;
}
