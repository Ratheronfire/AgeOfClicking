import { MaterialImportModule } from './material-import.module';

describe('MaterialImportModule', () => {
  let materialImportModule: MaterialImportModule;

  beforeEach(() => {
    materialImportModule = new MaterialImportModule();
  });

  it('should create an instance', () => {
    expect(materialImportModule).toBeTruthy();
  });
});
