import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';

function Press({data, rotateImages}) {
  const press = data.fields.reduce(
    (acc, {key, value, reference, references}) => {
      if (key === 'article_link') acc[key] = JSON.parse(value);
      else acc[key] = references || reference || value;
      return acc;
    },
    {},
  );

  const images = press?.images?.nodes || [];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!rotateImages || images.length <= 1) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [rotateImages]);
  console.log(index);

  return (
    <div className="press-container">
      <div className="press-img-container">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={images[index]?.image?.url}
            src={images[index]?.image?.url}
            alt={images[index]?.alt}
            initial={{x: '100%'}}
            animate={{x: 0}}
            exit={{x: '-100%'}}
            transition={{duration: 0.3, ease: 'easeInOut'}}
          />
        </AnimatePresence>
      </div>
      <div className="press-text-container">
        <p>{press?.title}</p>
        <img
          src={press?.publication_logo?.image?.url}
          alt={press?.publication_logo?.alt}
        />
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={press?.article_link?.url}
        >
          {press?.article_link?.text}
        </a>
      </div>
    </div>
  );
}

export default Press;
