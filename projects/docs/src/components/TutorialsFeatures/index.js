
import styles from './styles.module.css';
import clsx from 'clsx';
import { OpLink } from '@site/src/components/OpLink';
const FeatureList = [
    {
        title: 'Blend Colors with Layers',
        url: 'multi-layer',
        img: require('@site/docs/learn/tutorials/img/colorblending_tutorial.jpeg').default,
        description: (
            <>
                Blend warp and weft colors using by assigning different sets of colors to different layers.

            </>
        ),
        operations: ['notation', 'satin', 'stretch']
    },
    {
        title: 'Figured Weaving',
        img: require('@site/docs/learn/tutorials/img/figured_square.png').default,
        url: 'figured_weaving_tc2',
        description: (
            <>
                Create drafts by filling regions of an image with shaded weave structures.
            </>
        ),
        operations: ['imagemap', 'shaded_satin', 'rectangle']
    },
    {
        title: 'Generating Threading Sequences',
        img: require('@site/docs/learn/tutorials/img/harness_feature.png').default,
        url: 'block_threading',
        description: (
            <>
                Create, modify and play with drawdowns created by threadings composed of different blocks.
            </>
        ),
        operations: ['warp_profile', 'rotate', 'drawdown']
    },
    {
        title: 'Generate Drafts to Weave on a TC2',
        img: require('@site/docs/learn/tutorials/img/tc2_square.jpg').default,
        url: 'weave_tc2',
        description: (
            <>
                A simple dataflow for testing structures on that can be woven on a TC2 Digital Jacquard Loom.
            </>
        ),
        operations: ['waffle', 'tabby', 'rectangle', 'selvedge']
    },
    {
        title: 'Generate Drafts to Weave on a CompuDobby',
        img: require('@site/docs/learn/tutorials/img/weave_square.png').default,
        url: 'weave_avl',
        description: (
            <>
                Using the Draft Editor to generate .WIF files for weaving on an AVL CompuDobby loom.
            </>
        ),
        operations: []
    },
];

function OperationsContent({ operations }) {
    if (operations.length > 0)
        return (
            <div className={styles.operations}>

                <h3>Uses Operations</h3>
                <div className={styles.opLinks}>
                    {operations.map((name) => (
                        <OpLink name={name} />
                    ))}
                </div>
            </div>
        )
}


function FeatureContent({ img, url, title, description, operations }) {
    return (
        <div className={`${styles.featureCard} card`}>
            <div className={styles.cardLeft}>
                {<a href={url}><img src={img}></img></a>}
            </div>
            <div className="text--left padding-horiz--md">
                <div className={styles.titleDesc}>
                    <h2><a href={url}>{title}</a></h2>
                    <h3 className={styles.desc}>{description}</h3>
                </div>
                <OperationsContent operations={operations}></OperationsContent>
            </div>
        </div>
    );
}

export default function TutorialFeatures() {
    return (
        <section className={styles.features}>
            <div className="container">
                <div className="row">
                    {FeatureList.map((props, idx) => (
                        <FeatureContent key={idx} {...props} />
                    ))}
                </div>
            </div>
        </section>
    );
}
