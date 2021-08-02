export class PatternFinder {

    private findBasePatternString(subsection: string) {
        var str: string = "";
        var pattern: any = [];
        for (var i = 0; i < subsection.length; i++) {
            let currentChar = subsection[i]
            if (currentChar == ",") {
                pattern.push(parseInt(str));
                str = "";
            } else {
                str += currentChar;
            }
        }
        return this.findBasePatternArray(pattern)
    }

    private findBasePatternArray(pattern: any) {
        for (var i = 2; i < pattern.length; i++) {
            if (pattern.length % i == 0) {
                var match = true;
                for (var j = 1; j < i; j++) {
                    if (pattern.slice(0, pattern.length/i) != pattern.slice((pattern.length/i)*j,(pattern.length/i)*(j+1))) {
                        match = false;
                    }
                    if (match) {
                        return this.findBasePatternArray(pattern.slice(0, pattern.length/i));
                    }
                }
            }
        }
        return pattern;
    }

    private toString(pattern: any) {
        var strPattern: string = "";
        for (var i = 0; i < pattern.length; i++) {
            var num: number = pattern[i];
            strPattern += num.toString();
            strPattern += ",";
        }
        return strPattern.slice(0, -1);
    }

    private toArray(pattern: string) {
        var arrayPattern: any = [];
        var temp: string = "";
        for (var i = 0; i < pattern.length; i++) {
            var currentChar = pattern[i];
            if (currentChar != ",") {
                temp += currentChar;
                if (i == pattern.length - 1) {
                    arrayPattern.push(parseInt(temp));
                }
            } else if (currentChar == ",") {
                arrayPattern.push(parseInt(temp));
                temp = "";
            } 
        }
        return arrayPattern;
    }

    private countOccurances(arr, item) {
        var count = 0;
        for (var i in arr) {
            if (i == item) {
                count += 1;
            }
        }
        return count;
    }

    private findPatterns(sequence) {
        for (var i = 0; i < sequence.length; i++) {
            if (sequence[i] == -1) {
                var allEmpty = true;
                for (var j = i+1; j < sequence.length; j++) {
                    if (sequence[j] != -1) {
                        allEmpty = false;
                    }
                }
                if (allEmpty) {
                    break;
                }
            }
        }
        if (allEmpty) {
            sequence.splice(i, sequence.length - i);
        }
        var singles = {};

        for (var i = 0; i < sequence.length; i++) {
            singles[i] = this.countOccurances(sequence, i);
        }
        for (var key in singles) {
            if (singles[key] == 1) {
                delete singles[key];
            }
        }

        var occuranceTable = {};
        var continueSearch = true;
        var size = 2;
        var occuranceTableKeys: string[] = [];
        

        while (continueSearch) {
            continueSearch = false;
            for (var i = 0; i < sequence.length - size + 1; i++) {
                var strSubsequence: string = "";
                for (var j = 0; j < size; j++) {
                    strSubsequence += sequence[i+j].toString() + ",";
                }
                strSubsequence = strSubsequence.slice(0, -1);
                if (occuranceTableKeys.includes(strSubsequence)) {
                    occuranceTable[strSubsequence] += 1;
                    continueSearch = true;
                } else {
                    occuranceTable[strSubsequence] = 1;
                    occuranceTableKeys.push(strSubsequence);
                }
            }
            size += 1;
        }        


        var patterns = [];

        for (var idx = 0; idx < occuranceTableKeys.length; idx++) {
            var key = occuranceTableKeys[idx];
            var simplifiable = false;
            if (occuranceTable[key] > 1) {
                for (var j = 0; j < patterns.length; j++) {
                    var pattern = patterns[j];
                    simplifiable = true;
                    //checking that current key is not just a pre-existing pattern repeated over and over...
                    if (pattern.length % key.length == 0) {
                        for (var checkingIdx = 0; checkingIdx < pattern.length-key.length; checkingIdx++) {
                            if (pattern.substring(checkingIdx, checkingIdx + key.length) != key) {
                                simplifiable = false;
                            }
                        }
                    }
                    if (simplifiable) {
                        break;
                    }
                }
                if (!simplifiable) {
                    patterns.push(key);
                }
            }
        }

        var toDelete = [];

        for (var p1 = 0; p1 < patterns.length; p1++) {
            for (var p2 = p1 + 1; p2 < patterns.length; p2++) {
                var pattern1 = this.toArray(patterns[p1]);
                var pattern2 = this.toArray(patterns[p2]);
                var swapped: boolean = false;

                let length1: number = pattern1.length;
                let length2: number = pattern2.length;
                if (length1 != length2) {
                    if (length1 > length2) {
                        var temp = JSON.parse(JSON.stringify(pattern1)); //Makes a deep copy of pattern1
                        pattern1 = JSON.parse(JSON.stringify(pattern2));
                        pattern2 = temp;
                        swapped = true;
                    }
                }
                var i = -1;
                var aligned = false;
                while (!aligned) {
                    i += 1;
                    if (pattern1[pattern1.length-1] == pattern2[i]) {
                        aligned = true;
                        for (var j = 1; j < i; j++) {
                            if (pattern1[pattern1.length - 1 - j] != pattern2[i - j]) {
                                aligned = false;
                            }
                        }
                    }
                    if (i == pattern1.length - 1 && !aligned) {
                        i = -1;
                        aligned = true;
                    }
                    
                }

                var repeat = false;
                if (i != -1) {
                    repeat = true;
                    for (var idx = 0; idx < pattern1.length-1-i; idx++) {
                        if (pattern1[idx] != pattern2[i + 1 + idx]) {
                            repeat = false;
                        }
                    }
                }
                if (repeat && swapped) {
                    toDelete.push(p1);
                } else if (repeat) {
                    toDelete.push(p2);
                }
            }
        }

        for (var i = 0; i < patterns.length; i++)
        {
            if (!patterns[i].includes(",")) {//meaning this is a pattern of one entry
                toDelete.push(i);
            }
            
        }

        
        var containsRepeats = true;
        while(containsRepeats) {
            var firstIdx = -1;
            containsRepeats = false;
            for (var i = 0; i < toDelete.length; i++) {
                for (var j = i+1; j < toDelete.length; j++) {
                    if (toDelete[i] == toDelete[j]) {
                        containsRepeats = true;
                        if (firstIdx == -1) {
                            firstIdx = j;
                        }
                    }
                }
            }
            if (firstIdx != -1) {
                toDelete.splice(firstIdx, 1);
            }
        }
        for (var i = 0; i < patterns.length; i++) {
            console.log('before delete:', patterns[i]);
        }

        console.log('toDelete:', toDelete);
        for (var i = 0; i < toDelete.length; i++) {
            patterns.splice(toDelete[toDelete.length - 1 - i], 1)
        }
        for (var i = 0; i < patterns.length; i++) {
            console.log('after delete:', patterns[i]);
        }

        return patterns;
    }

    private findDraftPatterns(treadlingPatterns, treadling, threadingPatterns, threading, draft) {
        // console.log('treadling', treadling);
        // console.log('threading', threading);
        // console.log('treadlingPatterns:', treadlingPatterns);
        // console.log('threadingPatterns:', threadingPatterns);
        var treadlingString: string = this.toString(treadling);
        var threadingString: string = this.toString(threading);
        
        var treadlingPatternsArr = [];
        for (var i = 0; i < treadlingPatterns.length; i++) {
            let current = treadlingPatterns[i];
            treadlingPatternsArr.push(this.toArray(current));
        }

        var threadingPatternsArr = [];
        for (var i = 0; i < threadingPatterns.length; i++) {
            let current = threadingPatterns[i];
            threadingPatternsArr.push(this.toArray(current));
        }

        var treadlingRanges = [];
        var threadingRanges = [];

        var checked = 0;
        for (i = 0; i < treadlingPatternsArr.length; i++) {
            let current = treadlingPatternsArr[i];
            let stringVersion = treadlingPatterns[i];
            let idx = treadlingString.slice(checked, treadlingString.length).indexOf(stringVersion);
            var length = -1;

            for (var j = 0; j < treadlingString.length; j++) {
                if (j == idx) {
                    length += 1;
                    break;
                }
                if (treadlingString[j] == ",") {
                    length += 1;
                }
            }
            treadlingRanges.push([length, current.length]);
            checked = stringVersion.length + 1;
        }

        checked = 0;
        for (var i = 0; i < threadingPatternsArr.length; i++) {
            let current = threadingPatternsArr[i];
            let stringVersion = threadingPatterns[i];
            let idx = threadingString.slice(checked, threadingString.length).indexOf(stringVersion);
            var length = -1;

            for (var j = 0; j < threadingString.length; j++) {
                if (j == idx) {
                    length += 1;
                    break;
                }
                if (threadingString[j] == ",") {
                    length += 1;
                }
            }
            threadingRanges.push([length, current.length]);
            checked = stringVersion.length + 1;
        }

        var draftPatterns = [];
        for (var i = 0; i < treadlingRanges.length; i++) {
            for (var j = 0; j < threadingRanges.length; j++) {
                var pattern = [];
                var counter = -1;
                for (var idxWeft = treadlingRanges[i][0]; idxWeft < treadlingRanges[i][1]; idxWeft += 1) {
                    counter += 1;
                    pattern.push([]);
                    for (var idxWarp = threadingRanges[j][0]; idxWarp < threadingRanges[j][1]; idxWarp += 1) {
                        pattern[counter].push(draft[idxWeft][idxWarp]);
                    }
                }
                draftPatterns.push(pattern);
            }
        }
        var transformedDraftPatterns = [];

        for (var i = 0; i < draftPatterns.length; i++) {
            transformedDraftPatterns.push([]);
            for (var j = 0; j < draftPatterns[i].length; j++) {                
                transformedDraftPatterns[i].push([]);
                for(var k = 0; k < draftPatterns[i][j].length; k++) {
                    if (draftPatterns[i][j][k].is_up) {
                        transformedDraftPatterns[i][j].push(1);
                    } else {
                        transformedDraftPatterns[i][j].push(0);
                    }
                }
            }
        }
        console.log('transforrmedDraftPatterns:', transformedDraftPatterns);
        return transformedDraftPatterns;
    }

    public computePatterns(threading, treadling, draft) {
        let threadingPatterns = this.findPatterns(threading);
        let treadlingPatterns = this.findPatterns(treadling);
        
        return this.findDraftPatterns(treadlingPatterns, treadling, threadingPatterns, threading, draft);
    }
    
}