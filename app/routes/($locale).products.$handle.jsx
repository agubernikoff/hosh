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
import crewneck from '../assets/crewneck.png';
import sweatshirt from '../assets/sweatshirt.png';
import tshirt from '../assets/tshirt.png';
import oversized from '../assets/oversized.png';

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

  const descriptionHtml = product.descriptionHtml;

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

  const [showSizingGuide, setShowSizingGuide] = useState(false);
  const [guideType, setGuideType] = useState('cropped-tshirt');
  const [unit, setUnit] = useState('cm');

  const measurements = {
    'oversized-tshirt': {
      in: {
        Sleeves: [8.0, 8.25, 8.5, 8.75, 9.0, 9.25],
        Shoulders: [21.75, 22.5, 23.25, 24.0, 24.75, 25.5],
        Chest: [20.5, 22.0, 23.5, 25.0, 26.5, 28.0],
        Length: [27.75, 28.5, 29.25, 30.0, 30.75, 31.5],
      },
      cm: {
        Sleeves: [20.3, 21.0, 21.6, 22.2, 22.9, 23.5],
        Shoulders: [55.2, 57.2, 59.1, 61.0, 62.9, 64.8],
        Chest: [52.1, 55.9, 59.7, 63.5, 67.3, 71.1],
        Length: [70.5, 72.4, 74.3, 76.2, 78.1, 80.0],
      },
    },
    'cropped-tshirt': {
      in: {
        Sleeves: [3.875, 4.125, 4.375, 4.625, 4.875, 5.125],
        Shoulders: [21.25, 21.75, 22.25, 22.75, 23.25, 23.75],
        Chest: [18.5, 19.5, 20.5, 21.5, 22.5, 23.5],
        Length: [21.75, 22.25, 22.75, 23.25, 23.75, 24.25],
      },
      cm: {
        Sleeves: [9.8, 10.5, 11.1, 11.7, 12.4, 13.0],
        Shoulders: [54.0, 55.2, 56.5, 57.8, 59.1, 60.3],
        Chest: [47.0, 49.5, 52.1, 54.6, 57.2, 59.7],
        Length: [55.2, 56.5, 57.8, 59.1, 60.3, 61.6],
      },
    },
    sweatshirt: {
      in: {
        Sleeves: [21.75, 22.0, 22.25, 22.5, 22.75, 23.0],
        Shoulders: [22.75, 23.5, 24.25, 25.0, 25.75, 26.5],
        Chest: [21.25, 22.75, 24.25, 25.75, 27.25, 28.75],
        Length: [27.75, 28.5, 29.25, 30.0, 30.75, 31.5],
      },
      cm: {
        Sleeves: [55.2, 55.9, 56.5, 57.2, 57.8, 58.4],
        Shoulders: [57.8, 59.7, 61.6, 63.5, 65.4, 67.3],
        Chest: [54.0, 57.8, 61.6, 65.4, 69.2, 73.0],
        Length: [70.5, 72.4, 74.3, 76.2, 78.1, 80.0],
      },
    },
    crewneck: {
      in: {
        Sleeves: [21.75, 22.0, 22.25, 22.5, 22.75, 23.0],
        Shoulders: [22.75, 23.5, 24.25, 25.0, 25.75, 26.5],
        Chest: [21.25, 22.75, 24.25, 25.75, 27.25, 28.75],
        Length: [28.75, 29.5, 30.25, 31.0, 31.75, 32.5],
      },
      cm: {
        Sleeves: [55.2, 55.9, 56.5, 57.2, 57.8, 58.4],
        Shoulders: [57.8, 59.7, 61.6, 63.5, 65.4, 67.3],
        Chest: [54.0, 57.8, 61.6, 65.4, 69.2, 73.0],
        Length: [73.0, 74.9, 76.8, 78.7, 80.6, 82.6],
      },
    },
  };

  const SizingGuideModal = () => (
    <>
      {showSizingGuide && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowSizingGuide(false)}
        >
          <div
            style={{
              background: '#fff',
              padding: '2rem',
              // borderRadius removed
              width: '100%',
              maxWidth: '95vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              fontFamily: 'monospace',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowSizingGuide(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                fontSize: '1.5rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              &times;
            </button>

            {/* Title */}
            <h2
              style={{
                marginBottom: '0.5rem',
                borderBottom: '1px solid black',
                paddingBottom: '0.5rem',
              }}
            >
              HOSH SIZE GUIDE
            </h2>

            {/* Guide Type */}
            <h3 style={{marginBottom: '0.5rem'}}>
              {guideType === 'oversized-tshirt'
                ? 'Oversized T-Shirt'
                : guideType === 'sweatshirt'
                  ? 'Sweatshirt'
                  : guideType === 'crewneck'
                    ? 'Crewneck'
                    : 'Cropped T-Shirt'}
            </h3>
            <ul style={{paddingLeft: '1rem', marginBottom: '1rem'}}>
              <li>Fits true to size. Take your normal size.</li>
              <li>Designed for a slight loose fit.</li>
              <li>Mid-weight, non-stretchy fabric</li>
              <li>S/M/L/XL/XXL sizing</li>
            </ul>

            {/* Toggle */}
            <div style={{marginBottom: '1rem'}}>
              <div
                style={{
                  borderTop: '1px solid black',
                  marginTop: '1rem',
                  marginBottom: '1rem',
                }}
              ></div>
              <strong>Measurements</strong>
              <div
                style={{display: 'flex', gap: '0.5rem', marginTop: '0.5rem'}}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <input
                    type="radio"
                    name="unit"
                    checked={unit === 'in'}
                    onChange={() => setUnit('in')}
                  />
                  in
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <input
                    type="radio"
                    name="unit"
                    checked={unit === 'cm'}
                    onChange={() => setUnit('cm')}
                  />
                  cm
                </label>
              </div>
            </div>

            {/* Table */}
            <div style={{overflowX: 'auto', marginBottom: '2rem'}}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'center',
                  borderTop: '1px solid #000',
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{border: '1px solid #000', padding: '1rem 0.5rem'}}
                    ></th>
                    <th
                      style={{
                        border: '1px solid #000',
                        padding: '1rem 0.5rem',
                        width: '60px',
                      }}
                    >
                      XS
                    </th>
                    <th
                      style={{
                        border: '1px solid #000',
                        padding: '1rem 0.5rem',
                        width: '60px',
                      }}
                    >
                      S
                    </th>
                    <th
                      style={{
                        border: '1px solid #000',
                        padding: '1rem 0.5rem',
                        width: '60px',
                      }}
                    >
                      M
                    </th>
                    <th
                      style={{
                        border: '1px solid #000',
                        padding: '1rem 0.5rem',
                        width: '60px',
                      }}
                    >
                      L
                    </th>
                    <th
                      style={{
                        border: '1px solid #000',
                        padding: '1rem 0.5rem',
                        width: '60px',
                      }}
                    >
                      XL
                    </th>
                    <th
                      style={{
                        border: '1px solid #000',
                        padding: '1rem 0.5rem',
                        width: '60px',
                      }}
                    >
                      XXL
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {['Sleeves', 'Shoulders', 'Chest', 'Length'].map((label) => (
                    <tr key={label}>
                      <td
                        style={{
                          border: '1px solid #000',
                          padding: '1rem 0.5rem',
                          textAlign: 'left',
                        }}
                      >
                        {label}
                      </td>
                      {[...Array(6)].map((_, idx) => (
                        <td
                          key={idx}
                          style={{
                            border: '1px solid #000',
                            padding: '1rem 0.5rem',
                            textAlign: 'center',
                          }}
                        >
                          {measurements[guideType]
                            ? measurements[guideType][unit][label][idx]
                            : '000'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Diagram + Text */}
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '2rem'}}>
              {/* Shirt Diagram */}
              <div style={{flex: '1 1 300px', textAlign: 'left'}}>
                <img
                  src={
                    guideType === 'crewneck'
                      ? crewneck
                      : guideType === 'sweatshirt'
                        ? sweatshirt
                        : guideType === 'oversized-tshirt'
                          ? oversized
                          : tshirt
                  }
                  alt="Sizing diagram"
                  style={{
                    width: '100%',
                    maxWidth: '360px',
                    height: 'auto',
                  }}
                />
              </div>

              {/* Descriptions */}
              <div style={{flex: '1 1 300px'}}>
                <p style={{marginBottom: '2rem'}}>
                  Sleeve
                  <br />
                  Measured from shoulder seam to sleeve hem
                </p>
                <p style={{marginBottom: '2rem'}}>
                  Shoulder
                  <br />
                  Measured from shoulder seam to shoulder seam
                </p>
                <p style={{marginBottom: '2rem'}}>
                  Chest
                  <br />
                  Measured from pit to pit
                </p>
                <p style={{marginBottom: '2rem'}}>
                  Length
                  <br />
                  Measured from high point shoulder to bottom hem
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  function getSizingGuideType(input) {
    const t = input.toLowerCase();

    if (t.includes('crewneck')) return 'crewneck';
    if (t.includes('sweatshirt')) return 'sweatshirt';
    if (t.includes('oversized') && (t.includes('t-shirt') || t.includes('tee')))
      return 'oversized-tshirt';
    if (t.includes('t-shirt') || t.includes('tee')) return 'cropped-tshirt';

    return 'cropped-tshirt';
  }

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 499px)');
    const handleChange = (e) => setIsMobile(e.matches);

    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className="product">
      <div className="product-left">
        {isMobile ? null : (
          <div style={{marginBottom: '1rem'}}>
            <p>{product.title}</p>
            <p>{product.artist?.value}</p>
          </div>
        )}
        {isMobile ? null : (
          <div style={{marginBottom: '1rem'}}>
            {isMobile ? null : (
              <p style={{fontSize: '14px'}}>{product.description2?.value}</p>
            )}
            {isMobile ? null : (
              <ProductPrice
                price={selectedVariant?.price}
                compareAtPrice={selectedVariant?.compareAtPrice}
              />
            )}
          </div>
        )}
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
            details: (
              <>
                {product.hide_size_guide ? null : (
                  <p>
                    See{' '}
                    <span
                      onClick={() => {
                        setGuideType(
                          getSizingGuideType(
                            `${product.handle} ${product.title} ${product.size_and_fit?.value ?? ''}`,
                          ),
                        );
                        setShowSizingGuide(true);
                      }}
                      style={{
                        textDecoration: 'underline',
                        color: 'black',
                        cursor: 'pointer',
                      }}
                    >
                      Sizing Guide
                    </span>{' '}
                    for exact measurements.
                  </p>
                )}
                {product.size_and_fit
                  ? mapRichText(JSON.parse(product.size_and_fit?.value))
                  : ''}
              </>
            ),
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
          product={product}
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
      <SizingGuideModal />
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
    if (collectionHandle) {
      collectionFetcher.load(`/collections/${collectionHandle}`);
    }
  }, [product.id]);

  // Filter out current product and limit results
  const recommendedProducts = useMemo(() => {
    // The key change: access .collection from fetcher data
    if (!collectionFetcher.data?.collection.products.nodes) {
      return [];
    }

    const filtered = collectionFetcher.data?.collection.products.nodes
      .filter((node) => {
        return node.id !== product.id;
      }) // exclude current product
      .slice(0, 6); // limit to 4 products

    return filtered;
  }, [collectionFetcher.data, product.id]);

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
    hide_size_guide:metafield(namespace:"custom",key:"hide_size_guide"){
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
