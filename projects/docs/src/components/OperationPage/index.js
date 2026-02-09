import React from 'react'
import Markdown from 'react-markdown';
import { getOp } from 'adacad-drafting-lib/operations/operations.js'
import styles from './styles.module.css';





export const OperationHeader = (props) => {

    const operation = getOp(props.name);
    if (operation !== null) return (
        < section className={styles.opHeader} >
            {operation.meta.desc}
            <img
                src={require(`@site/docs/reference/operations/${operation.meta.categories[0].name}/${operation.name}/${operation.name}.png`).default}
                alt="Example banner"
            />
        </section >
    );
}

export const OperationMarkdown = ({ name }) => {
    const obj = assets.find(el => el.name == name)
    console.log("FOUND OBJ", obj, obj.frontMatter);
    if (obj !== undefined) return (<Markdown>## Hi</Markdown>)

}

