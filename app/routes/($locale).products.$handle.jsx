import {useState, useRef, useEffect, useMemo} from 'react';
import {useLoaderData, useFetcher} from '@remix-run/react';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {ProductPrice} from '~/components/ProductPrice';
import {ProductImage} from '~/components/ProductImage';
import {ProductForm} from '~/components/ProductForm';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import Expandable from '~/components/Expandable';
import mapRichText from '~/helpers/MapRichText';
import {ProductItem} from '~/components/ProductItem';
import {motion} from 'motion/react';

function useIsFirstRender() {
  const isFirst = useRef(true);
  useEffect(() => {
    isFirst.current = false;
  }, []);
  return isFirst.current;
}

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  return [
    {title: `Hosh | ${data?.product.title ?? ''}`},
    {
      rel: 'canonical',
      href: `/products/${data?.product.handle}`,
    },
  ];
};

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {LoaderFunctionArgs}
 */
async function loadCriticalData({context, params, request}) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: product});

  return {
    product,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {LoaderFunctionArgs}
 */
function loadDeferredData({context, params}) {
  // Put any API calls that is not critical to be available on first page render
  // For example: product reviews, product recommendations, social feeds.

  return {};
}

export default function PDP() {
  return (
    <>
      <Product />
      <Recs />
    </>
  );
}
function Product() {
  /** @type {LoaderReturnData} */
  const {product} = useLoaderData();

  // Optimistically selects a variant with given available variant information
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  // Sets the search param to the selected variant without navigation
  // only when no search params are set in the url
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  // Get the product options array
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const {title, descriptionHtml} = product;

  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const isFirstRender = useIsFirstRender();

  const productImage = product.images.edges.map((edge) => (
    <ProductImage key={edge.node.id} image={edge.node} />
  ));

  const [imageIndex, setImageIndex] = useState(0);

  function handleScroll(scrollWidth, scrollLeft) {
    const widthOfAnImage = scrollWidth / product.images.edges.length;
    const dividend = scrollLeft / widthOfAnImage;
    const rounded = parseFloat((scrollLeft / widthOfAnImage).toFixed(0));
    if (Math.abs(dividend - rounded) < 0.2) setImageIndex(rounded);
  }

  const mappedIndicators =
    product.images.edges.length > 1
      ? product.images.edges.map((e, i) => (
          <div
            key={e.node.id}
            className="circle"
            style={{
              height: '5px',
              width: '5px',
              borderRadius: '10px',
              position: 'relative',
              background: 'grey',
            }}
          >
            {i === imageIndex ? (
              <motion.div
                layoutId="mapped-indicator"
                key="mapped-indicator"
                style={{
                  background: 'black',
                  height: '5px',
                  width: '5px',
                  borderRadius: '10px',
                  position: 'absolute',
                }}
                transition={{ease: 'easeInOut', duration: 0.15}}
              />
            ) : null}
          </div>
        ))
      : null;

  return (
    <div className="product">
      <div className="product-left">
        <div style={{marginBottom: '1rem'}}>
          <p>{title}</p>
          <p>{product.artist?.value}</p>
        </div>
        <div style={{marginBottom: '1rem'}}>
          <p>{product.description2?.value}</p>
          <ProductPrice
            price={selectedVariant?.price}
            compareAtPrice={selectedVariant?.compareAtPrice}
          />
        </div>
        {[
          {
            title: 'Artwork',
            details: product.artwork?.value,
          },
          {
            title: 'Artist',
            details: product.artist_note?.value,
          },
          {
            title: 'Craftsmanship & Details',
            details: product.craftsmanship_details?.value,
          },
          {
            title: 'Size & Fit',
            details: product.size_and_fit
              ? mapRichText(JSON.parse(product.size_and_fit?.value))
              : '',
          },
          {
            title: 'Care',
            details: product.care_guide?.value,
          },
        ]
          .filter((section) => section.details)
          .map((section) => (
            <Expandable
              key={section.title}
              openSection={openSection}
              toggleSection={toggleSection}
              title={section.title}
              details={section.details}
              isFirstRender={isFirstRender}
            />
          ))}
      </div>
      <div
        style={{
          position: 'relative',
        }}
      >
        <div
          className="product-images"
          onScroll={(e) =>
            handleScroll(e.target.scrollWidth, e.target.scrollLeft)
          }
        >
          {productImage}
        </div>
        <div className="mapped-indicators">{mappedIndicators}</div>
      </div>
      <div className="product-main">
        <ProductForm
          productOptions={productOptions}
          selectedVariant={selectedVariant}
        />
      </div>
      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </div>
  );
}

function Recs() {
  const {product} = useLoaderData();
  const collectionFetcher = useFetcher();

  useEffect(() => {
    const collectionHandle = product.artist?.value
      .toLowerCase()
      .split(' ')
      .join('-');
    console.log('Fetching collection:', collectionHandle);
    if (collectionHandle) {
      collectionFetcher.load(`/collections/${collectionHandle}`);
    }
  }, [product.id]);

  console.log('Fetcher state:', collectionFetcher.state);
  console.log('Fetcher data:', collectionFetcher.data);

  // Filter out current product and limit results
  const recommendedProducts = useMemo(() => {
    // The key change: access .collection from fetcher data
    if (!collectionFetcher.data?.collection.products.nodes) {
      console.log('No collection products found');
      return [];
    }

    const filtered = collectionFetcher.data?.collection.products.nodes
      .filter((node) => {
        console.log(node);
        return node.id !== product.id;
      }) // exclude current product
      .slice(0, 6); // limit to 4 products

    console.log('Filtered products:', filtered.length);
    return filtered;
  }, [collectionFetcher.data, product.id]);

  console.log('Recommended products:', recommendedProducts);

  return (
    <div style={{marginBottom: '5rem'}}>
      {collectionFetcher.state === 'loading' && (
        <p>Loading recommendations...</p>
      )}
      {recommendedProducts.length > 0 && (
        <>
          <p style={{marginBlock: '3rem', textAlign: 'center'}}>
            {product.artist.value}
          </p>
          <div className="recommended-products-grid">
            {recommendedProducts.map((node) => (
              <ProductItem key={node.id} product={node} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ProductOptionSwatch({swatch, name, isColorOption, productImage}) {
  if (isColorOption) {
    const image = productImage || swatch?.image?.previewImage;
    return (
      <div
        aria-label={name}
        className="product-option-label-swatch"
        style={{
          backgroundColor: image
            ? 'transparent'
            : swatch?.color || 'transparent',
        }}
      >
        <Image data={productImage} alt={name} aspectRatio="1/1" width="75px" />
      </div>
    );
  }

  return <div className="product-option-label-text">{name}</div>;
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
`;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    images(first: 10) {
      edges {
        node {
          id
          url
          altText
          width
          height
        }
      }
    }
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
    artist:metafield(namespace:"custom",key:"artist_name"){
      value
    }
    description2:metafield(namespace:"custom",key:"product_description"){
      value
    }
    craftsmanship_details:metafield(namespace:"custom",key:"craftsmanship_details"){
      value
    }
    artwork:metafield(namespace:"custom",key:"artwork"){
      value
    }
    size_and_fit:metafield(namespace:"custom",key:"size_and_fit"){
      value
    }
    care_guide:metafield(namespace:"descriptors",key:"care_guide"){
      value
    }
    artist_note:metafield(namespace:"custom",key:"artist_note"){
      value
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
