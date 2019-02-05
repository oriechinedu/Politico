import chai from 'chai';
import chaiHTTP from 'chai-http';
import passwordHash from 'password-hash';
import app from '../app';

chai.use(chaiHTTP);
const { expect } = chai;
const baseUrl = '/api/v1/parties';
const hashedPassword = passwordHash.generate('password');
const admin = {
  firstName: 'First Name',
  lastName: 'Last Name',
  otherName: 'Other Name',
  phone: '07000000000',
  email: 'jondoe@gmail.com',
  passportUrl: 'https://example.com/lorem.jpg',
  isAdmin: true,
  password: hashedPassword,
};
let token;
describe('Test Party Endpoints', () => {
  /* eslint-disable no-unused-expressions */
  describe('POST REQUESTS', () => {
    before(async () => {
      try {
        const res = await chai.request(app)
          .post('/api/v1/auth/signup')
          .send(admin);
        token = res.body.data[0].token;
      } catch (err) {
        console.log(err);
      }
    });

    it('It should ensure that party name is not empty', (done) => {
      const newParty = {
        name: '',
        hqAddress: 'Test Address',
        logoUrl: 'test-logo.png',
      };
      chai.request(app)
        .post(baseUrl)
        .send(newParty)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.errors[0]).to.eql('The party name is required');
          done();
        });
    });
    it('It should ensure that party hqAddress is not empty', (done) => {
      const newParty = {
        name: 'Test Party',
        hqAddress: '',
        logoUrl: 'test-logo.png',
      };
      chai.request(app)
        .post(baseUrl)
        .send(newParty)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.errors[0]).to.eql('The party HQ Address is required');
          done();
        });
    });

    it('It should ensure that party logoUrl is not empty', (done) => {
      const newParty = {
        name: 'Test Party',
        hqAddress: 'Test Address',
        logoUrl: '',
      };
      chai.request(app)
        .post(baseUrl)
        .send(newParty)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.errors[0]).to.eql('The party logo is required');
          done();
        });
    });
    it('It should create the new political party', async () => {
      const newParty = {
        name: 'Test Party',
        hqAddress: 'Test Address',
        logoUrl: 'test-logo.png',
      };
      try {
        const res = await chai.request(app)
          .post(baseUrl)
          .send(newParty)
          .set('token', token)
          .set('Authorization', token);
        expect(res).to.have.status(201);
        expect(res.body.data[0].name).to.eql('Test Party');
      } catch (err) {
        console.log(err);
      }
    });
    it('It should respond with status 409 if party already exists', async () => {
      const newParty = {
        name: 'Test Party',
        hqAddress: 'Test Address',
        logoUrl: 'test-logo.png',
      };
      try {
        const res = await chai.request(app)
          .post(baseUrl)
          .send(newParty)
          .set('token', token)
          .set('Authorization', token);
        expect(res).to.have.status(409);
        expect(res.body.error).to.eql('The party already exists');
      } catch (err) {
        console.log(err);
      }
    });
  });
  describe('GET REQUESTS', () => {
    it('should respond with status code 404 if party does not exists', (done) => {
      const id = 5;
      chai.request(app)
        .get(`${baseUrl}/${id}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body.error).to.eql(`Party with ID: ${id} Not Found`);
          done();
        });
    });
  });
  it('should respond with status code 400 if partyId is not a number', (done) => {
    const id = 'dd';
    chai.request(app)
      .get(`${baseUrl}/${id}`)
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body.error).to.eql('The party ID must be a number');
        done();
      });
  });
  it('should get all parties record', async () => {
    try {
      const res = await chai.request(app)
        .get(baseUrl);
      expect(res).to.have.status(200);
      expect(res.body.data).to.have.lengthOf(1);
      expect(res.body.data[0].name).to.eql('Test Party');
      expect(res.body.data[0].hqAddress).to.eql('Test Address');
      expect(res.body.data[0].logoUrl).to.eql('test-logo.png');
    } catch (err) {
      console.log(err);
    }
  });
});