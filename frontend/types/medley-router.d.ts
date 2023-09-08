declare module '@medley/router' {
  import { RenderFunction } from '../lib/router/index.mjs';

  export type RouteStore = Record<string, RenderFunction>

  export type Route = {
    store: RouteStore
    params: Record<string, string>
  }

  export default class Router {
    register(path: string): RouteStore

    find(path: string): Route | null
  }
}
