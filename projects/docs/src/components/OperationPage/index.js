import React from 'react'
import Markdown from 'react-markdown';
import { getOp } from 'adacad-drafting-lib/operations/operations.js'
import styles from './styles.module.css';



export const AuthorList = ({ authors }) => {
    if (authors === undefined) return null;
    return (
        <li>✍️ {authors.join(', ')}</li>
    )
}

export const URLList = ({ urls }) => {
    if (urls === undefined) return null;
    return (
        <li>🔗 {urls.map(url => <a href={url.url} target="_blank">{url.text}</a>).join(', ')}</li>
    )
}



export const OperationHeader = (props) => {

    const operation = getOp(props.name);


    if (operation !== null) return (



        < section className={styles.opHeader} >
            <ul>
                <li>{operation.meta.advanced ? '🔥 advanced' : '💡 basic'}</li>
                <li>🗂️ {operation.meta.categories.map(category => category.name).join(', ')}</li>
                <AuthorList authors={operation.meta.authors} />
                {/* <URLList urls={operation.meta.urls} /> */}
            </ul>
            <p>{operation.meta.desc}    </p>
            <img
                src={require(`@site/docs/reference/operations/${operation.meta.categories[0].name}/${operation.name}/${operation.name}.png`).default}
                alt="Example banner" />
        </section >
    );
}

export const OperationMarkdown = ({ name }) => {
    const obj = assets.find(el => el.name == name)
    if (obj !== undefined) return (<Markdown>## Hi</Markdown>)

}

