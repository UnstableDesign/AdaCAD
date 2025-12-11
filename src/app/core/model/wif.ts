import { createMaterial, Draft, Material, setMaterialID, warps, wefts } from "adacad-drafting-lib";


export const getInt = (val: string, e: string) => {
    var index = e.search(val);
    if (index != -1) {
        var substring = e.substring(index, e.length);
        var endOfLineChar = '\n';
        var endIndex = substring.indexOf(endOfLineChar);
        if (endIndex != -1) {
            return +(substring.substring(val.length + 1, endIndex)); //string is converted to int with unary + operator
        } else {
            return -1;
        }
    } else {
        return -1;
    }
}

export const getBool = (val: string, e: string) => {
    var index = e.search(val);
    if (index != -1) {
        var substring = e.substring(index, e.length);
        var endOfLineChar = '\n';
        var endIndex = substring.indexOf(endOfLineChar);
        if (endIndex != -1 && substring.substring(val.length + 1, endIndex) === "yes") {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

export const getString = (val: string, e: string) => {
    var index = e.search(val);
    if (index != -1) {
        var substring = e.substring(index, e.length);
        var endOfLineChar = '\n';
        var endIndex = substring.indexOf(endOfLineChar);
        if (endIndex != -1) {
            return substring.substring(val.length + 1, endIndex);
        } else {
            return "";
        }
    } else {
        return "";
    }
}


export const getSubstringAfter = (val: string, e: string) => {
    var index = e.search(val);
    if (index != -1) {
        return e.substring(index + val.length);
    } else {
        return e;
    }
}

//**UPATE THIS */
export const getTreadling = (e: string, draft: Draft): Array<Array<number>> => {
    const treadling: Array<Array<number>> = [];
    const treadles = getInt("Treadles", e);

    for (let i = 0; i < wefts(draft.drawdown); i++) {
        treadling.push([]);
    }

    var indexOfLabel = e.search("TREADLING]");
    var startIndex = indexOfLabel + "TREADLING]".length + 1;
    var endOfLineChar = '\n';
    var endIndex = (e.substring(startIndex)).indexOf(endOfLineChar) + startIndex;
    var line = e.substring(startIndex, endIndex);

    while (line.match(/[0-9]*=[0-9]*/) != null) {
        var weft = +(line.match(/[0-9]*/));
        var treadle = +(line.match(/=[0-9]*/)[0].substring(1));
        treadling[weft - 1] = [treadle - 1];
        startIndex = endIndex + 1;
        endIndex = e.substring(startIndex).indexOf(endOfLineChar) + startIndex;
        line = e.substring(startIndex, endIndex);
    }

    return treadling;
}

export const getThreading = (e: string, draft: Draft): Array<number> => {
    const threading: Array<number> = [];
    for (let i = 0; i < warps(draft.drawdown); i++) {
        threading.push(-1);
    }

    var indexOfLabel = e.search("THREADING]");
    var startIndex = indexOfLabel + "THREADING]".length + 1;
    var endOfLineChar = '\n';
    var endIndex = (e.substring(startIndex)).indexOf(endOfLineChar) + startIndex;
    var line = e.substring(startIndex, endIndex);

    while (line.match(/[0-9]*=[0-9]*/) != null) {
        var warp = +(line.match(/[0-9]*/));
        var frame = +(line.match(/=[0-9]*/)[0].substring(1));
        threading[warps(draft.drawdown) - warp] = frame - 1;
        startIndex = endIndex + 1;
        endIndex = e.substring(startIndex).indexOf(endOfLineChar) + startIndex;
        line = e.substring(startIndex, endIndex);
    }

    return threading;
}

export const getTieups = (e: string, draft: Draft): Array<Array<boolean>> => {
    const tieups: Array<Array<boolean>> = [];
    const frames = getInt("Shafts", e);
    const treadles = getInt("Treadles", e);

    for (let i = 0; i < frames; i++) {
        tieups.push(Array(treadles).fill(false));
    }

    var indexOfLabel = e.search("TIEUP]");
    var startIndex = indexOfLabel + "TIEUP]".length + 1;
    var endOfLineChar = '\n';
    var endIndex = (e.substring(startIndex)).indexOf(endOfLineChar) + startIndex;
    var line = e.substring(startIndex, endIndex);

    while (line.match(/[0-9]*=[0-9]*/) != null) {
        var treadle = +(line.match(/[0-9]*/));
        var firstFrame = +(line.match(/=[0-9]*/)[0].substring(1));
        tieups[firstFrame - 1][treadle - 1] = true;
        var restOfFrames = line.match(/,[0-9]/g);
        if (restOfFrames != null) {
            for (var i = 0; i < restOfFrames.length; i++) {
                var currentFrame = +(restOfFrames[i].substring(1));
                tieups[currentFrame - 1][treadle - 1] = true;
            }
        }
        startIndex = endIndex + 1;
        endIndex = e.substring(startIndex).indexOf(endOfLineChar) + startIndex;
        line = e.substring(startIndex, endIndex);
    }

    return tieups;
}

//can likely simplify this as it is mostlyy like the function above but with different variable names for the respective applications
export const getColorTable = (e: string): Array<Material> => {
    const color_table: Array<Material> = [];
    var originalShuttle = createMaterial({
        color: "#3d3d3d",
        id: 0
    });
    originalShuttle.color = "#3d3d3d";
    setMaterialID(originalShuttle, 0);
    color_table.push(originalShuttle);

    var indexOfLabel = e.search("COLOR TABLE]");
    var startIndex = indexOfLabel + "COLOR TABLE]".length + 1;
    var endOfLineChar = '\n';
    var endIndex = (e.substring(startIndex)).indexOf(endOfLineChar) + startIndex;
    var line = e.substring(startIndex, endIndex);
    var id = 1;

    while (line.match(/[0-9]*=[0-9]*,[0-9]*,[0-9]*/) != null) {
        // var index = +(line.match(/[0-9]*/));
        var redNum = +(line.match(/=[0-9]*/)[0].substring(1));
        var greenAndBlue = line.match(/,[0-9]*/g);
        var greenNum = +(greenAndBlue[0].substring(1));
        var blueNum = +(greenAndBlue[1].substring(1));

        var hex = "#";
        var hexr = redNum.toString(16);
        if (hexr.length == 1) {
            hex += "0" + hexr;
        } else {
            hex += hexr;
        }
        var hexg = greenNum.toString(16);
        if (hexg.length == 1) {
            hex += "0" + hexg;
        } else {
            hex += hexg;
        }
        var hexb = blueNum.toString(16);
        if (hexb.length == 1) {
            hex += "0" + hexb;
        } else {
            hex += hexb;
        }


        var shuttle = createMaterial({
            color: hex,
            id: id
        });
        shuttle.color = hex;
        setMaterialID(shuttle, id);
        id++;

        color_table.push(shuttle);

        startIndex = endIndex + 1;
        endIndex = e.substring(startIndex).indexOf(endOfLineChar) + startIndex;
        line = e.substring(startIndex, endIndex);
    }
    return color_table;
}