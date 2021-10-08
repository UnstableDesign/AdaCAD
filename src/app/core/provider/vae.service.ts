import * as tf from '@tensorflow/tfjs'
import { std, mean } from 'mathjs'
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VaeService {
  private epsilons: any = [];
  private batch_size: number = 16;
  private decoder;
  private encoder_log_var;
  private encoder_mean;
  
  constructor() { }

  async loadModels(collection: string) {
    this.decoder = await tf.loadLayersModel('../../../assets/' + collection + '/decoder/model.json');
    this.encoder_log_var = await tf.loadLayersModel('../../../assets/' + collection + '/encoder_log_var/model.json');
    this.encoder_mean = await tf.loadLayersModel('../../../assets/' + collection + '/encoder_mean/model.json');
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

    let epsilon_shape = mean.shape;
    this.epsilons.push([]);
    for (var i = 0; i < epsilon_shape[0]; i++) {
        this.epsilons[this.epsilons.length-1].push([]);
        for (var j = 0; j < epsilon_shape[1]; j++) {
            this.epsilons[this.epsilons.length-1][i].push(Math.random());
        }
    }
    
    var z_sample = tf.add(tf.add(mean, tf.exp(log_var)), this.epsilons[this.epsilons.length-1]);
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
