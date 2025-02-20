import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';




const TutorialTaxonomy = [
  {
    title: 'Weaving Figured Drafts',
    img: require('@site/static/img/sample7b.jpg').default,
    description: (
      <>
      Apply structures to regions in a color indexed image for weaving on a jacquard loom like a TC2
    </>
    ),
  },
  {
    title: 'Generating Threading Sequences',
    img: require('@site/static/img/sample7b.jpg').default,
    description: (
      <>
      Great groups of threading sequences and playfully use them to generate variations and drawdowns. 
</>
    ),
  },
  {
    title: 'Weave Your Drafts',
    img: require('@site/static/img/code.png').default,
    description: (
      <>
        Learn how to export files from AdaCAD for use on an AVL CompuDobby or TC2 digital loom. 
      </>
    ),
  }

];


export const Feature = ({img, title, description}) => (

    <div className={clsx('col col--4 item shadow--lw')}>
      {/* <div className="text--left">
        <img src={img}></img>
      </div> */}
      <div className="text--left padding-horiz--md">
        <h2>{title}</h2>
        <p>{description}</p>
        <button class="button button--primary">Primary</button>

      </div>
    </div>
);

export const TutorialContent = ({children, title}) => (
  <section className={styles.features}>
  <div className="container">
    <div className="row">
      {TutorialTaxonomy.map((props, idx) => (
        <Feature key={idx} {...props} />
      ))}
    </div>
  </div>
</section>

  
);

