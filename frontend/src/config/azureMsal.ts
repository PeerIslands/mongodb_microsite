import { PublicClientApplication, type Configuration } from '@azure/msal-browser';

let pca: PublicClientApplication | null = null;

export function isAzureSsoConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_AZURE_CLIENT_ID?.trim() &&
      import.meta.env.VITE_AZURE_TENANT_ID?.trim()
  );
}

export async function getMsalInstance(): Promise<PublicClientApplication> {
  if (!isAzureSsoConfigured()) {
    throw new Error('Azure SSO is not configured');
  }
  if (!pca) {
    const config: Configuration = {
      auth: {
        clientId: import.meta.env.VITE_AZURE_CLIENT_ID!,
        authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID!}`,
        redirectUri:
          import.meta.env.VITE_AZURE_REDIRECT_URI?.trim() || window.location.origin,
      },
      cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false,
      },
    };
    pca = new PublicClientApplication(config);
    await pca.initialize();
  }
  return pca;
}

/**
 * Opens Microsoft login popup and returns the ID token for backend exchange.
 */
export async function acquireAzureIdTokenPopup(): Promise<string> {
  const msal = await getMsalInstance();
  const result = await msal.loginPopup({
    scopes: ['openid', 'profile', 'email'],
  });
  const idToken = result.idToken;
  if (!idToken) {
    throw new Error('No ID token returned from Microsoft');
  }
  return idToken;
}
