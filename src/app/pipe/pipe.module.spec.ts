import { PipeModule } from './pipe.module';

describe('PipeModule', () => {
  let pipeModule: PipeModule;

  beforeEach(() => {
    pipeModule = new PipeModule();
  });

  it('should create an instance', () => {
    expect(pipeModule).toBeTruthy();
  });
});
