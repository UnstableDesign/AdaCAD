import { Drawdown, warps, wefts } from "../draft";
import { density_units } from "../utils";
import { calcWidth } from "./loom";
import { LoomUtil, Loom, LoomSettings } from "./types";


export const jacquard_utils: LoomUtil = {
  type: 'jacquard',
  displayname: 'jacquard loom',
  dx: "draft exclusively from drawdown, disregarding any frame and treadle information",

  getDressingInfo: (dd: Drawdown, loom: Loom, ls: LoomSettings): Array<{ label: string, value: string }> => {

    const unit_string = density_units.find(el => el.value == ls.units)
    const unit_string_text = (unit_string !== undefined) ? unit_string.viewValue : 'undefined';

    return [
      { label: 'loom type', value: 'jacquard' },
      { label: 'warp density', value: ls.epi + " " + unit_string_text },
      { label: 'warp ends', value: warps(dd) + " ends" },
      { label: 'width', value: calcWidth(dd, ls) + " " + ls.units },
      { label: 'weft picks', value: wefts(dd) + " picks" }
    ];
  }

}