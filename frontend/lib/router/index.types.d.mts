export interface StateBase extends Record<string, unknown> {
  head: {
    title?: string;
    description?: string;
  };
}
