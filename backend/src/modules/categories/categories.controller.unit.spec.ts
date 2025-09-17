import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

describe('CategoriesController (unit)', () => {
  let controller: CategoriesController;
  const serviceMock = {
    listTree: jest.fn().mockResolvedValue([{ id: '1', name: 'A', slug: 'a' }]),
    listAll: jest.fn().mockResolvedValue([{ id: '1', name: 'A', slug: 'a' }]),
  } as Partial<CategoriesService> as CategoriesService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: CategoriesService, useValue: serviceMock }],
    }).compile();

    controller = module.get(CategoriesController);
  });

  it('tree calls service.listTree and returns array', async () => {
    const res = await controller.tree();
    expect(Array.isArray(res)).toBe(true);
    expect(serviceMock.listTree).toHaveBeenCalled();
  });

  it('list calls service.listAll and returns array', async () => {
    const res = await controller.list();
    expect(Array.isArray(res)).toBe(true);
    expect(serviceMock.listAll).toHaveBeenCalled();
  });
});
