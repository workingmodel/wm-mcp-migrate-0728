export function handle(method: string) {
  if (method === "tasks/get") return { task: {} };
  if (method === "tasks/update") return { task: {} };
  return {};
}
