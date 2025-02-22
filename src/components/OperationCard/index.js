import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

export const OperationCard = ({children, name, display}) => (

  <article className={clsx('margin-bottom--lg')} >
  <a 
  className={clsx('card padding--lg')}
  href={`${name}/`}
  style={{backgroundImage: `url($require('@site/docs/reference/operations/img/'+name+'.png')`}}>
  <div className="text--left padding-horiz--md">
          {
            <img
            src={require('@site/docs/reference/operations/img/'+name+'.png').default}
            alt="Image of the operation"
          />
          }
 
        <h2># {display}</h2>
        <p>{children}</p>
 

  </div>

     
  </a>
  </article>    





    
  );


  export const Highlight = ({children, color}) => (
    <span
      style={{
        backgroundColor: color,
        borderRadius: '2px',
        color: '#fff',
        padding: '0.2rem',
      }}>
      {children}
    </span>
  );