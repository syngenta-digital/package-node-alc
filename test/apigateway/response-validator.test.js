const {assert, expect, use} = require('chai');
const chaiAsPromised = require('chai-as-promised');

const RequestClient = require('../../src').apigateway.Request;
const ResponseClient = require('../../src').apigateway.Response;
const ResponseValidator = require('../../src').apigateway.ResponseValidator;
const Schema = require('../../src/apigateway/schema');
const mockData = require('./mock-data');

use(chaiAsPromised);

describe('Test ResponseValidator', () => {
    const eventClient = new RequestClient(mockData.getValidBodyData());
    const responseClient = new ResponseClient();
    const schema = Schema.fromFilePath('test/openapi.yml');
    const requestValidator = new ResponseValidator(eventClient, responseClient, schema);

    describe('corner cases', () => {
        it('when entity name is not found then should throw an error', () => {
            const randomString = 'random-string-$$$';
            responseClient.body = {};
            const checkFn = async () => await requestValidator.isValid(randomString);
            expect(checkFn()).to.be.rejectedWith('');
        });
    });

    describe('test with complex objects', () => {
        it('when response is valid then test should pass', async () => {
            responseClient.body = {
                pageNumber: 0,
                data: {
                    id: 'string'
                }
            };
            await requestValidator.isValid('v1-required-response');
            assert.equal(responseClient.hasErrors, false);
        });

        it('when body is not object then test should fail', async () => {
            responseClient.body = '';
            await requestValidator.isValid('v1-required-response');
            assert.equal(responseClient.hasErrors, true);
        });

        it("when response is not valid then test shouldn't pass", async () => {
            responseClient.body = {};
            await requestValidator.isValid('v1-required-response');
            assert.isTrue(responseClient.hasErrors);
        });

        it('when response is not valid then message should be formatted properly', async () => {
            responseClient.body = {};
            await requestValidator.isValid('v1-response-test-all-of');
            assert.deepEqual(responseClient.rawBody, {
                errors: [
                    {key_path: 'root', message: "must have required property 'data'"},
                    {key_path: 'root', message: "must have required property 'pageNumber'"}
                ]
            });
        });
    });
});
