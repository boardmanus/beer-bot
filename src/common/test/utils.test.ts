import { Utils } from '../utils';

describe('Utils', () => {
  it('f_to_c and c_to_f are inverse within float precision', () => {
    const f = 68;
    const c = Utils.f_to_c(f);
    expect(c).toBeCloseTo(20, 6);
    expect(Utils.c_to_f(c)).toBeCloseTo(f, 6);
  });

  it('gravity_to_abv works per formula', () => {
    expect(Utils.gravity_to_abv(1.050, 1.010)).toBeCloseTo(5.25);
  });

  it('rgba_style prints correct string', () => {
    expect(Utils.gravity_to_abv(1.050, 1.010)).toBeCloseTo(5.25);
  });

  it('rgba_style prints correct string', () => {
    expect(Utils.rgba_style([10, 20, 30], 0.5)).toBe('rgba(10,20,30,0.5)');
  });

  it('srm_to_rgb corners and ranges', () => {
    expect(Utils.srm_to_rgb(0)).toEqual([240, 239, 181]);
    expect(Utils.srm_to_rgb(2)).toEqual([233, 215, 108]);
    const dark = Utils.srm_to_rgb(50);
    expect(dark.length).toBe(3);
    expect(dark[0]).toBeGreaterThanOrEqual(0);
    expect(dark[1]).toBeGreaterThanOrEqual(0);
    expect(dark[2]).toBeGreaterThanOrEqual(0);
  });
});
