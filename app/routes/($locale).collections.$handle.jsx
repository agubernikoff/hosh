import {redirect} from '@shopify/remix-oxygen';
import {useLoaderData, useSearchParams} from '@remix-run/react';
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
  return [{title: `Hosh | ${data?.collection.title ?? ''} Collection`}];
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

  const [{collection}, {metaobject}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {handle, filters, reverse, sortKey, ...paginationVariables},
      // Add other queries here, so that they are loaded in parallel
    }),
    storefront.query(ARTIST_QUERY, {
      variables: {handle},
      // Add other queries here, so that they are loaded in parallel
    }),
  ]);

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }

  let artist = null;
  if (metaobject) artist = metaobject;

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: collection});

  return {
    collection,
    artist,
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
  const {collection, artist} = useLoaderData();

  return (
    <div className="collection">
      <div className="collection-title">
        <p>{collection.title.toUpperCase()}</p>
        {artist && (
          <p>
            <span>{artist?.tribe?.value}</span>
            {artist?.tribe?.value && artist?.discipline?.value && ' • '}
            <span>{artist?.discipline?.value}</span>
          </p>
        )}
      </div>
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

// Modified Filter component with cascading close
export function Filter({filters, shopAll, term}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [openFilter, setOpenFilter] = useState(null); // Track which filter is open
  const [backupFilterOpen, setBackupFilterOpen] = useState(false); // Track backup filter state

  // Handle cascading close - close child filters first, then parent
  const handleBackupFilterClose = () => {
    if (openFilter !== null) {
      // If a child filter is open, close it first
      setOpenFilter(null);
      // Then close the backup filter after a short delay for smooth animation
      setTimeout(() => {
        setBackupFilterOpen(false);
      }, 150); // Match your animation duration
    } else {
      // If no child filters are open, close immediately
      setBackupFilterOpen(false);
    }
  };

  // Handle backup filter toggle
  const handleBackupFilterToggle = () => {
    if (backupFilterOpen) {
      handleBackupFilterClose();
    } else {
      setBackupFilterOpen(true);
    }
  };

  // Handle child filter toggle - this should work normally when backup filter is open
  const handleChildFilterToggle = (index) => {
    // Only allow child filter toggling when backup filter is open
    if (backupFilterOpen) {
      setOpenFilter(openFilter === index ? null : index);
    }
  };

  function addFilter(input) {
    setSearchParams(
      (prev) => {
        if (prev.has('filter')) {
          prev.append('filter', input);
        } else prev.set('filter', input);
        return prev;
      },
      {preventScrollReset: true},
    );
  }

  function removeFilter(input) {
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        const filters = newParams.getAll('filter');
        newParams.delete('filter');

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
        newParams.delete('filter');
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

  // Get all selected filters across all filter types
  function getSelectedFilters() {
    const selectedFilters = [];
    const activeFilters = searchParams.getAll('filter');

    filters.forEach((filterGroup) => {
      filterGroup.values.forEach((filterValue) => {
        if (activeFilters.includes(filterValue.input)) {
          selectedFilters.push({
            label: filterValue.label,
            value: filterValue.input,
            groupLabel: filterGroup.label,
          });
        }
      });
    });

    return selectedFilters;
  }

  return (
    <div className="filter-container">
      <BackupFilter
        isOpen={backupFilterOpen}
        onToggle={handleBackupFilterToggle}
        onClose={handleBackupFilterClose}
      >
        <div
          style={{position: 'relative', margin: 0}}
          className="filter-container"
        >
          {filters.map((filter, index) => (
            <Filt
              filter={filter.values}
              addFilter={addFilter}
              removeFilter={removeFilter}
              isChecked={isChecked}
              clearFilter={clearFilter}
              label={filter.label}
              key={filter.label}
              isOpen={openFilter === index}
              onToggle={() => handleChildFilterToggle(index)}
              selectedFilters={getSelectedFilters()}
              // Pass parent state to child for cascading behavior
              parentOpen={backupFilterOpen}
            />
          ))}
        </div>
      </BackupFilter>
      <Sort
        addSort={addSort}
        removeSort={removeSort}
        isChecked={isSortChecked}
        shopAll={shopAll}
        term={term}
      />
      <div
        style={{position: 'relative', margin: 0}}
        className="filter-container hide-on-mobile"
      >
        {filters.map((filter, index) => (
          <Filt
            filter={filter.values}
            addFilter={addFilter}
            removeFilter={removeFilter}
            isChecked={isChecked}
            clearFilter={clearFilter}
            label={filter.label}
            key={filter.label}
            isOpen={openFilter === index}
            onToggle={() => setOpenFilter(openFilter === index ? null : index)}
            selectedFilters={getSelectedFilters()}
          />
        ))}
      </div>
    </div>
  );
}

function SelectedFilters({selectedFilters, removeFilter, clearFilter}) {
  if (selectedFilters.length === 0) return null;

  return (
    <div className="selected-filters-container">
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          alignItems: 'center',
        }}
      >
        {selectedFilters.map((filter, index) => (
          <button
            key={`${filter.groupLabel}-${filter.value}`}
            className="selected-filter-tag"
            onClick={(e) => {
              e.stopPropagation();
              removeFilter(filter.value);
            }}
            style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <span>{filter.label}</span>
            <span style={{fontWeight: 'bold'}}>×</span>
          </button>
        ))}
      </div>
      {selectedFilters.length > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            clearFilter();
          }}
          style={{
            padding: '0.25rem 0.5rem',
            backgroundColor: 'black',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '0.875rem',
            cursor: 'pointer',
            fontWeight: 'bold',
            alignSelf: 'end',
          }}
        >
          Clear All
        </button>
      )}
    </div>
  );
}

function Sort({addSort, removeSort, isChecked, term, shopAll}) {
  const [isOpen, setIsOpen] = useState(false);

  // Define sort options with their labels and values
  const sortOptions = [
    {
      label: 'Best Selling',
      value: JSON.stringify({
        reverse: false,
        sortKey: 'BEST_SELLING',
      }),
    },
    {
      label: 'Alphabetically, A-Z',
      value: JSON.stringify({reverse: false, sortKey: 'TITLE'}),
    },
    {
      label: 'Alphabetically, Z-A',
      value: JSON.stringify({reverse: true, sortKey: 'TITLE'}),
    },
    {
      label: 'Date, new to old',
      value: JSON.stringify({
        reverse: true,
        sortKey: shopAll ? 'CREATED_AT' : 'CREATED',
      }),
    },
    {
      label: 'Date, old to new',
      value: JSON.stringify({
        reverse: false,
        sortKey: shopAll ? 'CREATED_AT' : 'CREATED',
      }),
    },
    {
      label: 'Price, low to high',
      value: JSON.stringify({reverse: false, sortKey: 'PRICE'}),
    },
    {
      label: 'Price, high to low',
      value: JSON.stringify({reverse: true, sortKey: 'PRICE'}),
    },
  ];

  // Find the currently selected sort option
  const getSelectedSortLabel = () => {
    const selectedOption = sortOptions.find((option) =>
      isChecked(option.value),
    );
    return selectedOption ? selectedOption.label : 'Relevance'; // Default fallback
  };

  function toggleIsOpen() {
    setIsOpen(!isOpen);
  }

  return (
    <button onClick={toggleIsOpen} className="sort-by-button">
      <span>
        <span style={{display: 'inline-block', textAlign: 'left'}}>
          {`Sort: `}
        </span>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={`sort-by-${getSelectedSortLabel()}`}
            initial={{opacity: 1}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            style={{
              display: 'inline-block',
              textAlign: 'left',
              marginLeft: '.5rem',
            }}
          >
            {getSelectedSortLabel()}
          </motion.span>
        </AnimatePresence>
      </span>
      <div>
        <motion.svg
          width="8"
          height="12"
          viewBox="0 0 8 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          initial={{rotateX: 0}}
          animate={{rotateX: isOpen ? 180 : 0}}
        >
          <path
            d="M4.35355 0.646446C4.15829 0.451184 3.84171 0.451184 3.64645 0.646446L0.464465 3.82843C0.269203 4.02369 0.269203 4.34027 0.464466 4.53553C0.659728 4.7308 0.97631 4.7308 1.17157 4.53553L4 1.70711L6.82843 4.53553C7.02369 4.7308 7.34027 4.7308 7.53553 4.53553C7.7308 4.34027 7.7308 4.02369 7.53553 3.82843L4.35355 0.646446ZM4 12L4.5 12L4.5 1L4 1L3.5 1L3.5 12L4 12Z"
            fill="black"
          />
        </motion.svg>
        <motion.svg
          width="8"
          height="12"
          viewBox="0 0 8 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          initial={{rotateX: 0}}
          animate={{rotateX: isOpen ? 180 : 0}}
        >
          <path
            d="M3.64645 11.3536C3.84171 11.5488 4.15829 11.5488 4.35355 11.3536L7.53553 8.17157C7.7308 7.97631 7.7308 7.65973 7.53553 7.46447C7.34027 7.2692 7.02369 7.2692 6.82843 7.46447L4 10.2929L1.17157 7.46447C0.97631 7.2692 0.659728 7.2692 0.464466 7.46447C0.269204 7.65973 0.269204 7.97631 0.464466 8.17157L3.64645 11.3536ZM4 0L3.5 -2.18557e-08L3.5 11L4 11L4.5 11L4.5 2.18557e-08L4 0Z"
            fill="black"
          />
        </motion.svg>
      </div>
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
                {sortOptions.map((option, index) => (
                  <FilterInput
                    key={index}
                    label={option.label}
                    value={option.value}
                    addFilter={addSort}
                    isChecked={isChecked}
                    removeFilter={removeSort}
                    isSort={true}
                    term={
                      option.label.toLowerCase().includes('price') ? null : term
                    }
                  />
                ))}
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
  isOpen,
  onToggle,
  selectedFilters,
  parentOpen,
}) {
  const filterOrderRef = useRef(new Map());

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
    storeInitialOrder(filter);
  }, []);

  return (
    <>
      <MobileFilt
        label={label}
        isOpen={isOpen}
        onToggle={onToggle}
        parentOpen={parentOpen}
      >
        <div className="filter-container">
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
        </div>
        <SelectedFilters
          selectedFilters={selectedFilters}
          removeFilter={removeFilter}
          clearFilter={clearFilter}
        />
      </MobileFilt>
    </>
  );
}

// Modified MobileFilt component to handle cascading behavior
function MobileFilt({children, label, isOpen, onToggle, parentOpen}) {
  // Auto-close when parent is closing - but don't interfere with normal opening
  useEffect(() => {
    if (!parentOpen && isOpen) {
      // Parent is closing and this child is open, so close it
      // Use a ref to avoid calling onToggle if it's already been called
      const timer = setTimeout(() => {
        // Only close if still open (avoid double-closing)
        if (isOpen) {
          onToggle();
        }
      }, 75);
      return () => clearTimeout(timer);
    }
  }, [parentOpen]); // Only depend on parentOpen, not isOpen or onToggle

  return (
    <button
      className={`mobile-filter ${isOpen ? 'isOpen-btn' : ''}`}
      onClick={onToggle}
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
              <div
                style={{
                  padding: '1rem 0',
                  background: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1px solid rgba(0, 0, 0, 0.3)',
                }}
              >
                {children}
              </div>
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
      {!term && (
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
        </button>
      )}
    </>
  );
}

// Modified BackupFilter component
function BackupFilter({children, isOpen, onToggle, onClose}) {
  return (
    <div className="hide-on-desktop">
      <button onClick={onToggle}>
        Filter
        <svg
          width="9"
          height="7"
          viewBox="0 0 9 7"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{scale: '1.5', marginLeft: '.25rem'}}
        >
          <path
            d="M1 1H8M2.16667 3.5H6.83333M3.56667 6H5.43333"
            stroke="black"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <AnimatePresence>
        {isOpen && (
          <div className="sort-overflow-hidden-container">
            <motion.div
              initial={{y: '-100%'}}
              animate={{y: '1px'}}
              exit={{y: '-100%'}}
              transition={{ease: 'easeInOut', duration: 0.15}}
            >
              <div
                style={{
                  padding: '1rem 0',
                  background: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1px solid rgba(0, 0, 0, 0.3)',
                }}
              >
                {children}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
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

const ARTIST_QUERY = `#graphql
  query Artist(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
  )
  @inContext(language: $language, country: $country) {
    metaobject(handle:{
        handle:$handle,type:"artist_data"
      }){
        tribe:field(key:"tribe") {
          key
          value
        }
        discipline:field(key:"discipline") {
          key
          value
        }
      }
    }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
