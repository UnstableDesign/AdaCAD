import { R, Z } from '@angular/cdk/keycodes';
import * as tf from '@tensorflow/tfjs'
import { abs, math, norm } from '@tensorflow/tfjs';

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
        var newDraft = [];
        for (var i = 0; i < draft.length; i++) {
            newDraft.push([]);
            for (var j = 0; j < draft[i].length; j++) {
                newDraft[i].push([draft[i][j]]);
            }
        }
        let mean = this.encoder_mean.predict(tf.tensor([newDraft]));
        console.log('predicted mean:', mean);
        let log_var = this.encoder_log_var.predict(tf.tensor([newDraft]));
        console.log('predicted log_var:', log_var);

        var close = true;
        var epsilon;
        while (close) {
            close = false;
            epsilon = Math.random(); //to replace with a rondom number from a normal distribution
            for (var i = 0; i < this.epsilons.length; i++) {
                if (Math.abs(epsilon - this.epsilons[i]) < 0.1) {
                    close = true;
                }
            }
        }
        this.epsilons.push(epsilon);
        
        var z_sample = tf.add(mean, tf.mul(tf.exp(log_var), epsilon));
        console.log('z_sample:', z_sample);
        let tile_multiple = [this.batch_size, 1];//tf.tensor([this.batch_size, 1]);
        let x_decoded = this.decoder.predict(tf.tile(z_sample, tile_multiple), this.batch_size);
        console.log('x_decoded:', x_decoded);
    }
}