import {Link} from '@remix-run/react';
import {Image, Money} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {motion, AnimatePresence} from 'motion/react';
import {useState, useEffect, useRef} from 'react';

/**
 * @param {{
 *   product:
 *     | CollectionItemFragment
 *     | ProductItemFragment
 *     | RecommendedProductFragment;
 *   loading?: 'eager' | 'lazy';
 * }}
 */
export function ProductItem({product, loading}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product?.images?.edges[0]?.node;
  const [quickShop, setQuickShop] = useState();
  function closePopUp() {
    setQuickShop();
  }
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
            <motion.div layoutId={`${product.id}`}>
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
          <QuickShop product={quickShop} closePopUp={closePopUp} />
        )}
      </AnimatePresence>
    </>
  );
}

/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {import('storefrontapi.generated').CollectionItemFragment} CollectionItemFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductFragment} RecommendedProductFragment */

function QuickShop({product, closePopUp}) {
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
    // if (index !== 0)
    //   imagesDiv.current?.scrollTo({
    //     left: 0,
    //     behavior: 'smooth', // optional for smooth scrolling
    //   });

    closePopUp();
  }

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
          layoutId={`${product.id}`}
          className="quick-shop-images-container"
          style={{width: '50%'}}
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
        {/* <ProductForm /> */}
      </div>
    </motion.div>
  );
}
