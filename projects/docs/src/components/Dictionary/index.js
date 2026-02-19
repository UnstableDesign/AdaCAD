import { opCategoryList, getAllOps, getOpMeta } from 'adacad-drafting-lib/operations/operations.js'
import styles from './styles.module.css';
const cat_list = opCategoryList();
const all_ops = getAllOps();


export const DictionaryItem = ({ op }) => {
    const readmePath = require(`@site/docs/reference/operations/${op.meta.categories[0].name}/${op.name}/index.md`);
    fetch(readmePath)
        .then(response => {
            return response.text();
        })
        .then(text => {
            console.log(text);
        })
    return (
        <div className={styles.dictionaryItem}>
            <h2>{op.meta.displayname}</h2>
            <p>{op.meta.desc}</p>
            <img
                src={require(`@site/docs/reference/operations/${op.meta.categories[0].name}/${op.name}/${op.name}.png`).default}
                alt="Example banner"
            />


        </div>
    )
}


export const Dictionary = () => {
    return (
        <div className={styles.dictionary}>
            <h1>Dictionary ${all_ops.length} operations</h1>

            {all_ops.map((op) => (
                <DictionaryItem key={op.name} op={op} />
            ))}
        </div>
    )
}

export default Dictionary;