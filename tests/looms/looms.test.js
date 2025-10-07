const convertTieupToLiftPlan = require('../../src/loom/loom').convertTieupToLiftPlan;



test('testing loom conversion - shaft to direct', async () => {


    const threading = [1, 2, 3, 4, 5];
    const tieup = [
        [false, false, false, false, false],
        [false, true, false, false, true],
        [false, false, true, false, false],
        [false, false, false, true, false],
        [false, false, false, false, true]
    ];
    const treadling = [
        [-1],
        [-1],
        [0],
        [-1],
        [1]
    ]


    const converted_loom = convertTieupToLiftPlan({ threading, tieup, treadling }, { frames: 4, treadles: 4, epi: 12, ppi: 12, type: 'direct', units: "cm" });
    expect(converted_loom.tieup[0][0]).toEqual(true);
    expect(converted_loom.tieup.length).toEqual(6);
    expect(converted_loom.tieup[0].length).toEqual(6);

});