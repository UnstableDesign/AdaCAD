import { opCategoryList, getOp } from 'adacad-drafting-lib/operations/operations.js'
import React from 'react';

//import { assets } from '../import_helper';
const cat_list = opCategoryList();



export const OpLink = (props) => {

    const name = props.name;
    const op = getOp(name);
    if (op == null) {
        return (name);
    } else {
        const cat_name = (op.meta.categories) ? op.meta.categories[0].name : 'uncategorized';
        const op_displayname = (op.meta) ? op.meta.displayname : { name }
        const color = (op.meta.categories) ? op.meta.categories[0].color : '#000';
        const url = `/docs/reference/operations/${cat_name}/${name}`;
        return (
            <a className={`${cat_name} opItem`} style={{
                backgroundColor: color
            }} href={url}>{op_displayname}</a>
        )
    }



}

// export const OpLink = (props) => {
//     console.log("CHILDREN ", props.name)
//     return (
//         { props.name }
//     );

// const name = 'pattern across width'
// console.log('NAME', name)

// const op = getOp(el => (el.name == name || el.meta.displayname == name));
// if (op === null) {
//     return ({ name })
// } else {
//     const cat_name = (op.meta.categories) ? op.meta.categories[0].name : 'uncategorized';
//     const op_name = (op) ? op.name : { name }
//     const op_displayname = (op.meta) ? op.meta.displayname : { name }
//     const url = '/docs/reference/operations/' + { cat_name } + '/' + { op_name };

//     return (
//         <a className={`${cat_name} opLink`} href={url}>{op_displayname}</a>
//     )
// }
// }

