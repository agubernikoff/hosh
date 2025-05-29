import React from 'react';
import {motion} from 'motion/react';

function Expandable({
  openSection,
  toggleSection,
  title,
  details,
  isFirstRender,
}) {
  return (
    <motion.div
      key={title}
      className="dropdown"
      layout={!isFirstRender ? 'position' : false}
      initial={{height: '1.2rem'}}
      animate={{height: openSection === title ? 'auto' : '1.2rem'}}
      style={{overflow: 'hidden'}}
    >
      <motion.p
        layout={!isFirstRender ? 'position' : false}
        className={`dropdown-header ${openSection === title ? 'open' : ''}`}
        onClick={() => toggleSection(title)}
      >
        <span>{openSection === title ? '-' : '+'}</span>
        <span className="dropdown-title">{title}</span>
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
