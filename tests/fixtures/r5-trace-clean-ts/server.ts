import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("my-mcp-server");

export function handleRequest(body: { _meta?: { traceparent?: string; tracestate?: string } }) {
  const traceparent = body._meta?.traceparent;
  const tracestate = body._meta?.tracestate;
  const span = tracer.startSpan("handle-request", { attributes: { traceparent, tracestate } });
  span.end();
  return { result: body };
}
