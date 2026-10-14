// Stub of the file `wrangler types` generates. The real file declares the
// whole Workers runtime; this declares only what the fixtures use.
interface Env {
  readonly GREETING: string;
}
declare class Request {
  readonly url: string;
}
declare class Response {
  constructor(body: string);
}
interface ExportedHandler<E = unknown> {
  fetch(request: Request, env: E): Response | Promise<Response>;
}
