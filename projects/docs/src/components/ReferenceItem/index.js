import React from 'react';
import styles from './styles.module.css';


export const ReferenceItem = ({ name, img, url, children }) => {

    return (
        <div className={`${styles.referenceBlock} card`}>

            <a className={styles.referenceImg} href={url}><img src={img} alt={name} /></a>
            <div className={styles.referenceBlockContent}>
                <h3><a href={url}>{name}</a></h3>
                <p>{children}</p>
            </div>
        </div>
    )



}

