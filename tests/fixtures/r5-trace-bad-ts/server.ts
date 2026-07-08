import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("my-mcp-server");

export function handleRequest(body: unknown) {
  const span = tracer.startSpan("handle-request");
  span.end();
  return { result: body };
}
