import * as tf from '@tensorflow/tfjs'

export class VAE {
    private epsilons: any = [];
    private latent_dim: number = 3;
    private batch_size: number = 16;
    private vae;
    private decoder;
    private encoder_log_var;
    private encoder_mean;

    constructor() {
        this.loadModels();
    }

    async loadModels() {
        // const handlerVAE = tfn.io.fileSystem("./assets/vae/model.json");

        // // this.vae = await tf.loadLayersModel(handlerVAE);
        // this.vae = await tf.loadLayersModel('https://localhost:4200/src/assets/vae/models.json'); // if merged to master, change this to the hosted address
        // this.decoder = await tf.loadLayersModel('https://localhost:4200/src/assets/decoder/models.json');
        // this.encoder_log_var = await tf.loadLayersModel('https://localhost:4200/src/assets/encoder_log_var/models.json');
        // this.encoder_mean = await tf.loadLayersModel('https://localhost:4200/src/assets/encoder_mean/models.json');
        // console.log('ML models loaded');
    }

    generateFromSeed(draft) {
        
    }
}