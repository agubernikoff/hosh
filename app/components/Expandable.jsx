import React from 'react';
import {motion} from 'motion/react';

function Expandable({
  openSection,
  toggleSection,
  title,
  details,
  isFirstRender,
  header,
}) {
  return (
    <motion.div
      key={title}
      className="dropdown"
      layout={!isFirstRender ? 'position' : false}
      initial={{height: '1.2rem'}}
      animate={{
        height: openSection === title ? 'auto' : !header ? '1.2rem' : '15.4px',
      }}
      style={{overflow: 'hidden'}}
      transition={{ease: 'easeInOut', duration: 0.15}}
    >
      <motion.p
        layout={!isFirstRender ? 'position' : false}
        className={`dropdown-header ${openSection === title ? 'open' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          toggleSection(title);
        }}
      >
        {!header && <span>{openSection === title ? '-' : '+'}</span>}
        <span className="dropdown-title">{title}</span>
        {header && (
          <motion.svg
            width="8"
            height="4"
            viewBox="0 0 8 4"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            initial={{rotate: 0}}
            animate={{rotate: openSection === title ? '180deg' : 0}}
            transition={{ease: 'easeInOut', duration: 0.15}}
          >
            <path
              d="M7.82391 0.152959C7.71112 0.0550192 7.55817 -4.38211e-07 7.39869 -4.24269e-07C7.23921 -4.10327e-07 7.08626 0.0550192 6.97348 0.152959L3.99637 2.73897L1.01926 0.15296C0.905829 0.0577954 0.753904 0.00513784 0.59621 0.00632804C0.438515 0.00751848 0.287667 0.0624613 0.176156 0.159324C0.064645 0.256186 0.00139348 0.387217 2.30612e-05 0.524196C-0.00134688 0.661175 0.0592744 0.79314 0.168831 0.891671L3.57115 3.84704C3.68394 3.94498 3.83689 4 3.99637 4C4.15585 4 4.3088 3.94498 4.42158 3.84704L7.82391 0.891671C7.93666 0.793701 8 0.660844 8 0.522315C8 0.383786 7.93666 0.250929 7.82391 0.152959Z"
              fill="black"
            />
          </motion.svg>
        )}
      </motion.p>
      <div style={{overflow: 'hidden'}}>
        <motion.div
          className="dropdown-content"
          initial={{opacity: 0}}
          animate={{opacity: openSection === title ? 1 : 0}}
          key={title}
          transition={{ease: 'easeOut'}}
        >
          {details}
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Expandable;
