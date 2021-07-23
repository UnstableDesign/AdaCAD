export class DraftMatcher {

    private simulatedDraft; 

    private distance(draft1, draft2) {
        var size = draft1.length * draft2.length;
        var sim_counter = 0;
        for (var i = 0; i < draft1.length; i++) {
            for (var j = 0; j < draft2.length; j++) {
                if (draft1[i][j] == 1 && draft2[i][j] == 1) {
                    sim_counter += 1;
                } else if (draft1[i][j] == 0 && draft2[i][j] == 0) {
                    sim_counter += 1;
                }
            }
        }
        return Math.abs(size-sim_counter)/size;
    }

    private patternToSize(centroids0, pattern) {
        console.log('pattern:', pattern);
        if (pattern[0].length > centroids0[0].length) {
            for (var i = 0; i < pattern.length; i++) {
                while(pattern[i].length > centroids0[0].length) {
                    pattern[i].splice(pattern[i].length-1, 1);
                }
            }
        }
        if (pattern.length > centroids0.length) {
            while(pattern.length > centroids0.length) {
                pattern.splice(pattern.length-1, 1);
            }
        }
        var idx = 0;
        while (pattern[0].length < centroids0[0].length) {
            for (var j = 0; j < pattern.length; j++) {
                if (idx < pattern[j].length) {
                    pattern[j].push(pattern[j][idx]);
                }
            }
            idx += 1;
            if (idx >= pattern[0].length) {
                idx = 0;
            }
        }
        idx = 0;
        while (pattern.length < centroids0.length) {
            pattern.push(pattern[idx]);
            idx += 1;
            if (idx >= pattern.length) {
                idx = 0;
            }
        }
        return pattern;
    }

    matchToClosestCluster(centroids, pattern) {
        this.simulatedDraft = this.patternToSize(centroids[0], pattern);
        return this.findClosest(centroids, this.simulatedDraft);
    }

    matchToClosestDraft(cluster) {
        return this.findClosest(cluster, this.simulatedDraft);
    }

    private findClosest(group, draft) {
        var minDistance = 1000;
        var minIdx = -1;
        for (var i = 0; i < group.length; i++) {
            let distanceVal = this.distance(draft, group[i]);
            if (distanceVal < minDistance) {
                minDistance = distanceVal;
                minIdx = i;
            }
        }
        return minIdx;
    }
}