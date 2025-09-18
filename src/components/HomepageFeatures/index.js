import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';



const FeatureList = [
  {
    title: '📗 About',
    url: '/docs/about',
    img: require('@site/static/img/layer_example.gif').default,
    description: (
      <>
        AdaCAD is an experimental workspace that applies <a href="/docs/reference/glossary/parametric-design">parametric design</a> to the domain of weave <a href="/docs/reference/glossary/draft">drafting</a>. It supports algorithmic and playful approaches to developing woven structures and cloth, for <a href="docs/reference/glossary/harness-loom">shaft</a>, <a href="/docs/reference/glossary/direct-tie-loom">dobby</a>,  and <a href="/docs/reference/glossary/jacquard-loom">jacquard</a> looms.
      </>
    ),
  },
  {
    title: '🖥️ Use it Online',
    img: require('@site/static/img/sample7b.jpg').default,
    url: 'https://adacad.org',
    description: (
      <>
        AdaCAD is freely accessible online at <a href="https://adacad.org">adacad.org</a>, you do not need to download or install it on your computer. We recommend using the Chrome browser on a laptop or desktop computer for the best experience.
      </>
    ),
  },
  {
    title: '🏁 Get Started',
    img: require('@site/static/img/code.png').default,
    url: '/docs/learn/getting-started/',
    description: (
      <>
        New to AdaCAD? Follow our <a href="/docs/learn/getting-started/">getting started</a> guide to start making dataflows.
      </>
    ),
  },
  {
    title: '🍎 Tutorials',
    img: require('@site/static/img/code.png').default,
    url: '/docs/learn/tutorials/',
    description: (
      <>
        <a href="/docs/learn/tutorials/">Tutorials</a> offer step-by-step instructions for performing common drafting tasks.
      </>
    ),
  },
  {
    title: '🧪 Reference Materials',
    img: require('@site/static/img/code.png').default,
    url: '/docs/reference/operations/',
    description: (
      <>
        Already using AdaCAD? Deepen your practice by exploring all of the project's <a href="/docs/reference/operations/">operations</a>, <a href="/docs/reference/glossary">concepts</a>, <a href="/docs/reference/interface">interface features</a> and <a href="/docs/learn/examples">stories</a>.
      </>
    ),
  },
  {
    title: '👯‍♀️ Open Source',
    img: require('@site/static/img/code.png').default,
    url: '/docs/develop/makeanoperation',
    description: (
      <>
        AdaCAD is an open source project! If you'd like to add a feature, <a href="/develop/makeanoperation">start by adding your own operation</a>.
      </>
    ),
  }
  // {
  //   title: '🧪 Experimental',
  //   img: require('@site/static/img/code.png').default,
  //   description: (
  //     <>
  //      AdaCAD is an open source project! If you'd like to add a feature, start by adding your own operation. 
  //     </>
  //   ),
  // },
  // {
  //   title: '🧪 Experimental',
  //   img: require('@site/static/img/code.png').default,
  //   description: (
  //     <>
  //      AdaCAD is an open source project! If you'd like to add a feature, start by adding your own operation. 
  //     </>
  //   ),
  // },
];

function Feature({ img, url, title, description }) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--left">
        {/* <img src={img}></img> */}
        {/* <Svg className={styles.featureSvg} role="img" /> */}
      </div>
      <div className="text--left padding-horiz--md">
        <h3><a href={url}>{title}</a></h3>
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
