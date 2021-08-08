import * as tf from '@tensorflow/tfjs'

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