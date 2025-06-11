import {redirect} from '@shopify/remix-oxygen';

export async function action({request, context}) {
  const {session} = context;
  const formData = await request.formData();
  console.log(formData);

  // Make sure the form request is valid
  const languageCode = formData.get('language');

  const countryCode = formData.get('country');

  // determine where to redirect to relative to where user navigated from
  // ie. hydrogen.shop/collections -> ca.hydrogen.shop/collections
  const path = formData.get('path');

  const cartId = await session.get('cartId');

  // Update cart buyer's country code if there is a cart id
  if (cartId) {
    await updateCartBuyerIdentity(context, {
      cartId,
      buyerIdentity: {
        countryCode,
      },
    });
  }

  console.log('cc ', countryCode);

  console.log('path ', path);
  const redirectUrl = `/EN-${countryCode}${path}`;
  console.log(redirectUrl);
  return redirect(redirectUrl, 302);
}

async function updateCartBuyerIdentity({storefront}, {cartId, buyerIdentity}) {
  const data = await storefront.mutate(UPDATE_CART_BUYER_COUNTRY, {
    variables: {
      cartId,
      buyerIdentity,
    },
  });
}

const UPDATE_CART_BUYER_COUNTRY = `#graphql
  mutation CartBuyerIdentityUpdate(
    $cartId: ID!
    $buyerIdentity: CartBuyerIdentityInput!
  ) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
      cart {
        id
      }
    }
  }
`;
/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({params, context}) {
  const {language, country} = context.storefront.i18n;

  if (
    params.locale &&
    params.locale.toLowerCase() !== `${language}-${country}`.toLowerCase()
  ) {
    // If the locale URL param is defined, yet we still are still at the default locale
    // then the the locale param must be invalid, send to the 404 page
    // throw new Response(null, {status: 404});
    return redirect('/404');
  }

  return null;
}

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
