const { app } = require('../server.js');
const request = require('supertest');

describe('/GET /api/news', () => {
    test('Test news API response',
        async (done) => {
            // feed express app to the supertest request and get location route
            const response = await request(app)
                .get('/api/news');
            // check that response is expected
            expect(response.body[0]).toEqual({
                title: expect.any(String),
                source: expect.any(String),
                author: expect.any(String),
                url: expect.any(String)
            });
            expect(response.statusCode).toBe(200);
            done();
        });
});