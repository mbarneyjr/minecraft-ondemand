import { addRoute } from '../lib/router/index.mjs';

import homePageHandler from './index.mjs';
import staticAssetsHandler from './static.mjs';
import adminPortalHandler from './admin/index.mjs';

export function registerPages() {
  addRoute('GET', '/', homePageHandler);
  addRoute('GET', '/static/*', staticAssetsHandler);
  addRoute('GET', '/admin', adminPortalHandler);
}
