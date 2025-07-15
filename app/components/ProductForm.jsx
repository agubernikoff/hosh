import {Link, useNavigate} from '@remix-run/react';
import {useState, useEffect} from 'react';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';
import {motion, AnimatePresence} from 'motion/react';
import {ProductPrice} from '~/components/ProductPrice';

/**
 * @param {{
 *   productOptions: MappedProductOptions[];
 *   selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
 * }}
 */
export function ProductForm({productOptions, selectedVariant, product}) {
  const navigate = useNavigate();
  const {open} = useAside();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleChange = (e) => setIsMobile(e.matches);

    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  return (
    <div className="product-form">
      {productOptions.map((option) => {
        // If there is only a single value in the option values, don't display the option
        if (option.optionValues.length === 1) return null;

        return (
          <div className="product-options" key={option.name}>
            <div style={{marginBottom: '1rem'}}>
              {isMobile ? (
                <p style={{fontSize: '14px', fontWeight: '500'}}>
                  {product.title}
                </p>
              ) : null}
              {isMobile ? (
                <p style={{fontSize: '14px', fontWeight: '500'}}>
                  {product.artist?.value}
                </p>
              ) : null}
            </div>
            <div style={{marginBottom: '1rem'}}>
              {isMobile ? (
                <p style={{fontSize: '14px'}}>{product.description2?.value}</p>
              ) : null}
              {isMobile ? (
                <ProductPrice
                  price={selectedVariant?.price}
                  compareAtPrice={selectedVariant?.compareAtPrice}
                />
              ) : null}
            </div>
            <p>
              <strong>Select {option.name}:</strong>{' '}
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={`${option.optionValues.find((v) => v.selected)?.name}`}
                  initial={{opacity: 1}}
                  animate={{opacity: 1}}
                  exit={{opacity: 0}}
                  style={{display: 'inline-block', width: '5rem'}}
                  transition={{ease: 'easeInOut', duration: 0.15}}
                >
                  {option.optionValues.find((v) => v.selected)?.name || ''}
                </motion.span>
              </AnimatePresence>
            </p>
            <div className="product-options-grid">
              {option.optionValues.map((value) => {
                const {
                  name,
                  handle,
                  variantUriQuery,
                  selected,
                  available,
                  exists,
                  isDifferentProduct,
                  swatch,
                } = value;

                if (isDifferentProduct) {
                  // SEO
                  // When the variant is a combined listing child product
                  // that leads to a different url, we need to render it
                  // as an anchor tag
                  return (
                    <Link
                      className="product-options-item"
                      key={option.name + name}
                      prefetch="intent"
                      preventScrollReset
                      replace
                      to={`/products/${handle}?${variantUriQuery}`}
                      style={{
                        border: selected
                          ? '1px solid black'
                          : '1px solid transparent',
                        opacity: available ? 1 : 0.3,
                      }}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </Link>
                  );
                } else {
                  // SEO
                  // When the variant is an update to the search param,
                  // render it as a button with javascript navigating to
                  // the variant so that SEO bots do not index these as
                  // duplicated links
                  return (
                    <button
                      type="button"
                      className={`product-options-item${
                        exists && !selected ? ' link' : ''
                      }`}
                      key={option.name + name}
                      style={{
                        opacity: available ? 1 : 0.3,
                        color: selected ? 'white' : 'black',
                        background: selected ? 'black' : 'white',
                      }}
                      disabled={!exists}
                      onClick={() => {
                        if (!selected) {
                          navigate(`?${variantUriQuery}`, {
                            replace: true,
                            preventScrollReset: true,
                          });
                        }
                      }}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </button>
                  );
                }
              })}
            </div>
            <br />
          </div>
        );
      })}
      {isMobile ? (
        <div
          style={{
            position: 'sticky',
            bottom: '10px',
            background: 'white',
            zIndex: 10,
          }}
        >
          <AddToCartButton
            disabled={!selectedVariant || !selectedVariant.availableForSale}
            onClick={() => {
              open('cart');
            }}
            lines={
              selectedVariant
                ? [
                    {
                      merchandiseId: selectedVariant.id,
                      quantity: 1,
                      selectedVariant,
                    },
                  ]
                : []
            }
          >
            {selectedVariant?.availableForSale ? 'ADD TO CART' : 'SOLD OUT'}
          </AddToCartButton>
        </div>
      ) : (
        <AddToCartButton
          disabled={!selectedVariant || !selectedVariant.availableForSale}
          onClick={() => {
            open('cart');
          }}
          lines={
            selectedVariant
              ? [
                  {
                    merchandiseId: selectedVariant.id,
                    quantity: 1,
                    selectedVariant,
                  },
                ]
              : []
          }
        >
          {selectedVariant?.availableForSale ? 'ADD TO CART' : 'SOLD OUT'}
        </AddToCartButton>
      )}
      <br />
      <p>Free standard shipping and easy returns.</p>
    </div>
  );
}

/**
 * @param {{
 *   swatch?: Maybe<ProductOptionValueSwatch> | undefined;
 *   name: string;
 * }}
 */
function ProductOptionSwatch({swatch, name}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;

  if (!image && !color) return name;

  return (
    <div
      aria-label={name}
      className="product-option-label-swatch"
      style={{
        backgroundColor: color || 'transparent',
      }}
    >
      {!!image && <img src={image} alt={name} />}
    </div>
  );
}

/** @typedef {import('@shopify/hydrogen').MappedProductOptions} MappedProductOptions */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').Maybe} Maybe */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').ProductOptionValueSwatch} ProductOptionValueSwatch */
/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
