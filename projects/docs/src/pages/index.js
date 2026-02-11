import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <h1 className="title">{siteConfig.title}</h1>
        <h2 className="subtitle">{siteConfig.tagline}</h2>
        <div className={styles.buttons}>
          <Link
            className="button adacad button--primary button--lg"
            to="https://adacad.org/">
            Start Drafting
          </Link>

          <Link
            className="button adacad button--secondary button--lg"
            to="https://adacad.org/?share=57405316">
            Open the File we used to make this Background
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
