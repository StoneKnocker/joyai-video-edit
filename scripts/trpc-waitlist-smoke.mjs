import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

const client = createTRPCProxyClient({
  links: [
    httpBatchLink({
      url: "http://localhost:3000/api/trpc",
    }),
  ],
});

const email = `client-lib-${Date.now()}@example.com`;
const created = await client.waitlist.join.mutate({ email });
console.log("CREATED", JSON.stringify(created));
const dup = await client.waitlist.join.mutate({ email });
console.log("DUP", JSON.stringify(dup));
try {
  await client.waitlist.join.mutate({ email: "not-valid" });
  console.log("INVALID unexpected success");
} catch (e) {
  console.log("INVALID", e.message || String(e));
}
