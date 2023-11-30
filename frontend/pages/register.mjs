import { addRoute } from '../lib/router/index.mjs';

import homePageHandler from './index.mjs';
import staticAssetsHandler from './static.mjs';
import adminPortalHandler from './admin/index.mjs';
import fileExplorerHandler from './admin/files/{fileName}/index.mjs';
import saveFileHandler from './admin/files/{fileName}/save.mjs';
import fileSourceHandler from './admin/files/{fileName}/source/index.mjs';
import getServiceDetailsHandler from './api/service/index.mjs';
import updateServiceHandler from './api/service/update.mjs';

export function registerPages() {
  addRoute('GET', '/', homePageHandler);
  addRoute('GET', '/static/*', staticAssetsHandler);
  // admin routes
  addRoute('GET', '/admin', adminPortalHandler);
  addRoute('GET', '/admin/files', fileExplorerHandler);
  addRoute('GET', '/admin/file-source/*', fileSourceHandler);
  addRoute('GET', '/admin/files/*', fileExplorerHandler);
  addRoute('POST', '/admin/files/*', saveFileHandler);
  addRoute('GET', '/api/service', getServiceDetailsHandler);
  addRoute('POST', '/api/service', updateServiceHandler);
}
