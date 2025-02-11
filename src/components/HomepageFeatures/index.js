import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: '📗 About',
    img: require('@site/static/img/layer_example.gif').default,
    description: (
      <>
      AdaCAD is an experimental workspace that applies <a href="/reference/glossary/parametric-design.md">parametric design</a> to the domain of weave <a href="/reference/glossary/draft.md">drafting</a>. It supports algorithmic and playful approaches to developing woven structures and cloth, for <a href="../reference/glossary/harness-loom.md">shaft</a>, <a href="../reference/glossary/direct-tie-loom.md">dobby</a>,  and <a href="(../reference/glossary/jacquard-loom.md">jacquard</a> looms. 
</>
    ),
  },
  {
    title: '🖥️ Use it Online',
    img: require('@site/static/img/sample7b.jpg').default,
    description: (
      <>
  AdaCAD is freely accessible online at <a href="adacad.org">adacad.org</a>, you do not need to download or install it on your computer. We recommend using the Chrome browser on a laptop or desktop computer for the best experience. 
</>
    ),
  },
  {
    title: '🍎 Learn More',
    img: require('@site/static/img/code.png').default,
    description: (
      <>
        This website includes examples, templates, and resources to help you get started. We also provide a glossary to clarify our terminology and a reference documenting each operation in the interface. 
      </>
    ),
  },
];

function Feature({img, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--left">
        {/* <img src={img}></img> */}
        {/* <Svg className={styles.featureSvg} role="img" /> */}
      </div>
      <div className="text--left padding-horiz--md">
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
