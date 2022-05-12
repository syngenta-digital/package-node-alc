const {assert} = require('chai');
const PatternResolver = require('../../../../src/apigateway/resolver/pattern-resolver');
const {Request} = require('../../../../src').apigateway;
const mockData = require('../../../mocks/apigateway/mock-data');

describe('Test PatternResolver Resovler: src/apigateway/resolver/pattern-resolver', () => {
    const handlerPattern = 'test/mocks/apigateway/mock-pattern-handlers/**/**.controller.js';
    const basePath = 'unittest/v1';
    const resolver = new PatternResolver({handlerPattern, basePath});
    it('should find the file with mvc structure', () => {
        const request = new Request(mockData.getApiGateWayRoute());
        const result = resolver.resolve(request);
        assert.isTrue(typeof result.post === 'function');
    });
    it('should find the file with mvvm structure', () => {
        const request = new Request(mockData.getApiGateWayCustomRoute('mvvm'));
        const result = resolver.resolve(request);
        assert.isTrue(typeof result.post === 'function');
    });
    it('should not find the file', () => {
        const request = new Request(mockData.getApiGateWayRoute('-fail'));
        try {
            resolver.resolve(request);
        } catch (error) {
            assert.equal(error.code, 404);
            assert.equal(error.key, 'url');
            assert.equal(error.message, 'endpoint not found');
        }
    });
    it('should throw error for same direcotry & file', () => {
        const request = new Request(mockData.getApiGateWayCustomRoute('same-file-directory'));
        try {
            resolver.resolve(request);
        } catch (error) {
            assert.equal(error.code, 500);
            assert.equal(error.key, 'router-config');
            assert.equal(error.message, 'file & directory cant share name in the same directory');
        }
    });
});
