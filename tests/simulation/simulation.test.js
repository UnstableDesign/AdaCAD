
import { call } from '../../src/operations';
import { satin } from '../../src/operations';

const computeSimulationData = require('../../src/simulation/simulation').computeSimulationData;

test('testing compute simdata', () => {

    const satin_draft = call(satin, [5, 2, false]).then(
        dat => {
            // let data = computeSimulationData(satin_draft)
        }
    );

})


