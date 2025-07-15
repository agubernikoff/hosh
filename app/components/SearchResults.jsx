import {Link} from '@remix-run/react';
import {Image, Money, Pagination} from '@shopify/hydrogen';
import {urlWithTrackingParams} from '~/lib/search';
import {Filter} from '~/routes/($locale).collections.$handle';
// import {Filter} from '~/routes/collections.$handle';
import {PaginatedResourceSection} from './PaginatedResourceSection';
import {ProductItem} from './ProductItem';

/**
 * @param {Omit<SearchResultsProps, 'error' | 'type'>}
 */
export function SearchResults({term, result, children}) {
  if (!result?.total) {
    return null;
  }

  return children({...result.items, term});
}

SearchResults.Products = SearchResultsProducts;
SearchResults.Empty = SearchResultsEmpty;

/**
 * @param {PartialSearchResult<'products'>}
 */
function SearchResultsProducts({term, products}) {
  if (!products?.nodes.length) {
    return null;
  }
  return (
    <div className="search-result">
      <p className="collection-title">{`"${term}"`}</p>
      <Filter
        tag={''}
        handle={''}
        filters={products?.productFilters}
        term={`"${term}"`}
        total={products.nodes.length}
      />
      <div className="filter-placeholder" />
      <PaginatedResourceSection
        connection={products}
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
    </div>
  );
}

function SearchResultsEmpty() {
  return <p>No results, try a different search.</p>;
}

/** @typedef {RegularSearchReturn['result']['items']} SearchItems */
/**
 * @typedef {Pick<
 *   SearchItems,
 *   ItemType
 * > &
 *   Pick<RegularSearchReturn, 'term'>} PartialSearchResult
 * @template {keyof SearchItems} ItemType
 */
/**
 * @typedef {RegularSearchReturn & {
 *   children: (args: SearchItems & {term: string}) => React.ReactNode;
 * }} SearchResultsProps
 */

/** @typedef {import('~/lib/search').RegularSearchReturn} RegularSearchReturn */
