// A simple configuration utility for reading and writing the Beer
// under brew details.
import * as fs from 'fs';

// A Beer configuration.
export interface Beer {
  name?: string;
  color_srm?: number;
  og?: number;
}

// Merge any missing data in the new beer from the original beer.
function merge_beer(beer: Beer, orig: Beer): Beer {
  return {
    name: beer.name ?? orig.name,
    color_srm: beer.color_srm ?? orig.color_srm,
    og: beer.og ?? orig.og
  };
}

function readFileSync(path: string): string {
  return fs.readFileSync(path, 'utf8');
}

function writeFileSync(path: string, data: string) {
  fs.writeFileSync(path, data);
}

// This gets around a problem with the jest mocking system, where mocking the
// fs `readFileSync` causes `jest` to incorporate the mock when reading itself
// (when watching).
export const cfs = { readFileSync, writeFileSync };

// Callback invoked when the Beer configuration changes.
export type OnBeerChange = (beer: Beer) => void;

// Configuration utility for reading and writing the Beer under brew details.
export class Config {
  readonly DEFAULT_BEER: Beer = {
    name: 'Plain Beer',
    color_srm: 23.0,
    og: 1.047
  };

  private path: string;
  private onChange: OnBeerChange;
  private beerValue: Beer = this.DEFAULT_BEER;

  // Create a Beer configuration, reading a JSON file at the given path.
  constructor(path: string) {
    this.path = path;
    this.onChange = (_beer: Beer) => {};
    this.beerValue = Config.readConfig(path, this.beerValue);
  }

  get beer(): Beer {
    return this.beerValue;
  }

  // Register a listener to be invoked when the Beer configuration changes.
  registerOnChange(onChange: OnBeerChange) {
    this.onChange = onChange;
    this.onChange(this.beer);
  }

  // Update the Beer configuration with the given JSON string.
  update(beerJson: string) {
    this.beerValue = Config.writeConfig(this.path, beerJson, this.beer);
    this.onChange(this.beer);
  }

  private static readConfig(path: string, orig: Beer): Beer {
    try {
      const jsonData = cfs.readFileSync(path);
      const beer = JSON.parse(jsonData) as Beer;
      return merge_beer(beer, orig);
    } catch (e) {
      console.info(`Failed to read ${path}: ${e.message}`);
      return orig;
    }
  }

  private static writeConfig(path: string, beerJson: string, orig: Beer): Beer {
    const newBeer = JSON.parse(beerJson) as Beer;
    const beer = merge_beer(newBeer, orig);
    const jsonData = JSON.stringify(beer, null, 2);
    try {
      cfs.writeFileSync(path, jsonData);
      return beer;
    } catch (e) {
      console.info(`Failed to write to ${path}: ${e.message}`);
      return orig;
    }
  }
}
