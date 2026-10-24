// "ping" as an ordinary word / identifier must not trip R11.
const ping = 3;
export function notify(user: string) {
  console.log("ping the user:", user, ping);
  const pingTimeout = 5;
  const note = "ping";
  return { pingTimeout, note };
}
