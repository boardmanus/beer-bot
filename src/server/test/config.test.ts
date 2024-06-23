import { Config, Beer, cfs } from '../config';

const ULTRA_STOUT_BEER: Beer = {
  name: 'Ultra Stout',
  color_srm: 52.0,
  og: 1.09
};

const BIG_BROWN_BEER: Beer = { name: 'Big Brown', color_srm: 20.0, og: 1.06 };
const BIG_BROWN_JSON: string = JSON.stringify(BIG_BROWN_BEER);

function mock_readFileSync() {
  jest.spyOn(cfs, 'readFileSync').mockReturnValue(BIG_BROWN_JSON);
}

function mock_readFileSync_error() {
  jest.spyOn(cfs, 'readFileSync').mockImplementation((_path) => {
    throw new Error('Fake error for testing');
  });
}

function mock_writeFileSync() {
  jest.spyOn(cfs, 'writeFileSync').mockImplementation((path, _data) => {
    console.log(`Fake write to file: ${path}`);
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Config should construct a configuration in a standard way', () => {
  it('Should read the config file on construction', () => {
    mock_readFileSync();

    const config = new Config('beer_config.json');

    expect(config.beer).toEqual(BIG_BROWN_BEER);
  });
  it('Should return default values if config file not found', () => {
    mock_readFileSync_error();

    const config = new Config('beer_config.json');

    expect(config.beer).toEqual(config.DEFAULT_BEER);
  });
});

describe('Config updates the beer data correctly', () => {
  let config: Config;

  beforeEach(() => {
    mock_readFileSync();
    mock_writeFileSync();
    config = new Config('beer_config.json');
  });

  it('Invokes the callback on registration', () => {
    const onChange = jest.fn((b: Beer) => console.log(`onChange: ${b.name}`));
    config.registerOnChange(onChange);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(BIG_BROWN_BEER);
    expect(config.beer).toEqual(BIG_BROWN_BEER);
  });

  describe('Config should invoked registered callbacks', () => {
    const onChange = jest.fn((b: Beer) => console.log(`onChange: ${b.name}`));

    beforeEach(() => {
      config.registerOnChange(onChange);
      jest.clearAllMocks();
    });

    it('Should invoke the callback when updated', () => {
      config.update(JSON.stringify(ULTRA_STOUT_BEER));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(ULTRA_STOUT_BEER);
      expect(config.beer).toEqual(ULTRA_STOUT_BEER);
    });

    it('Should only update known Beer fields if a partial config is provided', () => {
      const partialConfig = { color_srm: 40.0, unknown_field: 'unknown' };
      config.update(JSON.stringify(partialConfig));

      const expectedBeer = {
        ...BIG_BROWN_BEER,
        color_srm: partialConfig.color_srm
      };
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(expectedBeer);
      expect(config.beer).toEqual(expectedBeer);
    });
  });
});
