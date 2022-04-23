const {assert, expect} = require('chai');
const sinon = require('sinon');
const {Router} = require('../../src').apigateway;
const mockData = require('./mock-data');
const mockPermissions = require('./mock-permissions-middleware');

describe('Test Router', () => {
    let event;
    beforeEach(() => {
        event = { httpMethod: 'get', requestContext: {}};
    })
    describe('test route', () => {
        it('router: found app route', async () => {
            this.router = new Router({
                event: await mockData.getApiGateWayRoute(),
                basePath: 'unittest/v1',
                handlerPath: 'test/apigateway/',
                schemaPath: 'test/openapi.yml'
            });
            const results = await this.router.route();
            assert.deepEqual(results, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                statusCode: 200,
                body: '{"test":true}'
            });
        });
        it('router: found app route; no trailing /', async () => {
            this.router = new Router({
                event: await mockData.getApiGateWayRoute(),
                basePath: 'unittest/v1',
                handlerPath: '/test/apigateway',
                schemaPath: 'test/openapi.yml'
            });
            const results = await this.router.route();
            assert.deepEqual(results, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                statusCode: 200,
                body: '{"test":true}'
            });
        });
        it('router: found public route', async () => {
            this.router = new Router({
                event: await mockData.getApiGateWayRoute('client-'),
                basePath: 'client-unittest/v1',
                handlerPath: 'test/apigateway/',
                schemaPath: 'test/openapi.yml'
            });
            const results = await this.router.route();
            assert.deepEqual(results, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                statusCode: 200,
                body: '{"test":true}'
            });
        });
        it('router: did not find route', async () => {
            this.router = new Router({
                event: await mockData.getApiGateWayRoute('', '-fail'),
                basePath: 'unittest/v1',
                handlerPath: 'test/apigateway/',
                schemaPath: 'test/openapi.yml'
            });
            const results = await this.router.route();
            assert.deepEqual(results, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                statusCode: 404,
                body: '{"errors":[{"key_path":"url","message":"endpoint not found"}]}'
            });
        });
        it('router: method not allowed', async () => {
            this.router = new Router({
                event: await mockData.getApiGateWayRoute('', '', 'GET'),
                basePath: 'unittest/v1',
                handlerPath: 'test/apigateway/',
                schemaPath: 'test/openapi.yml'
            });
            const results = await this.router.route();
            assert.deepEqual(results, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                statusCode: 403,
                body: '{"errors":[{"key_path":"method","message":"method not allowed"}]}'
            });
        });
        it('router: defaults to index', async () => {
            this.router = new Router({
                event: await mockData.getIndexApiGateWayRoute(),
                basePath: 'unittest/v1',
                handlerPath: '/test/apigateway/mocks'
            });
            const result = await this.router.route();
            assert.equal(result.statusCode, 404);
        });
        it('router: ran route without the need of requirements export', async () => {
            this.router = new Router({
                event: await mockData.getApiGateWayRouteNoRequirements(),
                basePath: 'unittest/v1',
                handlerPath: 'test/apigateway/',
                schemaPath: 'test/openapi.yml'
            });
            const results = await this.router.route();
            assert.deepEqual(results, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                statusCode: 200,
                body: '{"test":true}'
            });
        });
        it('router: test permissions fail', async () => {
            this.router = new Router({
                event: await mockData.getApiGateWayRoute('', '', 'PATCH'),
                basePath: 'unittest/v1',
                handlerPath: 'test/apigateway/',
                schemaPath: 'test/openapi.yml',
                beforeAll: mockPermissions.checkPermissions
            });
            const results = await this.router.route();
            assert.deepEqual(results, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                statusCode: 400,
                body: '{"errors":[{"key_path":"headers","message":"in appropriate api-key"}]}'
            });
        });
        it('router: test permissions pass', async () => {
            const event = await mockData.getApiGateWayRoute('', '', 'PATCH');
            event.headers['x-api-key'] = 'passing-key';
            this.router = new Router({
                event,
                basePath: 'unittest/v1',
                handlerPath: 'test/apigateway/',
                schemaPath: 'test/openapi.yml',
                beforeAll: mockPermissions.checkPermissions
            });
            const results = await this.router.route();
            assert.deepEqual(results, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                statusCode: 200,
                body: '{"test":true}'
            });
        });
        it('should call onError callback if onError exist and error occurs', async () => {
            const event = await mockData.getApiGateWayRoute('', '', 'PATCH');
            const spyFn = sinon.fake();
            const error = new Error();

            this.router = new Router({
                event,
                basePath: 'unittest/v1',
                handlerPath: 'test/apigateway/',
                schemaPath: 'test/openapi.yml',
                beforeAll: () => {
                    throw error;
                },
                onError: spyFn
            });
            const response = await this.router.route();
            assert.deepEqual(spyFn.callCount, 1);
            assert.deepEqual(spyFn.getCall(0).args[2], error);
            assert.equal(spyFn.getCall(0).args[1].code, response.statusCode);
        });
        it('should return status code that was set in onError callback', async () => {
            const event = await mockData.getApiGateWayRoute('', '', 'PATCH');
            const error = new Error();
            const returnedCode = 400;
            this.router = new Router({
                event,
                basePath: 'unittest/v1',
                handlerPath: 'test/apigateway/',
                schemaPath: 'test/openapi.yml',
                beforeAll: () => {
                    throw error;
                },
                onError: (req, res) => {
                    res.code = returnedCode;
                    return res;
                }
            });
            const response = await this.router.route();
            assert.equal(returnedCode, response.statusCode);

        });
        it('should return 404 error if config is not exist', async () => {
            class Config {
                ifExist(){
                    return false;
                }
                static fromFilePath = () => {
                    return new Config();
                }
            }
            const router = new Router({
                event,
            }, {Config});
            const result = await router.route()
            expect(result.statusCode).to.be.eq(404);
        })


        it('should return 403 error if config is exist and method is not exist', async () => {
            class Config {
                ifExist(){
                    return true;
                }

                ifMethodExist(){
                    return false;
                }

                static fromFilePath = () => {
                    return new Config();
                }
            }
            const router = new Router({
                event,
            }, {Config});
            const result = await router.route()
            expect(result.statusCode).to.be.eq(403);
        })

        it('should return 500 error if handler throws something', async () => {
            class Config {
                ifExist(){
                    return true;
                }

                ifMethodExist(){
                    return true;
                }

                getRequirementsByMethodName(){
                    return {};
                }

                getHandlerByMethodName(){
                    return () => {
                        throw new Error()
                    }
                }

                static fromFilePath = () => {
                    return new Config();
                }

            }

            class PathResolverMock {
                path = '$$$randomString'
            }


            const router = new Router({
                event,
            }, {Config, PathResolverMock});
            const result = await router.route()
            expect(result.statusCode).to.be.eq(500);
        })

        it('should call afterAll callback', async () => {
            class Config {
                ifExist(){
                    return true;
                }

                ifMethodExist(){
                    return true;
                }

                getRequirementsByMethodName(){
                    return {};
                }

                getHandlerByMethodName(){
                    return () => () => ({
                        response: {}
                    })
                }

                static fromFilePath = () => {
                    return new Config();
                }

            }

            class PathResolverMock {
                path = '$$$randomString'
            }

            const afterAll = sinon.fake();

            const router = new Router({
                event,
                afterAll,
            }, {Config, PathResolverMock});


            await router.route()
            expect(afterAll.getCalls().length).to.be.eq(1);
        })
        it('should validate response', async () => {
            class Config {
                ifExist(){
                    return true;
                }

                ifMethodExist(){
                    return true;
                }

                getRequirementsByMethodName(){
                    return {
                        responseBody: '$$fakeName'
                    };
                }

                getHandlerByMethodName(){
                    return () => () => ({
                        response: {}
                    })
                }

                static fromFilePath = () => {
                    return new Config();
                }

            }

            class PathResolverMock {
                path = '$$$randomString'
            }

            const isValid = sinon.fake(() => Promise.resolve())


            class ResponseValidatorMock {
                isValid = isValid
            }


            const router = new Router({
                event,
            }, {
                Config,
                PathResolver: PathResolverMock,
                ResponseValidator: ResponseValidatorMock
            });


            await router.route()
            expect(isValid.getCalls().length).to.be.eq(1);
        });
    });
});
