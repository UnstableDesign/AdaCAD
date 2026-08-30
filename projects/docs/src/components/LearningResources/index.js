
import styles from './styles.module.css';
import { OpLink } from '../OpLink';


const ResourcesList = [
    {
        title: 'Key Concepts',
        url: '../../learn/key-concepts/',
        desc: <>New to the concept of Parametric Design? Learn more about it and other key concepts that can help when using AdaCAD</>,
        extra: []
    },
    {
        title: 'Tutorials',
        url: '../../learn/tutorials/',
        desc: <>Step-by-step guides for common drafting tasks using AdaCAD</>,
        extra: []
    },
    {
        title: 'Workshops and Events',
        url: '../../learn/workshops-and-events/',
        desc: <>See upcoming Workshops and events where you can learn more about AdaCAD and watch previous workshop recordings</>,
        extra: []
    },
    {
        title: 'FAQ',
        url: '../../learn/faq/',
        desc: <>Have a question? Check out our FAQ section for answers to common questions and troubleshooting tips.</>,
        extra: []
    },

    {
        title: 'Community',
        url: 'https://discord.gg/Be7ukQcvrC',
        desc: <>Connect with us and other users on Discord</>,
        extra: []
    },
    {
        title: 'Operations List',
        url: '../../reference/operations/',
        desc: <>A list of all the operations AdaCAD offers</>,
        extra: []
    }
];



function ExtraContent(props) {
    return (
        <li><a className='' href={props.url} > {props.text}</a ></li>
    );
}



function FeatureContent({ img, url, title, desc, extra }) {

    return (
        <div className={`${styles.featureCard} card`}>
            <div className={styles.featureContainer}>

                <div className={styles.titleDesc}>
                    <h2><a href={url}>{title}</a></h2>
                    <p>{desc} <a className='' href={url}>more...</a></p>
                    <ul>
                        {extra.map((props, idx) => (
                            <ExtraContent key={idx} {...props} />
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export function LearningResources() {
    return (
        <section className={styles.learningResources}>
            {ResourcesList.map((props, idx) => (
                <FeatureContent key={idx} {...props} />
            ))}
        </section>

    );
}
