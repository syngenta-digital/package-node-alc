const {assert} = require('chai');
const sinon = require('sinon');
const {Router} = require('../../../src').apigateway;
const mockData = require('../../mocks/apigateway/mock-data');
const mockBeforeAll = require('../../mocks/apigateway/mock-before-all');

describe('Test Router: src/apigateway/router.js', () => {
    describe('test routing', () => {
        it('should find route', async () => {
            const router = new Router({
                event: mockData.getApiGateWayRoute(),
                basePath: 'unit-test/v1',
                handlerPath: 'test/mocks/apigateway/mock-directory-handlers/',
                schemaPath: 'test/mocks/openapi.yml'
            });
            const results = await router.route();
            assert.deepEqual(results, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                statusCode: 200,
                body: '{"test":true}'
            });
        });
        it('should find route wiht no trailing /', async () => {
            const router = new Router({
                event: mockData.getApiGateWayRoute(),
                basePath: 'unit-test/v1',
                handlerPath: '/test/mocks/apigateway/mock-directory-handlers',
                schemaPath: 'test/mocks/openapi.yml'
            });
            const results = await router.route();
            assert.deepEqual(results, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                statusCode: 200,
                body: '{"test":true}'
            });
        });
        it('should not find route', async () => {
            const router = new Router({
                event: mockData.getApiGateWayRoute('-fail'),
                basePath: 'unit-test/v1',
                handlerPath: 'test/mocks/apigateway/mock-directory-handlers/',
                schemaPath: 'test/mocks/openapi.yml'
            });
            const results = await router.route();
            assert.deepEqual(results, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                statusCode: 404,
                body: '{"errors":[{"key_path":"url","message":"endpoint not found"}]}'
            });
        });
        it('should not allow method', async () => {
            const router = new Router({
                event: mockData.getApiGateWayRoute('', 'GET'),
                basePath: 'unit-test/v1',
                handlerPath: 'test/mocks/apigateway/mock-directory-handlers/',
                schemaPath: 'test/mocks/openapi.yml'
            });
            const results = await router.route();
            assert.deepEqual(results, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                statusCode: 403,
                body: '{"errors":[{"key_path":"method","message":"method not allowed"}]}'
            });
        });
        it('should catch unhandled property', async () => {
            const event = mockData.getApiGateWayRouteValidation('PATCH');
            const error = new Error();
            const router = new Router({
                event,
                basePath: 'unit-test/v1',
                handlerPath: 'test/mocks/apigateway/mock-directory-handlers/',
                schemaPath: 'test/mocks/openapi.yml',
                beforeAll: () => {
                    throw error;
                }
            });
            const results = await router.route();
            assert.deepEqual(results, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                statusCode: 500,
                body: '{"errors":[{"key_path":"server","message":"internal server error"}]}'
            });
        });
    });
    describe('test route basic validation', () => {
        it('should run route without the need of requirements export', async () => {
            const router = new Router({
                event: mockData.getApiGateWayRouteNoRequirements(),
                basePath: 'unit-test/v1',
                handlerPath: 'test/mocks/apigateway/mock-directory-handlers/',
                schemaPath: 'test/mocks/openapi.yml'
            });
            const results = await router.route();
            assert.deepEqual(results, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                statusCode: 200,
                body: '{"test":true}'
            });
        });
        it('should pass required query string requirements', async () => {
            const router = new Router({
                event: mockData.getApiGateWayRouteValidation('DELETE'),
                basePath: 'unit-test/v1',
                handlerPath: 'test/mocks/apigateway/mock-directory-handlers/',
                schemaPath: 'test/mocks/openapi.yml'
            });
            const results = await router.route();
            assert.deepEqual(results, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                statusCode: 200,
                body: '{"test":true}'
            });
        });
        it('should fail required query string requirements', async () => {
            const event = mockData.getApiGateWayRouteValidation('DELETE');
            delete event.queryStringParameters.test;
            const router = new Router({
                event,
                basePath: 'unit-test/v1',
                handlerPath: 'test/mocks/apigateway/mock-directory-handlers/',
                schemaPath: 'test/mocks/openapi.yml'
            });
            const results = await router.route();
            assert.deepEqual(results, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                statusCode: 400,
                body: '{"errors":[{"key_path":"queryParams","message":"Please provide test for queryParams"}]}'
            });
        });
        it('should pass available query string requirements', async () => {
            const event = mockData.getApiGateWayRouteValidation('GET');
            const router = new Router({
                event,
                basePath: 'unit-test/v1',
                handlerPath: 'test/mocks/apigateway/mock-directory-handlers/',
                schemaPath: 'test/mocks/openapi.yml'
            });
            const results = await router.route();
            assert.deepEqual(results, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                statusCode: 200,
                body: '{"test":true}'
            });
        });
        it('should fail available query string requirements', async () => {
            const event = mockData.getApiGateWayRouteValidation('GET');
            event.queryStringParameters.fail = 1;
            const router = new Router({
                event,
                basePath: 'unit-test/v1',
                handlerPath: 'test/mocks/apigateway/mock-directory-handlers/',
                schemaPath: 'test/mocks/openapi.yml'
            });
            const results = await router.route();
            assert.deepEqual(results, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                statusCode: 400,
                body: '{"errors":[{"key_path":"queryParams","message":"fail is not an available queryParams"}]}'
            });
        });
        it('should pass with endpoint before', async () => {
            const event = mockData.getApiGateWayRouteValidation('PUT');
            const router = new Router({
                event,
                basePath: 'unit-test/v1',
                handlerPath: 'test/mocks/apigateway/mock-directory-handlers/',
                schemaPath: 'test/mocks/openapi.yml'
            });
            const results = await router.route();
            assert.deepEqual(results, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                statusCode: 200,
                body: '{"data_class":true}'
            });
        });
        it('should fail with endpoint before', async () => {
            const event = mockData.getApiGateWayRouteValidation('PUT');
            event.headers.fail = 'fail';
            const router = new Router({
                event,
                basePath: 'unit-test/v1',
                handlerPath: 'test/mocks/apigateway/mock-directory-handlers/',
                schemaPath: 'test/mocks/openapi.yml'
            });
            const results = await router.route();
            assert.deepEqual(results, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                statusCode: 400,
                body: '{"errors":[{"key_path":"header","message":"before failed"}]}'
            });
        });
    });
    describe('test route custom validation', () => {
        it('should return errors when beforeAll fails', async () => {
            const router = new Router({
                event: mockData.getApiGateWayRouteValidation('PATCH'),
                basePath: 'unit-test/v1',
                handlerPath: 'test/mocks/apigateway/mock-directory-handlers/',
                schemaPath: 'test/mocks/openapi.yml',
                beforeAll: mockBeforeAll.checkPermissions
            });
            const results = await router.route();
            assert.deepEqual(results, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                statusCode: 400,
                body: '{"errors":[{"key_path":"headers","message":"in appropriate api-key"}]}'
            });
        });
        it('should pass when beforeAll pass', async () => {
            const event = mockData.getApiGateWayRouteValidation('PATCH');
            event.headers['x-api-key'] = 'passing-key';
            const router = new Router({
                event,
                basePath: 'unit-test/v1',
                handlerPath: 'test/mocks/apigateway/mock-directory-handlers/',
                schemaPath: 'test/mocks/openapi.yml',
                beforeAll: mockBeforeAll.checkPermissions
            });
            const results = await router.route();
            assert.deepEqual(results, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                statusCode: 200,
                body: '{"test":true}'
            });
        });
        it('should call afterAll when provided', async () => {
            const event = mockData.getApiGateWayRouteValidation('PATCH');
            const spyFn = sinon.fake();
            const router = new Router({
                event,
                basePath: 'unit-test/v1',
                handlerPath: 'test/mocks/apigateway/mock-directory-handlers/',
                schemaPath: 'test/mocks/openapi.yml',
                afterAll: spyFn
            });
            const response = await router.route();
            assert.deepEqual(spyFn.callCount, 1);
            assert.equal(spyFn.getCall(0).args[1].code, response.statusCode);
        });
        it('should call withAuth when provided', async () => {
            const event = mockData.getApiGateWayRouteValidation('PATCH');
            const spyFn = sinon.fake();
            const router = new Router({
                event,
                basePath: 'unit-test/v1',
                handlerPath: 'test/mocks/apigateway/mock-directory-handlers/',
                schemaPath: 'test/mocks/openapi.yml',
                withAuth: spyFn
            });
            const response = await router.route();
            assert.deepEqual(spyFn.callCount, 1);
            assert.equal(spyFn.getCall(0).args[1].code, response.statusCode);
        });
        it('should call onError callback if onError exist and error occurs', async () => {
            const event = mockData.getApiGateWayRouteValidation('PATCH');
            const spyFn = sinon.fake();
            const error = new Error();
            const router = new Router({
                event,
                basePath: 'unit-test/v1',
                handlerPath: 'test/mocks/apigateway/mock-directory-handlers/',
                schemaPath: 'test/mocks/openapi.yml',
                beforeAll: () => {
                    throw error;
                },
                onError: spyFn
            });
            const response = await router.route();
            assert.deepEqual(spyFn.callCount, 1);
            assert.deepEqual(spyFn.getCall(0).args[2], error);
            assert.equal(spyFn.getCall(0).args[1].code, response.statusCode);
        });
    });
    describe('test auto validate', () => {
        it('should auto validate and pass validation', async () => {
            const mock = mockData.getApiGateWayCustomRouteWithParams('auto', 'post');
            const router = new Router({
                event: mock,
                basePath: 'unit-test/v1',
                handlerPath: 'test/mocks/apigateway/mock-directory-handlers/',
                schemaPath: 'test/mocks/openapi.yml',
                autoValidate: true,
                strictValidation: true
            });
            const response = await router.route();
            assert.deepEqual(response, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                statusCode: 200,
                body: '{"post":true}'
            });
        });
        it('should not find endpoint', async () => {
            const mock = mockData.getApiGateWayCustomRouteWithParams('auto-not-found', 'patch');
            const router = new Router({
                event: mock,
                basePath: 'unit-test/v1',
                handlerPath: 'test/mocks/apigateway/mock-directory-handlers/',
                schemaPath: 'test/mocks/openapi.yml',
                autoValidate: true,
                strictValidation: true
            });
            const response = await router.route();
            assert.equal(response.statusCode, 404);
        });
        it('should not allow method', async () => {
            const mock = mockData.getApiGateWayCustomRouteWithParams('auto', 'patch');
            const router = new Router({
                event: mock,
                basePath: 'unit-test/v1',
                handlerPath: 'test/mocks/apigateway/mock-directory-handlers/',
                schemaPath: 'test/mocks/openapi.yml',
                autoValidate: true,
                strictValidation: true
            });
            const response = await router.route();
            assert.equal(response.statusCode, 403);
        });
        it('should auto validate and pass validation with path param', async () => {
            const mock = mockData.getApiGateWayCustomRouteWithParams('auto/1', 'put');
            const router = new Router({
                event: mock,
                basePath: 'unit-test/v1',
                handlerPath: 'test/mocks/apigateway/mock-directory-handlers/',
                schemaPath: 'test/mocks/openapi.yml',
                autoValidate: true,
                strictValidation: true
            });
            const response = await router.route();
            assert.deepEqual(response, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                statusCode: 200,
                body: '{"put":true}'
            });
        });
        it('should not find endpoint with path param', async () => {
            const mock = mockData.getApiGateWayCustomRouteWithParams('auto/1', 'patch');
            const router = new Router({
                event: mock,
                basePath: 'unit-test/v1',
                handlerPath: 'test/mocks/apigateway/mock-directory-handlers/',
                schemaPath: 'test/mocks/openapi.yml',
                autoValidate: true,
                strictValidation: true
            });
            const response = await router.route();
            assert.equal(response.statusCode, 404);
        });
        it('should find route but error on validation', async () => {
            const mock = mockData.getApiGateWayCustomRouteWithParams('auto/1', 'delete');
            const router = new Router({
                event: mock,
                basePath: 'unit-test/v1',
                handlerPath: 'test/mocks/apigateway/mock-directory-handlers/',
                schemaPath: 'test/mocks/openapi.yml',
                autoValidate: true,
                strictValidation: true
            });
            const response = await router.route();
            assert.equal(response.statusCode, 400);
        });
    });
});
