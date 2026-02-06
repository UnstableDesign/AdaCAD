
import styles from './styles.module.css';
import { OpLink } from '@site/src/components/OpLink';
const ProjectList = [
    {
        title: 'Lattice Structures',
        url: 'lattice-tutorial',
        img: require('@site/docs/learn/examples/img/lattice_preview.jpg').default,
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
        img: require('@site/docs/learn/examples/img/animatedlinen_preview.png').default,
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
        img: require('@site/docs/learn/examples/img/aftr_chat.jpg').default,
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

export default function ProjectsFeature() {
    return (
        <section className={styles.features}>
            <div className="container">
                <div className="row">
                    {ProjectList.map((props, idx) => (
                        <FeatureContent key={idx} {...props} />
                    ))}
                </div>
            </div>
        </section>
    );
}
