import { NhostClient } from '@nhost/nhost-js';
console.log('Subdomain:', import.meta.env.VITE_NHOST_SUBDOMAIN);
console.log('Region:', import.meta.env.VITE_NHOST_REGION);
console.log('GraphQL URL:', import.meta.env.VITE_GRAPHQL_URL);

export const nhost = new NhostClient({
    subdomain: import.meta.env.VITE_NHOST_SUBDOMAIN,

    region: import.meta.env.VITE_NHOST_REGION
});

