import { Cell, Drawdown, initDraft, unpackDrawdownFromArray, warps, wefts } from "adacad-drafting-lib/draft";
import { Draft } from "./datatypes";
import { defaults } from "./defaults";
import utilInstance from "./util";



const parseSavedDrawdown = (dd: Array<Array<Cell>>): Drawdown => {

    const drawdown: Drawdown = [];
    if (dd === undefined) return [];

    for (var i = 0; i < wefts(dd); i++) {
        drawdown.push([]);
        for (var j = 0; j < warps(dd); j++) {
            drawdown[i][j] = dd[i][j];
        }
    }

    return drawdown;
}


/**
 * creates a draft object from saved data. Handles different forms of saved drafts. 
 * @param data : a draft node object from the saved file
 */
export const loadDraftFromFile = (data: any, version: string, src: string): Promise<{ draft: Draft, id: number }> => {
    const draft: Draft = initDraft();

    console.log("DATA is ", data)


    if (data.id !== undefined) draft.id = data.id;

    if (data.draft_name === undefined) {
        draft.gen_name = (data.gen_name === undefined) ? defaults.draft_name : data.gen_name;
        draft.ud_name = (data.ud_name === undefined) ? '' : data.ud_name;

    } else {
        draft.gen_name = data.draft_name;
        draft.ud_name = '';


    }



    if (version === undefined || version === null || !utilInstance.sameOrNewerVersion(version, '3.4.5')) {
        draft.drawdown = parseSavedDrawdown(data.pattern);
    } else {
        // console.log("VERSION NEWER THAN 3.4.5")
        if (data.compressed_drawdown === undefined) {
            draft.drawdown = parseSavedDrawdown(data.drawdown);
        } else {
            // console.log("UNPACKING", data.compressed_drawdown, data.warps, data.wefts);


            let compressed: Uint8ClampedArray;
            if (src == 'upload') {
                compressed = new Uint8ClampedArray(data.compressed_drawdown);


            } else {
                compressed = data.compressed_drawdown;
            }

            draft.drawdown = unpackDrawdownFromArray(data.compressed_drawdown, data.warps, data.wefts)

        }
    }

    draft.rowShuttleMapping = (data.rowShuttleMapping === undefined) ? [] : data.rowShuttleMapping;
    draft.rowSystemMapping = (data.rowSystemMapping === undefined) ? [] : data.rowSystemMapping;
    draft.colShuttleMapping = (data.colShuttleMapping === undefined) ? [] : data.colShuttleMapping;;
    draft.colSystemMapping = (data.colSystemMapping === undefined) ? [] : data.colSystemMapping;;

    return Promise.resolve({ draft: draft, id: draft.id });

}
