import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Parametric Design For Woven Structures',
    img: require('@site/static/img/layer_example.gif').default,
    description: (
      <>
Instead of filling a blank canvas with your drafts and bindings, in AdaCAD, you grow drafts from the ground up by combining different operations. This makes woven structure design algorithmic and playful. 
</>
    ),
  },
  {
    title: 'Designed for Experimental Weaving',
    img: require('@site/static/img/sample7b.jpg').default,
    description: (
      <>
        AdaCAD is developed in conversation with experimental weavers across fiber arts and engineering and, thus, offers specific support for complex structure development. 
      </>
    ),
  },
  {
    title: 'Open Source',
    img: require('@site/static/img/code.png').default,
    description: (
      <>
        AdaCAD is an open-source tool, meaning that anyone can add to the code base to add new operations and features. 
      </>
    ),
  },
];

function Feature({img, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <img src={img}></img>
        {/* <Svg className={styles.featureSvg} role="img" /> */}
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
