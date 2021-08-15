import { R, Z } from '@angular/cdk/keycodes';
import * as tf from '@tensorflow/tfjs'
import { abs, norm } from '@tensorflow/tfjs';
import { std, mean } from 'mathjs'

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

    cleanDraft(draft) {
        let std_dev = std(draft);
        let mean_val = mean(draft);
        var thresholded_draft = JSON.parse(JSON.stringify(draft)); //making deep copy of the draft
        
        for (var weft = 0; weft < draft.length; weft++) {
            for (var warp = 0; warp < draft[weft].length; warp++) {
                if (draft[weft][warp] >= mean_val-0.08*std_dev) {
                    thresholded_draft[weft][warp] = 1;
                } else {
                    thresholded_draft[weft][warp] = 0;
                }
            }
        }

        return thresholded_draft;
    }

    async generateFromSeed(draft) {
        var newDraft = [];
        for (var i = 0; i < draft.length; i++) {
            newDraft.push([]);
            for (var j = 0; j < draft[i].length; j++) {
                newDraft[i].push([draft[i][j]]);
            }
        }
        let mean = this.encoder_mean.predict(tf.tensor([newDraft]));
        let log_var = this.encoder_log_var.predict(tf.tensor([newDraft]));

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
        let tile_multiple = [this.batch_size, 1];
        let x_decoded = this.decoder.predict(tf.tile(z_sample, tile_multiple), this.batch_size);
        var draftSuggestions = [];
        await x_decoded.array().then(array => 
            {
                let x_decoded_arr = array;
                for (var i = 0; i < x_decoded_arr.length; i++) {
                    var unclean_draft = [];
                    for (var j = 0; j < x_decoded_arr[i].length; j++) {
                        unclean_draft.push([]);
                        for (var k = 0; k < x_decoded_arr[i][j].length; k++) {
                            unclean_draft[j].push(x_decoded_arr[i][j][k][0]);
                        }
                    }
                    draftSuggestions.push(this.cleanDraft(unclean_draft));
                }


                var toDelete = [];
                for (var i = 0; i < draftSuggestions.length; i++) {
                    for (var j = i+1; j < draftSuggestions.length; j++) {
                        if (JSON.stringify(draftSuggestions[i]) === JSON.stringify(draftSuggestions[j])) {
                            if (!toDelete.includes(j)) {
                                toDelete.push(j);
                            }
                        } 
                    }
                }

                for (var i = 0; i < toDelete.length; i++) {
                    let idx = toDelete.length-1-i;
                    draftSuggestions.splice(idx, 1);
                }
            });
            return draftSuggestions;

    }
}