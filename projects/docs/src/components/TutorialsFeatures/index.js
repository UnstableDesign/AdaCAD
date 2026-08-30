
import styles from './styles.module.css';
import clsx from 'clsx';
import { OpLink } from '@site/src/components/OpLink';
const FeatureList = [
    {
        title: 'Data Weaving',
        img: require('@site/docs/learn/tutorials/img/dataweave.013.jpeg').default,
        url: 'data-weave',
        description: (
            <>
                Use data to create and manipulate drafts.
            </>
        ),
        operations: ['undulatewefts', 'sample_width', 'sample_length', 'fill'],
        collaborators: []
    },
    {
        title: 'Using Drafts as Graphics',
        img: require('@site/docs/learn/tutorials/img/bitfield_stretch_1.jpeg').default,
        url: 'draft-as-graphic',
        description: (
            <>
                Strategies for using interesting looking drafts as graphics in cloth.
            </>
        ),
        operations: ['bitfield', 'stretch', 'interlace', 'fill'],
        collaborators: []
    },
    {
        title: 'Blend Colors with Layers',
        url: 'multi-layer',
        img: require('@site/docs/learn/tutorials/img/colorblending_tutorial.jpeg').default,
        description: (
            <>
                Blend warp and weft colors using by assigning different sets of colors to different layers.

            </>
        ),
        operations: ['notation', 'satin', 'stretch'],
        collaborators: []
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
        operations: ['imagemap', 'shaded_satin', 'rectangle'],
        collaborators: []
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
        operations: ['warp_profile', 'rotate', 'drawdown'],
        collaborators: []
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
        operations: ['waffle', 'tabby', 'rectangle', 'selvedge'],
        collaborators: []
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
        operations: [],
        collaborators: []
    },
    {
        title: 'Lattice Structures',
        url: 'lattice-tutorial',
        img: require('@site/docs/learn/tutorials/img/lattice_preview.jpg').default,
        description: (
            <>
                Explores multi-layered structures that interlock into a lattice.

            </>
        ),
        operations: ['notation', 'sample_width', 'splice_in_wefts'],
        collaborators: [{ url: '', text: 'Elizabeth Meiklejohn' }]
    },
    {
        title: 'Moisture Activated Shape Changing Cloth',
        img: require('@site/docs/learn/tutorials/img/animatedlinen_preview.png').default,
        url: 'hygromorphic-linen',
        description: (
            <>
                Explores how to combine different S and Z twisting yarns to create texture effects
            </>
        ),
        operations: ['assign_systems', 'sample_width', 'glitchsatin'],
        collaborators: [{ url: '', text: 'Kathryn Walters' }, { url: '', text: 'Deanna Gelosi' }]

    },
    {
        title: 'Force Sensing Cloth',
        img: require('@site/docs/learn/tutorials/img/aftr_chat.jpg').default,
        url: 'forcepocket',
        description: (
            <>
                Our design features the use of a woven pocket structure filled with conductive felt.
            </>
        ),
        operations: ['assign_systems', 'overlay_multiple'],
        collaborators: []
    }
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

function CollaboratorList({ collaborators }) {
    if (collaborators.length > 0)
        return (

            <div className={styles.opLinks}>
                <h4>In collaboration with

                    {collaborators.map((name) => (
                        <> {name.text} </>
                    ))}
                </h4>
            </div>

        )
}


function FeatureContent({ img, url, title, description, operations, collaborators }) {
    return (
        <div className={`${styles.featureCard} card`}>
            <div className={styles.featureContainer}>
                <div className={styles.cardLeft}>
                    {<a href={url}><img src={img}></img></a>}
                </div>
                <div className={styles.cardRight}>
                    <div className={styles.titleDesc}>
                        <h2><a href={url}>{title}</a></h2>
                        <CollaboratorList collaborators={collaborators}></CollaboratorList>
                        <h3 className={styles.desc}>{description}</h3>
                    </div>
                    <OperationsContent operations={operations}></OperationsContent>
                </div>
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
