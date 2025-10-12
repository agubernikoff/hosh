import {Link, useLocation} from '@remix-run/react';
import {Image, Money} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {motion, AnimatePresence} from 'motion/react';
import {useState, useEffect, useRef} from 'react';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {ProductPrice} from '~/components/ProductPrice';
import {ProductForm} from '~/components/ProductForm';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';

/**
 * @param {{
 *   product:
 *     | CollectionItemFragment
 *     | ProductItemFragment
 *     | RecommendedProductFragment;
 *   loading?: 'eager' | 'lazy';
 * }}
 */
export function ProductItem({product, loading, layoutId}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product?.images?.edges[0]?.node;
  const [quickShop, setQuickShop] = useState();
  function closePopUp() {
    setQuickShop();
  }
  const {pathname} = useLocation();
  return (
    <>
      <Link
        className="product-item"
        key={product.id}
        prefetch="intent"
        to={variantUrl}
      >
        {image && (
          <div className="product-item-img-container">
            <motion.div layoutId={layoutId || `${product.id}-${pathname}`}>
              <Image
                alt={image.altText || product.title}
                // aspectRatio="1/1"
                data={image}
                loading={loading}
                sizes="(min-width: 45em) 400px, 100vw"
              />
            </motion.div>
            <button
              className="quick-shop"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setQuickShop(product);
              }}
            >
              Quick Shop
            </button>
          </div>
        )}
        <p>{product.title}</p>
        <small>
          <Money data={product.priceRange.minVariantPrice} />
        </small>
      </Link>
      <AnimatePresence mode="popLayout">
        {quickShop === product && (
          <QuickShop
            product={quickShop}
            closePopUp={closePopUp}
            pathname={pathname}
            layoutId={layoutId}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {import('storefrontapi.generated').CollectionItemFragment} CollectionItemFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductFragment} RecommendedProductFragment */

function QuickShop({product, closePopUp, pathname, layoutId}) {
  const images = product?.images?.edges;
  useEffect(() => {
    // Lock scroll
    document.body.style.overflow = 'hidden';

    return () => {
      // Unlock scroll when modal is removed
      document.body.style.overflow = '';
    };
  }, []);

  const [imageIndex, setImageIndex] = useState(0);

  function handleScroll(scrollWidth, scrollLeft) {
    const widthOfAnImage = scrollWidth / images.length;
    const dividend = scrollLeft / widthOfAnImage;
    const rounded = parseFloat((scrollLeft / widthOfAnImage).toFixed(0));
    if (Math.abs(dividend - rounded) < 0.2) setImageIndex(rounded);
  }

  const mappedIndicators =
    images.length > 1
      ? images.map((e, i) => (
          <div
            key={e.node.id}
            className="circle"
            style={{
              height: '3px',
              width: '22px',
              position: 'relative',
              background: '#e9e9e9',
            }}
          >
            {i === imageIndex ? (
              <motion.div
                layoutId="mapped-indicator"
                key="mapped-indicator"
                style={{
                  background: '#999999',
                  height: '3px',
                  width: '22px',
                  position: 'absolute',
                }}
                transition={{ease: 'easeInOut', duration: 0.15}}
              />
            ) : null}
          </div>
        ))
      : null;

  const imagesDiv = useRef(null);
  function handleClose() {
    if (imageIndex !== 0) {
      imagesDiv.current?.scrollTo({
        left: 0,
        behavior: 'smooth', // optional for smooth scrolling
      });
      setTimeout(
        () => {
          closePopUp();
        },
        330 * (imageIndex - 0.7 * (imageIndex - 1)),
      );
    } else closePopUp();
  }

  const [selectedVariant, setSelectedVariant] = useState();

  useEffect(
    () => setSelectedVariant(product?.selectedOrFirstAvailableVariant),
    [product],
  );

  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  function handleClick(variant) {
    setSelectedVariant(variant);
  }

  const {title, descriptionHtml} = product;

  const itemStyle = (selected, available, isColorOption) => {
    return {
      opacity: available ? 1 : 0.3,
      color: selected ? 'white' : 'black',
      background: selected ? 'black' : 'white',
      padding: isColorOption ? 0 : null,
    };
  };

  const {open} = useAside();
  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      className="quick-shop-container"
    >
      <button className="close-popup" onClick={handleClose}></button>
      <div className="quick-shop-popup">
        <button onClick={handleClose}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 13 13"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 1L1 12M1 1L12 12"
              stroke="black"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <motion.div
          layoutId={layoutId || `${product.id}-${pathname}`}
          className="quick-shop-images-container"
          style={{width: '55%'}}
        >
          <div
            ref={imagesDiv}
            className="popup-images"
            onScroll={(e) =>
              handleScroll(e.target.scrollWidth, e.target.scrollLeft)
            }
          >
            {images?.map(({node}) => (
              <div className="popup-image">
                <Image
                  alt={node.altText || product.title}
                  // aspectRatio="1/1"
                  data={node}
                  sizes="(min-width: 45em) 400px, 100vw"
                />
              </div>
            ))}
          </div>
          <div className="mapped-indicators">{mappedIndicators}</div>
        </motion.div>
        <div className="quick-shop-popup-right">
          <div>
            <p>
              <strong>{title}</strong>
            </p>
            <p>
              <strong>{product.artist?.value}</strong>
            </p>
          </div>
          <p>{product.description2?.value}</p>
          <div>
            <ProductPrice
              price={selectedVariant?.price}
              compareAtPrice={selectedVariant?.compareAtPrice}
            />
          </div>
          {productOptions.map((option) => {
            // if (option.optionValues.length === 1) return null;

            const isColorOption =
              option.name.toLowerCase() === 'material' ||
              option.name.toLowerCase() === 'color';

            return (
              <div className="product-options" key={option.name}>
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
                      variant,
                    } = value;
                    const variantImage = isColorOption ? variant?.image : null;
                    const styles = itemStyle(
                      selected,
                      available,
                      isColorOption,
                    );

                    if (isDifferentProduct) {
                      return (
                        <button className="product-options-item" style={styles}>
                          <ProductOptionSwatch
                            swatch={swatch}
                            name={name}
                            isColorOption={isColorOption}
                            productImage={variantImage}
                          />
                        </button>
                      );
                    } else {
                      return (
                        <button
                          type="button"
                          className={`product-options-item${
                            exists && !selected ? ' link' : ''
                          }`}
                          key={option.name + name}
                          style={styles}
                          disabled={!exists}
                          onClick={() => handleClick(variant, name)}
                        >
                          <ProductOptionSwatch
                            swatch={swatch}
                            name={name}
                            isColorOption={isColorOption}
                            productImage={variantImage}
                          />
                          {/* {selected && (
                            <motion.div
                              layoutId={`${option.name}-${product.handle}`}
                              id={`${option.name}`}
                              transition={{ease: 'easeInOut', duration: 0.15}}
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                left: '-1px',
                                right: '-1px',
                                height: '2px',
                                background: 'black',
                              }}
                            />
                          )} */}
                        </button>
                      );
                    }
                  })}
                </div>
              </div>
            );
          })}
          {/* <p>
            <strong>Description</strong>
          </p>
          <div dangerouslySetInnerHTML={{__html: descriptionHtml}} /> */}

          <AddToCartButton
            disabled={!selectedVariant || !selectedVariant.availableForSale}
            onClick={() => {
              setTimeout(() => open('cart'), 250);
              closePopUp();
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
            {selectedVariant?.availableForSale ? 'ADD TO CART' : 'Sold out'}
          </AddToCartButton>
          <p>Free standard shipping and easy returns.</p>
        </div>
      </div>
    </motion.div>
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
