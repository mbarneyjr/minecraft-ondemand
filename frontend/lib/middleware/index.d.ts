import { RenderFunction } from '../router/index.d.ts';

export type MiddleWare = (renderer: RenderFunction) => RenderFunction;
