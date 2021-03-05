require('dotenv').config();

const { execSync } = require('child_process');

const margData = require('../data/marg-test-data');
const fakeRequest = require('supertest');
const app = require('../lib/app');
const client = require('../lib/client');


describe('app routes', () => {
  describe('routes', () => {
    let token;
  
    beforeAll(async done => {
      execSync('npm run setup-db');
  
      client.connect();
  
      const signInData = await fakeRequest(app)
        .post('/auth/signup')
        .send({
          email: 'jon@user.com',
          password: '1234'
        });
      
      token = signInData.body.token; // eslint-disable-line
  
      return done();
    });
  
    afterAll(done => {
      return client.end(done);
    });

    test('the sign in rout', async() => {
      
      const data = await fakeRequest(app)
        .post('/auth/signup')
        .send({
          email: 'Tyler@user.com',
          password: '1234'
        });
      const token = data.body.token;
      const expected = ({
        email: 'Tyler@user.com',
        id: 3,
        token: token,
      });
      expect(expected).toEqual(data.body);
    });

    test('the sign in rout', async() => {
      
      const data = await fakeRequest(app)
        .post('/auth/signin')
        .send({
          email: 'jon@user.com',
          password: '1234'
        });
      
      const token = data.body.token;
      const expected = ({
        email: 'jon@user.com',
        id: 2,
        token: token,
      });
      expect(expected).toEqual(data.body);
    });

    test('returns the results from the search query', async() => {
      
      const data = await fakeRequest(app)
        .get('/cocktails?search=marg')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect([data.body]).toEqual(margData);
    });

    const cocktail = {
      drink_id: 12345,
      name: 'Vesper',
      glass: 'Cocktail Glass',
      image: 'https://www.thecocktaildb.com/images/media/drink/mtdxpa1504374514.jpg'
    };
    const dbCocktail = {
      ...cocktail,
      id: 4,
      owner_id: 2
    };
    
    
    test('adds a cocktail to users favorites db', async() => {
      
      
      const data = await fakeRequest(app)
        .post('/api/favorites')
        .send(cocktail)
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(data.body[0]).toEqual(dbCocktail);
    });

    test('returns the users favorites', async() => {
      
      const data = await fakeRequest(app)
        .get('/api/favorites')
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(data.body[0]).toEqual(dbCocktail);
    });
    
    test('deletes a favorite from the users favorites db', async() => {
      
      const data = await fakeRequest(app)
        .delete('/api/favorites/4')

        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(data.body).toEqual([]);
    });

  

  

  

  });
});
