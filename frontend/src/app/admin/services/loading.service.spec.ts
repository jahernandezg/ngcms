import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;
  beforeEach(() => { service = new LoadingService(); });

  it('isLoading false inicialmente', () => {
    expect(service.isLoading()).toBe(false);
  });

  it('incrementa y decrementa correctamente', () => {
    service.start();
    expect(service.isLoading()).toBe(true);
    service.stop();
    expect(service.isLoading()).toBe(false);
  });

  it('no baja de 0', () => {
    service.stop();
    expect(service.isLoading()).toBe(false);
  });

  it('reset funciona', () => {
    service.start();
    service.start();
    expect(service.isLoading()).toBe(true);
    service.reset();
    expect(service.isLoading()).toBe(false);
  });
});
