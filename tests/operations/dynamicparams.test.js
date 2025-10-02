const { weft_profile } = require('../../src/operations/weft_profile/weft_profile.ts');
const { sample_width } = require('../../src/operations/sample_width/sample_width.ts');



test('test param generation on weft profile', () => {
    const params = weft_profile.params.map(el => {
        return { name: el.name, param: el }
    });
    const static_inlets = weft_profile.inlets;
    const inlet_vals = [0, 'a'];
    const changed_param_id = weft_profile.dynamic_param_id;
    const dynamic_param_vals = 'a b c a b c'
    const inlets = weft_profile.onParamChange(params, static_inlets, inlet_vals, changed_param_id, dynamic_param_vals);
    expect(inlets).toEqual([0, 'a', 'b', 'c']);
})



test('test param generation on variable width sampler', () => {
    const params = sample_width.params.map(el => {
        return { name: el.name, param: el }
    });
    const static_inlets = sample_width.inlets;
    const inlet_vals = [0, 'a'];
    const changed_param_id = sample_width.dynamic_param_id;
    const dynamic_param_vals = 'x20 y20 z20 x20'
    const inlets = sample_width.onParamChange(params, static_inlets, inlet_vals, changed_param_id, dynamic_param_vals);
    expect(inlets).toEqual([0, 'x', 'y', 'z']);
})