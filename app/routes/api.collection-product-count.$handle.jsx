// app/routes/api/collection-product-count.js

import {json} from '@shopify/remix-oxygen';

const QUERY = `
  query CollectionProducts($handle: String!, $cursor: String) {
    collection(handle: $handle) {
      products(first: 250, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node { id }
        }
      }
    }
  }
`;

export const loader = async ({request, context, params}) => {
  const url = new URL(request.url);
  console.log(url, params);
  const handle = params.handle;
  console.log(handle);
  if (!handle) {
    return json({error: 'Missing handle'}, {status: 400});
  }

  let total = 0;
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const res = await context.storefront.query(QUERY, {
      variables: {handle, cursor},
    });

    const products = res.collection?.products;

    if (!products) {
      return json({error: 'Collection not found'}, {status: 404});
    }

    total += products.edges.length;
    hasNextPage = products.pageInfo.hasNextPage;
    cursor = products.pageInfo.endCursor;
  }

  return json({total});
};
