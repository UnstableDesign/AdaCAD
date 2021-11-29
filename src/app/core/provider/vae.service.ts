import * as tf from '@tensorflow/tfjs'
import { std, mean } from 'mathjs'
import { Injectable } from '@angular/core';


interface Model{
    name: string,
    decoder: any,
    encoder_log_var: any, 
    encoder_mean: any
}


@Injectable({
  providedIn: 'root'
})
export class VaeService {
  private epsilons: any = [];
  private batch_size: number = 16;
  private models: Array<Model> = [];
  private collections: Array<string> = ['crackle_weave', 'german'];
  
  /**
   * add models on load
   */
  constructor() { 


    this.collections.forEach(
        collection =>  {

            return Promise.all(
                [tf.loadLayersModel('../../../assets/' + collection + '/decoder/model.json'), 
                tf.loadLayersModel('../../../assets/' + collection + '/encoder_log_var/model.json'),
                tf.loadLayersModel('../../../assets/' + collection + '/encoder_mean/model.json')
            ]).then(model => {
                 this.models.push(<Model> {
                    name: collection,
                    decoder: model[0],
                    encoder_log_var:model [1],
                    encoder_mean: model[2]
                });
                }
            ).catch(console.error);

           
        }
    ) 

  

 



  }

  getModel(name: string) : Model {
      const m = this.models.find(el => el.name === name);
      if(m === undefined) console.error("cannot find model with name ", name);
      return m;
  }


printDecoder(collection: string){
    
    const m: Model = this.getModel(collection);
    console.log(m.decoder);
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

async generateFromSeed(draft, collection) {

    const m: Model = this.getModel(collection);

    var newDraft = [];
    for (var i = 0; i < draft.length; i++) {
        newDraft.push([]);
        for (var j = 0; j < draft[i].length; j++) {
            newDraft[i].push([draft[i][j]]);
        }
    }

    console.log("new draft is", newDraft);

    let mean = m.encoder_mean.predict(tf.tensor([newDraft]));
    let log_var = m.encoder_log_var.predict(tf.tensor([newDraft]));

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
    let x_decoded = m.decoder.predict(tf.tile(z_sample, tile_multiple), this.batch_size);
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
