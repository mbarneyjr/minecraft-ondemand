import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { Layout } from '#src/components/layout.mjs';
import { favicon } from '#src/components/favicon.mjs';

const html = String.raw;

/**
 * @typedef {object} FormTool
 * @property {string} type
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {Array<{
 *   name: string;
 *   type: 'string' | 'number';
 *   description: string;
 *   required: boolean;
 * }>} fields
 * @property {import('hono').Handler} handler
 * @typedef {FormTool} Tool
 */

export class Toolbox {
  /** @type {Hono} */
  app;

  /** @type {Array<Tool>} */
  tools = [];

  constructor() {
    this.app = new Hono();

    this.app.get('/favicon.svg', (c) => {
      const response = new Response(favicon);
      response.headers.set('Content-Type', 'image/svg+xml');
      return response;
    });

    this.app.get('/', (c) => {
      /** @type {Array<string>} */
      const elements = [];
      for (const tool of this.tools) {
        if (tool.type === 'form') {
          elements.push(html`
            <div class="rounded-lg bg-blue-100 p-4 shadow-lg">
              <form action="/${tool.id}" method="post">
                <h2 class="font-mono text-lg font-bold text-blue-800">${tool.name}</h2>
                <p class="text-blue-600">${tool.description}</p>
                ${tool.fields
                  .map(
                    (field) => html`
                      <div class="">
                        <label for="${field.name}" class="block max-w-screen-lg font-mono font-bold text-blue-800"
                          >${field.name}</label
                        >
                        <input
                          type="${field.type}"
                          name="${field.name}"
                          id="${field.name}"
                          required="${field.required}"
                          class="w-full rounded-md border border-blue-300 p-2"
                        />
                      </div>
                    `,
                  )
                  .join('\n')}
                <button type="submit" class="mt-4 rounded-md bg-blue-800 p-2 font-mono font-bold text-blue-100">
                  Submit
                </button>
              </form>
            </div>
          `);
        }
      }
      const tools = html` <div class="mx-auto flex max-w-screen-lg flex-col gap-4 p-4">${elements.join('\n')}</div> `;

      return c.html(Layout({ c, children: tools }));
    });
  }

  /**
   * @param {Tool} tool
   */
  addTool(tool) {
    this.app.post(`/${tool.id}`, tool.handler);
    this.tools.push(tool);
  }

  start() {
    serve(this.app, (info) => {
      console.log(`Server started on http://localhost:${info.port}`);
    });
  }
}
