function Press({data}) {
  const press = data.fields.reduce(
    (acc, {key, value, reference, references}) => {
      if (key === 'article_link') acc[key] = JSON.parse(value);
      else acc[key] = references || reference || value;
      return acc;
    },
    {},
  );

  const images = press?.images?.nodes || [];

  return (
    <div className="press-container">
      <div className="press-img-container">
        <img
          key={images[0]?.image?.url}
          src={images[0]?.image?.url}
          alt={images[0]?.alt}
        />
      </div>
      <div className="press-text-container">
        <p>PRESS</p>
        <img
          src={press?.publication_logo?.image?.url}
          alt={press?.publication_logo?.alt}
        />
        <p>{press?.title}</p>
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
