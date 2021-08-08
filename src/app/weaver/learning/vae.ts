import * as tf from '@tensorflow/tfjs'

class lambdaLayer extends tf.layers.Layer {
    private shape;
    private latent_dim;
    constructor(shape, latent_dim) {
        super();
        this.shape = shape;
        this.latent_dim = latent_dim;
    }

    call(inputs) {
        let z_mean = inputs[0];
        let z_log_var = inputs[1];
        let epsilon = tf.randomNormal([this.shape[0], this.latent_dim], 0., 1.);

        let toRet = z_mean + tf.matMul(tf.exp(z_log_var), epsilon);
        return toRet;
    }

    getConfig() {
        let config = super.getConfig();
        config['shape'] = this.shape;
        config['latent_dim'] = this.latent_dim;
        return config;
    }
}

export class VAE {
    private epsilons: any = [];
    private latent_dim: number = 3;
    private batch_size: number = 16;
    private vae;
    private decoder;
    private encoder_log_var;
    private encoder_mean;
    private lambda;
    
    
    constructor() {
        this.loadModels();
    }

    async loadModels() {

        this.decoder = await tf.loadLayersModel('../../../assets/decoder/model.json');
        this.encoder_log_var = await tf.loadLayersModel('../../../assets/encoder_log_var/model.json');
        this.encoder_mean = await tf.loadLayersModel('../../../assets/encoder_mean/model.json');
        console.log('ML models loaded');
    }

    generateFromSeed(draft) {
        
    }
}