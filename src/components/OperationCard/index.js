import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';


// export default function HomepageFeatures({}) {
//   return (
//     <section className={styles.features}>
//       <div className="container">
//         <div className="row">
//           {FeatureList.map((props, idx) => (
//             <Feature key={idx} {...props} />
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }

export const OperationCard = ({children, name, display}) => (



  <div className={clsx('col col--4')}>
      <div className="text--left">         
        {
          <img
          src={require('@site/docs/reference/operations/img/'+name+'.png').default}
          alt="Image of the operation"
        />
        }
      </div>
      <div className="text--left padding-horiz--md">
        <h2>{name}</h2>
        <p>{display}</p>
      </div>
    </div>



    
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