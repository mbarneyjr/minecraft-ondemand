import authMiddleware from '../../../lib/middleware/auth/index.mjs';
import { getServiceDetails } from '../../../lib/backend/service.mjs';

/** @type {import('../../../lib/router/index.mjs').RenderFunction} */
const getServiceDetailsHandler = async (event, session) => {
  const serviceDetails = await getServiceDetails();
  return {
    body: JSON.stringify(serviceDetails),
    headers: {
      'content-type': 'application/json',
    },
    session,
  };
};

export default authMiddleware(getServiceDetailsHandler, { adminOnly: true });
