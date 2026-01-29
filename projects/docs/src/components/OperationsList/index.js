import { opCategoryList, getOpList } from 'adacad-drafting-lib/operations/operations.js'
import { assets } from '../import_helper';
import styles from './styles.module.css';
const cat_list = opCategoryList();

//import FlipImg from "adacad-drafting-lib/img/flip.png";


export const OperationItem = ({ color, operation }) => {
    if (operation !== undefined) {

        const link = '/docs/reference/operations/' + operation.name + '/';
        const obj = assets.find(el => el.name == operation.name);


        if (obj !== undefined) {
            return (
                <div>
                    <a className="opItem"
                        style={{
                            backgroundColor: color,
                        }}
                        href={link}>{operation.meta.displayname}</a>
                    {/* <img src={obj.img}></img> */}
                </div>
            );
        } else {


            return (
                <div>
                    <h3><a className="opItem" href={link}>{operation.meta.displayname}</a></h3>
                </div>
            );
        }
    }

}

export const CategorySubSet = ({ name, category, operations }) => {
    if (operations.length !== 0) {
        return (
            <div className={styles.operationBlock}>
                <h3>{name}</h3>
                <div className={styles.basicOps}>
                    {operations.map((operation, idx) => (
                        <OperationItem color={category.color} operation={operation} />
                    ))}
                </div>
            </div>
        )
    }
}



export const CategoryItem = (props) => {

    const op_list = getOpList(props.name);
    const basic = op_list.filter(op => op.meta.advanced === undefined)
    const advanced = op_list.filter(op => op.meta.advanced !== undefined)
    const category = cat_list.find(el => el.name == props.name)


    if (category === undefined) return (<section> category not found </section>)
    else
        return (<section>
            <p>{category.desc}   </p>
            <div className={styles.operationRow}>
                <CategorySubSet name='Basic' category={category} operations={basic} />
                <CategorySubSet name='Advanced' category={category} operations={advanced} />
            </div>
        </section>
        )
}

export const OperationsList = () => {
    return (
        <section className="something">
            <div className="container">
                <div className="row">
                    {cat_list.map((props, idx) => (
                        <CategoryItem key={idx} {...props} />
                    ))}
                </div>
            </div>
        </section>
    );
}
