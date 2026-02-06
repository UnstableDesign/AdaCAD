import { getOp } from 'adacad-drafting-lib/operations/operations.js'
import { assets } from '../import_helper';
import styles from './styles.module.css';


export const OperationImage = ({ name }) => {
    const obj = assets.find(el => el.name == name)
    if (obj !== undefined) return (<img src={obj.img}></img>)
}


export const OperationHeader = (props) => {

    const operation = getOp(props.name);
    if (operation !== null) return (
        < section className={styles.opHeader} >
            {operation.meta.desc}
            <OperationImage name={props.name}></OperationImage>
        </section >
    );
}

