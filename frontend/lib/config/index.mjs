if (!process.env.APP_CLIENT_ID) throw new Error('APP_CLIENT_ID is not defined');
if (!process.env.AUTH_BASE_URL) throw new Error('AUTH_BASE_URL is not defined');
if (!process.env.APP_ENDPOINT) throw new Error('APP_ENDPOINT is not defined');

export const config = {
  auth: {
    clientId: process.env.APP_CLIENT_ID,
    scope: 'openid email',
    baseUrl: process.env.AUTH_BASE_URL,
  },
  api: {
    pageSize: 10,
  },
  appEndpoint: process.env.APP_ENDPOINT,
  filesDirectory: process.env.MINECRAFT_MOUNT_DIRECTORY ?? './',
};
