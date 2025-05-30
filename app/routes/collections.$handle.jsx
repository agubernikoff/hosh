import {redirect} from '@shopify/remix-oxygen';
import {useLoaderData, NavLink, useSearchParams} from '@remix-run/react';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {ProductItem} from '~/components/ProductItem';
import {useState, useRef, useEffect} from 'react';
import {AnimatePresence, motion} from 'motion/react';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  return [{title: `Hydrogen | ${data?.collection.title ?? ''} Collection`}];
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
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 24,
  });
  const filters = [];
  let reverse = false;
  let sortKey = null;

  if (!handle) {
    throw redirect('/collections');
  }

  if (searchParams.has('filter')) {
    filters.push(...searchParams.getAll('filter').map((x) => JSON.parse(x)));
  }
  if (searchParams.has('sortKey')) sortKey = searchParams.get('sortKey');
  if (searchParams.has('reverse'))
    reverse = searchParams.get('reverse') === 'true';

  const [{collection}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {handle, filters, reverse, sortKey, ...paginationVariables},
      // Add other queries here, so that they are loaded in parallel
    }),
  ]);

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: collection});

  return {
    collection,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {LoaderFunctionArgs}
 */
function loadDeferredData({context}) {
  return {};
}

export default function Collection() {
  /** @type {LoaderReturnData} */
  const {collection} = useLoaderData();

  return (
    <div className="collection">
      <h1>{collection.title}</h1>
      <p className="collection-description">{collection.description}</p>
      <Filter filters={collection.products.filters} />
      <PaginatedResourceSection
        connection={collection.products}
        resourcesClassName="products-grid"
      >
        {({node: product, index}) => (
          <ProductItem
            key={product.id}
            product={product}
            loading={index < 8 ? 'eager' : undefined}
          />
        )}
      </PaginatedResourceSection>
      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </div>
  );
}

export function Filter({filters, shopAll, term}) {
  const [searchParams, setSearchParams] = useSearchParams();

  function addFilter(input) {
    setSearchParams(
      (prev) => {
        prev.set('filter', input);
        return prev;
      },
      {preventScrollReset: true},
    );
  }

  function removeFilter(input) {
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev); // Clone to avoid mutation
        const filters = newParams.getAll('filter'); // Get all filter values
        newParams.delete('filter'); // Remove all instances

        // Re-add only the filters that are NOT being removed
        filters
          .filter((f) => f !== input)
          .forEach((f) => newParams.append('filter', f));

        return newParams;
      },
      {preventScrollReset: true},
    );
  }

  function isChecked(input) {
    if (input === 'viewAll') return !searchParams.get('filter');
    return searchParams.getAll('filter').includes(input);
  }

  function clearFilter() {
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.delete('filter'); // Remove all `filter` parameters
        return newParams;
      },
      {preventScrollReset: true},
    );
  }

  function addSort(input) {
    const parsed = JSON.parse(input);
    setSearchParams(
      (prev) => {
        prev.set('reverse', Boolean(parsed.reverse));
        prev.set('sortKey', parsed.sortKey);
        return prev;
      },
      {preventScrollReset: true},
    );
  }

  function removeSort() {
    setSearchParams(
      (prev) => {
        prev.delete('reverse');
        prev.delete('sortKey');
        return prev;
      },
      {preventScrollReset: true},
    );
  }

  function isSortChecked(input) {
    const parsed = JSON.parse(input);
    return (
      searchParams.get('reverse') === parsed.reverse.toString() &&
      searchParams.get('sortKey') === parsed.sortKey
    );
  }
  console.log(filters);
  return (
    <div className="filter-container">
      <Sort
        addSort={addSort}
        removeSort={removeSort}
        isChecked={isSortChecked}
        shopAll={shopAll}
        term={term}
      />
      {filters.map((filter) => (
        <Filt
          filter={filter.values}
          addFilter={addFilter}
          removeFilter={removeFilter}
          isChecked={isChecked}
          clearFilter={clearFilter}
          label={filter.label}
          key={filter.label}
        />
      ))}
    </div>
  );
}

function Sort({addSort, removeSort, isChecked, term, shopAll}) {
  const [isOpen, setIsOpen] = useState(false);
  function toggleIsOpen() {
    setIsOpen(!isOpen);
  }
  return (
    <button onClick={toggleIsOpen} className="sort-by-button">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={`sort-by-${isOpen}`}
          initial={{opacity: 1}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          style={{display: 'inline-block', textAlign: 'left'}}
        >
          {!isOpen ? 'Sort:' : 'Close'}
        </motion.span>
      </AnimatePresence>
      <svg
        width="16"
        height="12"
        viewBox="0 0 16 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line y1="3" x2="16" y2="3" stroke="black" />
        <motion.rect
          x="3.5"
          y="1"
          width="4"
          height="4"
          fill="white"
          stroke="black"
          initial={{x: 0}}
          animate={{x: isOpen ? '6px' : 0}}
          transition={{ease: 'easeInOut', duration: 0.15}}
        />
        <line y1="9" x2="16" y2="9" stroke="black" />
        <motion.rect
          x="9.5"
          y="7"
          width="4"
          height="4"
          fill="white"
          stroke="black"
          initial={{x: 0}}
          animate={{x: isOpen ? '-6px' : 0}}
          transition={{ease: 'easeInOut', duration: 0.15}}
        />
      </svg>
      <AnimatePresence>
        {isOpen && (
          <div className="sort-overflow-hidden-container">
            <motion.div
              initial={{y: '-100%'}}
              animate={{y: '1px'}}
              exit={{y: '-100%'}}
              transition={{ease: 'easeInOut', duration: 0.15}}
            >
              <div className="sort-container">
                <FilterInput
                  label={'Best Selling'}
                  value={JSON.stringify({
                    reverse: false,
                    sortKey: 'BEST_SELLING',
                  })}
                  addFilter={addSort}
                  isChecked={isChecked}
                  removeFilter={removeSort}
                  isSort={true}
                  term={term}
                />
                <FilterInput
                  label={'Alphabetically, A-Z'}
                  value={JSON.stringify({reverse: false, sortKey: 'TITLE'})}
                  addFilter={addSort}
                  isChecked={isChecked}
                  removeFilter={removeSort}
                  term={term}
                  isSort={true}
                />
                <FilterInput
                  label={'Alphabetically, Z-A'}
                  value={JSON.stringify({reverse: true, sortKey: 'TITLE'})}
                  addFilter={addSort}
                  isChecked={isChecked}
                  removeFilter={removeSort}
                  term={term}
                  isSort={true}
                />
                <FilterInput
                  label={'Date, new to old'}
                  value={JSON.stringify({
                    reverse: true,
                    sortKey: shopAll ? 'CREATED_AT' : 'CREATED',
                  })}
                  addFilter={addSort}
                  isChecked={isChecked}
                  removeFilter={removeSort}
                  term={term}
                  isSort={true}
                />
                <FilterInput
                  label={'Date, old to new'}
                  value={JSON.stringify({
                    reverse: false,
                    sortKey: shopAll ? 'CREATED_AT' : 'CREATED',
                  })}
                  addFilter={addSort}
                  isChecked={isChecked}
                  removeFilter={removeSort}
                  term={term}
                  isSort={true}
                />
                <FilterInput
                  label={'Price, low to high'}
                  value={JSON.stringify({reverse: false, sortKey: 'PRICE'})}
                  addFilter={addSort}
                  isChecked={isChecked}
                  removeFilter={removeSort}
                  isSort={true}
                />
                <FilterInput
                  label={'Price, high to low'}
                  value={JSON.stringify({reverse: true, sortKey: 'PRICE'})}
                  addFilter={addSort}
                  isChecked={isChecked}
                  removeFilter={removeSort}
                  isSort={true}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </button>
  );
}

function Filt({
  filter,
  addFilter,
  isChecked,
  removeFilter,
  clearFilter,
  label,
}) {
  const filterOrderRef = useRef(new Map()); // Persist across renders

  function storeInitialOrder(filters) {
    if (filterOrderRef.current.size === 0) {
      filters.forEach((filter, index) => {
        filterOrderRef.current.set(filter.label, index);
      });
    }
  }

  function sortByStoredOrder(filters) {
    return filters.slice().sort((a, b) => {
      return (
        (filterOrderRef.current.get(a.label) ?? Infinity) -
        (filterOrderRef.current.get(b.label) ?? Infinity)
      );
    });
  }

  useEffect(() => {
    console.log(filter);
    storeInitialOrder(filter);
  }, []);

  return (
    <>
      {/* <div style={{display: 'flex'}} className="desktop-filter">
        <FilterInput
          label={'View All'}
          value={'viewAll'}
          addFilter={clearFilter}
          isChecked={isChecked}
          removeFilter={clearFilter}
        />
        {sortByStoredOrder(filter).map((v) => (
          <FilterInput
            key={v.id}
            label={v.label}
            value={v.input}
            addFilter={addFilter}
            isChecked={isChecked}
            removeFilter={removeFilter}
          />
        ))}
      </div> */}
      <MobileFilt label={label}>
        <FilterInput
          label={'View All'}
          value={'viewAll'}
          addFilter={clearFilter}
          isChecked={isChecked}
          removeFilter={clearFilter}
          isSort={true}
        />
        {sortByStoredOrder(filter).map((v) => (
          <FilterInput
            key={v.id}
            label={v.label}
            value={v.input}
            addFilter={addFilter}
            isChecked={isChecked}
            removeFilter={removeFilter}
            isSort={true}
          />
        ))}
      </MobileFilt>
    </>
  );
}
function MobileFilt({children, label}) {
  const [isOpen, setIsOpen] = useState(false);
  function toggleIsOpen() {
    setIsOpen(!isOpen);
  }
  return (
    <button
      className={`mobile-filter ${isOpen ? 'isOpen-btn' : ''}`}
      onClick={toggleIsOpen}
    >
      <AnimatePresence mode="popLayout">
        <motion.span
          key={`filt-by-${isOpen}`}
          initial={{opacity: 1}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          style={{display: 'inline-block', textAlign: 'left'}}
        >
          {label}
        </motion.span>
      </AnimatePresence>
      <motion.svg
        width="8"
        height="4"
        viewBox="0 0 8 4"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        initial={{rotate: 0}}
        animate={{rotate: isOpen ? '180deg' : 0}}
        transition={{ease: 'easeInOut', duration: 0.15}}
      >
        <path
          d="M7.82391 0.152959C7.71112 0.0550192 7.55817 -4.38211e-07 7.39869 -4.24269e-07C7.23921 -4.10327e-07 7.08626 0.0550192 6.97348 0.152959L3.99637 2.73897L1.01926 0.15296C0.905829 0.0577954 0.753904 0.00513784 0.59621 0.00632804C0.438515 0.00751848 0.287667 0.0624613 0.176156 0.159324C0.064645 0.256186 0.00139348 0.387217 2.30612e-05 0.524196C-0.00134688 0.661175 0.0592744 0.79314 0.168831 0.891671L3.57115 3.84704C3.68394 3.94498 3.83689 4 3.99637 4C4.15585 4 4.3088 3.94498 4.42158 3.84704L7.82391 0.891671C7.93666 0.793701 8 0.660844 8 0.522315C8 0.383786 7.93666 0.250929 7.82391 0.152959Z"
          fill="black"
        />
      </motion.svg>

      <AnimatePresence>
        {isOpen && (
          <div className="sort-overflow-hidden-container">
            <motion.div
              initial={{y: '-100%'}}
              animate={{y: '1px'}}
              exit={{y: '-100%'}}
              transition={{ease: 'easeInOut', duration: 0.15}}
            >
              <div className="sort-container">{children}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </button>
  );
}

function FilterInput({
  label,
  value,
  addFilter,
  isChecked,
  removeFilter,
  isSort,
  term,
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <>
      <button
        className="padded-filter-div inline-border filter-input"
        onClick={(e) => {
          e.stopPropagation();
          if (!isChecked(value)) addFilter(value);
          else removeFilter(value);
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        disabled={term ? true : false}
        style={{
          fontWeight: isChecked(value) ? 'bold' : 'normal',
          textDecoration: isChecked(value) ? 'underline' : 'none',
        }}
      >
        {label}
        {/* {hovered && (
          <motion.div
            layoutId={`${isSort ? 'sort-' : ''}hover-indicator`}
            id={`${isSort ? 'sort-' : ''}hover-indicator`}
            style={{
              right: isSort ? 'auto' : 0,
              left: 0,
              height: isSort ? '100%' : '3px',
              width: isSort ? '3px' : '100%',
              position: 'absolute',
              bottom: 0,
              background: '#999999',
            }}
            transition={{ease: 'easeInOut', duration: 0.15}}
          />
        )}
        {isChecked(value) && (
          <motion.div
            layoutId={`${isSort ? 'sort-' : ''}filter-indicator`}
            id={`${isSort ? 'sort-' : ''}filter-indicator`}
            style={{
              right: isSort ? 'auto' : 0,
              left: 0,
              height: isSort ? '100%' : '3px',
              width: isSort ? '3px' : '100%',
              position: 'absolute',
              bottom: 0,
              background: 'black',
            }}
            transition={{ease: 'easeInOut', duration: 0.15}}
          />
        )} */}
      </button>
    </>
  );
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
    selectedOrFirstAvailableVariant(
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      ...ProductVariant
    }
    adjacentVariants {
      ...ProductVariant
    }
    priceRange{
      minVariantPrice{
        amount
        currencyCode
      }
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
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $filters: [ProductFilter!]
    $reverse: Boolean
    $sortKey: ProductCollectionSortKeys
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        filters: $filters,
        reverse: $reverse,
        sortKey: $sortKey
      ) {
        nodes {
          ...Product
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
        filters{
          id
          label
          presentation
          type
          values{
            count
            id
            input
            label
          }
        }
      }
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
