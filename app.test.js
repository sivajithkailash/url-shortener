const request = require('supertest');
const app = require('../server');
const db = require('../db');

beforeAll((done) => {
    // Wait a brief moment to ensure DB is created
    setTimeout(done, 500);
});

describe('URL Shortener API', () => {
    let testShortCode = '';

    it('should create a new short URL', async () => {
        const res = await request(app)
            .post('/api/shorten')
            .send({
                longUrl: 'https://www.google.com'
            });
        
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('shortCode');
        expect(res.body).toHaveProperty('shortUrl');
        expect(res.body.longUrl).toEqual('https://www.google.com');
        
        testShortCode = res.body.shortCode;
    });

    it('should return 400 for invalid URL', async () => {
        const res = await request(app)
            .post('/api/shorten')
            .send({
                longUrl: 'invalid-url'
            });
        
        expect(res.statusCode).toEqual(400);
    });

    it('should redirect to the long URL', async () => {
        const res = await request(app).get("/" + testShortCode);
        expect(res.statusCode).toEqual(302);
        expect(res.headers.location).toEqual('https://www.google.com');
    });

    it('should increment click count after redirect', async () => {
        // First get the urls to check click count
        const res = await request(app).get('/api/urls');
        expect(res.statusCode).toEqual(200);
        
        const url = res.body.find(u => u.short_code === testShortCode);
        expect(url).toBeDefined();
        // Because the redirect happens asynchronously and updates DB,
        // we might need to wait or rely on the previous test triggering it.
        // Let's just check it's >= 1 since the previous test hit it.
        expect(url.click_count).toBeGreaterThanOrEqual(1);
    });

    it('should return 404 for non-existent short URL', async () => {
        const res = await request(app).get('/nonexistent123');
        expect(res.statusCode).toEqual(404);
    });
});
