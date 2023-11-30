import authMiddleware from '../../lib/middleware/auth/index.mjs';

/** @type {import('../../lib/router/index.mjs').RenderFunction} */
const adminPortalHandler = async (event, session) => {
  const styles = /* css */ `
    h1 {
      padding-bottom: 1rem;
    }
    h2 {
      text-align: center;
    }
    #control-panel {
      width: 100%;
      display: flex;
      flex-wrap: wrap;
    }
    .server-controls {
      width: 100%;
      display: flex;
      flex-wrap: wrap;
      flex-direction: column;
    }
    .control-element {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      gap: 1rem;
    }
    /* every control element but the last one, add a line at the bottom */
    .control-element:not(:last-child) {
      border-bottom: 2px solid var(--secondary);
    }
  `;

  const html = /* html */ `
    <style>${styles}</style>
    <header>
      <title-bar></title-bar>
    </header>
    <script type="module" src="/static/admin/index.mjs"></script>
    <main>
      <section class="flex flex-column">
        <h1>Welcome to the Admin Page!</h1>
        <div secondary id="control-panel" class="flex flex-column">
          <content-card class="server-controls">
            <h2>Server Controls</h2>
            <div class="control-element">
              <p>Status: <content-pill primary id="service-status">...</content-pill></p>
              <button primary disabled id="power-button">...</button>
            </div>
            <div class="control-element">
              <p>Generate a map!</p>
              <button id="generate-map-button">Generate Map</button>
            </div>
          </content-card>
          <content-card class="server-controls">
            <h2>Other Utilities</h2>
            <div class="control-element">
              <p>View the list of players on the server</p>
              <a href="/admin/files" style="justify-content: space-between">
                <button>Player List</button>
              </a>
            </div>
            <div class="control-element">
              <p>Browse and edit the Minecraft server files</p>
              <a href="/admin/files" style="justify-content: space-between">
                <button>File Explorer</button>
              </a>
            </div>
          </content-card>
        </div>
      </section>
    </main>
  `;

  return {
    body: html,
    headers: {
      'content-type': 'text/html',
    },
    state: {
      head: {
        title: 'Admin',
        description: 'Administrator portal',
      },
    },
    session,
  };
};

export default authMiddleware(adminPortalHandler, { adminOnly: true });
