import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Get } from '@nestjs/common';
import request = require('supertest');
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';

@Controller('contract-demo')
class DemoController {
  @Get()
  getData() { return { hello: 'world' }; }
}

describe('API Contract (partial)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DemoController],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });
  afterAll(async () => { await app.close(); });

  it('wraps response with success/message/data', async () => {
    const server = app.getHttpServer();
    const res = await request(server).get('/contract-demo');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'OK', data: { hello: 'world' } });
  });
});
